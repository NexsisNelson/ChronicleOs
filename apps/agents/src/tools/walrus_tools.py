"""Tools for Walrus integration (Phase 2)."""

import asyncio
import logging
from pathlib import Path
from typing import Optional

import httpx

from src.config import get_config
from src.tools.local_store import read_walrus_blob as read_local_walrus_blob
from src.tools.local_store import save_walrus_blob as save_local_walrus_blob
from src.tools.local_store import walrus_store_dir

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
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.put(
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


async def download_from_walrus(cid: str) -> bytes:
    """Download data from Walrus by CID.

    Args:
        cid: Content ID of data to download

    Returns:
        Raw bytes of downloaded data
    """
    if cid.startswith("local://"):
        return read_local_walrus_blob(cid)

    config = get_config()
    aggregator_endpoint = _resolve_walrus_endpoint(config, "walrus_aggregator_endpoint")
    if not aggregator_endpoint:
        raise ValueError("Walrus endpoint is not configured")

    download_url = _walrus_url(aggregator_endpoint, config.walrus_download_path, cid=cid)
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(download_url)
        response.raise_for_status()
        return response.content


async def _delay_retry(attempt: int) -> None:
    """Pause briefly between retry attempts."""
    await asyncio.sleep(0.5 * attempt)


def _extract_cid(payload: dict) -> Optional[str]:
    if payload is None:
        return None
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


async def list_walrus_objects() -> list:
    """List stored artifacts when remote listing is unavailable.

    Remote Walrus listing is not implemented because the public HTTP APIs expose
    blob reads, not a stable object listing endpoint.
    """
    config = get_config()
    if _resolve_walrus_endpoint(config, "walrus_publisher_endpoint") or _resolve_walrus_endpoint(config, "walrus_aggregator_endpoint"):
        return []

    local_dir = _local_artifacts_dir()
    walrus_dir = walrus_store_dir()
    candidates = []

    if local_dir.exists():
        candidates.extend(local_dir.iterdir())
    if walrus_dir.exists():
        candidates.extend(walrus_dir.iterdir())

    files = [path for path in candidates if path.is_file()]
    return [str(path.name) for path in sorted(files, key=lambda path: path.name)]
