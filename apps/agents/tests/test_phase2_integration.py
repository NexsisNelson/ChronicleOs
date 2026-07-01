import pytest

from src.tools import search_tools, walrus_tools, memwal_tools


class FakeHttpResponse:
    def __init__(self, status_code=200, text="", content=b"", headers=None):
        self.status_code = status_code
        self.text = text
        self.content = content
        self.headers = headers or {"content-type": "text/plain"}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise ValueError(f"HTTP error {self.status_code}")

    async def aread(self):
        return self.text


class FakeHttpClient:
    def __init__(self, *args, **kwargs):
        self.calls = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url, **kwargs):
        self.calls.append(url)
        if "lite.duckduckgo.com" in url:
            body = """
                <html><body>
                <a href="https://example.com">Example Domain</a>
                <a href="https://example.org">Example Org</a>
                </body></html>
            """
            return FakeHttpResponse(text=body, headers={"content-type": "text/html"})
        if "example.com" in url:
            body = "<html><head><title>Example Domain</title></head><body><p>Example content.</p></body></html>"
            return FakeHttpResponse(text=body, headers={"content-type": "text/html"})
        if "export.arxiv.org" in url:
            xml = """
                <feed xmlns="http://www.w3.org/2005/Atom">
                  <entry>
                    <title>Test Paper</title>
                    <summary>Summary text</summary>
                    <published>2026-01-01T00:00:00Z</published>
                    <link rel="alternate" href="https://arxiv.org/abs/1234.5678" />
                    <author><name>Author Name</name></author>
                  </entry>
                </feed>
            """
            return FakeHttpResponse(text=xml, headers={"content-type": "application/atom+xml"})
        return FakeHttpResponse(status_code=404, text="Not found")


@pytest.mark.asyncio
async def test_search_web_returns_results(monkeypatch):
    monkeypatch.setattr(search_tools, "httpx", type("mod", (), {"AsyncClient": FakeHttpClient}))
    results = await search_tools.search_web("chronicleos architecture")
    assert isinstance(results, list)
    assert all(isinstance(item, dict) for item in results)
    assert any("example.com" in item["url"] for item in results)


@pytest.mark.asyncio
async def test_fetch_url_returns_text(monkeypatch):
    monkeypatch.setattr(search_tools, "httpx", type("mod", (), {"AsyncClient": FakeHttpClient}))
    content = await search_tools.fetch_url("https://example.com")
    assert isinstance(content, str)
    assert "Example Domain" in content


@pytest.mark.asyncio
async def test_search_academic_returns_entries(monkeypatch):
    monkeypatch.setattr(search_tools, "httpx", type("mod", (), {"AsyncClient": FakeHttpClient}))
    entries = await search_tools.search_academic("machine learning")
    assert isinstance(entries, list)
    assert len(entries) == 1
    assert entries[0]["title"] == "Test Paper"


@pytest.mark.asyncio
async def test_list_walrus_objects_uses_memwal_references(monkeypatch):
    sample_entry = {
        "walrus_cid": "cid-1",
        "walrus_cids": ["cid-2", "cid-3"],
        "artifacts": [{"walrus_cid": "cid-4"}],
        "result": {"walrus_cid": "cid-5"},
    }

    async def fake_list_keys(prefix=None):
        return ["research:demo-1", "architect:demo-1"]

    async def fake_read(key):
        return sample_entry

    monkeypatch.setattr(walrus_tools, "list_memwal_keys", fake_list_keys)
    monkeypatch.setattr(walrus_tools, "read_from_memwal", fake_read)

    object_ids = await walrus_tools.list_walrus_objects()
    assert {"cid-1", "cid-2", "cid-3", "cid-4", "cid-5"}.issubset(set(object_ids))


@pytest.mark.asyncio
async def test_list_memwal_keys_falls_back_when_remote_unavailable(monkeypatch):
    from src.tools.local_store import save_memwal_entry, list_memwal_keys

    # ensure local storage has at least one key
    save_memwal_entry("research:test", {"foo": "bar"})

    class FakeMemWalClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def list_memory_keys(self, prefix=None):
            raise RuntimeError("unavailable")

    monkeypatch.setattr(memwal_tools, "MemWalClient", FakeMemWalClient)
    monkeypatch.setattr(
        memwal_tools,
        "get_config",
        lambda: type(
            "cfg",
            (),
            {
                "memwal_endpoint": "http://localhost:8000",
                "memwal_private_key": None,
                "memwal_account_id": None,
                "memwal_server_url": None,
                "memwal_namespace": "agents",
            },
        )(),
    )
    monkeypatch.setattr(memwal_tools, "list_local_memwal_keys", list_memwal_keys)

    keys = await memwal_tools.list_memwal_keys()
    assert "research:test" in keys


@pytest.mark.asyncio
async def test_save_to_memwal_verifies_proof(monkeypatch):
    class FakeMemWalClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def save_memory(self, key, data, metadata=None):
            return {"proof": "proof-1", "blob_id": "blob-1"}

        async def verify_proof(self, key, proof):
            assert proof == "proof-1"
            return True

    monkeypatch.setattr(memwal_tools, "MemWalClient", FakeMemWalClient)
    monkeypatch.setattr(
        memwal_tools,
        "get_config",
        lambda: type(
            "cfg",
            (),
            {
                "memwal_endpoint": "http://localhost:8000",
                "memwal_private_key": "abc",
                "memwal_account_id": "id",
                "memwal_server_url": "https://relayer",
                "memwal_namespace": "agents",
            },
        )(),
    )

    proof = await memwal_tools.save_to_memwal("research:test", {"foo": "bar"})
    assert proof == "proof-1"
