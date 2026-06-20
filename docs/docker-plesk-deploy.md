# Deploy tamir.li with Docker on Plesk

Single **docker compose** stack replaces the split setup (static `httpdocs` + Plesk Node.js subdomain + Plesk MySQL):

| Service | Role |
|---------|------|
| **web** | nginx — Vite `dist/` + reverse proxy `/api` → backend |
| **backend** | Express API + Prisma |
| **mysql** | MySQL 8 (persistent volume) |

One public port (`WEB_PORT`, default **8080**) serves the whole site. No separate `api.tamir.li` subdomain required (optional if you prefer).

Related: split Plesk deploy remains in [`plesk-deploy.md`](./plesk-deploy.md). DNS: [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md).

---

## Architecture

```text
                    Cloudflare / DNS
                           │
                           ▼
              Plesk (proxy or Docker port map)
                           │
                           ▼
              ┌────────────────────────────┐
              │  web (nginx)  :8080→80   │
              │  • static SPA (dist/)    │
              │  • /api/* → backend        │
              │  • /health → backend     │
              └─────────────┬────────────┘
                            │ internal network
              ┌─────────────┴────────────┐
              │                          │
              ▼                          ▼
     ┌─────────────────┐        ┌─────────────────┐
     │ backend :5000   │        │ mysql :3306     │
     │ Express+Prisma  │◄───────│ volume: data    │
     └─────────────────┘        └─────────────────┘
```

**File conversion:** conversions run in the browser (Vite bundle). The API records usage/auth/billing; `POST /api/conversions` is still a stub (501). No ffmpeg/imagemagick in containers today.

---

## Prerequisites

- Plesk with **Docker** extension (or SSH + Docker CLI on the VPS)
- Git or SFTP access to the server
- Domain `tamir.li` pointed at the Plesk server (see DNS section)

---

## One-time server setup

### 1. Clone the repo on the server

```bash
cd ~
git clone https://github.com/StiNgeRIsrael/tamir-li.git
cd tamir-li
```

Or use Plesk **Git** on the subscription to pull into e.g. `~/tamir-li`.

### 2. Create environment file

```bash
cp .env.docker.example .env.docker
chmod 600 .env.docker
```

Edit `.env.docker` — fill secrets (never commit this file). Templates also reference:

- Root frontend vars: [`.env.example`](../.env.example)
- Backend vars: [`backend/.env.example`](../backend/.env.example)

**Important for same-origin API:**

```env
VITE_SITE_ORIGIN=https://tamir.li
VITE_API_URL=https://tamir.li
CORS_ORIGIN=https://tamir.li,https://www.tamir.li
```

Stripe webhook URL becomes `https://tamir.li/api/billing/webhook` (not `api.tamir.li`).

### 3. Deploy

```bash
docker compose --env-file .env.docker up -d --build
```

Updates:

```bash
git pull
docker compose --env-file .env.docker up -d --build
```

---

## Plesk Docker extension (UI)

Steps vary slightly by Plesk version; typical flow:

1. **Extensions** → **Docker** → enable if needed.
2. **Add Stack** / **Compose** → point to `docker-compose.yml` in the cloned repo path (e.g. `/var/www/vhosts/tamir.li/tamir-li/docker-compose.yml`).
3. **Environment file:** `.env.docker` in the same directory (upload or create in File Manager).
4. **Published port:** map host port → container `web:80` (e.g. host `8080` → container `80`). Match `WEB_PORT` in `.env.docker`.
5. **Restart policy:** `unless-stopped` (already in compose).
6. Click **Create** / **Up** to start the stack.

### Plesk proxy to the container (recommended)

Instead of exposing `8080` publicly:

1. **Domains** → `tamir.li` → **Apache & nginx Settings** or **Hosting Settings**.
2. Configure **proxy** to `http://127.0.0.1:8080` (or use Plesk “Docker proxy” if offered).
3. Keep **Let's Encrypt** on `tamir.li` / `www.tamir.li` in Plesk.
4. Cloudflare SSL: **Full (strict)** — see [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md).

