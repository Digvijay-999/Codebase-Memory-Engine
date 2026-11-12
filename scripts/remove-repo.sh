#!/usr/bin/env bash
# Remove one indexed repo: its clone and its chunks in Chroma. Backs up both volumes first.
#   scripts/remove-repo.sh [--dry-run] [--force] <repo-name>
# --dry-run shows what would be removed and changes nothing. --force allows the demo's original repos.
# The backend is stopped for the backup and the delete (Chroma's files must have one writer), then started again.
set -euo pipefail
cd "$(dirname "$0")/.."
export MSYS_NO_PATHCONV=1  # no effect on Linux; keeps container paths intact under Git Bash
PROTECTED="Hello-World Spoon-Knife flask"
dry=0 force=0 name=
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry=1 ;;
    --force) force=1 ;;
    -*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) [ -z "$name" ] || { echo "only one repo name" >&2; exit 2; }; name="$arg" ;;
  esac
done
[ -n "$name" ] || { echo "usage: $0 [--dry-run] [--force] <repo-name>" >&2; exit 2; }
# Repo names are directory names under REPOS_DIR: never let one reach outside it.
[[ "$name" =~ ^[A-Za-z0-9._-]+$ && "$name" != . && "$name" != .. ]] || { echo "invalid repo name: $name" >&2; exit 2; }
if [[ " $PROTECTED " == *" $name "* && $force -eq 0 ]]; then
  echo "$name is one of the demo's original repos ($PROTECTED). Pass --force to remove it anyway." >&2; exit 1
fi

# Prints "<chunks> <clone present: 0|1>"; with "delete", removes both. Runs with the backend's own code and settings.
repo_py() {  # <name> [delete]
  local cmd=(docker compose exec -T backend)
  [ -n "$(docker compose ps -q --status running backend)" ] || cmd=(docker compose run --rm --no-deps -T --entrypoint python backend)
  [ "${cmd[2]}" = exec ] && cmd+=(python)
  "${cmd[@]}" - "$@" <<'EOF'
import os, shutil, sys
from config.settings import REPOS_DIR
from services.embedding_service import collection
name, delete = sys.argv[1], sys.argv[2:] == ["delete"]
path = os.path.join(REPOS_DIR, os.path.basename(name))
if delete:
    collection.delete(where={"repo_name": name})
    if os.path.isdir(path) and not os.path.islink(path):
        shutil.rmtree(path)
print(len(collection.get(where={"repo_name": name}, include=[])["ids"]), int(os.path.isdir(path)))
EOF
}

read -r chunks clone < <(repo_py "$name" | tail -n 1)
[[ "$chunks" =~ ^[0-9]+$ ]] || { echo "couldn't read the index (is the stack set up?)" >&2; exit 1; }
echo "$name: $chunks chunks in Chroma, clone $([ "$clone" = 1 ] && echo present || echo missing)"
[ "$chunks" -gt 0 ] || [ "$clone" = 1 ] || { echo "nothing to remove for $name" >&2; exit 1; }
if [ $dry -eq 1 ]; then echo "dry run: would back up both volumes, then delete the clone and the $chunks chunks"; exit 0; fi

read -r -p "Type the repo name to delete it: " answer
[ "$answer" = "$name" ] || { echo "not confirmed, nothing changed" >&2; exit 1; }

docker compose stop backend
trap 'docker compose up -d --no-build --no-recreate --wait backend' EXIT
scripts/backup-volumes.sh
read -r chunks clone < <(repo_py "$name" delete | tail -n 1)
[ "$chunks" = 0 ] && [ "$clone" = 0 ] || { echo "removal incomplete: $chunks chunks left, clone present=$clone" >&2; exit 1; }
echo "removed $name (backup above)"
