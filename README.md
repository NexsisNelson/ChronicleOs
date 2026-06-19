# ChronicleOS – Decentralized Multi-Agent R&D Lab

A production-ready framework for autonomous agents collaborating on long-running technical tasks, powered by **Walrus** (decentralized storage), **MemWal** (verifiable agent memory), and a **Next.js developer dashboard** for real-time introspection.

For the shortest path, start with [docs/START_HERE.md](./docs/START_HERE.md). For the longer walkthrough, see [usersLearn.md](./usersLearn.md).

```
                  [ Walrus / MemWal Storage Layer ]
                     /           |            \
        (Shared Memory)   (Shared Files)    (Execution Logs)
                   /             |              \
   [Research Agent]  [Architect Agent]  [Auditor Agent]
```

## 📋 Quick Start

### Prerequisites
- **Node.js** ≥ 20.0.0 (for dashboard)
- **Python** ≥ 3.10 (for agents)
- **npm** ≥ 10.0.0
- Walrus devnet tokens (for storage gas fees)
- LLM API key (OpenAI, Anthropic, or Deepseek)

### Installation

```bash
npm run bootstrap
```

That one command prepares env files, installs dependencies, and seeds the offline demo store.

### Development

```bash
# Start all services in parallel
npm run dev

# Or run individually:
npm --workspace=apps/dashboard run dev     # Dashboard on http://localhost:3000
cd apps/agents && python main.py            # Agents
```

## 🏗️ Project Structure

```
chronicle-os/
├── apps/
│   ├── agents/              # Multi-agent system (Python + LangGraph)
│   │   ├── src/
│   │   │   ├── agents/      # Researcher, Architect, Auditor
│   │   │   ├── tools/       # Walrus, MemWal, web search tools
│   │   │   └── main.py      # Entry point
│   │   ├── requirements.txt
│   │   └── .env.example
│   │
│   └── dashboard/           # Developer UI (Next.js + TypeScript)
│       ├── src/
│       │   ├── components/  # Memory Timeline, Artifact Explorer
│       │   ├── pages/
│       │   ├── lib/         # Walrus gateway client, MemWal API
│       │   └── styles/
│       ├── package.json
│       └── .env.example
│
├── packages/
│   └── memwal-adapter/      # Python SDK for MemWal integration
│       ├── src/
│       │   ├── memory.py    # Custom memory class for LangGraph
│       │   └── api.py       # MemWal API wrapper
│       ├── setup.py
│       └── requirements.txt
│
├── package.json             # Root monorepo config (Turborepo)
├── pyproject.toml           # Python workspace config
└── README.md
```

## 🎯 Architecture Overview

### Three-Agent Team

1. **Researcher Agent**
   - Gathers data from external APIs and sources
   - Saves raw datasets and markdown notes to Walrus
   - Tracks research progress in MemWal (never duplicates work)

2. **Architect Agent**
   - Reads research notes from Walrus
   - Synthesizes information into high-value artifacts (reports, datasets, code)
   - References Walrus CIDs for traceability

3. **Auditor/Reviewer Agent**
   - QA on final artifacts
   - Reads shared MemWal context to understand architect decisions
   - Approves or routes back for revisions

### Core Integrations

- **Walrus:** Decentralized blob storage with CID-based retrieval
- **MemWal:** Verifiable, timestamped agent memory (cryptographic proofs)
- **LangGraph:** Multi-agent state machines with memory overrides
- **Next.js Dashboard:** Real-time memory timeline + artifact explorer

## 🚀 Phases of Implementation

### Phase 1: Local Multi-Agent Script ✅
- [x] Framework setup (LangGraph)
- [x] Agent definitions (Researcher, Architect, Auditor)
- [ ] Basic tool implementations
- [ ] Local file I/O (before Walrus integration)

### Phase 2: Walrus + MemWal Integration ⏳
- [ ] Walrus SDK integration
- [ ] MemWal API client
- [ ] Custom memory class (replaces default history)
- [ ] End-to-end agent workflow with storage

### Phase 3: SDK Package (memwal-adapter) ⏳
- [ ] LangChain/LangGraph memory wrapper
- [ ] Shared workspace protocol (standardized directory structure)
- [ ] Cross-agent memory serialization
- [ ] PyPI publish

### Phase 4: Dashboard ⏳
- [ ] Memory Timeline Visualizer (chronological state snapshots)
- [ ] Artifact Explorer (Walrus file browser)
- [ ] Agent status + logs viewer
- [ ] Execution history replay

## 📖 Usage Example (Coming Soon)

```python
from chronicle_os.agents import ResearcherAgent, ArchitectAgent, AuditorAgent
from memwal_adapter import MemWalMemory

# Initialize agents with MemWal backing
memory = MemWalMemory(endpoint="http://localhost:8000")
researcher = ResearcherAgent(memory=memory)
architect = ArchitectAgent(memory=memory)
auditor = AuditorAgent(memory=memory)

# Run workflow
task = "Generate a comprehensive market analysis report on AI infrastructure"
result = researcher.run(task)
artifact = architect.synthesize(result)
approval = auditor.review(artifact)
```

## 🔧 Environment Setup

### Create `.env` files

**`apps/agents/.env`:**
```
WALRUS_ENDPOINT=https://walrus-devnet.sui.io
MEMWAL_ENDPOINT=http://localhost:8000
WALRUS_PRIVATE_KEY=<your-sui-private-key>
OPENAI_API_KEY=<your-api-key>
LOG_LEVEL=INFO
```

**`apps/dashboard/.env.local`:**
```
NEXT_PUBLIC_WALRUS_GATEWAY=https://walrus-testnet-gateway.sui.io
NEXT_PUBLIC_MEMWAL_API=http://localhost:3001
```

## 📚 Documentation

- [Users Guide](./usersLearn.md)
- [Start Here](./docs/START_HERE.md)
- [Developer Setup](./docs/DEVELOPER_SETUP.md)
- [Example Workflows](./docs/EXAMPLE_WORKFLOWS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT

---

**Built with** 🚀 **Walrus** + **MemWal** + **LangGraph** + **Next.js**
