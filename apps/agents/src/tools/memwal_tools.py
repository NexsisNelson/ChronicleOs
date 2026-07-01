"""Tools for MemWal integration (Phase 2)."""

import asyncio
import logging
from typing import Any, Dict, List, Optional

from src.config import get_config
from src.tools.local_store import list_memwal_keys as list_local_memwal_keys
from src.tools.local_store import read_memwal_entry as read_local_memwal_entry
from src.tools.local_store import save_memwal_entry as save_local_memwal_entry
from memwal_adapter.core.client import MemWalClient

logger = logging.getLogger(__name__)


MEMWAL_RETRY_ATTEMPTS = 3
MEMWAL_RETRY_DELAY = 0.5


def _has_remote_memwal_config(config) -> bool:
    return bool(config.memwal_endpoint or (config.memwal_private_key and config.memwal_account_id))


async def _delay_retry(attempt: int) -> None:
    await asyncio.sleep(MEMWAL_RETRY_DELAY * attempt)


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

    if not _has_remote_memwal_config(config):
        return payload.get("proof", "")

    for attempt in range(1, MEMWAL_RETRY_ATTEMPTS + 1):
        async with MemWalClient(
            config.memwal_endpoint,
            private_key=config.memwal_private_key,
            account_id=config.memwal_account_id,
            server_url=config.memwal_server_url,
            namespace=config.memwal_namespace,
        ) as client:
            try:
                result = await client.save_memory(key, data, metadata)
                proof = result.get("proof") or result.get("blob_id") or result.get("id") or payload.get("proof", "")
                if proof and await client.verify_proof(key, proof):
                    logger.info("MemWal proof verified for key %s", key)
                else:
                    logger.warning("MemWal proof verification failed for key %s", key)
                return proof
            except Exception as exc:
                logger.warning("MemWal save attempt %s failed for key %s: %s", attempt, key, exc)
                if attempt < MEMWAL_RETRY_ATTEMPTS:
                    await _delay_retry(attempt)

    logger.warning("MemWal save failed after %s attempts, using local fallback for key %s", MEMWAL_RETRY_ATTEMPTS, key)
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

    if not _has_remote_memwal_config(config):
        return local_entry

    for attempt in range(1, MEMWAL_RETRY_ATTEMPTS + 1):
        async with MemWalClient(
            config.memwal_endpoint,
            private_key=config.memwal_private_key,
            account_id=config.memwal_account_id,
            server_url=config.memwal_server_url,
            namespace=config.memwal_namespace,
        ) as client:
            try:
                result = await client.read_memory(key)
                return result or local_entry
            except Exception as exc:
                logger.warning("MemWal read attempt %s failed for key %s: %s", attempt, key, exc)
                if attempt < MEMWAL_RETRY_ATTEMPTS:
                    await _delay_retry(attempt)

    logger.warning("MemWal read failed after %s attempts for key %s", MEMWAL_RETRY_ATTEMPTS, key)
    return local_entry


async def list_memwal_keys(prefix: Optional[str] = None) -> List[str]:
    """List all keys in MemWal memory."""
    config = get_config()
    if not _has_remote_memwal_config(config):
        return list_local_memwal_keys(prefix=prefix)

    for attempt in range(1, MEMWAL_RETRY_ATTEMPTS + 1):
        async with MemWalClient(
            config.memwal_endpoint,
            private_key=config.memwal_private_key,
            account_id=config.memwal_account_id,
            server_url=config.memwal_server_url,
            namespace=config.memwal_namespace,
        ) as client:
            try:
                return await client.list_memory_keys(prefix=prefix)
            except Exception as exc:
                logger.warning("MemWal key listing attempt %s failed: %s", attempt, exc)
                if attempt < MEMWAL_RETRY_ATTEMPTS:
                    await _delay_retry(attempt)

    logger.warning("MemWal key listing failed after %s attempts, falling back to local keys", MEMWAL_RETRY_ATTEMPTS)
    return list_local_memwal_keys(prefix=prefix)
