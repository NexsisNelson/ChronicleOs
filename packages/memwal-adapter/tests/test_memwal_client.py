import httpx
import pytest

from memwal_adapter import MemWalClient, SharedWorkspace


class FakeResponse:
    def __init__(self, status_code=200, payload=None, content=b"", url="http://testserver"):
        self.status_code = status_code
        self._payload = payload or {}
        self.content = content
        self._url = url
        self.request = httpx.Request("GET", url)

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "error",
                request=self.request,
                response=self,
            )


class FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        self.calls = []
        self.store = {
            "beta": {
                "key": "beta",
                "data": {"value": 2},
                "metadata": {},
                "proof": "proof-beta",
                "saved_at": "2026-06-17T00:00:00Z",
            }
        }

    async def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        if method == "POST" and url.endswith("/memory/save"):
            payload = kwargs.get("json", {})
            key = payload.get("key", "unknown")
            entry = {
                "key": key,
                "data": payload.get("data", {}),
                "metadata": payload.get("metadata", {}),
                "proof": "proof-123",
                "saved_at": payload.get("timestamp", "2026-06-17T00:00:00Z"),
            }
            self.store[key] = entry
            return FakeResponse(payload={"proof": "proof-123", "key": key})
        if method == "GET" and url.endswith("/memory/keys"):
            prefix = kwargs.get("params", {}).get("prefix")
            keys = sorted(self.store)
            if prefix:
                keys = [key for key in keys if key.startswith(prefix)]
            return FakeResponse(payload=keys)
        if method == "GET" and "/memory/" in url:
            key = url.split("/memory/", 1)[1]
            entry = self.store.get(key)
            if entry is None:
                return FakeResponse(status_code=404, payload={"error": "not found"}, url=url)
            return FakeResponse(payload=entry, url=url)
        return FakeResponse(status_code=404)

    async def aclose(self):
        return None


@pytest.mark.asyncio
async def test_memwal_client_and_shared_workspace(monkeypatch):
    fake_client = FakeAsyncClient()
    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: fake_client)

    client = MemWalClient("http://memwal.local", api_key="test-key")
    proof = await client.save_memory("alpha", {"value": 1}, {"source": "test"})
    keys = await client.list_memory_keys()
    memory = await client.read_memory("alpha")

    assert proof["proof"] == "proof-123"
    assert keys == ["alpha", "beta"]
    assert memory["key"] == "alpha"

    workspace = SharedWorkspace(session_id="demo", endpoint="http://memwal.local")
    monkeypatch.setattr(workspace, "client", client)

    await workspace.save_artifact(
        agent="researcher",
        artifact_type="report",
        data={"status": "ok"},
        cid="cid-1",
        metadata={"format": "json"},
    )
    artifact = await workspace.read_artifact("researcher", "report")
    artifact_keys = await workspace.list_artifacts()

    assert artifact is not None
    assert artifact.agent == "researcher"
    assert artifact.walrus_cid == "cid-1"
    assert artifact.data == {"status": "ok"}
    assert artifact_keys
    assert artifact_keys[0].name == "report_researcher"
