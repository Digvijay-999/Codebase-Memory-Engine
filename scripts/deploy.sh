#!/usr/bin/env bash
# Update and (re)start the production stack: pull the code, rebuild, start, wait until healthy, show the status.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose config --services | grep -qx caddy \
  || { echo "Set COMPOSE_FILE=docker-compose.yml:compose.prod.yml in .env first (see DEPLOY.md)." >&2; exit 1; }
git pull --ff-only
docker compose build --pull
docker compose up -d --remove-orphans --wait --wait-timeout 300
docker compose ps
