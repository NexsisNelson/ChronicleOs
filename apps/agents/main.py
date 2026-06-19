"""Main entry point for ChronicleOS multi-agent system."""

import argparse
import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional
from urllib.error import URLError
from urllib.request import urlopen

from src.config import load_config, set_config
from src.agents.researcher import ResearcherAgent
from src.agents.architect import ArchitectAgent
from src.agents.auditor import AuditorAgent
from src.models.types import ResearchTask, AgentWorkflow
from src.tools.memwal_tools import list_memwal_keys
from src.tools.walrus_tools import list_walrus_objects
from src.workflow_checkpoint import (
    WorkflowCheckpoint,
    load_workflow_checkpoint,
    restore_workflow_from_checkpoint,
    save_workflow_checkpoint,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

DEFAULT_DEMO_TASK = "Produce a ChronicleOS local demo run with seeded memory and artifacts"
ROOT_DIR = Path(__file__).resolve().parents[2]
LOCAL_DEMO_BUNDLE_PATH = ROOT_DIR / 'config' / 'local-demo.sample.json'


def _load_local_demo_bundle() -> Dict[str, Any]:
    try:
        return json.loads(LOCAL_DEMO_BUNDLE_PATH.read_text(encoding='utf-8'))
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            'demo': {
                'sessionId': 'demo-1',
                'task': DEFAULT_DEMO_TASK,
            }
        }


def _probe_url(url: str) -> bool:
    try:
        with urlopen(url, timeout=2):
            return True
    except URLError:
        return False


def _read_task_file(task_file: Optional[str]) -> Optional[str]:
    if not task_file:
        return None

    path = Path(task_file)
    if not path.exists():
        raise FileNotFoundError(f"Task file not found: {task_file}")

    task_text = path.read_text(encoding="utf-8").strip()
    if not task_text:
        raise ValueError(f"Task file is empty: {task_file}")
    return task_text


def _print_session_summary(session_id: str, checkpoint) -> None:
    stage = checkpoint.checkpoint_stage if checkpoint else "unknown"
    description = checkpoint.task_description if checkpoint else "(no description)"
    print(f"- {session_id} [{stage}] {description}")


async def list_sessions() -> None:
    keys = await list_memwal_keys(prefix="workflow:")
    sessions = []

    for key in keys:
        parts = key.split(":")
        if len(parts) >= 3 and parts[-1] == "checkpoint":
            session_id = ":".join(parts[1:-1])
            if session_id not in sessions:
                sessions.append(session_id)

    if not sessions:
        print("No workflow sessions found yet. Run a workflow or use --local-demo to seed sample data.")
        return

    print("Workflow sessions:")
    for session_id in sessions:
        checkpoint = await load_workflow_checkpoint(session_id)
        _print_session_summary(session_id, checkpoint)


async def collect_status_report(local_demo: bool = False) -> Dict[str, Any]:
    config = load_config()
    if local_demo:
        config.walrus_endpoint = ""
        config.memwal_endpoint = ""
        set_config(config)

    bundle = _load_local_demo_bundle()
    demo_session_id = bundle.get('demo', {}).get('sessionId', 'demo-1')
    demo_task = bundle.get('demo', {}).get('task', DEFAULT_DEMO_TASK)

    memwal_keys = await list_memwal_keys()
    walrus_objects = await list_walrus_objects()
    dashboard_health = _probe_url("http://localhost:3000/api/health")
    local_demo_health = _probe_url("http://localhost:3000/api/local-demo/health")

    demo_keys = [key for key in memwal_keys if key.startswith(("research:", "architect:", "audit:", "workflow:"))]
    seeded_demo = any(key.startswith(f"research:{demo_session_id}") for key in memwal_keys)

    return {
        "dashboard_running": dashboard_health or local_demo_health,
        "dashboard_health": dashboard_health,
        "local_demo_health": local_demo_health,
        "memwal_mode": "local-demo" if not config.memwal_endpoint else "remote",
        "walrus_mode": "local-demo" if not config.walrus_endpoint else "remote",
        "seeded_demo": seeded_demo,
        "demo_session_id": demo_session_id,
        "demo_task": demo_task,
        "memwal_key_count": len(memwal_keys),
        "demo_key_count": len(demo_keys),
        "walrus_object_count": len(walrus_objects),
        "seeded_memory_keys": demo_keys,
        "seeded_artifacts": walrus_objects,
        "session_ids": [
            ":".join(key.split(":")[1:-1])
            for key in memwal_keys
            if key.startswith("workflow:") and key.endswith(":checkpoint")
        ],
    }


