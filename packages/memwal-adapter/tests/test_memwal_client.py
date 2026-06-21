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


class FakeSdkResult:
    def __init__(self, blob_id="blob-123", result_id="result-123", owner="owner-123", namespace="default"):
        self.blob_id = blob_id
        self.id = result_id
        self.owner = owner
        self.namespace = namespace


class FakeSdkRecallMemory:
    def __init__(self, blob_id: str, text: str, distance: float = 0.01):
        self.blob_id = blob_id
        self.text = text
        self.distance = distance


class FakeSdkRecallResult:
    def __init__(self, results):
        self.results = results


class FakeSdkClient:
    def __init__(self):
        self.saved_texts = []
        self.closed = False

    async def remember_and_wait(self, text, namespace=None, poll_interval_ms=1500, timeout_ms=60000):
        self.saved_texts.append((text, namespace))
        return FakeSdkResult(namespace=namespace or "default")

    async def recall(self, query, limit=10, namespace=None, max_distance=None):
        if not self.saved_texts:
            return FakeSdkRecallResult([])
        return FakeSdkRecallResult([
            FakeSdkRecallMemory(blob_id="blob-123", text=self.saved_texts[-1][0])
        ])

    async def close(self):
        self.closed = True


class FakeMemWalFactory:
    @staticmethod
    def create(*args, **kwargs):
        return FakeSdkClient()


@pytest.mark.asyncio
async def test_memwal_client_and_shared_workspace(monkeypatch):
    fake_client = FakeAsyncClient()
    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: fake_client)

    client = MemWalClient("http://memwal.local")
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


@pytest.mark.asyncio
async def test_memwal_client_uses_sdk_when_credentials_are_present(monkeypatch):
    import memwal_adapter.core.client as client_module

    monkeypatch.setattr(client_module, "MemWal", FakeMemWalFactory)

    client = MemWalClient(
        "http://localhost:8000",
        private_key="0xabc",
        account_id="0x123",
        server_url="https://relayer-staging.memory.walrus.xyz",
    )

    proof = await client.save_memory("alpha", {"value": 1}, {"source": "test"})
    memory = await client.read_memory("alpha")

    assert proof["proof"] == "blob-123"
    assert proof["remote_owner"] == "owner-123"
    assert memory is not None
    assert memory["key"] == "alpha"
    assert memory["data"] == {"value": 1}
