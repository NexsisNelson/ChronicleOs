"""Main entry point for ChronicleOS multi-agent system."""

import asyncio
import argparse
import logging
from pathlib import Path
from typing import Optional

from src.config import load_config
from src.agents.researcher import ResearcherAgent
from src.agents.architect import ArchitectAgent
from src.agents.auditor import AuditorAgent
from src.models.types import ResearchTask, AgentWorkflow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def run_workflow(
    task_description: str,
    session_id: Optional[str] = None,
    debug: bool = False,
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
    
    if debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    logger.info(f"🚀 Starting ChronicleOS workflow: {task_description[:80]}...")
    
    # Initialize task
    task = ResearchTask(
        id=session_id or "default",
        description=task_description,
        status="starting"
    )
    
    # Phase 1: Research
    logger.info("📚 Phase 1: Research Agent starting...")
    researcher = ResearcherAgent(config=config)
    research_result = await researcher.research(task)
    logger.info(f"✅ Research complete. Found {len(research_result.sources)} sources")
    
    # Phase 2: Architecture
    logger.info("🏗️  Phase 2: Architect Agent starting...")
    architect = ArchitectAgent(config=config)
    architecture_result = await architect.synthesize(research_result)
    logger.info(f"✅ Architecture complete. Generated {len(architecture_result.artifacts)} artifacts")
    
    # Phase 3: Audit
    logger.info("🔍 Phase 3: Auditor Agent starting...")
    auditor = AuditorAgent(config=config)
    audit_result = await auditor.review(architecture_result)
    logger.info(f"✅ Audit complete. Quality score: {audit_result.quality_score:.1f}%")
    
    # Compile workflow
    workflow = AgentWorkflow(
        task_id=task.id,
        research=research_result,
        architecture=architecture_result,
        audit=audit_result,
        status="completed"
    )
    
    logger.info("✨ ChronicleOS workflow completed successfully!")
    return workflow


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="ChronicleOS - Multi-Agent Research Lab"
    )
    parser.add_argument(
        "--task",
        type=str,
        required=True,
        help="Research task description"
    )
    parser.add_argument(
        "--session-id",
        type=str,
        default=None,
        help="Session identifier for tracking"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    args = parser.parse_args()
    
    # Run async workflow
    workflow = asyncio.run(
        run_workflow(
            task_description=args.task,
            session_id=args.session_id,
            debug=args.debug,
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
