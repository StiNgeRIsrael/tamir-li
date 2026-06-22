# Deploy tamir.li — single Node.js app on Plesk

**Preferred production setup.** One Express process serves:

| Path | Handler |
|------|---------|
| `/api/*` | Express API (auth, billing, tools, …) |
| `/health` | Health check JSON |
| Everything else | Vite `dist/` static files + SPA fallback (`index.html`) |

No separate SFTP upload to `httpdocs`, no `api.tamir.li` subdomain, no Docker Compose required.

Legacy split deploy (static `httpdocs` + API subdomain): [`plesk-deploy.md`](./plesk-deploy.md) — deprecated for new installs.

Docker Compose alternative: [`docker-plesk-deploy.md`](./docker-plesk-deploy.md) — still supported; monolith Node.js is simpler on Plesk.

DNS: [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md).

---

## Deploy without SSH (Plesk Node.js UI)

**No SSH required.** Use Plesk → **Domains** → `tamir.li` → **Node.js** and the **Run Node.js commands** tab.

### Node.js vs Docker extension

| Approach | When to use | This guide |
|----------|-------------|------------|
| **Node.js** (Plesk extension) | Single Express monolith on `tamir.li` | **Yes — follow below** |
| **Docker** (Plesk Docker extension) | Compose stack, separate containers | **No** — use [`docker-plesk-deploy.md`](./docker-plesk-deploy.md) instead |

If you enabled the **Docker** extension, the Node.js panel and **Run Node.js commands** tab do not apply.

### Plesk Node.js settings

Enable **Node.js** on the main domain `tamir.li` (not a subdomain).

Plesk requires a **startup file** (`app.js`) and the **document root must be inside the application root** (not parent `httpdocs/`).

| Setting | Value |
|---------|-------|
| **Node.js version** | **22.x** preferred (25.x may work; this repo targets Node ≥ 22) |
| **Package manager** | npm |
| **Application root** | `httpdocs/deploy` |
| **Application startup file** | `app.js` |
| **Document root** | **`httpdocs/deploy`** (same as application root) — **recommended** |
| **Application mode** | `production` |

Do **not** set document root to `httpdocs` alone — Plesk errors: *"document root is not a subchild of application root"*.

**Avoid document root `httpdocs/deploy/dist` for the monolith.** If docroot is `deploy/dist`, Apache/nginx serves static files from `dist/` first. The Vite build ships `dist/.htaccess` (Apache SPA fallback), which rewrites `/api/*` and `/health` to `index.html` — so the API never reaches Express. CI omits `dist/.htaccess` on upload, but the reliable fix is **document root = `httpdocs/deploy`** (not `deploy/dist`). Express serves `dist/` internally.

The startup file `app.js` (uploaded by CI) loads the compiled API server:

```js
import './backend/dist/index.js';
```

Plesk runs `app.js` directly; it does **not** use the **Custom script / start** field or `npm start`. Keep `npm start` in `package.json` for local/CLI use only.

Full path example: `/var/www/vhosts/tamir.li/httpdocs/deploy` (adjust for your vhost).

Set **environment variables** in Node.js → **Custom environment variables** before first start (see table below). `DATABASE_URL` must be set before running migrations.

**NPM install:** Plesk’s **+ NPM install** button runs `npm install` in the application root. For a reproducible first deploy, prefer **Run Node.js commands** → `run setup` (runs `npm ci` + backend prod deps + migrations).

### Run Node.js commands (no shell, no `npx`, no `cd`)

Plesk only exposes **npm** in the **Run Node.js commands** tab: a dropdown for `npm` plus a text field for arguments (everything after `npm `).

**Working directory** is always the application root (`httpdocs/deploy`). Run **one command at a time** — wait for each to finish before the next.

#### First deploy (after CI upload)

| Step | Type in the npm args field | What it runs |
|------|----------------------------|--------------|
| 1 | `run setup` | `npm ci` + backend prod deps + Prisma migrate (all-in-one) |

