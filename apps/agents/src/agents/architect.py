"""Architect Agent - Synthesis and artifact creation."""

import json
import logging
from typing import List
from datetime import datetime

from src.config import ChronicleConfig
from src.models.types import ResearchResult, ArchitectureResult, Artifact
from src.tools.llm_client import generate_json
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

        system_prompt = (
            "You are the ChronicleOS Architect agent. Turn the research result into concrete artifacts "
            "for a user-facing workflow. Return only valid JSON."
        )
        user_prompt = f"""
Task id: {research.task_id}
Research summary: {research.summary}
Research sources: {json.dumps(research.sources, ensure_ascii=True, default=str)}

Return JSON with these keys:
- summary_markdown: a markdown document that summarizes the task and the recommended next step
- data_export: a JSON-serializable object with the task, concise analysis, recommended_next_step, and risks
- decisions: an array of at least 2 concise architecture decisions
""".strip()

        llm_result = await generate_json(self.config, system_prompt, user_prompt)

        summary_markdown = str(
            llm_result.get("summary_markdown")
            or f"# Task Summary\n\nTask: {research.task_id}\n\n{research.summary}\n"
        )
        data_export = llm_result.get("data_export")
        if not isinstance(data_export, dict):
            data_export = {
                "task_id": research.task_id,
                "analysis": research.summary,
                "recommended_next_step": "Review the dashboard outputs and refine the task prompt if needed.",
                "risks": [],
            }

        decisions = llm_result.get("decisions") if isinstance(llm_result.get("decisions"), list) else []
        if not decisions:
            decisions = [
                "Produce a human-readable markdown summary for the dashboard.",
                "Export a structured JSON artifact for downstream inspection.",
            ]

        artifacts: List[Artifact] = [
            Artifact(
                name="research_summary.md",
                type="report",
                content=summary_markdown,
                metadata={
                    "format": "markdown",
                    "research_task_id": research.task_id,
                },
            ),
            Artifact(
                name="data_export.json",
                type="dataset",
                content=json.dumps(data_export, default=str, indent=2),
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
