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

## Quick start (server)

From the **repository root** (Plesk Node.js application root):

```bash
npm ci
npm run build
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
npm start
```

First deploy only: ensure MySQL exists and `DATABASE_URL` is set in Plesk env vars before `prisma migrate deploy`.

---

## Plesk Node.js settings

Enable **Node.js** on the main domain `tamir.li` (not a subdomain).

| Setting | Value |
|---------|-------|
| **Node.js version** | **22.x** |
| **Package manager** | npm |
| **Application root** | Repository root (contains root `package.json`), e.g. `/var/www/vhosts/tamir.li/tamir-li` |
| **Application startup file** | Leave blank — use npm script below, or set `backend/dist/index.js` |
| **Document root** | Default subdomain/docroot is OK — Plesk proxies HTTP(S) to the Node process |
| **Application mode** | `production` |
| **Custom script / start** | `npm start` (runs `node backend/dist/index.js`) |

### Environment variables (Plesk → Node.js → Custom environment variables)

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

**Build-time (`VITE_*`)** — baked into the frontend bundle when you run `npm run build`. Set in CI (GitHub Actions vars/secrets) or in `.env.production.local` on the server before building:

| Variable | Recommended |
|----------|-------------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` |
| `VITE_API_URL` | `https://tamir.li` (same origin) or omit (runtime fallback to `window.location.origin`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID |
| `VITE_GTM_ID`, `VITE_ADSENSE_*`, `VITE_STRIPE_PUBLISHABLE_KEY` | As needed |

After changing any `VITE_*` value, run `npm run build` again and restart Node.js.

---

## Build & start commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Install root + backend deps (`postinstall` runs `npm ci` in `backend/`) |
| `npm run build` | Sitemap → Vite `dist/` → `backend/dist/` (TypeScript + Prisma client) |
| `npm start` | `node backend/dist/index.js` — API + static SPA when `NODE_ENV=production` |
| `npm run dev` | Frontend only (Vite, port 8080) |
| `npm run dev:api` | Backend only (nodemon, port 5000) |

Local full stack: run `npm run dev` and `npm run dev:api` in two terminals; set `VITE_API_URL=http://localhost:5000` in `.env.development.local`.

---

## MySQL

1. Plesk → **Databases** → create database + user.
2. Set `DATABASE_URL` in Node.js env vars.
3. Apply migrations from repo root:

   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

---

## Deploy options

### A) Build on server (Plesk Git)

Plesk → **Git** → clone repo → **Deploy actions**:

```bash
npm ci
npm run build
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

Store secrets in Plesk Node.js env vars. Restart the Node.js app after deploy.

### B) GitHub Actions → SFTP (recommended)

Workflow: [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)

CI builds the full app, assembles a deploy bundle (`dist/`, `backend/dist/`, `backend/prisma/`, package manifests), and uploads via SFTP.

On the server after first upload:

```bash
cd backend && npm ci --omit=dev && npx prisma generate
npx prisma migrate deploy
cd .. && npm start
```

Or enable Plesk Node.js with `npm start` and run `npm ci` + migrate via SSH once.

Set repository variable `PLESK_NODE_APP_DIR` to the Node.js application root (not `httpdocs/`).

### C) Manual SFTP

Upload the repo (or CI deploy bundle), SSH in, run the **Quick start** commands above.

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
- [`docker-plesk-deploy.md`](./docker-plesk-deploy.md) — Docker Compose (optional)
