param(
  [string]$Task = "Produce a live ChronicleOS memory and artifact demo",
  [string]$SessionId = "demo-1"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path "apps/agents/.env")) {
  Copy-Item "apps/agents/.env.example" "apps/agents/.env"
}

if (-not (Test-Path "apps/dashboard/.env.local")) {
  Copy-Item "apps/dashboard/.env.example" "apps/dashboard/.env.local"
}

docker compose up -d memwal walrus dashboard
Push-Location apps/agents
python main.py --task $Task --session-id $SessionId
Pop-Location
