# Local development (tamir.li)

Run the **frontend** (Vite, port **8080**) and **backend API** (Express, port **5000**) as two processes. Production on Plesk is a **monolith** (`npm run build` + `npm start` serves `dist/` from the API); locally, use the split setup for hot reload.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js 22+** | `engines.node` in root `package.json` |
| **npm** | Comes with Node |
| **MySQL 8** | Local install, XAMPP, or Docker (see below) |

Check versions:

```powershell
node -v    # v22.x or newer
npm -v
```

---

## 1. MySQL database

Prisma uses **MySQL** (`backend/prisma/schema.prisma`). Default database name: **`tamirly_db`**.

### Option A — Docker (recommended)

From the repo root:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

Default connection (matches `backend/.env.example`):

```
mysql://root:root@localhost:3306/tamirly_db
```

Stop when done: `docker compose -f docker-compose.dev.yml down` (add `-v` to wipe data).

### Option B — XAMPP

1. Start **MySQL** in the XAMPP Control Panel.
2. Open phpMyAdmin → create database `tamirly_db` (utf8mb4).
3. Use e.g. `mysql://root:@localhost:3306/tamirly_db` (empty root password is common on XAMPP).

### Option C — MySQL installed on Windows

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tamirly_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Set `DATABASE_URL` in `backend/.env` to match your user/password.

---

## 2. Environment files

**Do not commit secrets.** Copy examples and edit locally.

### Frontend — `.env.development.local` (repo root)

```powershell
Copy-Item .env.example .env.development.local
```

Minimum for local full stack:

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_SITE_ORIGIN` | `http://localhost:8080` | Recommended (SEO/canonical) |
| `VITE_API_URL` | `http://localhost:5000` | **Yes** — without this, dev has no API |
| `VITE_GOOGLE_CLIENT_ID` | Same as backend | For Google sign-in |
| `VITE_USE_MOCK_CONVERSION` | omit or `false` | Use real API conversions |

Optional: `VITE_GA4_ID` (direct GA4 — production `G-EBE6D6BPZ0`), `VITE_GTM_ID` (use one, not both), `VITE_ADSTERRA_*`, `VITE_PAYPAL_CLIENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY` — not needed for core dev.

### Analytics (GA4)

Set `VITE_GA4_ID=G-EBE6D6BPZ0` in `.env.development.local` to test locally. gtag loads **on app boot** (Consent Mode v2 — cookieless pings before accept). Do **not** set `VITE_GTM_ID` at the same time. See [`google-analytics-setup.md`](./google-analytics-setup.md).

### Backend — `backend/.env`

```powershell
Copy-Item backend\.env.example backend\.env
```

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `development` | Yes |
| `PORT` | `5000` | Yes (default) |
| `DATABASE_URL` | `mysql://root:root@localhost:3306/tamirly_db` | **Yes** |
| `JWT_SECRET` | Any string ≥16 chars locally | **Yes** |
| `GOOGLE_CLIENT_ID` | OAuth Web client ID | For Google sign-in |
| `CORS_ORIGIN` | `http://localhost:8080` | **Yes** (split dev) |
| `ADMIN_EMAILS` | `you@gmail.com` | Optional — grants ADMIN on Google sign-in |

**Optional** (billing / AI features):

| Variable | Notes |
|----------|--------|
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`, `PAYPAL_PLAN_*` | PayPal subscriptions |
| `ENABLE_STRIPE=true` + `STRIPE_*` | Stripe instead of PayPal |
| `OPENAI_API_KEY` | AI-assisted conversions |
| `RESEND_API_KEY` | Email (if used) |

---

## 3. Install dependencies & database schema

From repo root:

```powershell
cd E:\Documents\GitHub\tamir-s-conversion-hub
npm ci
npx prisma migrate deploy --schema=backend/prisma/schema.prisma
```

`npm ci` runs `postinstall`, which also installs backend dev dependencies.

Generate Prisma client only (usually automatic on backend dev start):

```powershell
npx prisma generate --schema=backend/prisma/schema.prisma
```

---

## 4. Start development servers

### Recommended — one terminal (`dev:all`)

```powershell
npm run dev:all
```

Runs Vite on **http://localhost:8080** and API on **http://localhost:5000**.

### Alternative — two terminals

**Terminal 1 — frontend:**

```powershell
npm run dev
```

**Terminal 2 — backend:**

```powershell
npm run dev:api
```

### Verify

```powershell
curl http://localhost:5000/health
```

Open **http://localhost:8080** in the browser.

---

## 5. Google Sign-In (localhost)

Auth uses **Google Identity Services** (popup), not a server redirect.

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your **OAuth 2.0 Web client**:

1. **Authorized JavaScript origins:** add `http://localhost:8080`
2. Use the **same Client ID** in `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`
3. Popup mode — no redirect URI required for basic sign-in

Add your email to `ADMIN_EMAILS` in `backend/.env` to get admin access on first Google login.

---

## 6. Production-like monolith (optional, no HMR)

To mimic Plesk locally (single process, no Vite dev server):

```powershell
# Set VITE_* in .env.production.local, then:
npm run build
$env:NODE_ENV="production"; npm start
```

App listens on **http://localhost:5000** (API + static `dist/`). Not recommended for day-to-day development.

---

## Env checklist (quick copy)

**`.env.development.local`**

```
VITE_SITE_ORIGIN=http://localhost:8080
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=<your-web-client-id>
```

**`backend/.env`**

```
NODE_ENV=development
PORT=5000
DATABASE_URL=mysql://root:root@localhost:3306/tamirly_db
JWT_SECRET=<local-dev-secret-min-16-chars>
GOOGLE_CLIENT_ID=<same-as-VITE_GOOGLE_CLIENT_ID>
CORS_ORIGIN=http://localhost:8080
ADMIN_EMAILS=you@example.com
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Admin panel says “set VITE_API_URL” | Add `VITE_API_URL=http://localhost:5000` to `.env.development.local` and restart `npm run dev` |
| CORS errors | Set `CORS_ORIGIN=http://localhost:8080` in `backend/.env` |
| Prisma / DB connection failed | Check MySQL is running; verify `DATABASE_URL`; run migrations |
| Google sign-in fails | Match client IDs; add `http://localhost:8080` to authorized origins |
| Port in use | Change `PORT` in `backend/.env` and update `VITE_API_URL` accordingly |

---

## Related docs

- [Plesk Node.js deploy](./plesk-node-deploy.md) — production monolith
- [Docker Plesk deploy](./docker-plesk-deploy.md) — full Docker stack
- [PayPal setup](./paypal-setup.md) — sandbox billing
