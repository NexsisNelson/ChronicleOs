# Developer Setup

This guide shows how to prepare ChronicleOS on Windows, macOS, and Linux.

## Prerequisites

- Python 3.10 or newer
- Node.js 20 or newer
- npm 10 or newer
- Git
- Docker and Docker Compose if you want the containerized stack

## 1. Clone the repository

```bash
git clone https://github.com/chronicle-os/chronicle-os.git
cd chronicle-os
```

## 2. Set up Python for the agents

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
Push-Location apps/agents
python -m pip install -r requirements-dev.txt
Pop-Location
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
cd apps/agents
python -m pip install -r requirements-dev.txt
cd ../..
```

## 3. Set up the dashboard

```bash
cd apps/dashboard
npm install
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local`.

## 4. Configure environment variables

### Agents

Copy `apps/agents/.env.example` to `apps/agents/.env` and set:

- `WALRUS_ENDPOINT`
- `MEMWAL_ENDPOINT`
- `WALRUS_PRIVATE_KEY`
- `OPENAI_API_KEY` or another model key

### Dashboard

Copy `apps/dashboard/.env.example` to `apps/dashboard/.env.local` and set:

- `NEXT_PUBLIC_WALRUS_GATEWAY`
- `NEXT_PUBLIC_MEMWAL_API`

## 5. Run the apps locally

### Dashboard

```bash
cd apps/dashboard
npm run dev
```

### Agents

```bash
cd apps/agents
python main.py --task "Summarize the latest ChronicleOS memory workflow" --session-id demo-1
```

## 6. Run tests

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

## 7. Docker deployment

Use the deployment scripts in `scripts/` or run the compose files directly.

## Platform notes

- Windows users should run PowerShell scripts with execution policy adjusted for the current session if needed.
- macOS and Linux users can run the `.sh` scripts directly after making them executable.
- Docker Compose is the most consistent option when you want the dashboard, MemWal, Walrus, and agents running together.
