#!/usr/bin/env bash
# Back up the data volumes to backups/<volume>-<UTC time>.tgz and delete backups older than 14 days.
# Uses the same compose setup as `docker compose` here (COMPOSE_FILE in .env); run it from any directory.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1  # no effect on Linux; keeps container paths intact under Git Bash
ALPINE=alpine:3.23@sha256:469c9ea410b9215eaee7976ba6c0639039b444be8e5d638f7abbada189971eb2
project="$(docker compose config --no-interpolate --no-env-resolution | sed -n 's/^name: //p')"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p backups

# Stop the backend so Chroma's files are consistent, and start it again however this script ends.
if [ -n "$(docker compose ps -q --status running backend)" ]; then
  docker compose stop backend
  trap 'docker compose start backend >/dev/null' EXIT
fi
for vol in chroma_data repos_data; do
  docker volume inspect "${project}_${vol}" >/dev/null
  docker run --rm -v "${project}_${vol}:/data:ro" "$ALPINE" tar czf - -C /data . > "backups/${vol}-${stamp}.tgz"
done
find backups -name '*.tgz' -mtime +14 -delete
ls -lh backups/*-"${stamp}".tgz
