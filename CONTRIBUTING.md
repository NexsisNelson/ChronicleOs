# CONTRIBUTING

Thank you for your interest in ChronicleOS! We welcome contributions across all areas:

## Areas We Need Help With

### Phase 2: Walrus + MemWal Integration
- **Walrus SDK Integration** - Connect to live Walrus storage (write `walrus_tools.py`)
- **MemWal Client** - Implement full MemWal API integration
- **Agent Tools** - Build search, fetch, and validation tools
- **Error Handling** - Comprehensive error recovery for long-running workflows

### Phase 3: Dashboard Components
- **Timeline Visualizer** - Interactive chronological memory view with Recharts
- **Artifact Explorer** - Walrus file browser with preview
- **Agent Monitor** - Real-time status and log viewer
- **Execution Replay** - Step-by-step workflow replay

### Phase 4: Documentation & Examples
- **Deployment Guides** - Walrus devnet setup, MemWal local instance
- **Example Notebooks** - Jupyter notebooks demonstrating workflows
- **Troubleshooting** - Common issues and solutions
- **Performance Tuning** - Optimization strategies

## Development Setup

```bash
# Clone and install
git clone https://github.com/chronicle-os/chronicle-os.git
cd chronicle-os
npm install
cd apps/agents && python -m pip install -r requirements-dev.txt
cd ../../packages/memwal-adapter && python -m pip install -e .[dev]

# Run all services
npm run dev

# Run individual services
npm --workspace=apps/dashboard run dev
cd apps/agents && python main.py --task "Your task"
```

## Code Style

- **Python**: Black (line-length=100), Ruff linting
- **TypeScript**: ESLint + Prettier
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`)

## Testing

```bash
# Python
cd apps/agents && python -m pytest tests
cd packages/memwal-adapter && python -m pytest tests

# TypeScript
npm --workspace=apps/dashboard run build
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes with conventional commits
4. Push to branch and create a Pull Request
5. Ensure all checks pass before merge

## Questions?

- Open an issue for bugs or questions
- Check documentation in `/docs`
- Review example code in `/examples`
