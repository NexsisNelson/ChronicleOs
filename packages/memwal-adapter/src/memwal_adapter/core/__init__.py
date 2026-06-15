"""Core module initialization."""

from memwal_adapter.core.client import MemWalClient
from memwal_adapter.core.crypto import compute_hash, compute_hmac, verify_hmac

__all__ = ["MemWalClient", "compute_hash", "compute_hmac", "verify_hmac"]
