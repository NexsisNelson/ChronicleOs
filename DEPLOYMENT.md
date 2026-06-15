# Deployment Guide

## Phase 1: Local Development

### Prerequisites

- Python 3.10+
- Node.js 20+
- Walrus devnet tokens (for Phase 2)

### Setup

```bash
# Clone
git clone https://github.com/chronicle-os/chronicle-os.git
cd chronicle-os

# Install dependencies
npm install
cd apps/agents && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Create environment files
cp apps/agents/.env.example apps/agents/.env
cp apps/dashboard/.env.example apps/dashboard/.env.local

# Fill in your credentials in .env files
```

### Run

```bash
# All services
npm run dev

# In separate terminals:
npm --workspace=apps/dashboard run dev  # http://localhost:3000
python apps/agents/main.py --task "Your task"
```

## Phase 2: Walrus Integration (Coming)

### Prerequisites for Walrus

1. **Sui Wallet**: Create a Sui wallet with devnet tokens
   ```bash
   sui client new-address ed25519
   sui client faucet
   ```

2. **Walrus CLI**: Install Walrus
   ```bash
   cargo install walrus-cli
   ```

3. **Configure**: Update `apps/agents/.env`
   ```
   WALRUS_ENDPOINT=https://walrus-devnet.sui.io
   WALRUS_PRIVATE_KEY=<your-private-key>
   ```

### Deploy Agents with Walrus

```bash
python apps/agents/main.py --walrus-enabled --task "Your task"
```

## Phase 3: MemWal Integration (Coming)

### Run Local MemWal Instance

```bash
# Clone MemWal repo
git clone https://github.com/memwal/memwal.git
cd memwal
docker-compose up

# Update endpoints in .env files
MEMWAL_ENDPOINT=http://localhost:8000
```

### Test Integration

```bash
python -c "from memwal_adapter import MemWalClient; print('MemWal SDK ready')"
```

## Production Deployment

### Docker

```bash
# Build images
docker build -t chronicle-agents apps/agents/
docker build -t chronicle-dashboard apps/dashboard/

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Monitor
kubectl logs -f deployment/chronicle-agents
kubectl logs -f deployment/chronicle-dashboard
```

### Security Considerations

- Keep `WALRUS_PRIVATE_KEY` secret (use K8s secrets, environment vaults)
- Rotate API keys regularly
- Use HTTPS for dashboard (reverse proxy with nginx/traefik)
- Rate-limit API endpoints
- Monitor for anomalous agent behavior

## Monitoring & Debugging

### Dashboard

Access at `http://localhost:3000/dashboard`

### Logs

```bash
# Agent logs
tail -f apps/agents/logs/app.log

# Dashboard logs
docker logs chronicle-dashboard

# MemWal logs
docker logs memwal
```

### Health Checks

```bash
# Agent health
curl http://localhost:8001/health

# Dashboard health
curl http://localhost:3000/api/health

# MemWal health
curl http://localhost:8000/health
```
