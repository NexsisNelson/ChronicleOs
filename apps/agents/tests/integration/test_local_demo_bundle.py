import json
from pathlib import Path

import pytest

import main as agent_main


def test_local_demo_bundle_matches_dashboard_seed_data():
    root = Path(__file__).resolve().parents[4]
    bundle = json.loads((root / 'config' / 'local-demo.sample.json').read_text(encoding='utf-8'))
    dashboard_bundle = json.loads((root / 'apps' / 'dashboard' / 'src' / 'lib' / 'local-demo-data.json').read_text(encoding='utf-8'))

    assert bundle['demo']['sessionId'] == dashboard_bundle['demoSessionId']
    assert bundle['demo']['task'] == dashboard_bundle['demoTask']
    assert bundle['bootstrap']['dashboardEnv']['NEXT_PUBLIC_LOCAL_DEMO'] == '1'
    assert dashboard_bundle['demoMemoryEntries'][0]['key'] == f"research:{bundle['demo']['sessionId']}"
    assert dashboard_bundle['demoArtifacts'][1]['cid'] == 'local://data_export.json'


@pytest.mark.asyncio
async def test_local_demo_status_report_reuses_shared_bundle(monkeypatch):
    monkeypatch.setattr(agent_main, 'load_config', lambda: type('Config', (), {'walrus_endpoint': '', 'memwal_endpoint': ''})())

    async def fake_list_memwal_keys():
        return ['research:demo-1', 'architect:demo-1', 'audit:demo-1', 'workflow:demo-1:checkpoint']

    async def fake_list_walrus_objects():
        return ['research_summary.md', 'data_export.json']

    monkeypatch.setattr(agent_main, 'list_memwal_keys', fake_list_memwal_keys)
    monkeypatch.setattr(agent_main, 'list_walrus_objects', fake_list_walrus_objects)
    monkeypatch.setattr(agent_main, '_probe_url', lambda url: url.endswith('/api/local-demo/health'))

    report = await agent_main.collect_status_report(local_demo=True)

    assert report['demo_session_id'] == 'demo-1'
    assert report['demo_task'] == 'Produce a ChronicleOS local demo run with seeded memory and artifacts'
    assert report['seeded_demo'] is True
    assert report['seeded_memory_keys'][0] == 'research:demo-1'
    assert report['seeded_artifacts'] == ['research_summary.md', 'data_export.json']
