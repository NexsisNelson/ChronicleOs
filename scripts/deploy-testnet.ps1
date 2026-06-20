param(
  [string]$ComposeFile = "docker-compose.testnet.yml"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ComposeFile)) {
  throw "Compose file not found: $ComposeFile"
}

if (-not (Test-Path "apps/agents/.env")) {
  Copy-Item "apps/agents/.env.testnet.example" "apps/agents/.env"
  Write-Host "Created apps/agents/.env from the testnet template. Update it before deploying."
}

if (-not (Test-Path "apps/dashboard/.env.local")) {
  Copy-Item "apps/dashboard/.env.testnet.example" "apps/dashboard/.env.local"
  Write-Host "Created apps/dashboard/.env.local from the testnet template. Update it before deploying."
}

docker compose -f $ComposeFile up -d --build
docker compose -f $ComposeFile ps