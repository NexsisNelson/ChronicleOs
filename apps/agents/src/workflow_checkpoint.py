"""Workflow checkpoint helpers for crash recovery tests and live resumes."""

from dataclasses import asdict, dataclass, field, is_dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from src.models.types import AgentWorkflow, ArchitectureResult, AuditResult, ResearchResult
from src.tools.memwal_tools import read_from_memwal, save_to_memwal


@dataclass
class WorkflowCheckpoint:
    task_id: str
    task_description: str
    checkpoint_stage: str
    research: Optional[ResearchResult] = None
    architecture: Optional[ArchitectureResult] = None
    audit: Optional[AuditResult] = None
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    def to_payload(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task_description": self.task_description,
            "checkpoint_stage": self.checkpoint_stage,
            "research": _to_json_safe(self.research),
            "architecture": _to_json_safe(self.architecture),
            "audit": _to_json_safe(self.audit),
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


def _to_json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if is_dataclass(value):
        return _to_json_safe(asdict(value))
    if isinstance(value, dict):
        return {key: _to_json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_to_json_safe(item) for item in value]
    return value


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None


def _checkpoint_key(session_id: str) -> str:
    return f"workflow:{session_id}:checkpoint"


def _unwrap_payload(entry: Dict[str, Any]) -> Dict[str, Any]:
    data = entry.get("data") if isinstance(entry, dict) else None
    return data if isinstance(data, dict) else entry


def restore_research_result(payload: Optional[Any]) -> Optional[ResearchResult]:
    if payload is None:
        return None
    if isinstance(payload, ResearchResult):
        return payload
    if not isinstance(payload, dict):
        payload = {"task_id": str(payload)}
    return ResearchResult(
        task_id=payload.get("task_id", ""),
        sources=payload.get("sources", []),
        raw_data=payload.get("raw_data", {}),
        walrus_cids=payload.get("walrus_cids", []),
        summary=payload.get("summary", ""),
        confidence=payload.get("confidence", 0.0),
        completed_at=_parse_datetime(payload.get("completed_at")) or datetime.now(),
    )


def restore_architecture_result(payload: Optional[Any]) -> Optional[ArchitectureResult]:
    if payload is None:
        return None
    if isinstance(payload, ArchitectureResult):
        return payload
    if not isinstance(payload, dict):
        payload = {"task_id": str(payload)}
    return ArchitectureResult(
        task_id=payload.get("task_id", ""),
        artifacts=payload.get("artifacts", []),
        synthesis_notes=payload.get("synthesis_notes", ""),
        decisions=payload.get("decisions", []),
        completed_at=_parse_datetime(payload.get("completed_at")) or datetime.now(),
    )


def restore_audit_result(payload: Optional[Any]) -> Optional[AuditResult]:
    if payload is None:
        return None
    if isinstance(payload, AuditResult):
        return payload
    if not isinstance(payload, dict):
        payload = {"task_id": str(payload)}
    return AuditResult(
        task_id=payload.get("task_id", ""),
        findings=payload.get("findings", []),
        quality_score=payload.get("quality_score", 0.0),
        approved=payload.get("approved", False),
        feedback=payload.get("feedback", ""),
        completed_at=_parse_datetime(payload.get("completed_at")) or datetime.now(),
    )


def restore_workflow_from_checkpoint(checkpoint: WorkflowCheckpoint) -> Dict[str, Any]:
    return {
        "research": restore_research_result(checkpoint.research),
        "architecture": restore_architecture_result(checkpoint.architecture),
        "audit": restore_audit_result(checkpoint.audit),
        "created_at": checkpoint.created_at,
        "completed_at": checkpoint.completed_at,
    }


async def load_workflow_checkpoint(session_id: str) -> Optional[WorkflowCheckpoint]:
    entry = await read_from_memwal(_checkpoint_key(session_id))
    if not entry:
        return None

    payload = _unwrap_payload(entry)
    if not payload:
        return None

    return WorkflowCheckpoint(
        task_id=payload.get("task_id", session_id),
        task_description=payload.get("task_description", ""),
        checkpoint_stage=payload.get("checkpoint_stage", "fresh"),
        research=restore_research_result(payload.get("research")),
        architecture=restore_architecture_result(payload.get("architecture")),
        audit=restore_audit_result(payload.get("audit")),
        created_at=_parse_datetime(payload.get("created_at")) or datetime.now(),
        completed_at=_parse_datetime(payload.get("completed_at")),
    )


async def save_workflow_checkpoint(checkpoint: WorkflowCheckpoint) -> str:
    payload = checkpoint.to_payload()
    return await save_to_memwal(_checkpoint_key(checkpoint.task_id), payload, {"kind": "workflow_checkpoint"})
