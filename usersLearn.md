# How to Use ChronicleOS From Start to Finish

This guide walks through the full ChronicleOS workflow: installing the project, configuring it, running the dashboard and agents, using the core features, testing the system, and deploying it.

## 1. What ChronicleOS Is

ChronicleOS is a monorepo with two main applications:

- `apps/agents`: the Python multi-agent workflow that runs the Researcher, Architect, and Auditor agents
- `apps/dashboard`: the Next.js dashboard for viewing agent activity, memory, artifacts, and execution history

It is designed to work with Walrus for decentralized storage and MemWal for verifiable agent memory.

## 2. Before You Start

You need these tools installed locally:

- Node.js 20 or newer
- npm 10 or newer
- Python 3.10 or newer
- Git
- Docker and Docker Compose if you want the containerized stack

On Windows, PowerShell is the easiest way to run the setup commands.

## 3. Get the Project

Clone the repository and move into it:

```bash
git clone https://github.com/NexsisNelson/ChronicleOs.git
cd chronicle-os
```

## 4. Install Dependencies

Install the root workspace dependencies first:

```bash
npm install
```

Then set up the Python environment for the agents:

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
Push-Location apps/agents
python -m pip install -r requirements-dev.txt
Pop-Location
```

If you only want the runtime dependencies instead of the dev tools, install `apps/agents/requirements.txt`.

## 5. Configure Environment Variables

Copy the example environment files and fill in your values.

### Agents

Create `apps/agents/.env` from the example file and set values such as:

- `WALRUS_ENDPOINT`
- `MEMWAL_ENDPOINT`
- `WALRUS_PRIVATE_KEY`
- `OPENAI_API_KEY` or another model key

### Dashboard

Create `apps/dashboard/.env.local` from the example file and set values such as:

- `NEXT_PUBLIC_WALRUS_GATEWAY`
- `NEXT_PUBLIC_MEMWAL_API`

## 6. Start the Project

### Dashboard

Run the dashboard in its own terminal:

```bash
cd apps/dashboard
npm run dev
```

Open the app at `http://localhost:3000`.

### Agents

Run the multi-agent workflow in another terminal:

```bash
cd apps/agents
python main.py --task "Analyze the latest trends in decentralized storage"
```

You can also add a session id for tracking:

```bash
python main.py --task "Analyze the latest trends in decentralized storage" --session-id demo-1
```

## 7. What Happens When You Run It

The agent workflow typically runs in three phases:

1. Researcher Agent gathers information and sources
2. Architect Agent turns the research into artifacts
3. Auditor Agent reviews the result and scores the output

The dashboard is where you monitor that work. You can use it to inspect:

- Overview and runtime status
- Memory timeline
- Artifact explorer
- Agent logs and session history

## 8. How to Use It Day to Day

A normal workflow looks like this:

1. Start the dashboard so you can watch the run
2. Start the agents with a task description
3. Let the workflow complete
4. Review the output in the dashboard and the terminal summary
5. Re-run with a different task or session id when needed

If you want to experiment, change the task text and use a new `--session-id` so the run is tracked separately.

## 9. How to Work With Sessions and Checkpoints

The agents support session tracking and workflow checkpoints.

- Use `--session-id` to identify a run
- If checkpointing is enabled, the workflow can resume from saved progress
- This is useful for long-running tasks or recovery after interruption

## 10. Run Tests

Use the test suites to verify the project after changes.

### Agents

```bash
cd apps/agents
python -m pytest tests
```

### MemWal adapter

```bash
cd packages/memwal-adapter
python -m pytest tests
```

## 11. Run the Containerized Stack

If you prefer Docker, use the compose files in the repository root.

Common options include:

- `docker-compose.yml` for the standard local stack
- `docker-compose.testnet.yml` for testnet-oriented setup
- `docker-compose.prod.yml` for production-style deployment

Use the scripts in `scripts/` if you want repeatable deploy commands.

## 12. Deploy or Extend the System

When you are ready to go beyond local usage:

- connect Walrus storage and MemWal persistence
- tune the agent prompts and tools in `apps/agents/src/`
- extend the dashboard UI in `apps/dashboard/src/`
- update deployment scripts and compose files for your environment

## 13. Troubleshooting

### Root `npm run dev` fails

If the workspace runner reports Turbo configuration errors, start the dashboard directly with `cd apps/dashboard && npm run dev`.

### Dashboard does not load

- Make sure dependencies are installed in `apps/dashboard`
- Check that port 3000 is free
- Verify `.env.local` is present

### Agents fail to import packages

- Confirm the virtual environment is active
- Reinstall `requirements.txt` or `requirements-dev.txt`
- Check that the repo root and `apps/agents` paths are correct

### No data appears in the dashboard

- Start the agents after the dashboard
- Use a task that actually runs the workflow
- Confirm the dashboard environment variables are set

## 14. Recommended End-to-End Flow

If you want the shortest successful path from zero to a working run, do this:

1. Install Node and Python prerequisites
2. Clone the repository
3. Run `npm install`
4. Create and activate the Python virtual environment
5. Install the agent Python requirements
6. Copy and fill in the `.env` files
7. Start the dashboard with `npm run dev` inside `apps/dashboard`
8. Start the agents with `python main.py --task "..."`
9. Watch the dashboard and terminal output
10. Run tests after any code changes

That is the full lifecycle for using ChronicleOS locally.
