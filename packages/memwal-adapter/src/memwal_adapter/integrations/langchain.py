"""MemWal Adapter - LangChain memory integration."""

from typing import Dict, List, Any, Optional
from langchain.schema import BaseMessage, messages_to_dict, messages_from_dict
from langchain.memory.chat_message_histories.base import BaseChatMessageHistory
import logging

logger = logging.getLogger(__name__)


class MemWalChatMessageHistory(BaseChatMessageHistory):
    """LangChain memory class backed by MemWal."""

    def __init__(
        self,
        endpoint: str,
        session_id: str,
        agent_id: str,
        private_key: Optional[str] = None,
        account_id: Optional[str] = None,
        server_url: Optional[str] = None,
        namespace: str = "default",
    ):
        """
        Initialize MemWal-backed message history.

        Args:
            endpoint: MemWal API endpoint
            session_id: Session identifier
            agent_id: Agent identifier
            private_key: Optional hosted Walrus Memory delegate key
            account_id: Optional hosted Walrus Memory account id
            server_url: Optional hosted Walrus Memory relayer URL
            namespace: Namespace to isolate chat history
        """
        from memwal_adapter.core.client import MemWalClient

        self.endpoint = endpoint
        self.session_id = session_id
        self.agent_id = agent_id
        self.client = MemWalClient(
            endpoint,
            private_key=private_key,
            account_id=account_id,
            server_url=server_url,
            namespace=namespace,
        )
        self.key = f"chat_history:{session_id}:{agent_id}"

    @property
    def messages(self) -> List[BaseMessage]:
        """Get all messages from MemWal."""
        import asyncio

        # Run async operation in sync context
        loop = asyncio.get_event_loop()
        data = loop.run_until_complete(self.client.read_memory(self.key))

        if not data:
            return []

        try:
            messages_data = data.get("messages", [])
            return messages_from_dict(messages_data)
        except Exception as e:
            logger.error(f"Failed to deserialize messages: {e}")
            return []

    def add_message(self, message: BaseMessage) -> None:
        """Add a message to MemWal."""
        import asyncio

        loop = asyncio.get_event_loop()
        current_messages = self.messages
        current_messages.append(message)

        messages_data = messages_to_dict(current_messages)
        payload = {
            "messages": messages_data,
            "agent": self.agent_id,
            "session": self.session_id,
        }

        loop.run_until_complete(
            self.client.save_memory(self.key, payload)
        )

    def clear(self) -> None:
        """Clear message history."""
        import asyncio

        loop = asyncio.get_event_loop()
        loop.run_until_complete(
            self.client.save_memory(self.key, {"messages": []})
        )
