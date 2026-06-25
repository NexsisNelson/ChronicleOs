import pytest

from src.config import ChronicleConfig
from src.tools.llm_client import generate_json


@pytest.mark.asyncio
async def test_generate_json_falls_back_without_api_keys():
    config = ChronicleConfig(openai_api_key=None, anthropic_api_key=None, deepseek_api_key=None)

    result = await generate_json(
        config,
        "You are the ChronicleOS Researcher agent.",
        "Task: produce a local demo summary",
    )

    assert result["summary"]
    assert isinstance(result["sources"], list)
    assert len(result["sources"]) >= 3
