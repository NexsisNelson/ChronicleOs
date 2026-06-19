# Start Here

ChronicleOS now has a single bootstrap command for fresh machines:

```bash
git clone https://github.com/NexsisNelson/ChronicleOs.git
cd ChronicleOs
```

Then run the bootstrap command:

```bash
npm run bootstrap
```

That command creates the local env files, installs dependencies, and prepares the offline demo store.

After bootstrap, run:

```bash
npm run ready
```

That single check confirms the dashboard health route, the agent readiness summary, and the seeded demo bundle are aligned.

## Daily Workflow

```bash
npm run dev
```

Open the dashboard, then run a workflow in another terminal.

### Windows PowerShell

```powershell
.\.venv\Scripts\python.exe apps\agents\main.py --local-demo
```

### macOS / Linux

```bash
./.venv/bin/python apps/agents/main.py --local-demo
```

If you want to use a custom task instead of the seeded demo:

### Windows PowerShell

```powershell
.\.venv\Scripts\python.exe apps\agents\main.py --task "Summarize the latest ChronicleOS workflow" --session-id demo-2
```

### macOS / Linux

```bash
./.venv/bin/python apps/agents/main.py --task "Summarize the latest ChronicleOS workflow" --session-id demo-2
```

## Local Demo

Use the offline demo when you want the dashboard to work without live services:

```bash
npm run reset:local
```

Then rerun the local demo workflow. The dashboard will show seeded memory keys and artifacts even before a real workflow writes data.

For the first successful run, you only need bootstrap, ready, dashboard, and local demo. Skip custom tasks until after you see the seeded data.

## Troubleshooting

If bootstrap stops early:

1. Confirm Node.js 20+ and Python 3.10+ are installed.
2. Re-run `npm run bootstrap` from the repository root.
3. If the dashboard shows no data, run `npm run reset:local` and then `--local-demo` again.
