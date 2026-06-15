"""Tools for Walrus integration (Phase 2)."""

import asyncio
import logging
from pathlib import Path
from typing import Optional

import httpx

from src.config import get_config

logger = logging.getLogger(__name__)


def _local_artifacts_dir() -> Path:
    config = get_config()
    return Path(config.artifacts_dir).expanduser().resolve()


def _walrus_url(endpoint: str, path_template: str, cid: Optional[str] = None) -> str:
    # Build a normalized URL for the Walrus API using the configured gateway path.
    path = path_template.format(cid=cid) if cid is not None else path_template
    return f"{endpoint.rstrip('/')}/{path.lstrip('/')}"


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
    if not config.walrus_endpoint:
        logger.warning("Walrus endpoint not configured, falling back to local artifact storage")
        fallback_path = _local_fallback_path(filename)
        fallback_path.write_bytes(data)
        return f"local://{fallback_path.name}"

    upload_url = _walrus_url(config.walrus_endpoint, config.walrus_upload_path)
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {
            "file": (
                filename or "artifact.bin",
                data,
                content_type,
            )
        }
        last_error = None
        for attempt in range(1, 4):
            try:
                response = await client.post(upload_url, files=files)
                response.raise_for_status()
                payload = response.json()
                cid = _extract_cid(payload)
                if not cid:
                    raise ValueError("Walrus upload succeeded but no CID was returned")
                return cid
            except Exception as exc:
                last_error = exc
                logger.warning("Walrus upload attempt %s failed: %s", attempt, exc)
                if attempt < 3:
                    await _delay_retry(attempt)
        logger.warning("Walrus upload failed after retries, writing locally instead: %s", last_error)
        fallback_path = _local_fallback_path(filename)
        fallback_path.write_bytes(data)
        return f"local://{fallback_path.name}"


async def download_from_walrus(cid: str) -> bytes:
    """Download data from Walrus by CID.

    Args:
        cid: Content ID of data to download

    Returns:
        Raw bytes of downloaded data
    """
    if cid.startswith("local://"):
        filename = cid.replace("local://", "")
        local_path = _local_artifacts_dir() / filename
        return local_path.read_bytes()

    config = get_config()
    if not config.walrus_endpoint:
        raise ValueError("Walrus endpoint is not configured")

    download_url = _walrus_url(config.walrus_endpoint, config.walrus_download_path, cid=cid)
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
        return payload.get("cid") or payload.get("id") or payload.get("hash") or payload.get("data", {}).get("cid")
    return None


async def list_walrus_objects() -> list:
    """List stored artifacts when remote listing is unavailable.

    This currently returns locally cached artifact filenames. Remote Walrus listing
    is not implemented because Walrus gateway APIs vary by deployment.
    """
    local_dir = _local_artifacts_dir()
    if not local_dir.exists():
        return []
    return [str(path.name) for path in sorted(local_dir.iterdir()) if path.is_file()]
