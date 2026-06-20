# ChronicleOS User Guide

This guide reflects the current state of ChronicleOS after the bootstrap, local-demo, and dashboard onboarding updates.

## Current State

ChronicleOS now includes:

- a single bootstrap command for fresh machines
- automatic local `.env` file creation with safe defaults
- a local demo mode that works without live MemWal or Walrus services
- a dashboard homepage with an onboarding checklist and direct navigation into memory, artifacts, and history
- a dashboard Task Launcher that can submit a task and run the latest submission without copying commands
- agent CLI helpers for listing sessions, resuming a session, reading a task from a file, and running offline demo mode
- a local reset command for clearing demo data and starting over

The product has two main pieces:

- `apps/agents`: the Python multi-agent workflow that runs the Researcher, Architect, and Auditor agents
- `apps/dashboard`: the Next.js dashboard for memory, artifacts, health checks, and workflow history

## First Success Path

If you only want the fastest path to a working local demo, use this order:

1. Run `npm run bootstrap`
2. Run `npm run ready`
3. Run `npm run dev`
4. Run `python apps/agents/main.py --local-demo` from the repo virtualenv
5. Open the dashboard and click the seeded demo links on the homepage

That path avoids live service setup until after you have already seen seeded memory and artifacts in the dashboard.
You only need three ideas at first: bootstrap, ready, and local demo.

## Before You Start

Install these tools first:

- Node.js 20 or newer
- npm 8.19.4 or newer
- Python 3.10 or newer
- Git
- Docker and Docker Compose if you want the containerized stack

On Windows, PowerShell is the easiest shell for the setup commands.

## Walrus Memory Setup

ChronicleOS supports two MemWal modes:

- local demo mode using `MEMWAL_ENDPOINT=http://localhost:8000`
- hosted Walrus Memory using `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID`, and `MEMWAL_SERVER_URL`

The hosted setup follows the Walrus Memory getting-started model, where the relayer URL is typically `https://relayer.staging.memwal.ai` for staging or `https://relayer.memwal.ai` for production.

## One-Time Setup

### Option A: Fastest path

```bash
git clone https://github.com/NexsisNelson/ChronicleOs.git
cd ChronicleOs
npm run bootstrap
```

What bootstrap does:

1. Creates `apps/agents/.env` and `apps/dashboard/.env.local` if they do not exist
2. Prepares local demo storage folders
3. Installs the workspace dependencies
4. Installs the Python agent dependencies
5. Installs the shared `memwal-adapter` package in editable mode

### Option B: Manual setup

If you want to do it step by step instead of using bootstrap, follow the repo’s setup files and install dependencies separately.

## Fastest First Success

If you only want one successful local run with the fewest concepts possible, do this:

1. Run `npm run bootstrap`.
2. Run `npm run ready`.
3. Start the dashboard with `npm run dev`.
4. Run `python apps/agents/main.py --local-demo` using the repo virtualenv.
5. Open the dashboard and click the seeded demo links on the homepage.

If you want to check readiness before or after a run, use the agent status command:

Windows PowerShell:

```powershell
..\.venv\Scripts\python.exe apps\agents\main.py --status --local-demo
```

macOS / Linux:

```bash
./.venv/bin/python apps/agents/main.py --status --local-demo
```

## Exact Scenarios You Can Use

### Scenario 1: First-time user on a fresh machine

Use this when you want the shortest possible path from a blank machine to a working ChronicleOS installation.

Steps:

1. Clone the repo.
2. Run `npm run bootstrap` from the repo root.
3. Open the dashboard with `npm run dev`.
4. Run the local demo workflow with the repo virtualenv command shown below.
5. Open the dashboard homepage and use the onboarding checklist.

Windows PowerShell:

```powershell
git clone https://github.com/NexsisNelson/ChronicleOs.git
cd ChronicleOs
npm run bootstrap
npm run dev
```

Then in a second PowerShell window:

```powershell
.\.venv\Scripts\python.exe apps\agents\main.py --local-demo
```

macOS / Linux:

```bash
git clone https://github.com/NexsisNelson/ChronicleOs.git
cd ChronicleOs
npm run bootstrap
npm run dev
```