### Plesk Docker UI checklist

| Setting | Value |
|---------|--------|
| Compose file | `docker-compose.yml` in repo root |
| Env file | `.env.docker` (same folder) |
| Public service | `web` |
| Container port | `80` |
| Host port | `8080` (or match `WEB_PORT`) |
| Volumes | `mysql_data` (auto-created; do not delete) |

---

## DNS (`tamir.li`)

| Type | Name | Target | Notes |
|------|------|--------|-------|
| A | `@` | Plesk server IP | Apex |
| A or CNAME | `www` | same server | Optional www |

**No `api` record required** when using same-origin `VITE_API_URL=https://tamir.li`.

If you keep a separate API subdomain, set `VITE_API_URL=https://api.tamir.li` and proxy only `/api` on that host (more moving parts).

---

## Environment variables

### Required in `.env.docker`

| Variable | Purpose |
|----------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root (container init) |
| `MYSQL_PASSWORD` | App DB user password |
| `JWT_SECRET` | Auth tokens (min 16 chars) |

### Strongly recommended

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` |
| `VITE_API_URL` | `https://tamir.li` (same origin) |
| `CORS_ORIGIN` | `https://tamir.li,https://www.tamir.li` |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | Google sign-in (same value) |
| `ADMIN_EMAILS` | Bootstrap admin access |
| `STRIPE_*` | Billing + webhook |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Checkout UI |
| `VITE_GTM_ID`, `VITE_ADSENSE_*` | Analytics / ads |

`DATABASE_URL` is **not** set manually — compose builds it from `MYSQL_*` for the `backend` service.

### Optional

| Variable | Default |
|----------|---------|
| `WEB_PORT` | `8080` |
| `MYSQL_DATABASE` | `tamirly_db` |
| `MYSQL_USER` | `tamirly` |

---

## Post-deploy checks

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/tools/config
curl -I http://127.0.0.1:8080/
```

Public (after proxy + SSL):

```bash
curl -fsS https://tamir.li/health
curl -fsS https://tamir.li/api/tools/config
curl -I https://tamir.li/sitemap.xml
```

Browser:

- [ ] Home page loads
- [ ] Deep links (`/tools/...`, `/blog/...`) work (nginx SPA fallback)
- [ ] Google sign-in (`POST /api/auth/google`)
- [ ] Stripe webhook endpoint reachable

---

## GitHub Actions (optional)

Workflow: [`.github/workflows/deploy-docker-plesk.yml`](../.github/workflows/deploy-docker-plesk.yml)

On push to `main` (docker-related paths) or manual dispatch: SSH to Plesk → `git pull` → `docker compose up -d --build`.

| Secret / variable | Purpose |
|-------------------|---------|
| `PLESK_SSH_HOST` | Server hostname/IP |
| `PLESK_SSH_USER` | SSH user |
| `PLESK_SSH_PASSWORD` | SSH password |
| `PLESK_SSH_PORT` (var) | Default `22` |
| `PLESK_DOCKER_DIR` (var) | Repo path on server, e.g. `~/tamir-li` |

`.env.docker` must exist on the server (not in git).

The existing [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml) still deploys static `dist/` only — disable or stop using it when Docker is live.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| `web` won't start | `docker compose logs web` — backend healthcheck must pass first |
| DB connection errors | `docker compose logs mysql backend` — wait for mysql healthy |
| Migrations failed | `docker compose exec backend npx prisma migrate deploy` |
| Old API URL in browser | Rebuild `web` after changing `VITE_*` (`docker compose build web`) |
| 502 from Plesk proxy | Confirm `WEB_PORT` matches proxy target |

---

## Files in this setup

| File | Role |
|------|------|
| `docker-compose.yml` | Stack definition |
| `backend/Dockerfile` | API image |
| `docker/web/Dockerfile` | Frontend build + nginx |
| `docker/nginx/nginx.conf` | Static + `/api` proxy |
| `docker/backend/docker-entrypoint.sh` | `prisma migrate deploy` then start |
| `.env.docker.example` | Env template |
