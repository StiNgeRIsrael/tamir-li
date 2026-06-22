# tamir.li — Production readiness audit

**Date:** 2026-06-22  
**Verdict:** The codebase is a **real full-stack app** (Express + Prisma + MySQL + Google OAuth + PayPal). **Production today is static-first:** the SPA is live, but `/api/*` and `/health` never reach Node — they return `index.html`.

---

## Feature matrix

| Feature | Code exists | Prod works | Blocker |
|---------|-------------|------------|---------|
| **Google login** | Yes — `AuthContext`, `GoogleLoginButton`, `POST /api/auth/google`, user upsert in Prisma | **No** | Static `httpdocs/` serves SPA for `/api/auth/*`. Needs Node proxy + `GOOGLE_CLIENT_ID`, `DATABASE_URL`, `JWT_SECRET` on Plesk |
| **JWT session** | Yes — 7-day JWT in `localStorage` (`tamir_auth_token`), Bearer on API calls | **No** | API unreachable. Not cookie-based auth (by design) |
| **Usage limits** | Yes — `UsageLog` in DB, `tamir_sid` httpOnly cookie for anonymous, 5/day free | **Partial** | Frontend falls back to **localStorage** when API fails — limits are client-only, bypassable |
| **PayPal premium** | Yes — checkout, capture, webhooks, subscription sync | **No** | API unreachable + `PAYPAL_*` env vars and webhook URL on Plesk |
| **Conversions API** | **Stub** — `POST /api/conversions` returns **501** | **No** | No worker pipeline; generic `ToolPage` calls API in prod (mock is dev-only). Custom tools (compressor, PDF, etc.) run **in-browser** |
| **Admin** | Yes — stats, users, tool config under `/api/admin/*` | **No** | API unreachable; requires `ADMIN` role (via `ADMIN_EMAILS` on Google sign-in) |

---

## Production probes (2026-06-22)

All probes used `curl https://tamir.li/...`. **HTML = static layer blocking API.**

| Endpoint | Expected (Node) | Actual | Content-Type |
|----------|-----------------|--------|--------------|
| `GET /health` | `200` JSON `{ status: "OK" }` | `200` SPA `index.html` | `text/html` |
| `GET /api/auth/me` | `401` JSON (no token) | `200` SPA | `text/html` |
| `POST /api/auth/google` (no body) | `400` JSON `idToken required` | `200` SPA | `text/html` |
| `GET /api/usage/today` | `200` JSON usage snapshot | `200` SPA | `text/html` |
| `GET /api/billing/status` | `401` JSON (no auth) | `200` SPA | `text/html` |
| `GET /api/tools/config` | `200` JSON | `200` SPA | `text/html` |
| `GET /sitemap.xml` | XML | `200` XML | `application/xml` ✓ |
| `https://api.tamir.li/health` | — | DNS **does not resolve** | — |

**Signals:** `X-Powered-By: PleskLin`, `Last-Modified` on HTML matches static deploy (~18:15 UTC). Frontend bundle has `VITE_API_URL=https://tamir.li` and `VITE_GOOGLE_CLIENT_ID` baked in — build is correct; routing is wrong.

---

## Codebase summary

### Auth (implemented)

- **Frontend:** `AuthContext` → Google GIS credential → `POST /api/auth/google` → stores JWT in `localStorage`
- **Backend:** Google ID token verify, user create/update, `ADMIN_EMAILS` bootstrap, `GET /api/auth/me` with Bearer
- **Not cookies for login** — only `tamir_sid` cookie for anonymous usage tracking

### Billing (implemented, PayPal primary)

- `useSubscription` → `/api/billing/status`, `/checkout`, `/portal`, PayPal capture on return
- Full webhook handler for subscription lifecycle and credit packs
- Stripe behind `ENABLE_STRIPE=true` (optional)

### Usage (implemented)

- `useUsage` → `/api/usage/today`, `/api/usage/record`
- **Graceful degradation:** on API failure, uses `localStorage` (`tamir_usage_v1`)

### Conversions (stub + client tools)

