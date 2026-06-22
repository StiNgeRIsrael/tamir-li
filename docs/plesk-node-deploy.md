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

| Setting | Value |
|---------|-------|
| **Node.js version** | **22.x** |
| **Package manager** | npm |
| **Application root** | `httpdocs/deploy` (or path from `PLESK_NODE_APP_DIR`; must contain root `package.json`) |
| **Application startup file** | Leave blank — use **Application mode** + npm script below |
| **Document root** | Keep default `httpdocs` — Plesk proxies HTTP(S) to the Node process |
| **Application mode** | `production` |
| **Custom script / start** | `npm start` (runs `node backend/dist/index.js`) |

Full path example: `/var/www/vhosts/tamir.li/httpdocs/deploy` (adjust for your vhost).

Set **environment variables** in Node.js → **Custom environment variables** before first start (see table below). `DATABASE_URL` must be set before running migrations.

### After GitHub Actions SFTP upload

CI ([`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)) **builds everything in GitHub** and uploads a ready-to-run bundle. The server does **not** need `npm run build`.

**Uploaded by CI:**

```
package.json
package-lock.json
dist/                 ← Vite frontend (pre-built)
backend/
  package.json
  package-lock.json
  dist/               ← compiled API (pre-built, includes Prisma client from CI build)
  prisma/             ← migration SQL
```

**Not uploaded:** `node_modules/` — install on the server once.

In Plesk → Node.js → **Run Node.js commands**, paste **one command at a time** (working directory is the application root):

```
npm ci
```

```
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

Then:

1. Confirm **Custom script / start** is `npm start`.
2. Click **Restart app**.

On later deploys (after CI uploads new files), run the same two commands only when `package-lock.json` changed or new migrations exist; otherwise **Restart app** is enough.

**Why `npm ci`?** Root `postinstall` runs `npm ci` in `backend/`, installing Express, `@prisma/client`, Stripe, etc. Prisma CLI (for `migrate deploy`) is in backend devDependencies and is installed via `--include=dev` in postinstall. You do **not** need a full rebuild on the server.

### First deploy checklist (no SSH)

1. Create MySQL database in Plesk → **Databases**.
2. Set Node.js env vars (`DATABASE_URL`, `JWT_SECRET`, Stripe, Google, …).
3. Enable Node.js; set application root and `npm start` as above.
4. Wait for GitHub Actions deploy to finish (or upload bundle manually).
5. **Run Node.js commands:** `npm ci`, then `npx prisma migrate deploy --schema=backend/prisma/schema.prisma`.
6. **Restart app**.
7. Run [post-deploy checks](#post-deploy-checks) (browser or external `curl`).

### Alternative application root

Set GitHub variable `PLESK_NODE_APP_DIR` to e.g. `tamir-li/` (subscription home, sibling to `httpdocs/`). Application root in Plesk becomes `/var/www/vhosts/tamir.li/tamir-li`.

---

## Recommended layout (GitHub Actions SFTP)

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

## Environment variables (Plesk → Node.js → Custom environment variables)

Set **backend** secrets here (never commit `.env` files).

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Optional | Use Plesk’s injected port if present |
| `DATABASE_URL` | Yes | `mysql://user:pass@localhost:3306/tamirly_db` |
| `JWT_SECRET` | Yes | Random string, min 16 characters |
| `GOOGLE_CLIENT_ID` | Yes (Google sign-in) | Same as `VITE_GOOGLE_CLIENT_ID` at build time |
| `CORS_ORIGIN` | Optional | Omit for same-origin; or `https://tamir.li,https://www.tamir.li` |
| `ADMIN_EMAILS` | Recommended | Comma-separated admin emails |
| `STRIPE_SECRET_KEY` | Yes (billing) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes (billing) | `whsec_...` — webhook URL: `https://tamir.li/api/billing/webhook` |
| `STRIPE_PRICE_*` | Billing | See [`backend/.env.example`](../backend/.env.example) |

**Build-time (`VITE_*`)** — baked into the frontend bundle in CI (or when you run `npm run build` locally). Set in GitHub Actions vars/secrets:

| Variable | Recommended |
|----------|-------------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` |
| `VITE_API_URL` | `https://tamir.li` (same origin) or omit (runtime fallback to `window.location.origin`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID |
| `VITE_GTM_ID`, `VITE_ADSENSE_*`, `VITE_STRIPE_PUBLISHABLE_KEY` | As needed |

After changing any `VITE_*` value, trigger a new CI deploy (or rebuild locally and re-upload); no server build step.

---

## Build & start commands (reference)

| Command | CI / server |
|---------|-------------|
| `npm ci` | **Server** (via Plesk Run Node.js commands) — installs runtime deps |
| `npm run build` | **CI only** when using GitHub Actions SFTP — not on server |
| `npx prisma migrate deploy --schema=backend/prisma/schema.prisma` | **Server** after upload or when migrations change |
| `npm start` | Plesk startup — `node backend/dist/index.js` |
| `npm run dev` / `npm run dev:api` | Local development only |

Local full stack: run `npm run dev` and `npm run dev:api` in two terminals; set `VITE_API_URL=http://localhost:5000` in `.env.development.local`.

---

## MySQL

1. Plesk → **Databases** → create database + user.
2. Set `DATABASE_URL` in Node.js env vars.
3. Apply migrations via **Run Node.js commands**:

   ```
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

---

## Deploy options

### A) GitHub Actions → SFTP (recommended)

Workflow: [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)

CI builds the full app, assembles the deploy bundle, and uploads via SFTP to the Node.js application root. On the server: `npm ci`, migrate, restart — all via Plesk Node.js UI (see [Deploy without SSH](#deploy-without-ssh-plesk-nodejs-ui)).

### B) Build on server (Plesk Git)

Only if you deploy source from Plesk **Git** (not the CI bundle). In **Run Node.js commands**, one at a time:

```
npm ci
```

```
npm run build
```

```
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
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
- [ ] Stripe checkout; webhook at `https://tamir.li/api/billing/webhook`

---

## Related

- [`stripe-setup.md`](./stripe-setup.md) — update webhook URL to `https://tamir.li/api/billing/webhook`
- [`plesk-deploy.md`](./plesk-deploy.md) — legacy static + API subdomain
- [`docker-plesk-deploy.md`](./docker-plesk-deploy.md) — Docker Compose (optional; use instead of Node.js extension)
