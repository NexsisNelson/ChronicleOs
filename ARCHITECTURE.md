# ChronicleOS Architecture

## System Overview

ChronicleOS is a decentralized multi-agent R&D lab with three core layers:

```
┌─────────────────────────────────────────────────────┐
│       Developer Dashboard (Next.js)                 │
│  Memory Timeline | Artifact Explorer | Agent Monitor│
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│         Storage & Memory Infrastructure              │
│  Walrus (Files) + MemWal (Verifiable Memory)        │
└─────────────────────────────────────────────────────┘
                       ▲
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
┌────▼────────┐ ┌─────▼──────┐ ┌───────▼────────┐
│ Researcher  │ │ Architect  │ │ Auditor/Review │
│   Agent     │ │   Agent    │ │     Agent      │
└─────────────┘ └────────────┘ └────────────────┘
     (LangGraph-based)
```

## Agent Workflow

### 1. Researcher Agent
**Role**: Data gathering and state tracking

- Scours external sources (web, APIs, databases)
- Saves raw datasets and markdown notes to **Walrus**
- Tracks research state in **MemWal** (never duplicates work, even after restart)
- Produces: Research findings + CID references

### 2. Architect Agent
**Role**: Synthesis and artifact creation

- Reads research notes from Walrus CIDs
- Uses LLM to synthesize information
- Generates high-value artifacts (reports, code, datasets)
- Saves artifacts back to Walrus
- Produces: Polished artifacts + decision logs

### 3. Auditor Agent
**Role**: Quality assurance and verification

- Pulls final artifacts from Walrus
- Evaluates against original task
- Reads shared **MemWal** context to understand architect decisions
- Logs detailed feedback
- Produces: Quality score + approval/rejection with reasons

## Data Flow

```
Task → Researcher → (Walrus CIDs)
                 ↓
                MemWal (state tracking)
                 ↓
        Architect → (Walrus CIDs)
                 ↓
                MemWal (decisions)
                 ↓
        Auditor → (Quality Score)
                 ↓
              Dashboard
```

## Storage Architecture

### Walrus (Decentralized File Storage)
- **What**: Immutable blob storage on Sui blockchain
- **Use**: Store raw data, documents, artifacts
- **Access**: Via Content IDs (CIDs)
- **Cost**: Gas fees (paid in Sui tokens)

### MemWal (Verifiable Agent Memory)
- **What**: Cryptographic key-value store for agent state
- **Use**: Track agent reasoning, decisions, progress
- **Access**: Via session ID + memory keys
- **Feature**: Cryptographic proofs for auditability

## Implementation Phases

### Phase 1 ✅ Scaffold (COMPLETE)
- [x] Monorepo structure
- [x] Agent framework (LangGraph placeholder)
- [x] Dashboard skeleton (Next.js)
- [x] MemWal adapter SDK

### Phase 2 ⏳ Integration
- [ ] Walrus SDK integration (upload/download files)
- [ ] MemWal API client (real endpoint)
- [ ] Agent tools (search, fetch, validation)
- [ ] End-to-end workflow testing

### Phase 3 ⏳ UI/UX
- [ ] Memory timeline visualization
- [ ] Artifact browser with previews
- [ ] Real-time agent status monitoring
- [ ] Execution history replay

### Phase 4 ⏳ Production
- [ ] Comprehensive documentation
- [ ] Example notebooks + guides
- [ ] Performance optimization
- [ ] PyPI package release

## Key Design Decisions

1. **Python for Agents** - Superior AI framework support (LangChain, LangGraph)
2. **LangGraph for Workflows** - Excellent for multi-agent state machines
3. **MemWal for Memory** - Native support for long-running agent persistence
4. **Walrus for Storage** - Decentralized, immutable, blockchain-backed
5. **Next.js for Dashboard** - Modern, fast, great for real-time updates
6. **Monorepo with Turbo** - Unified tooling, parallel builds

## Shared Memory Protocol

### Directory Structure on Walrus

```
/{session_id}/
├── artifacts/
│   ├── research_findings.md
│   ├── synthesis_report.pdf
│   └── generated_code.ts
├── logs/
│   ├── researcher.log
│   ├── architect.log
│   └── auditor.log
└── metadata.json
```

### MemWal Key Naming Convention

```
chat_history:{session_id}:{agent_id}
state:{session_id}:{agent_name}
workspace:{session_id}:artifact:{type}_{agent}
timeline:{session_id}
```

## Security Model

- **Non-custodial**: Agents don't hold user funds (only stored in Walrus/MemWal)
- **Immutable**: Walrus files cannot be changed, only new versions created
- **Verifiable**: MemWal proofs allow third-party audit of agent decisions
- **Private**: Agents can use private MemWal instances; no public data leakage required

## Performance Characteristics

| Component | Latency | Throughput | Notes |
|-----------|---------|-----------|-------|
| Researcher Agent | 30-300s | 1 task/agent | Depends on API rate limits |
| Architect Agent | 5-60s | 10 artifacts/min | LLM inference time |
| Auditor Agent | 10-30s | 10 reviews/min | LLM evaluation |
| Walrus Upload | 100-500ms | 10 MB/s | Network dependent |
| Walrus Download | 50-200ms | 50 MB/s | Parallel streams |
| MemWal Write | 10-50ms | 1000/sec | Local endpoint |
| MemWal Read | 5-20ms | 5000/sec | Local endpoint |

## Extending the Framework

### Adding a New Agent

```python
# apps/agents/src/agents/custom_agent.py
from src.config import ChronicleConfig
from src.models.types import ResearchResult

class CustomAgent:
    def __init__(self, config: ChronicleConfig):
        self.config = config
        self.name = "Custom"
    
    async def process(self, input_data) -> output_data:
        # Implement custom logic
        pass
```

### Adding a New Integration

```python
# packages/memwal-adapter/src/memwal_adapter/integrations/my_framework.py
from memwal_adapter.core.client import MemWalClient

class MyFrameworkMemory:
    def __init__(self, endpoint, **kwargs):
        self.client = MemWalClient(endpoint)
    
    async def save(self, key, data):
        await self.client.save_memory(key, data)
```

## References

- [Walrus Docs](https://docs.walrus.io)
- [MemWal Docs](https://memwal.io)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Next.js Docs](https://nextjs.org/docs)
