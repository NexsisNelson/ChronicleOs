"""Shared data types for agents."""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Task execution status."""
    STARTING = "starting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"


@dataclass
class ResearchTask:
    """Initial research task input."""
    id: str
    description: str
    status: TaskStatus = TaskStatus.STARTING
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ResearchResult:
    """Output from Researcher Agent."""
    task_id: str
    sources: List[Dict[str, Any]] = field(default_factory=list)
    raw_data: Dict[str, Any] = field(default_factory=dict)
    walrus_cids: List[str] = field(default_factory=list)  # CIDs of saved files
    summary: str = ""
    confidence: float = 0.0
    completed_at: datetime = field(default_factory=datetime.now)


@dataclass
class Artifact:
    """Generated artifact from Architect Agent."""
    name: str
    type: str  # "report", "code", "dataset", etc.
    content: str
    walrus_cid: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ArchitectureResult:
    """Output from Architect Agent."""
    task_id: str
    artifacts: List[Artifact] = field(default_factory=list)
    synthesis_notes: str = ""
    decisions: List[str] = field(default_factory=list)
    completed_at: datetime = field(default_factory=datetime.now)


@dataclass
class AuditFinding:
    """Single audit finding."""
    severity: str  # "error", "warning", "info"
    message: str
    artifact_name: Optional[str] = None
    suggested_action: str = ""


@dataclass
class AuditResult:
    """Output from Auditor Agent."""
    task_id: str
    findings: List[AuditFinding] = field(default_factory=list)
    quality_score: float = 0.0  # 0-100
    approved: bool = False
    feedback: str = ""
    completed_at: datetime = field(default_factory=datetime.now)


@dataclass
class AgentWorkflow:
    """Complete workflow with all three agent outputs."""
    task_id: str
    research: ResearchResult
    architecture: ArchitectureResult
    audit: AuditResult
    status: str = "in_progress"
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
