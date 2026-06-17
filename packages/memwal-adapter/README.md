# MemWal Adapter

A lightweight Python SDK that bridges **MemWal** (verifiable agent memory) with popular AI frameworks like LangChain and LangGraph.

## Features

- **Drop-in Memory Replacement** - Replace default in-memory history with verifiable MemWal storage
- **Framework Agnostic** - Works with LangChain, LangGraph, and AutoGen
- **Cryptographic Proofs** - All memory updates are cryptographically signed
- **Shared Workspace Protocol** - Standardized directory structure for multi-agent collaboration
- **Cross-Agent Context** - Agents can read shared memory to understand decisions made by others

## Installation

```bash
pip install memwal-adapter
```

## Quick Start

### LangChain Integration

```python
from memwal_adapter import MemWalChatMessageHistory
from langchain.memory import ConversationBufferMemory

# Initialize MemWal-backed memory
memory = MemWalChatMessageHistory(
    endpoint="http://localhost:8000",
    session_id="session_123",
    agent_id="researcher"
)

# Use with LangChain agent
agent_memory = ConversationBufferMemory(
    memory_key="chat_history",
    chat_memory=memory
)
```

### LangGraph Integration

```python
from memwal_adapter import MemWalStateStore

# Use MemWal as state persistence layer
state_store = MemWalStateStore(
    endpoint="http://localhost:8000",
    workspace_id="chronicle_os_session_1"
)

graph.invoke(
    input_state,
    config={"configurable": {"state_store": state_store}}
)
```

### Shared Workspace Protocol

```python
from memwal_adapter import SharedWorkspace

workspace = SharedWorkspace(
    session_id="session_123",
    endpoint="http://localhost:8000"
)

# Researcher saves findings
await workspace.save_artifact(
    agent="researcher",
    artifact_type="findings",
    data=research_data,
    cid="walrus_cid_123"
)

# Architect reads findings
findings = await workspace.read_artifact(
    agent="researcher",
    artifact_type="findings"
)
```

## Documentation

- [API Reference](./docs/API.md)
- [Integration Guide](./docs/INTEGRATION.md)
- [Shared Workspace Protocol](./docs/WORKSPACE_PROTOCOL.md)

## Architecture

```
memwal_adapter/
├── core/
│   ├── client.py          # MemWal API client
│   └── crypto.py          # Cryptographic verification
├── integrations/
│   ├── langchain.py       # LangChain memory class
│   ├── langgraph.py       # LangGraph state store
│   └── autogen.py         # AutoGen memory plugin
├── workspace/
│   └── protocol.py        # Shared workspace protocol
└── types.py               # Shared data structures
```

## Phases

### Phase 2: Walrus + MemWal Integration
- [x] Client SDK structure
- [ ] MemWal API wrapper
- [ ] Framework integrations
- [ ] Error handling & retries

### Phase 3: Production Release
- [ ] Full documentation
- [ ] Comprehensive test suite
- [ ] PyPI package release
- [ ] Example notebooks

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/
ruff check src/
```

## Build and publish

```bash
python -m pip install build twine
python -m build
twine check dist/*
twine upload dist/*
```

For a test PyPI upload, point `twine` at your test index instead of the public one.

## License

MIT
