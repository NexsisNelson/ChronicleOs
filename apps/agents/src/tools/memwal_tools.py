"""Tools for MemWal integration (Phase 2)."""

import logging
from typing import Any, Dict, List, Optional

from src.config import get_config
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
    async with MemWalClient(config.memwal_endpoint, config.memwal_api_key) as client:
        result = await client.save_memory(key, data, metadata)
        return result.get("proof") or result.get("signature") or result.get("id") or ""


async def read_from_memwal(key: str) -> Dict[str, Any]:
    """Read data from MemWal.

    Args:
        key: Key to retrieve

    Returns:
        Stored data
    """
    config = get_config()
    async with MemWalClient(config.memwal_endpoint, config.memwal_api_key) as client:
        result = await client.read_memory(key)
        return result or {}


async def list_memwal_keys(prefix: Optional[str] = None) -> List[str]:
    """List all keys in MemWal memory."""
    config = get_config()
    async with MemWalClient(config.memwal_endpoint, config.memwal_api_key) as client:
        return await client.list_memory_keys(prefix=prefix)
