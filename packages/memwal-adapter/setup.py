[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "memwal-adapter"
version = "0.1.0"
description = "MemWal integration adapter for AI frameworks (LangChain, LangGraph, AutoGen)"
requires-python = ">=3.10"
authors = [{name = "ChronicleOS Team"}]
dependencies = [
    "httpx>=0.25.0",
    "pydantic>=2.5.0",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
langchain = ["langchain>=0.1.0"]
langgraph = ["langgraph>=0.1.0"]
autogen = ["pyautogen>=0.2.0"]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.5.0",
]

[[project.urls]]
Homepage = "https://github.com/chronicle-os/memwal-adapter"
Documentation = "https://memwal-adapter.readthedocs.io"
Repository = "https://github.com/chronicle-os/memwal-adapter.git"
