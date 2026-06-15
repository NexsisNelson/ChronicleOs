# Chronicle OS - Agents App

Multi-agent system for collaborative research and artifact generation.

## Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Then run:
python main.py --task "Your research task here"
```

## Agents

- **Researcher Agent** - Data gathering and state tracking
- **Architect Agent** - Synthesis and artifact creation  
- **Auditor Agent** - Quality assurance and verification

## Structure

```
src/
├── agents/
│   ├── __init__.py
│   ├── researcher.py     # Data gathering agent
│   ├── architect.py      # Artifact creation agent
│   └── auditor.py        # QA/verification agent
├── tools/
│   ├── __init__.py
│   ├── walrus_tools.py   # Walrus storage integration
│   ├── memwal_tools.py   # MemWal memory integration
│   ├── search_tools.py   # Web search and data gathering
│   └── validation_tools.py
├── models/
│   ├── __init__.py
│   └── types.py          # Shared data structures
├── config.py             # Configuration and settings
└── main.py               # Entry point
```

## Environment Variables

See `.env.example` for required settings.

## Development

Run with verbose logging:
```bash
python main.py --debug --task "Your task"
```

View agent memory:
```bash
python -c "from src.tools.memwal_tools import list_memory; list_memory()"
```
