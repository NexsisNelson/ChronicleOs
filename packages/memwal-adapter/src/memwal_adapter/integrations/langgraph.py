"""MemWal Adapter - LangGraph state store integration."""

from typing import Dict, Any, Optional, List
import logging
import json

logger = logging.getLogger(__name__)


class MemWalStateStore:
    """LangGraph state store backed by MemWal."""

    def __init__(
        self,
        endpoint: str,
        workspace_id: str,
        private_key: Optional[str] = None,
        account_id: Optional[str] = None,
        server_url: Optional[str] = None,
        namespace: str = "default",
    ):
        """
        Initialize MemWal-backed state store for LangGraph.

        Args:
            endpoint: MemWal API endpoint
            workspace_id: Workspace identifier
            private_key: Optional hosted Walrus Memory delegate key
            account_id: Optional hosted Walrus Memory account id
            server_url: Optional hosted Walrus Memory relayer URL
            namespace: Namespace to isolate state
        """
        from memwal_adapter.core.client import MemWalClient

        self.endpoint = endpoint
        self.workspace_id = workspace_id
        self.client = MemWalClient(
            endpoint,
            private_key=private_key,
            account_id=account_id,
            server_url=server_url,
            namespace=namespace,
        )

    async def put(self, key: str, value: Dict[str, Any]) -> None:
        """Store state in MemWal."""
        await self.client.save_memory(
            key=f"state:{self.workspace_id}:{key}",
            data={"state": value},
        )

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve state from MemWal."""
        data = await self.client.read_memory(
            key=f"state:{self.workspace_id}:{key}"
        )
        if data:
            return data.get("state")
        return None

    async def delete(self, key: str) -> None:
        """Delete state from MemWal."""
        # MemWal doesn't have explicit delete; save empty state
        await self.client.save_memory(
            key=f"state:{self.workspace_id}:{key}",
            data={"state": None},
        )

    async def list_keys(self) -> List[str]:
        """List all state keys in workspace."""
        prefix = f"state:{self.workspace_id}:"
        all_keys = await self.client.list_memory_keys(prefix=prefix)
        return [k.replace(prefix, "") for k in all_keys if k.startswith(prefix)]
