"""Researcher Agent - Data gathering and state tracking."""

import json
import logging
from typing import List, Dict, Any
from datetime import datetime

from src.config import ChronicleConfig
from src.models.types import ResearchTask, ResearchResult
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
        
        sources = [
            {
                "title": f"Research Source {i+1}",
                "url": f"https://example.com/source{i+1}",
                "content": f"Sample research content for source {i+1}",
                "timestamp": datetime.now().isoformat(),
            }
            for i in range(3)
        ]
        
        summary = f"Researched: {task.description}. Found {len(sources)} relevant sources."
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
            confidence=0.75,
        )

        await save_to_memwal(f"research:{task.id}", {
            "result": result_payload,
            "walrus_cid": cid,
            "confidence": result.confidence,
        })

        logger.info(f"{self.name}: Research complete. {len(sources)} sources gathered. Saved research payload to {cid}")
        return result
