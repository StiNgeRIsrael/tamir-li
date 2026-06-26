# tamir.li — Production readiness audit

**Last updated:** 2026-06-26  
**Verdict:** Full-stack **Node monolith** on Plesk is the production path. API, auth, usage, billing, and conversion queue are **live** when `DATABASE_URL` and secrets are set. Capacitor **Android app** (AdMob + Google Play Billing) is implemented in code; Play Console / AdMob verification in progress.

**Canonical repo:** [StiNgeRIsrael/tamir-li](https://github.com/StiNgeRIsrael/tamir-li)  
**Deploy:** push to `main` → [Deploy to Plesk](https://github.com/StiNgeRIsrael/tamir-li/actions/workflows/deploy-plesk.yml)

Re-verify after each deploy: `SITE_URL=https://tamir.li API_URL=https://tamir.li npm run site:check:prod`

---

## Feature matrix (2026-06-26)

| Feature | Code exists | Prod (typical) | Notes |
|---------|-------------|----------------|-------|
| **Google login** | Yes | **Yes** when env set | `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` must match |
| **JWT session** | Yes | **Yes** | Bearer in `localStorage`; anonymous usage via `tamir_sid` cookie |
| **Usage limits** | Yes | **Yes** | 5/day free; localStorage fallback when API down |
| **PayPal premium (web)** | Yes | **Yes** when env + webhook configured | Primary web checkout |
| **Google Play Billing (Android)** | Yes | **Pending** | Needs Play Console products + `GOOGLE_PLAY_*` backend env + internal test install |
| **Adsterra (web)** | Yes | **Partial** | Needs zone keys in `/admin/ads`; `ads.txt` still placeholder |
| **AdMob (Android app)** | Yes | **Pending approval** | IDs in `.env.production`; app loads live `tamir.li` bundle |
| **Conversions API** | Queue + worker | **Partial** | `POST /api/conversions` → **202**; audio real with ffmpeg; video/PDF-word stub |
| **Client-side tools** | Yes | **Yes** | Image, PDF, text, Word→PDF in browser |
| **Admin** | Yes | **Yes** | Requires `ADMIN` role via `ADMIN_EMAILS` |
| **Android Capacitor shell** | Yes | **Not on Play yet** | `li.tamir.app`; see [android-play-console-setup.md](./android-play-console-setup.md) |

---

## Architecture (current)

```
Browser or Capacitor WebView → https://tamir.li
                                    │
                    Plesk Node (httpdocs/deploy/app.js)
                    ├── /api/*     → Express + Prisma + MySQL
                    ├── /health    → JSON
                    └── /*         → Vite dist/ SPA

Android native layer (Capacitor)
├── AdMob SDK (App ID in strings.xml)
├── Google Play Billing plugin
└── Loads same SPA from tamir.li (not bundled dist/)
```

**Deprecated:** split deploy with static-only `httpdocs` + `api.tamir.li` — see [plesk-deploy.md](./plesk-deploy.md).

---

## Production probes

```bash
curl -s https://tamir.li/health | head -c 200          # expect JSON, db.ok
curl -sI https://tamir.li/api/usage/today | grep -i content-type  # application/json
curl -s https://tamir.li/app-ads.txt                     # AdMob app-ads.txt (after deploy)
```

| Endpoint | Expected |
|----------|----------|
| `GET /health` | JSON `{ status, db, migrations, … }` |
| `GET /api/usage/today` | JSON usage snapshot |
| `GET /api/auth/me` (no token) | JSON 401 |
| `POST /api/conversions` | **202** + `jobId` (not 501) |

If `/api/*` returns HTML, document root or static layer is blocking Node — [plesk-node-deploy.md § Fix static layer](./plesk-node-deploy.md).

---

## Prioritized follow-ups

### P0 — Web revenue

1. Paste real **Adsterra `ads.txt`** line ([adsterra-setup.md](./adsterra-setup.md))
2. Confirm **PayPal** live plans + webhook on `https://tamir.li/api/billing/paypal/webhook`
3. Zone keys in **`/admin/ads`** + consent smoke test

### P1 — Android launch

1. Merge Android branch to **StiNgeRIsrael/tamir-li** `main` if not already deployed
2. Play Console internal testing + signed AAB
3. AdMob / Play policy verification (in progress)
4. Backend: `GOOGLE_PLAY_*` + migration `20260627120000_google_play_billing`

### P2 — Conversions

1. Real video/PDF-word workers or keep ComingSoon on stub tools
2. `ffmpeg` on Plesk for audio queue reliability

---

## Local full stack

See [local-dev.md](./local-dev.md). Mock conversions default on in dev; production uses client-side tools + server queue where applicable.

## Related

- [implementation-status.md](./implementation-status.md) — detailed code audit
- [deploy-checklist.md](./deploy-checklist.md) — CI deploy steps
- [docs/README.md](./README.md) — doc index
