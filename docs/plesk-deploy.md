# Deploy tamir.li frontend to Plesk

> **Deprecated for new production deploys.** Use [`plesk-node-deploy.md`](./plesk-node-deploy.md) (Node monolith on `tamir.li`).  
> This doc describes the **legacy** split: static SPA in `httpdocs` + optional `api.tamir.li` subdomain.  
> **Android note:** the Capacitor app loads the live site — AdMob IDs must be in the production frontend build (`.env.production`), not only in the AAB.

Static SPA (Vite + React Router) hosted on **Plesk** (Apache/nginx). DNS is managed in **Cloudflare** — see [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md).

**Not used for production frontend:** GitHub Pages (`.github/workflows/deploy-frontend.yml` is optional and disabled by default for Plesk users).

---

## Overview

| Step | Action |
|------|--------|
| 1 | Build locally or in CI: `npm run build:prod` |
| 2 | Upload contents of `dist/` to Plesk document root (`httpdocs`) |
| 3 | Enable SSL (Plesk Let's Encrypt and/or Cloudflare Full) |
| 4 | Verify SPA routes, `ads.txt`, `sitemap.xml`, `robots.txt` |

The build copies everything from `public/` into `dist/`, including `.htaccess`, `ads.txt`, `sitemap.xml`, and `robots.txt`.

---

## Prerequisites

- Node.js 22+ locally (or use CI to produce `dist/`)
- Plesk access for `tamir.li` (document root, usually `httpdocs`)
- Cloudflare DNS pointing apex and `www` to the Plesk server IP — confirm with your host (likely `74.208.236.85`)

---

## Environment variables (baked at build time)

Vite embeds `VITE_*` values into the JS bundle at **build** time. Set them in `.env.production.local` (see `.env.example`) before running `npm run build:prod`:

```env
VITE_SITE_ORIGIN=https://tamir.li
VITE_API_URL=https://api.tamir.li
VITE_GTM_ID=GTM-XXXXXXX
VITE_ADSENSE_CLIENT=ca-pub-4410150504570814
VITE_ADSENSE_SLOT_BANNER=...
VITE_ADSENSE_SLOT_SIDEBAR=...
VITE_ADSENSE_SLOT_INLINE=...
```

After changing any `VITE_*` value, rebuild and re-upload `dist/`.

---

## Build

```bash
npm ci
npm run build:prod
```

This runs `prebuild` → `generate:sitemap` (uses `VITE_SITE_ORIGIN`) then `vite build`.

Confirm these files exist in `dist/` before upload:

- `index.html`
- `.htaccess` — Apache SPA fallback for React Router
- `ads.txt`
- `sitemap.xml`
- `robots.txt`
- `assets/` (hashed JS/CSS)

---

## Upload to Plesk

### Manual (FTP / SFTP / File Manager)

1. Plesk → **Domains** → `tamir.li` → **File Manager** (or connect via SFTP).
2. Open the document root (`httpdocs` for the main domain, or the subdomain docroot if applicable).
3. **Back up** existing files if replacing a live site.
4. Delete old static assets in `httpdocs` (or replace in place).
5. Upload **all contents** of local `dist/` into `httpdocs` — not the `dist` folder itself.
6. Ensure `.htaccess` is present (some FTP clients hide dotfiles; enable “show hidden files”).

### Optional: Plesk Git deploy

Plesk → **Git** can pull the repo and run a deploy script, for example:

```bash
npm ci
npm run build:prod
rsync -a --delete dist/ ./httpdocs/
```

Store production env vars in Plesk environment settings or a protected `.env.production.local` on the server (never commit secrets).

### Node.js on Plesk

**Not required** for this frontend — it is a static SPA. Only use Plesk Node.js if you later add SSR; the current app does not need it.

---

## SPA routing (Apache)

`public/.htaccess` is copied to `dist/.htaccess` on build. It rewrites unknown paths to `index.html` so React Router handles client-side routes (e.g. `/tools/pdf-to-word`).

If you use **nginx** on Plesk instead of Apache, add equivalent `try_files` in the server block — `.htaccess` is ignored by nginx.

---

## SSL / HTTPS

Choose one or combine:

| Layer | Setting |
|-------|---------|
| **Cloudflare** | SSL/TLS → **Full** or **Full (strict)** (recommended with orange-cloud proxy) |
| **Plesk** | **SSL/TLS Certificates** → Let's Encrypt for `tamir.li` and `www.tamir.li` |

Avoid Cloudflare **Flexible** if Plesk serves HTTPS — use Full so traffic is encrypted end-to-end.

---

## Backend API (`api.tamir.li`)

The Express/Prisma backend lives in the repo’s `backend/` folder. It is **not** served from `httpdocs` and does **not** use the frontend GitHub Actions workflow today.

### Architecture

| Host | Role | Plesk setup |
|------|------|-------------|
| `tamir.li` | Static Vite SPA | Document root `httpdocs` (deploy `dist/` via [GitHub Actions](#github-actions-deploy-recommended)) |
| `api.tamir.li` | Express API (`/api/*`, `/health`) | Subdomain + **Node.js** app pointing at `backend/` |

Frontend calls `VITE_API_URL` + path, e.g. `https://api.tamir.li/api/auth/me`. Set `VITE_API_URL=https://api.tamir.li` (no trailing slash) at frontend build time — already the default in [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml).

Stripe webhook: `https://api.tamir.li/api/billing/webhook` — see [`stripe-setup.md`](./stripe-setup.md).

### Build & runtime (from `backend/package.json`)

| Item | Value |
|------|-------|
| Production build | `npm run build` → compiles TypeScript to `dist/` (`tsc`) |
| Start command | `npm start` → `node dist/index.js` |
| Dev only | `npm run dev` → `nodemon src/index.ts` (do **not** use in Plesk production) |
| Default port | `5000` (`PORT` env var; Plesk may inject its own) |
| Node version | **22** (matches frontend CI) |

After every `npm install` on the server, also run:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy   # first deploy / after schema changes
npm run build
```

`prisma` is a devDependency — install with dev deps on the build host (`npm ci` or `npm install --include=dev`), then start with `npm start`.

### MySQL (required)

Prisma uses **MySQL** (`backend/prisma/schema.prisma`). You need a MySQL database on Plesk:

1. Plesk → **Databases** → **Add Database** (e.g. `tamirly_db`).
2. Create a dedicated DB user with full rights on that database.
3. Set `DATABASE_URL` in Node.js custom environment variables:

   ```env
   mysql://DB_USER:DB_PASSWORD@localhost:3306/tamirly_db
   ```

Use `localhost` when MySQL runs on the same Plesk server. Migrations live in `backend/prisma/migrations/` — apply with `npx prisma migrate deploy` from the application root.

### Plesk Node.js settings (`api.tamir.li`)

Create the subdomain first: **Domains** → **Add Subdomain** → `api.tamir.li`, then open **Node.js** on that subdomain.

| Setting | Recommended value | Notes |
|---------|-------------------|-------|
| **Node.js version** | 22.x | Match repo CI |
| **Package manager** | npm | |
| **Application root** | Path containing `backend/package.json` | e.g. `/var/www/vhosts/tamir.li/backend` or subscription home `backend/` — **not** `httpdocs` |
| **Application startup file** | `dist/index.js` | Or leave blank and set **Document root / mode** to run `npm start` if your Plesk build offers “npm” startup |
| **Application mode** | `production` | Sets typical Node behaviour; also set `NODE_ENV=production` |
| **Document root** | Subdomain default (often `api.tamir.li/httpdocs`) | Can stay empty/minimal — Plesk proxies HTTP(S) to the Node process |
| **Application URL** | `/` | API is at subdomain root; routes are `/api/...` and `/health` |
| **Custom environment variables** | See table below | Required secrets — never commit `backend/.env` |

**CORS:** set `CORS_ORIGIN` to include the live frontend:

```env
CORS_ORIGIN=https://tamir.li,https://www.tamir.li
```

(`backend/src/app.ts` reads comma-separated origins and enables `credentials: true`.)

### Environment variables (backend)

Copy from [`backend/.env.example`](../backend/.env.example). Set all of these in Plesk **Node.js → Custom environment variables** (not in git).

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Optional | `5000` — use Plesk’s value if the panel sets it automatically |
| `DATABASE_URL` | Yes | `mysql://user:pass@localhost:3306/tamirly_db` |
| `JWT_SECRET` | Yes | Random string, **min 16 characters** |
| `GOOGLE_CLIENT_ID` | Yes (Google sign-in) | Same Web client ID as frontend `VITE_GOOGLE_CLIENT_ID` |
| `CORS_ORIGIN` | Yes | `https://tamir.li,https://www.tamir.li` |
| `ADMIN_EMAILS` | Recommended | Comma-separated admin emails for bootstrap |
| `STRIPE_SECRET_KEY` | Yes (billing) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (billing) | `whsec_...` from Stripe webhook endpoint |
| `STRIPE_PRICE_MONTHLY` | Yes (billing) | Stripe Price ID |
| `STRIPE_PRICE_YEARLY` | Yes (billing) | Stripe Price ID |
| `STRIPE_PRICE_CREDITS_10` | Optional | Credit pack price IDs |
| `STRIPE_PRICE_CREDITS_30` | Optional | |
| `STRIPE_PRICE_CREDITS_60` | Optional | |
| `STRIPE_PRICE_CREDITS_120` | Optional | |
| `OPENAI_API_KEY` | Future | Listed in `.env.example`; not wired in routes yet |
| `RESEND_API_KEY` | Future | Listed in `.env.example`; not wired in routes yet |

### DNS (`api.tamir.li`)

In **Cloudflare → DNS** (same server as `tamir.li`):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `api` | Same Plesk server IP as apex | Proxied or **DNS only** (grey cloud) — DNS only avoids double TLS if Plesk serves Let’s Encrypt directly |

Enable **Let's Encrypt** for `api.tamir.li` in Plesk → subdomain → **SSL/TLS Certificates**.

### Deployment options

#### A) SFTP / Git — backend only (manual)

1. Upload or clone the repo; use only the `backend/` tree on the server (or full repo with app root = `backend/`).
2. SSH/SFTP into the subscription, then:

   ```bash
   cd backend
   npm ci --include=dev
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```

3. In Plesk Node.js, set application root to that folder, startup `dist/index.js`, add env vars, click **Enable Node.js** / **Restart App**.

#### B) Extend GitHub Actions (not implemented yet)

The current [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml) deploys only `dist/` to `httpdocs`. To automate the backend you could add a second job: SFTP `backend/` (excluding `node_modules`), SSH run `npm ci`, `prisma migrate deploy`, `npm run build`, restart Node via Plesk API or a deploy hook.

#### C) Plesk Git on the subdomain

1. Subdomain `api.tamir.li` → **Git** → clone this repo.
2. **Application root** → `backend` (or repo root if deploy script `cd`s into it).
3. **Deploy actions**:

   ```bash
   cd backend
   npm ci --include=dev
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```

4. Store secrets in Plesk Node.js env vars, not in the repo.

### Post-deploy checks (API)

```bash
curl https://api.tamir.li/health
curl https://api.tamir.li/api/tools/config
```

Browser (with frontend deployed and `VITE_API_URL=https://api.tamir.li`):

- [ ] Google sign-in reaches `POST /api/auth/google`
- [ ] Admin panel loads stats (admin user in `ADMIN_EMAILS`)
- [ ] Stripe checkout / webhook (see [`stripe-setup.md`](./stripe-setup.md))

**Note:** `POST /api/conversions` currently returns **501** until conversion workers are connected — auth, billing, usage, and admin routes still need the API live.

---

## Post-deploy checks

```bash
curl -I https://tamir.li/
curl https://tamir.li/ads.txt
curl -I https://tamir.li/sitemap.xml
curl -I https://tamir.li/tools/pdf-to-word
```

Browser:

- [ ] `https://tamir.li` loads the home page
- [ ] Deep link (e.g. `/blog`) loads without 404 (SPA fallback)
- [ ] `https://tamir.li/ads.txt` shows the AdSense line
- [ ] `https://tamir.li/sitemap.xml` returns XML
- [ ] GTM / AdSense fire in production (check Network tab)

---

## Related docs

- [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md) — Cloudflare DNS for Plesk
- [`adsense-setup.md`](./adsense-setup.md) — AdSense approval
- [`google-analytics-setup.md`](./google-analytics-setup.md) — GTM / GA4
- [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) — optional GitHub Pages deploy (not used for Plesk)

---

﻿## GitHub Actions deploy (recommended)

Workflow: [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)

| Trigger | When it runs |
|---------|----------------|
| **workflow_dispatch** | Actions → Deploy to Plesk → Run workflow |
| **push to `main`** | After merge to `main` (automatic deploy) |

Steps: `npm ci` → `npm run build:prod` with `VITE_*` from repo settings → upload `dist/` to Plesk via **SFTP** ([wlixcc/SFTP-Deploy-Action](https://github.com/wlixcc/SFTP-Deploy-Action), port **22**).

### Credentials (secrets)

The workflow reads **SSH/SFTP** settings first, then falls back to the legacy FTP secret names (same Plesk login often works for both).

| Secret | Fallback | Description |
|--------|----------|-------------|
| `PLESK_SSH_HOST` | `PLESK_FTP_HOST` | Plesk server IP or hostname (**Websites & Domains** → **Hosting Settings** or **SSH Access**; e.g. `74.208.236.85`) |
| `PLESK_SSH_USER` | `PLESK_FTP_USER` | Username from Plesk **SSH Access** (often the subscription/system user) |
| `PLESK_SSH_PASSWORD` | `PLESK_FTP_PASSWORD` | Password from Plesk **SSH Access** |

SFTP deploy uses the **same** `PLESK_FTP_HOST`, `PLESK_FTP_USER`, and `PLESK_FTP_PASSWORD` secrets (workflow falls back from optional `PLESK_SSH_*`). Set host to your Plesk server IP or hostname, port **22**, credentials from **SSH Access** in Plesk. Add separate `PLESK_SSH_*` only if SFTP credentials differ from FTP.

Optional: SSH private key deploy is **not** configured in the workflow; password auth is used. To use a key instead, extend the workflow with `ssh_private_key` from a secret.

### Repository variables (Settings → Secrets and variables → Actions → Variables)

| Name | Example | Required |
|------|---------|----------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` | Yes |
| `VITE_API_URL` | `https://api.tamir.li` | Recommended |
| `PLESK_SSH_SERVER_DIR` | `./` or `httpdocs/` | Optional (falls back to `PLESK_FTP_SERVER_DIR`, then `./`) |
| `PLESK_SSH_PORT` | `22` | Optional (default **22**) |

**Remote path:** After SFTP login, Plesk often lands you in the subscription home. Use `./` if the session root is already `httpdocs`, or `httpdocs/` if the login root is the subscription folder (confirm in Plesk File Manager).

**Note:** `PLESK_FTP_PORT` (21) is ignored by the SFTP workflow; leave unset so port 22 is used.

### Other repository secrets (build-time)

| Secret | Description |
|--------|-------------|
| `VITE_GTM_ID` | Google Tag Manager container ID (optional) |
| `VITE_ADSENSE_CLIENT` | AdSense publisher ID (optional) |
| `VITE_ADSENSE_SLOT_BANNER` | Ad slot ID (optional) |
| `VITE_ADSENSE_SLOT_SIDEBAR` | Ad slot ID (optional) |
| `VITE_ADSENSE_SLOT_INLINE` | Ad slot ID (optional) |

Create secrets from your machine with [GitHub CLI](https://cli.github.com/) (repo root):

```bash
gh auth login
gh variable set VITE_SITE_ORIGIN --body "https://tamir.li"
gh variable set VITE_API_URL --body "https://api.tamir.li"
gh secret set PLESK_FTP_HOST
gh secret set PLESK_FTP_USER
gh secret set PLESK_FTP_PASSWORD
# Optional analytics / ads (prompts for value):
gh secret set VITE_GTM_ID
gh secret set VITE_ADSENSE_CLIENT
```

Use `--body "value"` instead of a prompt when scripting non-interactive setup.

### Alternative: Plesk Git extension (manual)

1. Plesk → **Domains** → `tamir.li` → **Git** → add repository URL (GitHub HTTPS or deploy key).
2. Set deployment path to `httpdocs` or a staging folder.
3. **Deploy actions** → enable **Additional deploy actions** and run:

   ```bash
   export VITE_SITE_ORIGIN=https://tamir.li
   export VITE_API_URL=https://api.tamir.li
   npm ci
   npm run build:prod
   cp -a dist/. ./httpdocs/
   ```

4. Store `VITE_*` and npm tokens in Plesk environment variables; never commit `.env` files.

Plesk Git does not run GitHub Actions — you either pull on the server or use the workflow above.