- `POST /api/conversions` → **501** `CONVERSION_NOT_READY`
- **Dev:** mock conversion animation (`allowMockFileConversion()` default true)
- **Prod:** calls API; if static HTML returns 200, UI may show false success without converting files
- **Real client-side tools:** image compressor/resizer, PDF manager, text tools (`customComponent` in `tools-data.ts`)
- **Stub / WIP:** Hebrew OCR (`HebOcrTool`) — simulated only; not in catalog. See [implementation-status.md](./implementation-status.md)

### Admin (implemented)

- Routes: `/api/admin/stats`, `/users`, `/tools` — require `ADMIN` role
- Frontend: `/admin/*` pages with `AdminGuard`

---

## Architecture: what prod runs today

```
Intended (monolith — docs/plesk-node-deploy.md)
────────────────────────────────────────────────
Browser → tamir.li → Plesk Node (httpdocs/deploy/app.js)
                      ├── /api/*     → Express + Prisma
                      ├── /health    → JSON
                      └── /*         → dist/ SPA

Actual (observed)
──────────────────
Browser → tamir.li → httpdocs/ static (Apache/nginx via PleskLin)
                      ├── /sitemap.xml  → static XML ✓
                      ├── /assets/*     → static JS/CSS ✓
                      ├── /api/*        → index.html ✗ (SPA fallback)
                      └── /health       → index.html ✗

httpdocs/deploy/     → Node app may exist but is NOT receiving /api traffic
api.tamir.li         → not configured (DNS NXDOMAIN)
```

CI workflow [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml) uploads the monolith to `httpdocs/deploy/` and SSH-cleans legacy `httpdocs/.htaccess`, `index.html`, `assets/`, and `dist/` — cleanup may not have run or Plesk document root still points at parent `httpdocs/`.

---

## Prioritized fix list

### P0 — Make API reachable (unblocks auth, billing, usage, admin)

1. **Plesk → Node.js:** Application root = `httpdocs/deploy`, **Document root = `httpdocs/deploy`** (not `deploy/dist`, not parent `httpdocs`)
2. **File Manager → `httpdocs/`:** Delete legacy `index.html`, `assets/`, PWA files at root (keep `deploy/` and SEO files like `sitemap.xml`)
3. **Restart Node app**; verify: `curl -sI https://tamir.li/health | grep -i content-type` → `application/json`
4. **Verify POST:** `curl -s -X POST https://tamir.li/api/auth/google -H 'Content-Type: application/json' -d '{}'` → `400` JSON

See [plesk-node-deploy.md § Fix static layer](./plesk-node-deploy.md#fix-static-layer-blocking-node).

### P0 — Backend secrets & database

1. Plesk Node → Custom environment variables: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (≥16 chars), `GOOGLE_CLIENT_ID` (match CI `VITE_GOOGLE_CLIENT_ID`)
2. Run `npm run setup` once (migrations): Plesk **Run Node.js commands** → `run setup`
3. Set `ADMIN_EMAILS` for admin panel access

### P1 — PayPal billing

1. Configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY`, `PAYPAL_MODE`
2. Register webhook URL: `https://tamir.li/api/billing/paypal/webhook`
3. Test checkout from `/premium` after auth works

### P2 — Conversions pipeline

1. Implement upload storage + worker queue (or integrate ffmpeg/sharp/etc.) behind `POST /api/conversions`
2. Until then, consider `VITE_USE_MOCK_CONVERSION=true` only for demos — not for real prod
3. Harden `ToolPage`: reject non-JSON API responses to avoid false success on HTML 200

### P3 — Hardening

- Server-side usage enforcement before conversion (already in `/api/usage/record`; wire into conversion flow)
- Rate limiting on auth endpoints
- Monitor `/health` in CI post-deploy (workflow already warns on HTML)

---

## Local full stack (reference)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:api

# .env.development.local
VITE_API_URL=http://localhost:5000
```

Backend: `backend/.env` with MySQL, `JWT_SECRET`, `GOOGLE_CLIENT_ID`. Mock conversions enabled in dev by default.
