"""Tools for MemWal integration (Phase 2)."""

import logging
from typing import Any, Dict, List, Optional

from src.config import get_config
from src.tools.local_store import list_memwal_keys as list_local_memwal_keys
from src.tools.local_store import read_memwal_entry as read_local_memwal_entry
from src.tools.local_store import save_memwal_entry as save_local_memwal_entry
from memwal_adapter.core.client import MemWalClient

logger = logging.getLogger(__name__)


async def save_to_memwal(
    key: str,
    data: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
    """Save data to MemWal with cryptographic proof.

    Args:
        key: Unique key for this memory entry
        data: Data to store
        metadata: Optional metadata

    Returns:
        Cryptographic proof of storage
    """
    config = get_config()
    payload = save_local_memwal_entry(key, data, metadata)

    if not config.memwal_endpoint and not config.memwal_private_key:
        return payload.get("proof", "")

    async with MemWalClient(
        config.memwal_endpoint,
        private_key=config.memwal_private_key,
        account_id=config.memwal_account_id,
        server_url=config.memwal_server_url,
    ) as client:
        try:
            result = await client.save_memory(key, data, metadata)
            return result.get("proof") or result.get("blob_id") or result.get("id") or payload.get("proof", "")
        except Exception as exc:
            logger.warning("MemWal save failed, using local demo store instead: %s", exc)
            return payload.get("proof", "")


async def read_from_memwal(key: str) -> Dict[str, Any]:
    """Read data from MemWal.

    Args:
        key: Key to retrieve

    Returns:
        Stored data
    """
    config = get_config()
    local_entry = read_local_memwal_entry(key)
    if local_entry:
        return local_entry

    if not config.memwal_endpoint and not config.memwal_private_key:
        return local_entry

    async with MemWalClient(
        config.memwal_endpoint,
        private_key=config.memwal_private_key,
        account_id=config.memwal_account_id,
        server_url=config.memwal_server_url,
    ) as client:
        try:
            result = await client.read_memory(key)
            return result or local_entry
        except Exception as exc:
            logger.warning("MemWal read failed, using local demo store instead: %s", exc)
            return local_entry


async def list_memwal_keys(prefix: Optional[str] = None) -> List[str]:
    """List all keys in MemWal memory."""
    _ = get_config()
    return list_local_memwal_keys(prefix=prefix)
