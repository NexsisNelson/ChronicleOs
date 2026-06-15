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

> If you run the agents container from a different Docker network, replace `host.docker.internal` with the proper MemWal host or service name.

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

## Optional local services

The provided `docker-compose.prod.yml` includes `memwal` and `redis` as support services.

```bash
docker-compose -f docker-compose.prod.yml up
```

## Security considerations

- Keep `WALRUS_PRIVATE_KEY` and API keys in secrets management, not in source control.
- Use HTTPS for the dashboard in production.
- Use environment-specific credentials and separate staging from production.
