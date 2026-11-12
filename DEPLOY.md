# Deploy ContextForge on one Ubuntu server

Production is `docker-compose.yml` plus `compose.prod.yml`. Caddy terminates HTTPS for your domain (automatic Let's Encrypt certificates, HSTS) and is the only container with published ports. The backend runs with `APP_ENV=production`, so `/docs` is off, and debug routes are off.

You need an Ubuntu 22.04/24.04 VM with 2 vCPU, 4 GB RAM and 20 GB disk or more, a domain you control, and an OpenRouter API key. Commands run as a normal sudo user.

## 1. Install Docker

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in so the `docker` group applies, then run `docker compose version`.

## 2. Firewall: allow 22, 80 and 443 only

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Also open 22, 80 and 443 in your cloud provider's firewall or security group; ufw alone isn't enough there. Some providers' Ubuntu images also ship iptables rules that block 80/443 even after ufw allows them, so check your provider's docs if HTTPS doesn't connect.

Docker writes its own iptables rules for published ports, and those bypass ufw. That's safe here only because Caddy (80/443) is the only container that publishes ports. Don't add `ports:` to the other services.

## 3. Clone the repo

```bash
git clone <your-repo-url> ~/contextforge
cd ~/contextforge
```

For a private repo, the server needs read access first: either add a read-only deploy key (`ssh-keygen -t ed25519`, add the public key under the repo's Settings → Deploy keys, then clone the `git@github.com:` URL), or run `gh auth login`.

## 4. Create the .env files

```bash
cp backend/.env.example backend/.env
cp .env.example .env
chmod 600 .env backend/.env
nano backend/.env   # set OPENROUTER_API_KEY; optionally LLM_DAILY_LIMIT and the rate limits
nano .env           # uncomment and set the production lines below
```

The root `.env` needs at least:

```
COMPOSE_FILE=docker-compose.yml:compose.prod.yml
DOMAIN=contextforge.example.com
```

With `COMPOSE_FILE` set, every plain `docker compose` command and every script in `scripts/` uses the production setup. Leave the model lines commented to use the built-in defaults.

## 5. Point DNS at the server

Create an A record for `DOMAIN` with the server's public IPv4 address (and an AAAA record if it has IPv6). Before the first start, wait until it resolves, so Caddy can get its certificate:

```bash
dig +short contextforge.example.com   # must print the server's IP
```

## 6. Restore the data

Copy the two backup files from the old machine into `~/contextforge/backups/`, then restore them on the server:

```bash
mkdir -p ~/contextforge/backups                                     # on the server
scp backups/*-20261111.tgz user@server:~/contextforge/backups/      # on the old machine
scripts/restore-volumes.sh backups/chroma_data-20261111.tgz backups/repos_data-20261111.tgz
```

The script checks both archives before it touches anything, replaces the volumes' contents, and sets the owner to the backend user (uid 10001). Skip this step to start empty.

## 7. Start

```bash
scripts/deploy.sh
```

This runs git pull, builds, runs `up -d`, waits until every container is healthy and prints `docker compose ps`. The first build takes a few minutes, because it downloads the embedding model.

## 8. Verify

```bash
D=contextforge.example.com
curl -fsS https://$D/api/health        # "chroma_collection_documents": 944 after the restore
curl -fsS https://$D/api/repos         # Hello-World, Spoon-Knife, flask
curl -s -o /dev/null -w '%{http_code}\n' https://$D/api/docs          # 404
curl -s -o /dev/null -w '%{http_code}\n' https://$D/api/content/flask # 404 (debug route)
curl -sI https://$D/ | grep -iE 'strict-transport|content-security|x-frame'
docker compose ps                      # backend and frontend healthy, caddy up
```

Then open `https://contextforge.example.com`, ask a question in Chat and open the Docs page. Logs: `docker compose logs -f backend` (rotated, 5 × 10 MB per container).

## 9. Update later

```bash
cd ~/contextforge && scripts/deploy.sh
```

## 10. Nightly backup

```bash
crontab -e
```

```
15 3 * * * cd $HOME/contextforge && scripts/backup-volumes.sh >> backups/backup.log 2>&1
```

Each run stops the backend for a few seconds while it copies the data. It writes `backups/<volume>-<UTC time>.tgz` and deletes backups older than 14 days. Copy them off the server regularly (for example `rsync` to another machine). To restore one, use step 6, then `scripts/deploy.sh`.

## Notes

- **HSTS** is set for one year with `includeSubDomains` (in `Caddyfile`). Once browsers have seen it, they refuse plain HTTP for `DOMAIN` and its subdomains. Remove `includeSubDomains` if subdomains of `DOMAIN` must stay on HTTP.
- **The compose network** uses `172.30.240.0/24`, with nginx at `.10` and Caddy at `.20`. If that overlaps a network on the server, set `DOCKER_SUBNET`, `PROXY_IP` and `CADDY_IP` in `.env`.
- **Client IPs:** rate limits use the real client IP (Caddy → nginx → backend). If you put another proxy or CDN in front of Caddy, configure Caddy's `trusted_proxies`, or all visitors will share one limit.
