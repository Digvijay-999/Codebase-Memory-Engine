#!/usr/bin/env bash
# Restore the data volumes from backups: scripts/restore-volumes.sh <chroma_data-*.tgz> <repos_data-*.tgz>
# Replaces what the volumes hold now. The backend is stopped first; start the stack afterwards (scripts/deploy.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1  # no effect on Linux; keeps container paths intact under Git Bash
[ $# -eq 2 ] || { echo "usage: $0 <chroma_data-*.tgz> <repos_data-*.tgz>" >&2; exit 2; }
ALPINE=alpine:3.23@sha256:469c9ea410b9215eaee7976ba6c0639039b444be8e5d638f7abbada189971eb2
project="$(docker compose config --no-interpolate --no-env-resolution | sed -n 's/^name: //p')"

# Read both archives completely before touching any volume, so a bad file can't wipe data.
for file in "$1" "$2"; do
  docker run --rm -i "$ALPINE" tar tzf - >/dev/null < "$file" || { echo "not a readable .tgz: $file" >&2; exit 1; }
done
docker compose stop backend 2>/dev/null || true
restore() {  # <volume> <archive>
  # Labelled like compose's own volumes, so a later `docker compose up` adopts it.
  docker volume create --label "com.docker.compose.project=$project" --label "com.docker.compose.volume=$1" "${project}_$1" >/dev/null
  docker run --rm -i -v "${project}_$1:/data" "$ALPINE" \
    sh -c 'find /data -mindepth 1 -delete && tar xzf - -C /data && chown -R 10001:10001 /data' < "$2"
  echo "restored $2 -> ${project}_$1"
}
restore chroma_data "$1"
restore repos_data "$2"
