"""Package initialization for memwal_adapter."""

from memwal_adapter.core.client import MemWalClient
from memwal_adapter.integrations.langchain import MemWalChatMessageHistory
from memwal_adapter.integrations.langgraph import MemWalStateStore
from memwal_adapter.integrations.autogen import MemWalMemoryPlugin
from memwal_adapter.workspace.protocol import SharedWorkspace, WorkspaceArtifact

__version__ = "0.1.0"

__all__ = [
    "MemWalClient",
    "MemWalChatMessageHistory",
    "MemWalStateStore",
    "MemWalMemoryPlugin",
    "SharedWorkspace",
    "WorkspaceArtifact",
]
