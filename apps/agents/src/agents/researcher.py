"""Researcher Agent - Data gathering and state tracking."""

import json
import logging
from typing import Dict, Any
from datetime import datetime

from src.config import ChronicleConfig
from src.models.types import ResearchTask, ResearchResult
from src.tools.llm_client import generate_json
from src.tools.walrus_tools import upload_to_walrus
from src.tools.memwal_tools import save_to_memwal

logger = logging.getLogger(__name__)


class ResearcherAgent:
    """Agent responsible for research and data gathering."""
    
    def __init__(self, config: ChronicleConfig):
        self.config = config
        self.name = "Researcher"
        logger.info(f"Initialized {self.name} Agent")
    
    async def research(self, task: ResearchTask) -> ResearchResult:
        """Conduct research on the given task.
        
        Args:
            task: ResearchTask to research
            
        Returns:
            ResearchResult with gathered data and metadata
        """
        logger.info(f"{self.name}: Starting research on '{task.description}'")

        system_prompt = (
            "You are the ChronicleOS Researcher agent. Produce compact, task-specific research notes "
            "based on the user's task. Do not invent external citations or URLs. Return only valid JSON."
        )
        user_prompt = f"""
Task: {task.description}

Return JSON with these keys:
- summary: a concise but concrete summary of how to approach the task
- sources: an array of exactly 3 evidence items, each with title and content
- confidence: a number from 0 to 1

The evidence items should be grounded in the task itself, not fake web citations.
""".strip()

        llm_result = await generate_json(self.config, system_prompt, user_prompt)

        sources = llm_result.get("sources") if isinstance(llm_result.get("sources"), list) else []
        if not sources:
            sources = [
                {
                    "title": "Task brief",
                    "content": task.description,
                    "timestamp": datetime.now().isoformat(),
                },
                {
                    "title": "Execution focus",
                    "content": "Use the configured LLMs to produce task-specific output and persist the results.",
                    "timestamp": datetime.now().isoformat(),
                },
                {
                    "title": "Verification",
                    "content": "Review the generated output in the dashboard history and artifact explorer after the workflow finishes.",
                    "timestamp": datetime.now().isoformat(),
                },
            ]

        summary = str(llm_result.get("summary") or f"Task analysis for: {task.description}")
        result_payload = {
            "task_id": task.id,
            "description": task.description,
            "sources": sources,
            "summary": summary,
            "created_at": datetime.now().isoformat(),
        }

        raw_json = json.dumps(result_payload, indent=2).encode("utf-8")
        filename = f"{task.id}_research.json"
        cid = await upload_to_walrus(raw_json, filename=filename, content_type="application/json")

        result = ResearchResult(
            task_id=task.id,
            sources=sources,
            raw_data={
                "query": task.description,
                "total_sources": len(sources),
                "processed_at": datetime.now().isoformat(),
            },
            walrus_cids=[cid],
            summary=summary,
            confidence=float(llm_result.get("confidence") or 0.75),
        )

        await save_to_memwal(f"research:{task.id}", {
            "result": result_payload,
            "walrus_cid": cid,
            "confidence": result.confidence,
        })

        logger.info(f"{self.name}: Research complete. {len(sources)} sources gathered. Saved research payload to {cid}")
        return result
