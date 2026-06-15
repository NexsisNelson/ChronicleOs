"""MemWal Adapter - Core client for MemWal API."""

import asyncio
import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class MemWalClient:
    """Low-level client for MemWal API."""

    def __init__(self, endpoint: str, api_key: Optional[str] = None):
        """
        Initialize MemWal client.

        Args:
            endpoint: MemWal API endpoint URL
            api_key: Optional API key for authentication
        """
        self.endpoint = endpoint.rstrip('/')
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": "memwal-adapter/0.1.0"}
        )

    async def save_memory(
        self,
        key: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Save memory entry to MemWal with cryptographic proof.

        Args:
            key: Unique identifier for memory entry
            data: Memory data to store
            metadata: Optional metadata

        Returns:
            Response with proof and timestamp
        """
        payload = {
            "key": key,
            "data": data,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = await self._request_with_retry(
                "POST",
                f"{self.endpoint}/memory/save",
                json=payload,
                headers=headers,
            )
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to save memory: {e}")
            raise

    async def read_memory(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Read memory entry from MemWal.

        Args:
            key: Memory key to read

        Returns:
            Memory data or None if not found
        """
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = await self._request_with_retry(
                "GET",
                f"{self.endpoint}/memory/{key}",
                headers=headers,
            )
            if response.status_code == 404:
                return None
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to read memory: {e}")
            return None

    async def list_memory_keys(self, prefix: Optional[str] = None) -> list:
        """
        List all memory keys, optionally filtered by prefix.

        Args:
            prefix: Optional key prefix filter

        Returns:
            List of memory keys
        """
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

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
        except httpx.HTTPError as e:
            logger.error(f"Failed to list keys: {e}")
            return []

    async def verify_proof(self, key: str, proof: str) -> bool:
        """
        Verify cryptographic proof of memory entry.

        Args:
            key: Memory key
            proof: Proof to verify

        Returns:
            True if proof is valid, False otherwise
        """
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = await self._request_with_retry(
                "POST",
                f"{self.endpoint}/memory/{key}/verify",
                json={"proof": proof},
                headers=headers,
            )
            result = response.json()
            return result.get("valid", False)
        except httpx.HTTPError as e:
            logger.error(f"Failed to verify proof: {e}")
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
                if response := getattr(exc, 'response', None):
                    if response.status_code == 404:
                        return response
                logger.warning("MemWal request failed (status %s) on attempt %s: %s", getattr(exc, 'response', None).status_code if getattr(exc, 'response', None) is not None else 'unknown', attempt, exc)
            except httpx.HTTPError as exc:
                logger.warning("MemWal request network error on attempt %s: %s", attempt, exc)
            if attempt < attempts:
                await asyncio.sleep(delay)
                delay *= 2
        raise httpx.HTTPError(f"MemWal request failed after {attempts} attempts")

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
