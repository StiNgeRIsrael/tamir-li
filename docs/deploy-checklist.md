# Pre-deploy checklist — tamir.li (Plesk Node.js monolith)

Use before/after each production deploy. Full guide: [plesk-node-deploy.md](./plesk-node-deploy.md). Post-deploy probe: [autonomous-testing.md](./autonomous-testing.md).

## Plesk Node.js layout

| Setting | Value |
|---------|--------|
| Application root | `httpdocs/deploy` |
| Document root | **`httpdocs/deploy`** (same as app root — **not** `deploy/dist`) |
| Startup file | `app.js` → loads `backend/dist/index.js` |
| Node.js | **22.x**, mode `production` |

**Do not** set document root to `httpdocs/deploy/dist` — static `.htaccess` can swallow `/api/*` and `/health`.

## GitHub Actions deploy ([`deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml))

Triggers on push to `main` or manual **workflow_dispatch**.

| When | Action |
|------|--------|
| Every deploy | CI builds (Node 22), SFTP upload to `httpdocs/`, SSH restart (`tmp/restart.txt` + `touch app.js`) |
| Lockfile or migrations changed | Re-run workflow with **run_server_setup** checked **or** Plesk → `run setup` |
| Code-only | Auto-restart only — no server `npm install` |

**CI build-time env** (baked into `dist/`): `VITE_SITE_ORIGIN`, `VITE_API_URL` (vars); `VITE_GOOGLE_CLIENT_ID`, `VITE_GTM_ID`, `VITE_ADSTERRA_ZONE_*` (secrets). Add other `VITE_*` to the workflow if needed (`VITE_PAYPAL_CLIENT_ID`, `VITE_GA4_ID`, etc.).

**CI secrets for deploy/restart:** `PLESK_SSH_HOST` / `PLESK_FTP_HOST`, `PLESK_SSH_USER`, `PLESK_SSH_PASSWORD` (FTP fallbacks OK). Optional vars: `PLESK_HTTPDOCS_DIR` (default `httpdocs/`), `PLESK_NODE_APP_DIR` (default `httpdocs/deploy`), `PLESK_DOMAIN` (default `tamir.li`).

**run_server_setup=true** requires GitHub secret `DATABASE_URL` (SSH does not inherit Plesk env). Optional: `JWT_SECRET`, `GOOGLE_CLIENT_ID` (falls back to `VITE_GOOGLE_CLIENT_ID`).

After restart, CI removes legacy `httpdocs/.htaccess`, `index.html`, `assets/`, `dist/` and `deploy/dist/.htaccess`, then probes `GET /health` is JSON (not HTML).

## Build-time (`VITE_*` — GitHub Actions or local `.env.production.local`)

Set before `npm run build` / CI deploy; rebuild required after changes.

| Variable | Production value |
|----------|------------------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` |
| `VITE_API_URL` | `https://tamir.li` (same-origin monolith) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Web client ID (must match Plesk `GOOGLE_CLIENT_ID`) |
| `VITE_GTM_ID` or `VITE_GA4_ID` | Analytics (not both) |
| `VITE_ADSTERRA_ZONE_*` | Ad zone keys (free tier) |
| `VITE_PAYPAL_CLIENT_ID` | Same PayPal app as server (optional; not in workflow by default) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Only if `ENABLE_STRIPE=true` on backend |

Do **not** put Adsterra Publisher API keys or server secrets in `VITE_*`.

## Runtime (Plesk → Node.js → Custom environment variables)

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | MySQL URL — set **before** migrations; runtime reads Plesk env, not GitHub |
| `JWT_SECRET` | Yes | Random, **≥ 16** characters |
| `GOOGLE_CLIENT_ID` | Yes | Same as `VITE_GOOGLE_CLIENT_ID` at build time |
| `CORS_ORIGIN` | Optional | Omit for same-origin monolith |
| `PAYPAL_*` | Yes (billing) | Live/sandbox IDs, webhook, plan IDs |
| `CONVERSION_STORAGE_DIR` | Recommended | Writable path for server conversion jobs (e.g. `.../deploy/data/conversions`) |
| `FFMPEG_PATH` | Optional | Full path if `ffmpeg` not on PATH for Node user |
| `CONVERSION_JOB_TTL_HOURS` | Optional | Default `24` |
| `ADMIN_EMAILS` | Optional | Bootstrap admin on Google sign-in |

## Database

1. Create MySQL DB + user in Plesk; set `DATABASE_URL` in Plesk Node.js env.
2. Run migrations (first deploy or schema change):
   - Plesk **Run Node.js commands** → npm args: `run setup` (full install + migrate), **or**
   - Step-by-step: `ci` → `run plesk:backend-install` → `run plesk:db`, **or**
   - CI **workflow_dispatch** with **run_server_setup** (needs GitHub `DATABASE_URL` secret).

Plesk UI does not support `npx` — use `run plesk:db`, not `npx prisma migrate deploy`.

## ffmpeg (server-side audio converter)

- Install on host: `apt install ffmpeg` (or hoster-provided path).
- Verify: `ffmpeg -version` as the user that runs Node.js.
- Set `FFMPEG_PATH` if not on PATH.
- Ensure `CONVERSION_STORAGE_DIR` exists and is writable.

## Deploy steps (summary)

1. Confirm Plesk docroot = application root (`httpdocs/deploy`).
2. Set runtime env vars (especially `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`).
3. Push to `main` (CI deploy) or manual upload → `run setup` on first deploy / schema change → restart if not auto-restarted.
4. Run production probe (see below).

## Post-deploy probe

```bash
SITE_URL=https://tamir.li API_URL=https://tamir.li npm run site:check
```

**Expect:** exit `0`, API routing not swallowed by SPA, `/health` JSON with `db.ok`, `/api/conversions/health` OK.

**Common failures:**

| Symptom | Likely fix |
|---------|------------|
| `/api/usage/today` or `/api/tools/config` → **500** | Fix `DATABASE_URL`, run `run plesk:db` (or `run setup`), restart app |
| `/health` → HTML or `db.ok: false` | Fix docroot (not `deploy/dist`); verify `DATABASE_URL` and migrations |
| `/health` missing `uptime` / `db` | Redeploy latest backend bundle |
| `/api/*` returns HTML | Fix document root; remove legacy `httpdocs/index.html` / `.htaccess` (CI does this on restart) |
| Google login hidden | Set `VITE_GOOGLE_CLIENT_ID` in CI + `GOOGLE_CLIENT_ID` in Plesk; rebuild |
| Conversion job **FAILED** / timeout | Install `ffmpeg`, set `FFMPEG_PATH`, writable `CONVERSION_STORAGE_DIR` |
| `POST /api/conversions` → **501** | Legacy deploy without queue; client-side tools still work in-browser |
| CI **Verify Node monolith** fails | Same as `/health` → HTML — docroot / static layer blocking Node |

Billing checkout is intentionally skipped by the probe (`SKIP_BILLING=true`).

## Related docs

- [conversion-queue.md](./conversion-queue.md) — server job storage and ffmpeg
- [production-readiness.md](./production-readiness.md) — feature/status audit
- [backend/.env.example](../backend/.env.example), [.env.example](../.env.example)