def format_status_report(report: Dict[str, Any]) -> str:
    lines = [
        "ChronicleOS status",
        f"- Dashboard: {'running' if report['dashboard_running'] else 'not running'}",
        f"- Dashboard health endpoint: {'reachable' if report['dashboard_health'] else 'not reachable'}",
        f"- Local demo health endpoint: {'reachable' if report['local_demo_health'] else 'not reachable'}",
        f"- MemWal mode: {report['memwal_mode']}",
        f"- Walrus mode: {report['walrus_mode']}",
        f"- Seeded demo data: {'yes' if report['seeded_demo'] else 'no'} ({report['demo_key_count']} demo keys, {report['walrus_object_count']} artifacts)",
        f"- Demo session: {report['demo_session_id']}",
        f"- Demo task: {report['demo_task']}",
        f"- Seeded memory keys: {', '.join(report['seeded_memory_keys']) if report['seeded_memory_keys'] else 'none'}",
        f"- Seeded artifacts: {', '.join(report['seeded_artifacts']) if report['seeded_artifacts'] else 'none'}",
        f"- Known sessions: {', '.join(report['session_ids']) if report['session_ids'] else 'none yet'}",
    ]
    return "\n".join(lines)


def format_ready_report(report: Dict[str, Any]) -> str:
    lines = [
        "ChronicleOS readiness",
        f"- Dashboard: {'running' if report['dashboard_running'] else 'not running'}",
        f"- Local demo: {'ready' if report['seeded_demo'] and report['local_demo_health'] else 'not ready'}",
        f"- Seeded demo session: {report['demo_session_id']}",
        f"- Seeded demo memory: {len(report['seeded_memory_keys'])} keys",
        f"- Seeded demo artifacts: {len(report['seeded_artifacts'])} objects",
    ]
    return "\n".join(lines)


