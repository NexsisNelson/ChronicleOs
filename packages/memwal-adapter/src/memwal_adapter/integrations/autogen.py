"""MemWal Adapter - AutoGen memory plugin."""

from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class MemWalMemoryPlugin:
    """Memory plugin for AutoGen agents."""

    def __init__(
        self,
        endpoint: str,
        session_id: str,
        agent_name: str,
        api_key: Optional[str] = None,
    ):
        """
        Initialize MemWal plugin for AutoGen.

        Args:
            endpoint: MemWal API endpoint
            session_id: Session identifier
            agent_name: Agent name
            api_key: Optional API key
        """
        from memwal_adapter.core.client import MemWalClient

        self.endpoint = endpoint
        self.session_id = session_id
        self.agent_name = agent_name
        self.client = MemWalClient(endpoint, api_key)
        self.key = f"autogen:{session_id}:{agent_name}"

    async def save_conversation(self, messages: List[Dict[str, Any]]) -> None:
        """Save conversation history to MemWal."""
        await self.client.save_memory(
            key=self.key,
            data={
                "messages": messages,
                "agent": self.agent_name,
                "session": self.session_id,
            },
        )

    async def load_conversation(self) -> List[Dict[str, Any]]:
        """Load conversation history from MemWal."""
        data = await self.client.read_memory(self.key)
        if data:
            return data.get("messages", [])
        return []