**Or** run step-by-step (same result, easier to debug):

| Step | Type in the npm args field | What it runs |
|------|----------------------------|--------------|
| 1 | `ci` | Install root dependencies (`postinstall` also installs backend) |
| 2 | `run plesk:backend-install` | `npm ci --prefix backend --omit=dev` |
| 3 | `run plesk:db` | `prisma migrate deploy --schema=backend/prisma/schema.prisma` |

#### After commands succeed

1. Confirm **Application startup file** is `app.js`.
2. Click **Restart app** (or **Enable Node.js** on first run).

#### Later deploys

| When | Type in the npm args field |
|------|----------------------------|
| `package-lock.json` changed | `run setup` (or `ci` then `run plesk:db` if only migrations changed) |
| New Prisma migrations only | `run plesk:db` |
| Code-only update (no lock/migrations) | *(none)* — just **Restart app** |

**Copy-paste strings** (args field only — Plesk prepends `npm`):

```
run setup
```

Step-by-step alternative:

```
ci
```

```
run plesk:backend-install
```

```
run plesk:db
```

Migrations only:

```
run plesk:db
```

**Why not `npx prisma`?** Plesk does not allow `npx` in this UI. Root `package.json` includes `prisma` and scripts `plesk:db` / `setup` so everything runs via `npm <args>` only.

### After GitHub Actions SFTP upload

