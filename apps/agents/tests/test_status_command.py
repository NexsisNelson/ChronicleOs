import pytest

import main as agent_main


@pytest.mark.asyncio
async def test_collect_status_report_local_demo(monkeypatch):
    monkeypatch.setattr(agent_main, 'load_config', lambda: type('Config', (), {'walrus_endpoint': '', 'memwal_endpoint': ''})())

    async def fake_list_memwal_keys():
        return ['research:demo-1', 'architect:demo-1', 'workflow:demo-1:checkpoint']

    async def fake_list_walrus_objects():
        return ['research_summary.md', 'data_export.json']

    monkeypatch.setattr(agent_main, 'list_memwal_keys', fake_list_memwal_keys)
    monkeypatch.setattr(agent_main, 'list_walrus_objects', fake_list_walrus_objects)
    monkeypatch.setattr(agent_main, '_probe_url', lambda url: url.endswith('/api/local-demo/health'))

    report = await agent_main.collect_status_report(local_demo=True)

    assert report['dashboard_running'] is True
    assert report['memwal_mode'] == 'local-demo'
    assert report['walrus_mode'] == 'local-demo'
    assert report['seeded_demo'] is True
    assert report['memwal_key_count'] == 3
    assert report['walrus_object_count'] == 2
    assert report['session_ids'] == ['demo-1']
    assert report['seeded_memory_keys'] == ['research:demo-1', 'architect:demo-1', 'workflow:demo-1:checkpoint']
    assert report['seeded_artifacts'] == ['research_summary.md', 'data_export.json']


@pytest.mark.asyncio
async def test_format_ready_report_mentions_seeded_data(monkeypatch):
    monkeypatch.setattr(agent_main, 'load_config', lambda: type('Config', (), {'walrus_endpoint': '', 'memwal_endpoint': ''})())

    async def fake_list_memwal_keys():
        return ['research:demo-1', 'architect:demo-1', 'workflow:demo-1:checkpoint']

    async def fake_list_walrus_objects():
        return ['research_summary.md', 'data_export.json']

    monkeypatch.setattr(agent_main, 'list_memwal_keys', fake_list_memwal_keys)
    monkeypatch.setattr(agent_main, 'list_walrus_objects', fake_list_walrus_objects)
    monkeypatch.setattr(agent_main, '_probe_url', lambda url: url.endswith('/api/local-demo/health'))

    report = await agent_main.collect_status_report(local_demo=True)
    summary = agent_main.format_ready_report(report)

    assert 'ChronicleOS readiness' in summary
    assert 'Dashboard: running' in summary
    assert 'Local demo: ready' in summary
    assert 'Seeded demo session: demo-1' in summary
    assert 'Seeded demo memory: 3 keys' in summary
    assert 'Seeded demo artifacts: 2 objects' in summary