Then in a second terminal:

```bash
./.venv/bin/python apps/agents/main.py --local-demo
```

### Scenario 2: Local offline demo mode

Use this when you want the product to work without live Walrus or MemWal endpoints.

What this gives you:

- seeded memory entries
- seeded artifact files
- dashboard pages that still show useful data
- no dependency on remote services

Steps:

1. Run `npm run reset:local` if you want a clean demo state.
2. Start the dashboard with `npm run dev`.
3. Run the local demo workflow with the repo virtualenv command shown below.
4. Open the dashboard homepage.
5. Use the demo links on the homepage, Memory page, Artifact page, or History page.

Windows PowerShell:

```powershell
npm run reset:local
npm run dev
```

Then:

```powershell
.\.venv\Scripts\python.exe apps\agents\main.py --local-demo
```

macOS / Linux:

```bash
npm run reset:local
npm run dev
```

Then:

```bash
./.venv/bin/python apps/agents/main.py --local-demo
```

### Scenario 3: Real workflow run with your own task

Use this when you want ChronicleOS to process a real prompt and write live workflow output.

Steps:

1. Open the dashboard Task Launcher.
2. Paste your task and choose a session id.
3. Click `Submit and run latest task`.
4. Wait for the Researcher, Architect, and Auditor phases to complete.
5. Review the results in the dashboard memory, artifacts, and history pages.

Windows PowerShell:

```powershell
start http://localhost:3000/dashboard/tasks
```

macOS / Linux:

```bash
open http://localhost:3000/dashboard/tasks
```

You can still use a task file directly when you want to launch from the terminal:

Windows PowerShell:

```powershell
..\.venv\Scripts\python.exe apps\agents\main.py --task-file path\to\task.txt --session-id task-42
```

macOS / Linux:

```bash
./.venv/bin/python apps/agents/main.py --task-file path/to/task.txt --session-id task-42
```

### Scenario 4: Resume an existing session

Use this when a workflow already has a session id and you want to continue from its saved checkpoint.

Steps:

1. Find the session id with the list-sessions command shown below.
2. Resume with `--resume <session-id>`.
3. Keep the task text the same as the original run if you want checkpoint restoration to kick in.
4. Let the workflow finish and then inspect the dashboard pages again.

Windows PowerShell:

```powershell
..\.venv\Scripts\python.exe apps\agents\main.py --resume demo-1 --task "Analyze the latest trends in decentralized storage"
```

macOS / Linux:

```bash
./.venv/bin/python apps/agents/main.py --resume demo-1 --task "Analyze the latest trends in decentralized storage"
```

If you only want to see the available sessions:

Windows PowerShell:

```powershell
..\.venv\Scripts\python.exe apps\agents\main.py --list-sessions
```

macOS / Linux:

```bash
./.venv/bin/python apps/agents/main.py --list-sessions
```

### Scenario 5: Inspect a memory entry directly

Use this when you want to read one MemWal entry and see exactly what the agents stored.

### Scenario 6: Connect to hosted Walrus Memory

Use this when you want ChronicleOS to target the hosted Walrus Memory relayer instead of the local demo endpoint.

Steps:

1. Set `MEMWAL_PRIVATE_KEY`, `MEMWAL_ACCOUNT_ID`, and `MEMWAL_SERVER_URL` in `apps/agents/.env`.
2. Leave `MEMWAL_ENDPOINT` pointed at the local demo service only if you still want the offline fallback.
3. Use the staging relayer URL while testing, then switch to production when you are ready.
4. Run your workflow and verify memory writes through the dashboard and readiness checks.

Steps:

1. Open the dashboard Memory page.
2. Enter a key such as `research:demo-1`, `architect:demo-1`, or `audit:demo-1`.
3. Click Load Entry.
4. Or click one of the seeded demo links.

What you can inspect:

- the original research result payload
- the architect artifact metadata
- the auditor feedback and quality score
- the workflow checkpoint entry

### Scenario 6: Inspect an artifact from Walrus

Use this when you want to open a saved artifact by CID and preview its content.

Steps:

