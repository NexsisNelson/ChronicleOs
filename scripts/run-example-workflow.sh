#!/usr/bin/env sh
set -eu

TASK="${1:-Produce a live ChronicleOS memory and artifact demo}"
SESSION_ID="${2:-demo-1}"

if [ ! -f apps/agents/.env ]; then
  cp apps/agents/.env.example apps/agents/.env
fi

if [ ! -f apps/dashboard/.env.local ]; then
  cp apps/dashboard/.env.example apps/dashboard/.env.local
fi

docker compose up -d memwal walrus dashboard
(
  cd apps/agents
  python main.py --task "$TASK" --session-id "$SESSION_ID"
)
