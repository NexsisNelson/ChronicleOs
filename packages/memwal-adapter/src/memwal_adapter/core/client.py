"""MemWal Adapter - Core client for MemWal API."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

import httpx

try:
    from memwal import MemWal
except ImportError:  # pragma: no cover - fallback when the SDK is unavailable
    MemWal = None

logger = logging.getLogger(__name__)


class MemWalClient:
    """Low-level client for MemWal API and hosted Walrus Memory."""

    def __init__(
        self,
        endpoint: str,
        private_key: Optional[str] = None,
        account_id: Optional[str] = None,
        server_url: Optional[str] = None,
        namespace: str = "default",
    ):
        """
        Initialize MemWal client.

        Args:
            endpoint: MemWal API endpoint URL used for the legacy/local HTTP path.
            private_key: Optional Walrus Memory delegate private key.
            account_id: Optional Walrus Memory account id.
            server_url: Optional hosted Walrus Memory relayer URL.
            namespace: Memory namespace to use for hosted SDK calls.
        """
        self.endpoint = endpoint.rstrip("/")
        self.private_key = private_key
        self.account_id = account_id
        self.namespace = namespace
        self.server_url = (
            server_url
            or (
                "https://relayer.memory.walrus.xyz"
                if private_key and account_id and MemWal is not None
                else endpoint
            )
        ).rstrip("/")
        self._sdk_client = None
        self._use_sdk = bool(private_key and account_id and MemWal is not None)
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": "memwal-adapter/0.1.0"},
        )

    def _serialize_payload(self, key: str, data: Dict[str, Any], metadata: Optional[Dict[str, Any]]) -> str:
        payload = {
            "key": key,
            "data": data,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }
        return json.dumps(payload, ensure_ascii=True, default=str)

    def _decode_payload(self, text: str) -> Optional[Dict[str, Any]]:
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            return None
        return payload if isinstance(payload, dict) else None

    async def _get_sdk_client(self):
        if not self._use_sdk:
            raise RuntimeError("MemWal SDK is not configured")

        if self._sdk_client is None:
            if MemWal is None:
                raise RuntimeError("The memwal SDK is not installed")
            self._sdk_client = MemWal.create(
                key=self.private_key,
                account_id=self.account_id,
                server_url=self.server_url,
                namespace=self.namespace,
            )

        return self._sdk_client

    async def save_memory(
        self,
        key: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Save memory entry to MemWal.

        When hosted Walrus Memory credentials are configured, the payload is also
        mirrored through the official SDK so the runtime uses the documented relayer
        flow while preserving the existing HTTP fallback for local demo mode.
        """
        payload = {
            "key": key,
            "data": data,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

        if self._use_sdk:
            try:
                sdk_client = await self._get_sdk_client()
                sdk_result = await sdk_client.remember_and_wait(
                    self._serialize_payload(key, data, metadata),
                    namespace=self.namespace,
                )
                return {
                    **payload,
                    "proof": getattr(sdk_result, "blob_id", ""),
                    "blob_id": getattr(sdk_result, "blob_id", ""),
                    "remote_id": getattr(sdk_result, "id", ""),
                    "remote_owner": getattr(sdk_result, "owner", ""),
                    "remote_namespace": getattr(sdk_result, "namespace", self.namespace),
                }
            except Exception as exc:
                logger.warning("Hosted MemWal save failed, falling back to HTTP path: %s", exc)

        headers = {"Content-Type": "application/json"}

        try:
            response = await self._request_with_retry(
                "POST",
                f"{self.endpoint}/memory/save",
                json=payload,
                headers=headers,
            )
            return response.json()
        except httpx.HTTPError as exc:
            logger.error("Failed to save memory: %s", exc)
            raise

    async def read_memory(self, key: str) -> Optional[Dict[str, Any]]:
        """Read memory entry from MemWal or the hosted SDK.

        The local HTTP path remains the first fallback because ChronicleOS keeps the
        local demo store as the exact-key source of truth for workflow checkpoints.
        """
        headers = {}

        try:
            response = await self._request_with_retry(
                "GET",
                f"{self.endpoint}/memory/{key}",
                headers=headers,
            )
            if response.status_code == 404:
                raise httpx.HTTPStatusError("not found", request=response.request, response=response)
            return response.json()
        except httpx.HTTPError:
            if not self._use_sdk:
                return None

        try:
            sdk_client = await self._get_sdk_client()
            result = await sdk_client.recall(key, limit=10, namespace=self.namespace)
            for memory in getattr(result, "results", []):
                payload = self._decode_payload(getattr(memory, "text", ""))
                if payload and payload.get("key") == key:
                    payload.setdefault("blob_id", getattr(memory, "blob_id", ""))
                    payload.setdefault("distance", getattr(memory, "distance", 0.0))
                    return payload
        except Exception as exc:
            logger.error("Failed to read memory from hosted MemWal: %s", exc)

        return None

    async def list_memory_keys(self, prefix: Optional[str] = None) -> list:
        """List all memory keys, optionally filtered by prefix.

        The hosted SDK does not expose a direct key listing API, so this remains
        compatible with the local HTTP path used by the demo store.
        """
        headers = {}

        params = {}
        if prefix:
            params["prefix"] = prefix

        try:
            response = await self._request_with_retry(
                "GET",
                f"{self.endpoint}/memory/keys",
                params=params,
                headers=headers,
            )
            return response.json()
        except httpx.HTTPError as exc:
            logger.error("Failed to list keys: %s", exc)
            return []

    async def verify_proof(self, key: str, proof: str) -> bool:
        """Verify cryptographic proof of memory entry."""
        headers = {}

        try:
            response = await self._request_with_retry(
                "POST",
                f"{self.endpoint}/memory/{key}/verify",
                json={"proof": proof},
                headers=headers,
            )
            result = response.json()
            return result.get("valid", False)
        except httpx.HTTPError as exc:
            logger.error("Failed to verify proof: %s", exc)
            return False

    async def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        attempts = 3
        delay = 0.5
        for attempt in range(1, attempts + 1):
            try:
                response = await self.client.request(method, url, **kwargs)
                response.raise_for_status()
                return response
            except httpx.HTTPStatusError as exc:
                response = getattr(exc, "response", None)
                if response is not None and response.status_code == 404:
                    return response
                logger.warning(
                    "MemWal request failed (status %s) on attempt %s: %s",
                    response.status_code if response is not None else "unknown",
                    attempt,
                    exc,
                )
            except httpx.HTTPError as exc:
                logger.warning("MemWal request network error on attempt %s: %s", attempt, exc)
            if attempt < attempts:
                await asyncio.sleep(delay)
                delay *= 2
        raise httpx.HTTPError(f"MemWal request failed after {attempts} attempts")

    async def close(self):
        """Close the underlying clients."""
        if self._sdk_client is not None:
            close = getattr(self._sdk_client, "close", None)
            if callable(close):
                await close()
            self._sdk_client = None
        await self.client.aclose()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
