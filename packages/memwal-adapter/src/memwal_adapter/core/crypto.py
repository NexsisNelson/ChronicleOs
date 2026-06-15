"""MemWal Adapter - Cryptographic utilities."""

import hashlib
import hmac
from typing import Any, Dict
import json


def compute_hash(data: Dict[str, Any]) -> str:
    """Compute SHA-256 hash of data."""
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_str.encode()).hexdigest()


def compute_hmac(data: Dict[str, Any], secret: str) -> str:
    """Compute HMAC-SHA256 of data."""
    json_str = json.dumps(data, sort_keys=True)
    return hmac.new(
        secret.encode(),
        json_str.encode(),
        hashlib.sha256
    ).hexdigest()


def verify_hmac(data: Dict[str, Any], secret: str, signature: str) -> bool:
    """Verify HMAC signature."""
    computed = compute_hmac(data, secret)
    return hmac.compare_digest(computed, signature)
