"""Auditor Agent - Quality assurance and verification."""

import logging
from typing import List
from datetime import datetime

from src.config import ChronicleConfig
from src.models.types import ArchitectureResult, AuditResult, AuditFinding
from src.tools.memwal_tools import read_from_memwal, save_to_memwal

logger = logging.getLogger(__name__)


class AuditorAgent:
    """Agent responsible for quality assurance and verification."""
    
    def __init__(self, config: ChronicleConfig):
        self.config = config
        self.name = "Auditor"
        logger.info(f"Initialized {self.name} Agent")
    
    async def review(self, architecture: ArchitectureResult) -> AuditResult:
        """Review artifacts for quality and completeness.
        
        Args:
            architecture: ArchitectureResult from Architect Agent
            
        Returns:
            AuditResult with findings and quality score
        """
        logger.info(f"{self.name}: Starting quality review")

        architect_context = await read_from_memwal(f"architect:{architecture.task_id}")
        findings: List[AuditFinding] = []

        if not architecture.artifacts:
            findings.append(AuditFinding(
                severity="error",
                message="No artifacts generated",
                suggested_action="Architect must generate at least one artifact",
            ))
        else:
            findings.append(AuditFinding(
                severity="info",
                message=f"Found {len(architecture.artifacts)} artifacts for review",
            ))

        if not architecture.synthesis_notes:
            findings.append(AuditFinding(
                severity="warning",
                message="Synthesis notes are empty",
                suggested_action="Architect should document synthesis decisions",
            ))

        if architect_context:
            findings.append(AuditFinding(
                severity="info",
                message="Architect decisions were loaded from MemWal context",
                suggested_action="Review referenced decisions in the artifact metadata",
            ))
        else:
            findings.append(AuditFinding(
                severity="warning",
                message="No architect context found in MemWal",
                suggested_action="Ensure architect decisions are persisted to MemWal",
            ))

        for artifact in architecture.artifacts:
            if not artifact.walrus_cid:
                findings.append(AuditFinding(
                    severity="warning",
                    message=f"Artifact {artifact.name} has no Walrus CID",
                    suggested_action="Save artifacts to Walrus before review",
                ))

        errors = len([item for item in findings if item.severity == "error"])
        warnings = len([item for item in findings if item.severity == "warning"])
        quality_score = max(0, 100 - (errors * 25 + warnings * 6))
        approved = quality_score >= 75 and errors == 0

        feedback = (
            f"Quality review complete. Score: {quality_score:.0f}%. "
            f"Status: {'✅ APPROVED' if approved else '⚠️ NEEDS REVISION'}"
        )

        audit_payload = {
            "task_id": architecture.task_id,
            "findings": [f.__dict__ for f in findings],
            "quality_score": quality_score,
            "approved": approved,
            "feedback": feedback,
            "completed_at": datetime.now().isoformat(),
        }

        await save_to_memwal(f"audit:{architecture.task_id}", audit_payload)

        result = AuditResult(
            task_id=architecture.task_id,
            findings=findings,
            quality_score=quality_score,
            approved=approved,
            feedback=feedback,
        )

        logger.info(f"{self.name}: Review complete. Quality: {quality_score:.0f}%. Approved: {approved}")
        return result
