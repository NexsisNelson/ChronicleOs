"""Architect Agent - Synthesis and artifact creation."""

import json
import logging
from typing import List
from datetime import datetime

from src.config import ChronicleConfig
from src.models.types import ResearchResult, ArchitectureResult, Artifact
from src.tools.walrus_tools import upload_to_walrus
from src.tools.memwal_tools import save_to_memwal

logger = logging.getLogger(__name__)


class ArchitectAgent:
    """Agent responsible for synthesizing research into artifacts."""
    
    def __init__(self, config: ChronicleConfig):
        self.config = config
        self.name = "Architect"
        logger.info(f"Initialized {self.name} Agent")
    
    async def synthesize(self, research: ResearchResult) -> ArchitectureResult:
        """Synthesize research into high-value artifacts.
        
        Args:
            research: ResearchResult from Researcher Agent
            
        Returns:
            ArchitectureResult with generated artifacts
        """
        logger.info(f"{self.name}: Synthesizing research into artifacts")
        
        artifacts: List[Artifact] = [
            Artifact(
                name="research_summary.md",
                type="report",
                content=f"# Research Summary\n\n{research.summary}\n\nSources: {len(research.sources)}",
                metadata={
                    "format": "markdown",
                    "research_task_id": research.task_id,
                },
            ),
            Artifact(
                name="data_export.json",
                type="dataset",
                content=json.dumps({"sources": research.sources}, default=str, indent=2),
                metadata={
                    "format": "json",
                    "total_records": len(research.sources),
                },
            ),
        ]

        saved_artifacts = []
        for artifact in artifacts:
            artifact_bytes = artifact.content.encode("utf-8")
            cid = await upload_to_walrus(
                artifact_bytes,
                filename=artifact.name,
                content_type=("application/json" if artifact.type == "dataset" else "text/markdown"),
            )
            artifact.walrus_cid = cid
            saved_artifacts.append({
                "name": artifact.name,
                "type": artifact.type,
                "walrus_cid": cid,
                "metadata": artifact.metadata,
            })
            logger.info(f"{self.name}: Saved artifact {artifact.name} to Walrus as {cid}")

        decisions = [
            "Chose markdown format for the summary for human readability.",
            "Exported research sources as JSON for structured downstream processing.",
        ]

        architecture_payload = {
            "task_id": research.task_id,
            "artifacts": saved_artifacts,
            "synthesis_notes": f"Synthesized {len(research.sources)} sources into {len(artifacts)} artifacts.",
            "decisions": decisions,
            "created_at": datetime.now().isoformat(),
        }

        await save_to_memwal(f"architect:{research.task_id}", architecture_payload)

        result = ArchitectureResult(
            task_id=research.task_id,
            artifacts=artifacts,
            synthesis_notes=architecture_payload["synthesis_notes"],
            decisions=decisions,
        )

        logger.info(f"{self.name}: Synthesis complete. {len(artifacts)} artifacts generated")
        return result
