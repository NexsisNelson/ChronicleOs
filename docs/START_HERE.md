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

## Optional hosted Walrus Memory

If you want to connect ChronicleOS to a hosted Walrus Memory relayer instead of the local demo service, set the SDK-style environment variables from the Walrus Memory getting-started guide:

- `MEMWAL_PRIVATE_KEY`
- `MEMWAL_ACCOUNT_ID`
- `MEMWAL_SERVER_URL`

Use `https://relayer.staging.memwal.ai` for staging or `https://relayer.memwal.ai` for production.
Keep `MEMWAL_ENDPOINT=http://localhost:8000` for the built-in local demo path.

## Daily Workflow

```bash
npm run dev
```

Open the dashboard, then run a workflow in another terminal.

If you want the fastest way to hand ChronicleOS a task, open the dashboard Task Launcher first and paste your prompt there. It will generate the exact command and session id for you.

If you want the shortest path, use the dashboard's Submit and run latest task button. It saves the task and launches the workflow without requiring you to paste a command.

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