async def run_workflow(
    task_description: Optional[str] = None,
    session_id: Optional[str] = None,
    debug: bool = False,
    fail_after_phase: Optional[str] = None,
    local_demo: bool = False,
) -> AgentWorkflow:
    """Run the complete agent workflow.
    
    Args:
        task_description: The research task for agents to work on
        session_id: Optional session identifier (for multi-run tracking)
        debug: Enable debug logging
        
    Returns:
        AgentWorkflow with results from all three agents
    """
    
    config = load_config()

    if local_demo:
        config.walrus_endpoint = ""
        config.memwal_endpoint = ""
        set_config(config)

    if not task_description and session_id:
        checkpoint = await load_workflow_checkpoint(session_id)
        if checkpoint and checkpoint.task_description:
            task_description = checkpoint.task_description

    if not task_description:
        task_description = DEFAULT_DEMO_TASK if local_demo else None

    if not task_description:
        raise ValueError("A task description is required. Use --task, --task-file, or --local-demo.")
    
    if debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    logger.info(f"🚀 Starting ChronicleOS workflow: {task_description[:80]}...")
    
    # Initialize task
    task = ResearchTask(
        id=session_id or "default",
        description=task_description,
        status="starting"
    )

    recovered_from_checkpoint = False
    checkpoint_stage = "fresh"
    checkpoint = None
    if session_id:
        checkpoint = await load_workflow_checkpoint(session_id)
        if checkpoint and checkpoint.task_description == task_description:
            recovered_from_checkpoint = True
            checkpoint_stage = checkpoint.checkpoint_stage

    if checkpoint and checkpoint.task_description == task_description:
        restored = restore_workflow_from_checkpoint(checkpoint)
        research_result = restored.get("research")
        architecture_result = restored.get("architecture")
        audit_result = restored.get("audit")

        if audit_result is not None:
            logger.info("♻️ Resuming from a completed checkpoint for session %s", task.id)
            return AgentWorkflow(
                task_id=task.id,
                research=research_result,
                architecture=architecture_result,
                audit=audit_result,
                status="completed",
                completed_at=restored.get("completed_at"),
                recovered_from_checkpoint=True,
                checkpoint_stage="complete",
            )
    else:
        research_result = None
        architecture_result = None
        audit_result = None
    
    # Phase 1: Research
    if research_result is None:
        logger.info("📚 Phase 1: Research Agent starting...")
        researcher = ResearcherAgent(config=config)
        research_result = await researcher.research(task)
        logger.info(f"✅ Research complete. Found {len(research_result.sources)} sources")
        checkpoint_stage = "research"
        if session_id:
            await save_workflow_checkpoint(
                WorkflowCheckpoint(
                    task_id=task.id,
                    task_description=task.description,
                    checkpoint_stage=checkpoint_stage,
                    research=research_result,
                )
            )
        if fail_after_phase == "research":
            raise RuntimeError("Simulated workflow crash after research phase")
    
    # Phase 2: Architecture
    if architecture_result is None:
        logger.info("🏗️  Phase 2: Architect Agent starting...")
        architect = ArchitectAgent(config=config)
        architecture_result = await architect.synthesize(research_result)
        logger.info(f"✅ Architecture complete. Generated {len(architecture_result.artifacts)} artifacts")
        checkpoint_stage = "architecture"
        if session_id:
            await save_workflow_checkpoint(
                WorkflowCheckpoint(
                    task_id=task.id,
                    task_description=task.description,
                    checkpoint_stage=checkpoint_stage,
                    research=research_result,
                    architecture=architecture_result,
                )
            )
        if fail_after_phase == "architecture":
            raise RuntimeError("Simulated workflow crash after architecture phase")
    
    # Phase 3: Audit
    if audit_result is None:
        logger.info("🔍 Phase 3: Auditor Agent starting...")
        auditor = AuditorAgent(config=config)
        audit_result = await auditor.review(architecture_result)
        logger.info(f"✅ Audit complete. Quality score: {audit_result.quality_score:.1f}%")
        checkpoint_stage = "audit"
        if session_id:
            await save_workflow_checkpoint(
                WorkflowCheckpoint(
                    task_id=task.id,
                    task_description=task.description,
                    checkpoint_stage="complete",
                    research=research_result,
                    architecture=architecture_result,
                    audit=audit_result,
                )
            )
    
    # Compile workflow
    workflow = AgentWorkflow(
        task_id=task.id,
        research=research_result,
        architecture=architecture_result,
        audit=audit_result,
        status="completed",
        recovered_from_checkpoint=recovered_from_checkpoint,
        checkpoint_stage="complete" if audit_result else checkpoint_stage,
    )
    
    logger.info("✨ ChronicleOS workflow completed successfully!")
    return workflow


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="ChronicleOS - Multi-Agent Research Lab"
    )
    parser.add_argument(
        "--list-sessions",
        action="store_true",
        help="List saved workflow sessions and exit"
    )
    parser.add_argument(
        "--ready",
        action="store_true",
        help="Print a concise readiness summary for the dashboard, agent, and seeded demo"
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Print service and local demo readiness summary and exit"
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Resume a workflow from an existing session id"
    )
    parser.add_argument(
        "--task",
        type=str,
        default=None,
        help="Research task description"
    )
    parser.add_argument(
        "--task-file",
        type=str,
        default=None,
        help="Path to a text file containing the task description"
    )
    parser.add_argument(
        "--session-id",
        type=str,
        default=None,
        help="Session identifier for tracking"
    )
    parser.add_argument(
        "--local-demo",
        action="store_true",
        help="Run the workflow in offline local demo mode"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    parser.add_argument(
        "--fail-after-phase",
        type=str,
        choices=["research", "architecture"],
        default=None,
        help="Simulate a crash after a workflow phase for recovery testing"
    )
    
    args = parser.parse_args()

    if args.list_sessions:
        asyncio.run(list_sessions())
        return

    if args.ready:
        status_report = asyncio.run(collect_status_report(local_demo=args.local_demo))
        print(format_ready_report(status_report))
        return

    if args.status:
        status_report = asyncio.run(collect_status_report(local_demo=args.local_demo))
        print(format_status_report(status_report))
        return

    task_description = args.task
    if not task_description:
        try:
            task_description = _read_task_file(args.task_file)
        except (FileNotFoundError, ValueError) as exc:
            parser.error(str(exc))

    session_id = args.resume or args.session_id
    if args.local_demo and not session_id:
        session_id = "local-demo"
    if args.local_demo and not task_description:
        task_description = DEFAULT_DEMO_TASK
    
    # Run async workflow
    workflow = asyncio.run(
        run_workflow(
            task_description=task_description,
            session_id=session_id,
            debug=args.debug,
            fail_after_phase=args.fail_after_phase,
            local_demo=args.local_demo,
        )
    )
    
    # Print summary
    print("\n" + "="*80)
    print("WORKFLOW SUMMARY")
    print("="*80)
    print(f"Task: {workflow.task_id}")
    print(f"Status: {workflow.status}")
    print(f"Quality Score: {workflow.audit.quality_score:.1f}%")
    print(f"Artifacts Generated: {len(workflow.architecture.artifacts)}")
    print(f"Sources Processed: {len(workflow.research.sources)}")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
