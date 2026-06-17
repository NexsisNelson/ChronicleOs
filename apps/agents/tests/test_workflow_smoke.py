import pytest

import main as agent_main
from src.config import ChronicleConfig


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