CI ([`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)) **builds everything in GitHub**, uploads via SFTP, then **restarts Node.js over SSH** (same `PLESK_SSH_*` secrets as SFTP). The server does **not** need `npm run build`.

**Restart method (tried in order on the server):**

| Order | Command | Notes |
|-------|---------|-------|
| 1 | `plesk bin node --restart -domain tamir.li` | Only if Plesk Node CLI supports it; often **not** available |
| 2 | `touch tmp/restart.txt` | **Standard** — same as Plesk **Restart app** (Phusion Passenger) |
| 3 | `touch app.js` | Extra fallback; touches the startup file |

Restart runs **only if SFTP deploy succeeded**. CI does **not** run `npm install` on every deploy — code-only updates need only the automatic restart.

**When lockfiles or migrations change**, either:

- Use Plesk **Run Node.js commands** → `run setup` (or `run plesk:db`), then restart, **or**
- Re-run the workflow manually with **run_server_setup** checked (runs `npm run setup` over SSH, then restart).

**Production note:** If the site still serves legacy static files from `httpdocs/` (no Node.js proxy), the restart is harmless but API/SPA changes require the Node.js monolith + proxy — see [Recommended layout](#recommended-layout-github-actions-sftp).

**Uploaded by CI:**

```
package.json
package-lock.json
app.js                ← Plesk startup entry (imports backend/dist/index.js)
dist/                 ← Vite frontend (pre-built)
backend/
  package.json
  package-lock.json
  dist/               ← compiled API (pre-built, includes Prisma client from CI build)
  prisma/             ← migration SQL
```

**Not uploaded:** `node_modules/` — install on the server once via **Run Node.js commands** (see [Run Node.js commands](#run-nodejs-commands-no-shell-no-npx-no-cd)).

On later deploys, run `run setup` when lockfiles change, `run plesk:db` when migrations change. Otherwise CI **restarts automatically** — no manual **Restart app** needed unless SSH is disabled or restart fails.

### GitHub secrets & variables (CI deploy + restart)

| Name | Required | Purpose |
|------|----------|---------|
| `PLESK_SSH_HOST` | Yes* | Server hostname (or `PLESK_FTP_HOST`) |
| `PLESK_SSH_USER` | Yes* | SSH/SFTP user (or `PLESK_FTP_USER`) |
| `PLESK_SSH_PASSWORD` | Yes* | SSH/SFTP password (or `PLESK_FTP_PASSWORD`) |
| `PLESK_SSH_PORT` (var) | No | Default `22` |
| `PLESK_HTTPDOCS_DIR` (var) | No | SFTP upload target; default `httpdocs/` |
| `PLESK_SSH_SERVER_DIR` (var) | No | Legacy alias for `PLESK_HTTPDOCS_DIR` (same value, e.g. `httpdocs/`) |
| `PLESK_NODE_APP_DIR` (var) | No | Node app root for restart; default `httpdocs/deploy` |
| `PLESK_DOMAIN` (var) | No | Domain for Plesk CLI restart attempt; default `tamir.li` |
| `VITE_GOOGLE_CLIENT_ID` (secret) | Yes (Google sign-in) | OAuth Web client ID — baked into frontend at CI build; must match Plesk `GOOGLE_CLIENT_ID` |

\*Workflow falls back from `PLESK_SSH_*` to `PLESK_FTP_*`. **No new secrets** are required if SFTP deploy already works — restart reuses the same credentials.

Set Google OAuth in GitHub (repo **Settings → Secrets and variables → Actions**):

```bash
gh secret set VITE_GOOGLE_CLIENT_ID --repo StiNgeRIsrael/tamir-li
# paste the same Web client ID as backend GOOGLE_CLIENT_ID in Plesk Node.js env vars
```

SSH access must be enabled for the subscription user (**Websites & Domains** → **Hosting Settings** → SSH access `/bin/bash` or similar).

### First deploy checklist (no SSH)

1. Create MySQL database — [Plesk MySQL](#plesk-mysql) (UI steps + `DATABASE_URL`).
2. Set Node.js env vars (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, PayPal live/sandbox, …).
3. Enable Node.js; set application root `httpdocs/deploy`, document root `httpdocs/deploy`, startup file `app.js`.
4. Wait for GitHub Actions deploy to finish (or upload bundle manually).
5. **Run Node.js commands:** `run setup` (or step-by-step: `ci`, `run plesk:backend-install`, `run plesk:db`).
6. **Restart app** (first time only — later deploys restart via CI SSH).
7. Run [post-deploy checks](#post-deploy-checks) (browser or external `curl`).

### Alternative application root

Set GitHub variable `PLESK_NODE_APP_DIR` to e.g. `tamir-li/` (subscription home, sibling to `httpdocs/`). Application root in Plesk becomes `/var/www/vhosts/tamir.li/tamir-li`.

---

## Recommended layout (GitHub Actions SFTP)

After CI deploy, the server should look like this (paths relative to subscription home):

```
httpdocs/
├── sitemap.xml          ← SEO (flat copy from CI)
├── robots.txt
├── ads.txt
├── llms.txt             ← if present in build
└── deploy/              ← Plesk Node.js application root
    ├── app.js           ← startup file (imports backend)
    ├── package.json
    ├── package-lock.json
    ├── dist/            ← Vite frontend (no .htaccess — Node serves SPA)
    │   ├── index.html
    │   ├── assets/
    │   └── …
    └── backend/
        ├── package.json
        ├── package-lock.json
        ├── dist/        ← compiled Express API
        │   └── index.js
        └── prisma/      ← migrations
```

| Location on server | Purpose |
|--------------------|---------|
| `httpdocs/` | Legacy static files — **remove** old `index.html`, `dist/`, etc. after Node.js is live |
| `httpdocs/deploy/` | **Node.js application root** (default `PLESK_NODE_APP_DIR`) |

Do **not** set `PLESK_NODE_APP_DIR` to `httpdocs/` unless the app root is literally `httpdocs/` — that mixes legacy static files with the monolith.

| GitHub variable | Default | Purpose |
|-----------------|---------|---------|
| `PLESK_NODE_APP_DIR` | `httpdocs/deploy/` | SFTP target = Plesk Node.js application root |
| `VITE_SITE_ORIGIN` | `https://tamir.li` | Baked into frontend at build time |
| `VITE_API_URL` | `https://tamir.li` | Same-origin API (monolith) |

```bash
gh variable set PLESK_NODE_APP_DIR --body "httpdocs/deploy/" --repo StiNgeRIsrael/tamir-li
gh variable set VITE_API_URL --body "https://tamir.li" --repo StiNgeRIsrael/tamir-li
```

---

## Fix: static layer blocking Node {#fix-static-layer-blocking-node}

**Symptoms:** Google login button missing; `curl https://tamir.li/health` or `curl https://tamir.li/api/auth/google` returns `index.html` (HTML) instead of JSON.

**Root cause:** Either (a) Plesk’s domain document root (`httpdocs/`) still serves **legacy static files** from an older deploy, or (b) **document root is `httpdocs/deploy/dist`** and `dist/.htaccess` rewrites `/api/*` and `/health` to `index.html`. The Node monolith in `httpdocs/deploy/` may be running but **not receiving HTTP traffic**.

CI now removes `httpdocs/.htaccess`, `httpdocs/index.html`, and `httpdocs/assets/` after each deploy (SSH restart step). If login/API still fail, complete the steps below manually once.

### Diagnose (from your machine)

```bash
curl -sI https://tamir.li/health | grep -i content-type
# Expected: application/json
# Broken:   text/html

curl -s https://tamir.li/assets/index-*.js | grep -o 'apps.googleusercontent.com' | head -1
# Expected: your OAuth client ID (if VITE_GOOGLE_CLIENT_ID is set in CI)
# Broken:   (empty — secret missing at build time)
```

### Plesk: route traffic to Node (required)

1. **Domains → tamir.li → Node.js**
   - **Application root:** `httpdocs/deploy`
   - **Document root:** `httpdocs/deploy` (**not** `httpdocs/deploy/dist` — see [Plesk Node.js settings](#plesk-nodejs-settings))
   - **Startup file:** `app.js`
   - **Application mode:** `production`
   - **Node.js:** enabled → **Restart app**

2. **File Manager → `httpdocs/`** — delete legacy static (keep `deploy/` and SEO files CI uploads):
   - `.htaccess` (Apache SPA rewrite — intercepts `/api/*` and `/health`)
   - `index.html`
   - `assets/` (entire folder)
   - `dist/` (entire folder, if present from old static deploy)
   - old `registerSW.js`, `sw.js`, `workbox-*.js` if present at `httpdocs/` root

3. **Node.js → Custom environment variables** — set at minimum:
   - `GOOGLE_CLIENT_ID` (same value as GitHub secret `VITE_GOOGLE_CLIENT_ID`)
   - `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`

4. **Hosting Settings** (optional check): domain document root should not override Node for `/api/*`. If Plesk offers **“Serve static files directly”** for Node.js, disable it or ensure no conflicting `index.html` exists in parent `httpdocs/`.

### Why login is hidden in the UI

The navbar login (`UserAuthSection`) renders **only when both** are true at build/runtime:

| Flag | Source | If missing |
|------|--------|------------|
| `googleConfigured` | `VITE_GOOGLE_CLIENT_ID` in CI build | Login hidden |
| `apiAvailable` | `VITE_API_URL` or same-origin fallback | Login hidden |

Even with a correct build, sign-in fails until `/api/auth/google` reaches Express (Node proxy fix above).

---

## Environment variables (Plesk → Node.js → Custom environment variables)

Set **backend** secrets here (never commit `.env` files). See [`backend/.env.example`](../backend/.env.example) for the full list.

### Required for production (core)

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | `mysql://tamirly_user:pass@localhost:3306/tamirly_db` — see [Plesk MySQL](#plesk-mysql) |
| `JWT_SECRET` | Yes | Random string, **min 16 characters** |
| `GOOGLE_CLIENT_ID` | Yes (Google sign-in) | OAuth Web client ID; must match `VITE_GOOGLE_CLIENT_ID` baked at CI build time |

### Recommended

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `PORT` | Optional | Use Plesk’s injected port if present |
| `CORS_ORIGIN` | Optional | Omit for same-origin monolith; or `https://tamir.li,https://www.tamir.li` |
| `ADMIN_EMAILS` | Recommended | Comma-separated emails for admin panel access |

### PayPal billing (primary — default)

Billing uses PayPal unless `ENABLE_STRIPE=true`. For **production**, set `PAYPAL_MODE=live` and use live app credentials from PayPal Developer Dashboard.

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `PAYPAL_CLIENT_ID` | Yes (billing) | Live client ID (or sandbox for testing) |
| `PAYPAL_CLIENT_SECRET` | Yes (billing) | Live secret |
| `PAYPAL_MODE` | Yes (billing) | `live` for production; `sandbox` for testing |
| `PAYPAL_WEBHOOK_ID` | Yes (webhooks) | From PayPal Dashboard → Webhooks |
| `PAYPAL_PLAN_MONTHLY` | Yes (subscriptions) | Plan ID `P-...` |
| `PAYPAL_PLAN_YEARLY` | Yes (subscriptions) | Plan ID `P-...` |

Set matching **`VITE_PAYPAL_CLIENT_ID`** in GitHub Actions (build-time) to the same PayPal client ID.

### Stripe billing (optional)

Set `ENABLE_STRIPE=true` only if switching from PayPal to Stripe.

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `ENABLE_STRIPE` | If using Stripe | `true` |
| `STRIPE_SECRET_KEY` | If using Stripe | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe | `whsec_...` — webhook URL: `https://tamir.li/api/billing/webhook` |
| `STRIPE_PRICE_*` | If using Stripe | Monthly/yearly and credit pack price IDs — see [`backend/.env.example`](../backend/.env.example) |

**Build-time (`VITE_*`)** — baked into the frontend bundle in CI (or when you run `npm run build` locally). Set in GitHub Actions vars/secrets:

| Variable | Recommended |
|----------|-------------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` |
| `VITE_API_URL` | `https://tamir.li` (same origin) or omit (runtime fallback to `window.location.origin`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID |
| `VITE_GTM_ID`, `VITE_ADSTERRA_*`, `VITE_STRIPE_PUBLISHABLE_KEY` | As needed |

After changing any `VITE_*` value, trigger a new CI deploy (or rebuild locally and re-upload); no server build step.

---

## Build & start commands (reference)

| Command | Plesk args field | CI / server |
|---------|------------------|-------------|
| `npm ci` | `ci` | **Server** — root deps |
| `npm run setup` / `npm run plesk:install` | `run setup` | **Server** — full first-time install + migrate |
| `npm run plesk:backend-install` | `run plesk:backend-install` | **Server** — backend prod deps only |
| `npm run plesk:db` | `run plesk:db` | **Server** — apply Prisma migrations |
| `npm run build` | `run build` | **CI only** when using GitHub Actions SFTP — not on server |
| `npm start` | — | Local / CLI — `node backend/dist/index.js` (Plesk uses `app.js` instead) |
| `npm run dev` / `npm run dev:api` | — | Local development only |

Local full stack: run `npm run dev` and `npm run dev:api` in two terminals; set `VITE_API_URL=http://localhost:5000` in `.env.development.local`.

---

## Plesk MySQL

The monolith uses **MySQL** via Prisma (`backend/prisma/schema.prisma` → `provider = "mysql"`, `url = env("DATABASE_URL")`). Create the database in Plesk **before** setting Node.js env vars or running migrations.

### Create database in Plesk UI

1. Log in to **Plesk** → select subscription **tamir.li**.
2. Open **Databases** (left sidebar or **Websites & Domains** → **Databases**).
3. Click **Add Database**.
4. **Database name** — e.g. `tamirly_db` (Plesk may prefix with your subscription name; use the **full name** shown after creation in `DATABASE_URL`).
5. **Database user** — check **Create a new database user** (or select an existing user).
   - **Username** — e.g. `tamirly_user`
   - **Password** — generate a strong password; save it securely (you need it for `DATABASE_URL`).
6. Ensure the user is **granted access** to this database (default when creating user on the same screen).
7. Click **OK** / **Create**.

**Host for `DATABASE_URL`:** use `localhost` when Node.js runs on the **same server** as MySQL (typical Plesk Node.js setup). Do **not** use the server’s public IP or remote hostname unless MySQL is on another machine.

Plesk may show a “Remote MySQL” or external host — ignore that for same-server Node.js; `localhost:3306` is correct.

### `DATABASE_URL` format

```
mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME
```

**Example** (replace with your real values):

```
mysql://tamirly_user:YourStrongPassword@localhost:3306/tamirly_db
```

If the password contains special characters (`@`, `#`, `%`, `:`, `/`, etc.), [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them in the connection string (e.g. `@` → `%40`).

### After the database is created

1. **Plesk** → **Domains** → `tamir.li` → **Node.js** → **Custom environment variables**.
2. Add **`DATABASE_URL`** with the connection string above (plus other vars — see [Environment variables](#environment-variables-plesk--nodejs--custom-environment-variables)).
3. **Run Node.js commands** tab → npm args field, **one command at a time**:
   - First deploy (full install + migrate): `run setup`
   - Or migrations only (if deps already installed): `run plesk:db`
4. Click **Restart app**.

| npm args field | What it runs |
|----------------|--------------|
| `run setup` | `npm ci` + backend prod deps + `prisma migrate deploy` |
| `run plesk:db` | `prisma migrate deploy --schema=backend/prisma/schema.prisma` |

**Order matters:** set `DATABASE_URL` in env vars **before** `run setup` or `run plesk:db`. Migrations create tables (`User`, `Profile`, `Subscription`, `Payment`, etc.).

### Verify tables (optional)

**Plesk** → **Databases** → your database → **phpMyAdmin** (or **Webadmin**). After a successful `run plesk:db`, you should see Prisma migration history (`_prisma_migrations`) and application tables.

---

## Deploy options

### A) GitHub Actions → SFTP + SSH restart (recommended)

Workflow: [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)

CI builds the full app, uploads via SFTP, then SSH-restarts Node.js (`touch tmp/restart.txt` + `touch app.js`, with optional `plesk bin node --restart` when available). On the server: first deploy still needs **Run Node.js commands** → `run setup` (see [Run Node.js commands](#run-nodejs-commands-no-shell-no-npx-no-cd)). Later code-only deploys need no manual restart.

### B) Build on server (Plesk Git)

Only if you deploy source from Plesk **Git** (not the CI bundle). In **Run Node.js commands**, one at a time (args field only):

```
ci
```

```
run build
```

```
run plesk:db
```

Store secrets in Plesk Node.js env vars. Restart the Node.js app after deploy.

### C) Manual upload

Upload the CI deploy bundle (or built repo) via Plesk **File Manager**, then use the same **Run Node.js commands** as in [Deploy without SSH](#deploy-without-ssh-plesk-nodejs-ui).

---

## Post-deploy checks

```bash
curl https://tamir.li/health
curl https://tamir.li/api/tools/config
curl -I https://tamir.li/
curl -I https://tamir.li/tools/pdf-to-word
curl https://tamir.li/ads.txt
```

Browser:

- [ ] Home page and deep links load (SPA fallback)
- [ ] Google sign-in (`POST /api/auth/google`)
- [ ] Admin panel (user in `ADMIN_EMAILS`)
- [ ] PayPal checkout (or Stripe if `ENABLE_STRIPE=true`); webhooks configured in PayPal/Stripe dashboard

---

## Related

- [`stripe-setup.md`](./stripe-setup.md) — update webhook URL to `https://tamir.li/api/billing/webhook`
- [`plesk-deploy.md`](./plesk-deploy.md) — legacy static + API subdomain
- [`docker-plesk-deploy.md`](./docker-plesk-deploy.md) — Docker Compose (optional; use instead of Node.js extension)
