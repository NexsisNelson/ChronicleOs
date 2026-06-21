import asyncio
import os
from uuid import uuid4

import pytest

import main as agent_main
from src.config import ChronicleConfig
from src.tools.memwal_tools import read_from_memwal


pytestmark = [pytest.mark.live, pytest.mark.slow]


def _live_test_enabled() -> bool:
    return os.getenv("CHRONICLE_LIVE_INTEGRATION") == "1"


def _live_config() -> ChronicleConfig:
    memwal_endpoint = os.getenv("CHRONICLE_LIVE_MEMWAL_ENDPOINT")
    walrus_publisher_endpoint = os.getenv("CHRONICLE_LIVE_WALRUS_PUBLISHER_ENDPOINT")
    walrus_aggregator_endpoint = os.getenv("CHRONICLE_LIVE_WALRUS_AGGREGATOR_ENDPOINT")
    walrus_endpoint = os.getenv("CHRONICLE_LIVE_WALRUS_ENDPOINT")
    if not memwal_endpoint or not (walrus_publisher_endpoint or walrus_endpoint) or not (walrus_aggregator_endpoint or walrus_endpoint):
        pytest.skip("Live integration endpoints are not configured")

    return ChronicleConfig(
        memwal_endpoint=memwal_endpoint,
        walrus_publisher_endpoint=walrus_publisher_endpoint,
        walrus_aggregator_endpoint=walrus_aggregator_endpoint,
        walrus_endpoint=walrus_endpoint,
        session_id=os.getenv("CHRONICLE_LIVE_SESSION_ID", f"live-{uuid4().hex[:8]}"),
        artifacts_dir=os.getenv("CHRONICLE_LIVE_ARTIFACTS_DIR", "./artifacts"),
    )


@pytest.fixture(autouse=True)
def _skip_without_live_env():
    if not _live_test_enabled():
        pytest.skip("Set CHRONICLE_LIVE_INTEGRATION=1 to run live staging/prod tests")


@pytest.fixture
def live_config(monkeypatch):
    config = _live_config()
    monkeypatch.setattr(agent_main, "load_config", lambda: config)
    return config


@pytest.mark.asyncio
async def test_live_workflow_end_to_end(live_config):
    workflow = await asyncio.wait_for(
        agent_main.run_workflow(
            task_description="Validate ChronicleOS live integration against MemWal and Walrus",
            session_id=live_config.session_id,
        ),
        timeout=int(os.getenv("CHRONICLE_LIVE_TIMEOUT_SECONDS", "240")),
    )

    assert workflow.status == "completed"
    assert workflow.recovered_from_checkpoint is False
    assert len(workflow.research.sources) >= 3
    assert len(workflow.architecture.artifacts) >= 2
    assert workflow.audit.quality_score >= 0


@pytest.mark.asyncio
async def test_live_workflow_soak_multiple_runs(live_config):
    session_prefix = f"soak-{uuid4().hex[:6]}"

    workflows = []
    for index in range(3):
        workflow = await asyncio.wait_for(
            agent_main.run_workflow(
                task_description=f"Soak test ChronicleOS run {index + 1}",
                session_id=f"{session_prefix}-{index}",
            ),
            timeout=int(os.getenv("CHRONICLE_LIVE_TIMEOUT_SECONDS", "240")),
        )
        workflows.append(workflow)

    assert all(workflow.status == "completed" for workflow in workflows)
    assert all(len(workflow.research.sources) >= 3 for workflow in workflows)


@pytest.mark.asyncio
async def test_live_workflow_crash_recovery(live_config):
    session_id = f"recovery-{uuid4().hex[:8]}"
    task_description = "Simulate a crash after research and resume from the checkpoint"

    with pytest.raises(RuntimeError, match="Simulated workflow crash after research phase"):
        await asyncio.wait_for(
            agent_main.run_workflow(
                task_description=task_description,
                session_id=session_id,
                fail_after_phase="research",
            ),
            timeout=int(os.getenv("CHRONICLE_LIVE_TIMEOUT_SECONDS", "240")),
        )

    checkpoint = await read_from_memwal(f"workflow:{session_id}:checkpoint")
    assert checkpoint
    assert checkpoint["data"]["checkpoint_stage"] == "research"

    resumed_workflow = await asyncio.wait_for(
        agent_main.run_workflow(
            task_description=task_description,
            session_id=session_id,
        ),
        timeout=int(os.getenv("CHRONICLE_LIVE_TIMEOUT_SECONDS", "240")),
    )

    assert resumed_workflow.status == "completed"
    assert resumed_workflow.recovered_from_checkpoint is True
    assert resumed_workflow.checkpoint_stage == "complete"
    assert len(resumed_workflow.architecture.artifacts) >= 2
