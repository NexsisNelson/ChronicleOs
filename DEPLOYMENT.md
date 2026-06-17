# Deployment Guide

## Overview
This guide prepares ChronicleOS for containerized deployment.
It includes production Docker images for the dashboard, a containerized agents runtime, and a local Docker Compose stack for Walrus/MemWal support.

## Prerequisites
- Python 3.10+
- Node.js 20+
- Docker Engine
- Docker Compose
- Walrus credentials and MemWal endpoint for Phase 2

## Local Production Build

The quickest path is to use the helper scripts:

```powershell
powershell -File scripts/deploy-prod.ps1
```

```bash
./scripts/deploy-prod.sh
```

If you want to run the commands manually, use the steps below.

### 1. Build Docker images

```bash
cd c:\Users\HP\Desktop\chronicle-os

docker build -t chronicle-dashboard -f apps/dashboard/Dockerfile .
docker build -t chronicle-agents -f apps/agents/Dockerfile .
```

### 2. Run the production compose stack

```bash
docker-compose -f docker-compose.prod.yml up --build
```

### 3. Access the Dashboard

- Dashboard: `http://localhost:3000`
- Dashboard health: `http://localhost:3000/api/health`
- MemWal service: `http://localhost:8000/health`
- Walrus gateway: `http://localhost:8001/blobs/{cid}`

## Testnet deployment

For a clean testnet deployment that uses remote Walrus testnet storage and local MemWal, use the dedicated compose stack:

```bash
docker-compose -f docker-compose.testnet.yml up --build
```

Then copy the provided testnet env templates:

```bash
cp apps/dashboard/.env.testnet.example apps/dashboard/.env.local
cp apps/agents/.env.testnet.example apps/agents/.env
```

Set the real secrets in `apps/agents/.env`:

- `WALRUS_PRIVATE_KEY=<your-sui-private-key>`
- `MEMWAL_API_KEY=<your-memwal-api-key>`
- `OPENAI_API_KEY=<your-openai-key>`

If you need a hosted MemWal endpoint instead of the local container, update `MEMWAL_ENDPOINT` in `apps/agents/.env` and `NEXT_PUBLIC_MEMWAL_API` in `apps/dashboard/.env.local`.

## Running the agents container

Use the agents image as a task runner with environment variables for deployment.

```bash
docker run --rm \
  -e WALRUS_ENDPOINT=https://walrus-devnet.sui.io \
  -e WALRUS_PRIVATE_KEY=<your-key> \
  -e MEMWAL_ENDPOINT=http://host.docker.internal:8000 \
  -e OPENAI_API_KEY=<your-openai-key> \
  chronicle-agents \
  --task "Analyze the latest trends in decentralized storage"
```

For a compose-based production stack, the agents service can use the built-in Walrus and MemWal services without host.docker.internal:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

> If you run the agents container from a different Docker network, replace `host.docker.internal` with the proper MemWal host or service name.

## Example workflow demo

To see live memory writes and dashboard updates end-to-end, start the shared stack and then run the example workflow script:

```powershell
powershell -File scripts/run-example-workflow.ps1
```

```bash
./scripts/run-example-workflow.sh
```

The workflow writes `research:*`, `architect:*`, and `audit:*` entries to MemWal and publishes artifacts to Walrus so the dashboard pages can show the fresh data immediately.

## Environment configuration

### Dashboard
Copy and customize:

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

### Agents
Copy and customize:

```bash
cp apps/agents/.env.example apps/agents/.env
```

## Docker build context and ignore rules

This repository includes `.dockerignore` files at the root and inside each app to keep build contexts small and avoid copying local artifacts.

## Notes

- The dashboard is production-ready using `next build` and `next start`.
- The agents container is configured as a CLI runtime; it can be invoked with `--task` to run workflows.
- The `packages/memwal-adapter` package now includes valid packaging metadata for editable installs and container builds.
- The helper scripts in `scripts/` will create local `.env` files from the templates if they do not already exist.

## Optional local services

The provided `docker-compose.prod.yml` includes `memwal` and `redis` as support services.

```bash
docker-compose -f docker-compose.prod.yml up
```

## Security considerations

- Keep `WALRUS_PRIVATE_KEY` and API keys in secrets management, not in source control.
- Use HTTPS for the dashboard in production.
- Use environment-specific credentials and separate staging from production.
