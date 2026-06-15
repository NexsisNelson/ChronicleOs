# Frequently Asked Questions

## General

**Q: What is ChronicleOS?**
A: A decentralized multi-agent R&D lab where three autonomous agents (Researcher, Architect, Auditor) collaborate on long-running tasks using Walrus for storage and MemWal for verifiable memory.

**Q: Why should I use ChronicleOS instead of just running agents locally?**
A: ChronicleOS adds:
- Decentralized storage (Walrus) - immutable, verifiable file history
- Cryptographic memory (MemWal) - persist agent state across crashes
- Multi-agent coordination - agents collaborate and share context
- Developer dashboard - inspect agent reasoning in real-time
- Production-ready framework - not just a script

**Q: Can I use my own LLM (not OpenAI)?**
A: Yes! The agent system uses LangChain, which supports:
- OpenAI (GPT-4o, o1)
- Anthropic (Claude 3.5 Sonnet)
- DeepSeek (v3)
- Local models via Ollama
- Custom providers

Set `PRIMARY_MODEL` in `.env` to your choice.

**Q: Is this open-source?**
A: Yes, MIT license. Contributions welcome!

## Setup & Installation

**Q: Do I need Walrus/MemWal running locally for Phase 1?**
A: No. Phase 1 uses local placeholders. Phase 2 will add real Walrus + MemWal integration.

**Q: What Python version do I need?**
A: Python 3.10+. Check with `python --version`.

**Q: Can I use Windows?**
A: Yes. The setup works on Windows, macOS, and Linux. Use `venv\Scripts\activate` instead of `source venv/bin/activate` on Windows.

**Q: How much disk space do I need?**
A: ~500MB for dependencies + logs. More if you process large datasets in Phase 2.

## Development

**Q: Can I modify the agent prompts?**
A: Yes! Edit the agent logic in `apps/agents/src/agents/`.

Example: To make Researcher agent focus on specific sources:
```python
# In researcher.py
sources = await search_web(task.description + " site:arxiv.org")  # Only arXiv
```

**Q: How do I add a custom tool?**
A: Create a new file in `apps/agents/src/tools/`:

```python
# my_tool.py
async def my_tool(query: str) -> str:
    # Your implementation
    return result
```

Then import and use in agents.

**Q: Can I run multiple agent instances in parallel?**
A: Yes! Start multiple terminals:
```bash
python main.py --session-id "run_1" --task "Task 1"
python main.py --session-id "run_2" --task "Task 2"
```

Each session maintains separate state in MemWal.

## Dashboard

**Q: Why is the dashboard empty?**
A: Run agents first! The dashboard displays live data from running workflows:
```bash
python apps/agents/main.py --task "..."
```

**Q: Can I customize the dashboard UI?**
A: Yes! Edit components in `apps/dashboard/src/components/` and pages in `apps/dashboard/src/app/`.

**Q: How do I add a new dashboard page?**
A: Create a file in `apps/dashboard/src/app/dashboard/your-page/page.tsx`:

```tsx
export default function YourPage() {
  return <div>Your content</div>
}
```

It'll automatically appear in the navigation.

## Phase 2: Walrus Integration

**Q: When is Walrus integration coming?**
A: Phase 2, estimated 4-6 weeks. See [ARCHITECTURE.md](./ARCHITECTURE.md) for roadmap.

**Q: How do I get Walrus devnet tokens?**
A:
```bash
# Install Sui CLI
curl -sSL https://sui-releases.s3.us-east-1.amazonaws.com/sui-latest.zip | unzip

# Create wallet
sui client new-address ed25519

# Request devnet tokens
sui client faucet
```

**Q: How much do Walrus writes cost?**
A: Gas fees in Sui tokens. Each write is ~1000-10000 MIST (1 SUI = 1B MIST). Devnet tokens are free and unlimited.

**Q: Can I use Walrus testnet instead of devnet?**
A: Yes, update `WALRUS_ENDPOINT=https://walrus-testnet.sui.io` in `.env`.

## Performance & Scaling

**Q: How long does a full workflow take?**
A: ~1-5 minutes depending on:
- LLM response time (10-30s per call)
- Number of sources to process (varies)
- Artifact complexity (varies)

**Q: Can I run longer workflows (hours/days)?**
A: Yes! That's the point of MemWal. If a workflow crashes, restart it and it resumes from the last checkpoint.

**Q: How many agents can run simultaneously?**
A: Depends on your LLM rate limits. With OpenAI:
- GPT-4: ~3-5 parallel calls
- GPT-3.5: ~10-20 parallel calls

Start small and scale up.

## Troubleshooting

**Q: ImportError: No module named 'memwal_adapter'**
A: Install it:
```bash
pip install -e packages/memwal-adapter
```

**Q: TypeError: object NoneType can't be used in 'await' expression**
A: You're mixing sync and async code. Check that you're using `await` for async functions and running in an async context.

**Q: Memory timeline shows no events**
A: Phase 1 doesn't save events (uses placeholders). This will work in Phase 2 when MemWal is integrated.

**Q: Dashboard won't start**
A: Check port 3000 is free:
```bash
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000
```

If in use, change port: `npm --workspace=apps/dashboard run dev -- -p 3001`

## Architecture & Design

**Q: Why three agents?**
A: Separation of concerns:
- **Researcher**: Data gathering (diverse sources, risk of noise)
- **Architect**: Synthesis (turns raw data into structured artifacts)
- **Auditor**: QA (catches errors, ensures quality)

Together they produce higher-quality outputs than a single agent.

**Q: Why Walrus?**
A: Decentralized immutable storage means:
- Artifacts are verifiable (can't be modified retroactively)
- No single point of failure
- Works offline (agents can cache locally, sync later)
- Blockchain-backed (auditable history)

**Q: Why MemWal instead of a database?**
A: MemWal is designed for agents:
- Cryptographic proofs (can prove agent made a decision)
- Query by key pattern (not SQL)
- Works offline (local-first)
- Designed for long-running workflows

**Q: Can I use a different agent framework?**
A: Yes! The system is framework-agnostic. You can replace LangGraph with:
- CrewAI
- AutoGen
- Rasa
- Custom

The key is implementing the agent interface and using the MemWal adapter.

## Contributing

**Q: How can I contribute?**
A: See [CONTRIBUTING.md](./CONTRIBUTING.md). Areas we need help:
- Phase 2 Walrus integration
- Phase 3 dashboard components
- Documentation & examples
- Bug fixes

**Q: What should I work on?**
A: Check [GitHub Issues](https://github.com/chronicle-os/chronicle-os/issues) for tagged tasks.

---

Still have questions? Open a GitHub issue!
