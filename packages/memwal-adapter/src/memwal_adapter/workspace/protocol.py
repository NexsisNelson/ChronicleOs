"""MemWal Adapter - Shared workspace protocol for cross-agent collaboration."""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class WorkspaceArtifact:
    """Artifact metadata in shared workspace."""

    name: str
    agent: str
    artifact_type: str
    walrus_cid: str
    timestamp: str
    metadata: Dict[str, Any]
    data: Any = None


class SharedWorkspace:
    """Multi-agent shared workspace protocol."""

    def __init__(
        self,
        session_id: str,
        endpoint: str,
        api_key: Optional[str] = None,
    ):
        """
        Initialize shared workspace.

        Args:
            session_id: Session identifier
            endpoint: MemWal API endpoint
            api_key: Optional API key
        """
        from memwal_adapter.core.client import MemWalClient

        self.session_id = session_id
        self.endpoint = endpoint
        self.client = MemWalClient(endpoint, api_key)
        self.workspace_key = f"workspace:{session_id}"

    async def save_artifact(
        self,
        agent: str,
        artifact_type: str,
        data: Any,
        cid: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Save artifact to shared workspace.

        Args:
            agent: Agent saving artifact
            artifact_type: Type of artifact (e.g., 'findings', 'report')
            data: Artifact data
            cid: Walrus CID
            metadata: Optional metadata
        """
        artifact = WorkspaceArtifact(
            name=f"{artifact_type}_{agent}",
            agent=agent,
            artifact_type=artifact_type,
            walrus_cid=cid,
            timestamp=datetime.utcnow().isoformat(),
            metadata=metadata or {},
            data=data,
        )

        await self.client.save_memory(
            key=f"{self.workspace_key}:artifact:{artifact.name}",
            data=asdict(artifact),
        )

    async def read_artifact(
        self,
        agent: str,
        artifact_type: str,
    ) -> Optional[WorkspaceArtifact]:
        """
        Read artifact from shared workspace.

        Args:
            agent: Agent that saved artifact
            artifact_type: Type of artifact

        Returns:
            Artifact metadata or None
        """
        artifact_name = f"{artifact_type}_{agent}"
        data = await self.client.read_memory(
            f"{self.workspace_key}:artifact:{artifact_name}"
        )

        if data and isinstance(data.get("data"), dict):
            return WorkspaceArtifact(**data["data"])
        return None

    async def list_artifacts(self) -> List[WorkspaceArtifact]:
        """List all artifacts in workspace."""
        keys = await self.client.list_memory_keys(
            prefix=f"{self.workspace_key}:artifact:"
        )

        artifacts = []
        for key in keys:
            data = await self.client.read_memory(key)
            if data and isinstance(data.get("data"), dict):
                artifacts.append(WorkspaceArtifact(**data["data"]))

        return artifacts
