"""Tools for Walrus integration (Phase 2)."""

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import httpx

from src.config import get_config
from src.tools.local_store import read_walrus_blob as read_local_walrus_blob
from src.tools.local_store import save_walrus_blob as save_local_walrus_blob
from src.tools.local_store import walrus_store_dir
from src.tools.memwal_tools import list_memwal_keys, read_from_memwal

logger = logging.getLogger(__name__)


def _local_artifacts_dir() -> Path:
    config = get_config()
    return Path(config.artifacts_dir).expanduser().resolve()


def _walrus_url(endpoint: str, path_template: str, cid: Optional[str] = None) -> str:
    # Build a normalized URL for the Walrus API using the configured gateway path.
    path = path_template.format(cid=cid) if cid is not None else path_template
    return f"{endpoint.rstrip('/')}/{path.lstrip('/')}"


def _resolve_walrus_endpoint(config, attribute_name: str) -> Optional[str]:
    value = getattr(config, attribute_name, None)
    if value:
        return value
    if attribute_name != "walrus_endpoint":
        legacy_value = getattr(config, "walrus_endpoint", None)
        if legacy_value:
            return legacy_value
    return None


def _local_fallback_path(filename: Optional[str]) -> Path:
    # Use local artifact storage when Walrus is unavailable.
    local_dir = _local_artifacts_dir()
    local_dir.mkdir(parents=True, exist_ok=True)
    return local_dir / (filename or "walrus_fallback.bin")


MEMWAL_RETRY_ATTEMPTS = 3
MEMWAL_RETRY_DELAY = 0.5


async def _retry_http_operation(operation, *args, **kwargs):
    for attempt in range(1, MEMWAL_RETRY_ATTEMPTS + 1):
        try:
            return await operation(*args, **kwargs)
        except Exception as exc:
            logger.warning("Walrus HTTP attempt %s failed: %s", attempt, exc)
            if attempt == MEMWAL_RETRY_ATTEMPTS:
                raise
            await asyncio.sleep(MEMWAL_RETRY_DELAY * attempt)


async def upload_to_walrus(
    data: bytes,
    filename: Optional[str] = None,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload data to Walrus and return CID.

    If the configured Walrus endpoint is unavailable, this stores the artifact locally
    and returns a fallback local reference.
    """
    config = get_config()
    publisher_endpoint = _resolve_walrus_endpoint(config, "walrus_publisher_endpoint")
    if not publisher_endpoint:
        logger.warning("Walrus endpoint not configured, falling back to local artifact storage")
        return save_local_walrus_blob(filename or "artifact.bin", data, content_type)

    upload_url = _walrus_url(publisher_endpoint, config.walrus_upload_path)
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await _retry_http_operation(
                client.put,
                upload_url,
                content=data,
                headers={"Content-Type": content_type or "application/octet-stream"},
            )
            response.raise_for_status()
            payload = response.json()
            cid = _extract_cid(payload)
            if not cid:
                raise ValueError("Walrus upload succeeded but no blob identifier was returned")
            return cid
    except Exception as exc:
        logger.warning("Walrus upload failed, storing artifact locally instead: %s", exc)
        return save_local_walrus_blob(filename or "artifact.bin", data, content_type)
    if isinstance(payload, dict):
        return (
            payload.get("cid")
            or payload.get("blob_id")
            or payload.get("blobId")
            or payload.get("id")
            or payload.get("hash")
            or payload.get("data", {}).get("cid")
            or payload.get("data", {}).get("blobId")
            or payload.get("newlyCreated", {}).get("blobObject", {}).get("blobId")
            or payload.get("alreadyCertified", {}).get("blobId")
        )
    return None


def _extract_walrus_cids(entry: Dict[str, Any]) -> Set[str]:
    cids: Set[str] = set()
    if not isinstance(entry, dict):
        return cids

    if "walrus_cid" in entry and isinstance(entry["walrus_cid"], str):
        cids.add(entry["walrus_cid"])

    if "walrus_cids" in entry and isinstance(entry["walrus_cids"], list):
        for cid in entry["walrus_cids"]:
            if isinstance(cid, str):
                cids.add(cid)

    if "artifacts" in entry and isinstance(entry["artifacts"], list):
        for artifact in entry["artifacts"]:
            if isinstance(artifact, dict):
                cid = artifact.get("walrus_cid")
                if isinstance(cid, str):
                    cids.add(cid)

    if "result" in entry and isinstance(entry["result"], dict):
        cid = entry["result"].get("walrus_cid")
        if isinstance(cid, str):
            cids.add(cid)

    return cids


async def list_walrus_objects() -> list:
    """List stored artifacts using known Walrus references and local fallback storage."""
    config = get_config()
    local_dir = _local_artifacts_dir()
    walrus_dir = walrus_store_dir()
    object_ids: Set[str] = set()

    if local_dir.exists():
        object_ids.update(str(path.name) for path in local_dir.iterdir() if path.is_file())
    if walrus_dir.exists():
        object_ids.update(str(path.name) for path in walrus_dir.iterdir() if path.is_file())

    if _resolve_walrus_endpoint(config, "walrus_publisher_endpoint") or _resolve_walrus_endpoint(config, "walrus_aggregator_endpoint"):
        try:
            keys = await list_memwal_keys()
            entries = await asyncio.gather(*(read_from_memwal(key) for key in keys), return_exceptions=True)
            for entry in entries:
                if isinstance(entry, dict):
                    object_ids.update(_extract_walrus_cids(entry))
        except Exception as exc:
            logger.warning("Unable to gather known Walrus artifacts from MemWal: %s", exc)

    return sorted(object_ids)
