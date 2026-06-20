#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${1:-docker-compose.testnet.yml}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

if [ ! -f apps/agents/.env ]; then
  cp apps/agents/.env.testnet.example apps/agents/.env
  echo "Created apps/agents/.env from the testnet template. Update it before deploying."
fi

if [ ! -f apps/dashboard/.env.local ]; then
  cp apps/dashboard/.env.testnet.example apps/dashboard/.env.local
  echo "Created apps/dashboard/.env.local from the testnet template. Update it before deploying."
fi

docker compose -f "$COMPOSE_FILE" up -d --build
docker compose -f "$COMPOSE_FILE" ps