1. Open the dashboard Artifact Explorer.
2. Paste a CID such as `local://research_summary.md` in local demo mode, or a live Walrus CID in connected mode.
3. Click Load Artifact.
4. Review the metadata and preview pane.
5. Use the demo shortcuts if you are on a fresh install.

### Scenario 7: Review workflow history

Use this when you want to browse the sequence of stored memory entries in time order.

Steps:

1. Open the dashboard History page.
2. Review the newest entries first.
3. Click Open memory entry to jump to the exact record.
4. Click Open artifact to jump directly to the related artifact.
5. Use the demo session if no live workflow has run yet.

### Scenario 8: Reset the local demo state

Use this when you want to clear local demo data and start the offline example from scratch.

Steps:

1. Stop any running dashboard or agent process.
2. Run `npm run reset:local`.
3. Start the dashboard again.
4. Rerun the repo virtualenv command shown below.
5. Open the dashboard and confirm the seeded data is back.

Windows PowerShell:

```powershell
..\.venv\Scripts\python.exe apps\agents\main.py --local-demo
```

macOS / Linux:

```bash
./.venv/bin/python apps/agents/main.py --local-demo
```

### Scenario 9: Use a task from a file

Use this when you want to keep a long or reusable task in a text file instead of typing into the dashboard.

Steps:

1. Create a text file with one task description, or paste the task into the Task Launcher and use the download button.
2. Run the agent CLI with `--task-file`, or submit the task in the dashboard and click `Run latest`.
3. Add `--session-id` if you want the run tracked as a named session.
4. Check the dashboard after the workflow completes.

Example:

Windows PowerShell:

```powershell
..\.venv\Scripts\python.exe apps\agents\main.py --task-file tasks\my-task.txt --session-id research-7
```

macOS / Linux:

```bash
./.venv/bin/python apps/agents/main.py --task-file tasks/my-task.txt --session-id research-7
```

### Scenario 10: Run the containerized stack

Use this when you want ChronicleOS to run through Docker Compose instead of local processes.

1. Choose the compose file for your use case.
2. Start the stack.
3. Run the workflow.
4. Refresh the dashboard.

Examples:

```bash
docker compose up -d memwal walrus dashboard
```

```bash
docker compose -f docker-compose.testnet.yml up --build
```

```powershell
powershell -File scripts/deploy-testnet.ps1
```

```bash
docker compose -f docker-compose.prod.yml up --build
```

## What Happens During a Workflow

The agent workflow runs in three phases:

1. Researcher Agent gathers sources and writes research memory
2. Architect Agent turns research into artifacts and writes artifact memory
3. Auditor Agent reviews the result and writes the final audit memory

The dashboard is where you inspect the result:

- Overview and service health
- Memory timeline
- Artifact explorer
- Execution history
- Direct links between workflow entries and artifacts

## How To Use ChronicleOS Day To Day

The simplest recurring flow is:

1. Start the dashboard
2. Use the Task Launcher for real tasks, or `--local-demo` for seeded sample data
3. Wait for the workflow to finish
4. Inspect memory, artifacts, and history
5. Use `--resume` or `--task-file` when needed

## Troubleshooting

### `npm run dev` fails at the workspace root

Start the dashboard directly:

```bash
cd apps/dashboard
npm run dev
```

### The dashboard shows no data

- Make sure you ran `npm run bootstrap`
- Run `npm run reset:local` and then `--local-demo` if you want seeded sample data
- Confirm the dashboard is running on port 3000

### The agent CLI cannot import packages

- Confirm the Python virtual environment is active
- Re-run `npm run bootstrap`
- Check that you are running commands from the repository root

### A live workflow shows no memory or artifacts

- Make sure the dashboard and agents are using the same session id
- Confirm the task completed without errors
- Open the Memory, Artifacts, and History pages in the dashboard

## Recommended Paths

If you want the fastest path from zero to useful output, do this:

1. Clone the repository
2. Run `npm run bootstrap`
3. Start the dashboard with `npm run dev`
4. Run `python apps/agents/main.py --local-demo`
5. Open the dashboard and click through the demo links

If you want a real run instead of the demo, replace step 4 with `--task "..." --session-id demo-1`.
