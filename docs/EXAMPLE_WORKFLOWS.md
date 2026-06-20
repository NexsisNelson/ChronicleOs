# Example Workflows

These workflows show how agents produce memory and how the dashboard reflects the live state.

For the easiest handoff, use the dashboard Task Launcher to turn a plain-language request into a runnable command or task file.

For the truly one-click path, use Submit and run latest task so the dashboard saves the request and launches it immediately.

For a faster first run, follow [Start Here](./START_HERE.md) and use `npm run bootstrap` before trying the examples below.

## Workflow 1: Run the agents locally

1. Start MemWal and Walrus with Docker Compose.

```bash
docker compose up -d memwal walrus
```

2. Start the dashboard.

```bash
cd apps/dashboard
npm run dev
```

3. Run an agent task.

```bash
cd apps/agents
python main.py --task "Research the latest ChronicleOS memory flow" --session-id demo-1
```

4. Open the dashboard and inspect:

- Memory Timeline for saved MemWal entries
- Artifact Explorer for Walrus-backed artifacts
- Execution History for the latest workflow records

## Workflow 2: Containerized demo

1. Prepare environment variables from the templates.

```bash
cp apps/agents/.env.example apps/agents/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

2. Start the stack.

```bash
docker compose -f docker-compose.yml up -d memwal walrus dashboard
```

3. Run the workflow inside the agent container.

```bash
docker compose -f docker-compose.yml run --rm agents --task "Create a live memory demo for ChronicleOS" --session-id demo-2
```

4. Refresh the dashboard to see the new memory and artifact entries.

## What to look for

- `research:*` keys appear after the Researcher finishes.
- `architect:*` keys appear after artifact synthesis.
- `audit:*` keys appear after QA completes.
- The dashboard pages query the live services rather than checked-in sample data.
