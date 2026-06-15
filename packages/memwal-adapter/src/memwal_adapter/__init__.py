"""Package initialization for memwal_adapter."""

from memwal_adapter.core.client import MemWalClient
from memwal_adapter.core.crypto import compute_hash, compute_hmac, verify_hmac
from memwal_adapter.workspace.protocol import SharedWorkspace, WorkspaceArtifact

__version__ = "0.1.0"

__all__ = [
    "MemWalClient",
    "compute_hash",
    "compute_hmac",
    "verify_hmac",
    "SharedWorkspace",
    "WorkspaceArtifact",
]
