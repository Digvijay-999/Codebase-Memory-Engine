#!/usr/bin/env bash
# Build the backend and frontend images here for linux/amd64 and load them on a server over ssh,
# for hosts too small to build (see DEPLOY.md, "Low-memory hosts").
#   scripts/ship-images.sh user@server [ssh options, e.g. -i ~/.ssh/key.pem]
# Then on the server: docker compose up -d --no-build
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -ge 1 ] || { echo "usage: $0 user@server [ssh options...]" >&2; exit 2; }
target="$1"; shift
# Only docker-compose.yml: compose.prod.yml changes no build settings, and this way DOMAIN isn't needed here.
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose -f docker-compose.yml build --pull backend frontend
docker save contextforge-backend contextforge-frontend | gzip | ssh "$@" "$target" 'gunzip | docker load'
