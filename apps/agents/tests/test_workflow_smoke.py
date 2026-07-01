import pytest
from uuid import uuid4

import main as agent_main
from src.config import ChronicleConfig
from src.tools.local_store import read_memwal_entry


@pytest.mark.asyncio
async def test_run_workflow_smoke(monkeypatch):
    memory_store = {}
    uploads = []

    async def fake_upload(data, filename=None, content_type=None):
        cid = f"cid-{filename}"
        uploads.append((filename, content_type, data))
        return cid

    async def fake_save(key, data, metadata=None):
        memory_store[key] = data
        return "proof-123"

    async def fake_read(key):
        return memory_store.get(key, {})

    async def fake_checkpoint_save(checkpoint):
        memory_store[f"checkpoint:{checkpoint.task_id}"] = checkpoint.to_payload()
        return "proof-checkpoint"

    async def fake_checkpoint_load(session_id):
        from src.workflow_checkpoint import WorkflowCheckpoint

        payload = memory_store.get(f"checkpoint:{session_id}")
        if not payload:
            return None
        return WorkflowCheckpoint(
            task_id=payload["task_id"],
            task_description=payload["task_description"],
            checkpoint_stage=payload["checkpoint_stage"],
            research=None,
            architecture=None,
            audit=None,
        )

    monkeypatch.setattr(agent_main, "load_config", lambda: ChronicleConfig(walrus_endpoint="", memwal_endpoint=""))
    monkeypatch.setattr("src.agents.researcher.upload_to_walrus", fake_upload)
    monkeypatch.setattr("src.agents.researcher.save_to_memwal", fake_save)
    monkeypatch.setattr("src.agents.architect.upload_to_walrus", fake_upload)
    monkeypatch.setattr("src.agents.architect.save_to_memwal", fake_save)
    monkeypatch.setattr("src.agents.auditor.read_from_memwal", fake_read)
    monkeypatch.setattr("src.agents.auditor.save_to_memwal", fake_save)
    monkeypatch.setattr(agent_main, "save_workflow_checkpoint", fake_checkpoint_save)
    monkeypatch.setattr(agent_main, "load_workflow_checkpoint", fake_checkpoint_load)

    workflow = await agent_main.run_workflow("Map ChronicleOS live memory flow", session_id="smoke-1")

    assert workflow.status == "completed"
    assert len(workflow.research.sources) == 3
    assert len(workflow.architecture.artifacts) == 2
    assert workflow.audit.approved is True
    assert "research:smoke-1" in memory_store
    assert "architect:smoke-1" in memory_store
    assert "audit:smoke-1" in memory_store
    assert uploads


@pytest.mark.asyncio
async def test_workflow_checkpoint_resume_with_remote_memwal_fallback(monkeypatch):
    session_id = f"checkpoint-fallback-{uuid4().hex[:8]}"
    task_description = "Validate remote MemWal fallback checkpoint resume"

    config = ChronicleConfig(
        memwal_endpoint="http://localhost:8000",
        walrus_endpoint="",
        walrus_publisher_endpoint="",
        walrus_aggregator_endpoint="",
        session_id=session_id,
    )

    monkeypatch.setattr(agent_main, "load_config", lambda: config)
    monkeypatch.setattr("src.tools.memwal_tools.get_config", lambda: config)
    monkeypatch.setattr("src.tools.walrus_tools.get_config", lambda: config)

    async def fake_upload(data, filename=None, content_type=None):
        return f"local://{filename or 'artifact.bin'}"

    monkeypatch.setattr("src.tools.walrus_tools.upload_to_walrus", fake_upload)

    remote_calls = {"save": 0, "read": 0}

    class FailingMemWalClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def save_memory(self, key, data, metadata=None):
            remote_calls["save"] += 1
            raise RuntimeError("remote MemWal unavailable")

        async def read_memory(self, key):
            remote_calls["read"] += 1
            raise RuntimeError("remote MemWal unavailable")

        async def verify_proof(self, key, proof):
            return False

        async def list_memory_keys(self, prefix=None):
            raise RuntimeError("remote MemWal unavailable")

    monkeypatch.setattr("src.tools.memwal_tools.MemWalClient", FailingMemWalClient)

    with pytest.raises(RuntimeError, match="Simulated workflow crash after research phase"):
        await agent_main.run_workflow(
            task_description=task_description,
            session_id=session_id,
            fail_after_phase="research",
        )

    checkpoint_key = f"workflow:{session_id}:checkpoint"
    checkpoint = read_memwal_entry(checkpoint_key)
    assert checkpoint
    assert checkpoint["data"]["checkpoint_stage"] == "research"
    assert remote_calls["save"] >= 1

    resumed_workflow = await agent_main.run_workflow(
        task_description=task_description,
        session_id=session_id,
    )

    assert resumed_workflow.status == "completed"
    assert resumed_workflow.recovered_from_checkpoint is True
    assert resumed_workflow.checkpoint_stage == "complete"
    assert len(resumed_workflow.architecture.artifacts) >= 2
