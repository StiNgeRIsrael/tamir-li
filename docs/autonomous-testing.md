# Autonomous testing — tamir.li

Repeatable health probes for the conversion hub. Safe for local dev, CI, and scheduled production monitoring.

**Explicit exclusion:** this harness never triggers PayPal/Stripe checkout, premium purchase flows, or billing webhooks.

---

## Quick start

```bash
# Local split dev (Vite :5173 + API :5000)
npm run dev:all   # in another terminal
SITE_URL=http://localhost:5173 API_URL=http://localhost:5000 npm run site:check

# Production monolith
SITE_URL=https://tamir.li API_URL=https://tamir.li npm run site:check

# Unit tests (format helpers, tool-availability)
npm test
```

Exit code **0** = all checks passed; **1** = at least one failure (actionable stderr summary).

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SITE_URL` | `http://localhost:5173` | Frontend origin (SPA pages + static files) |
| `API_URL` | same as `SITE_URL` | Backend origin (`/health`, `/api/*`) |
| `SITE_CHECK_TIMEOUT_MS` | `15000` | Per-request timeout |
| `SKIP_NETWORK` | `0` | Set to `1` for logic-only mode (CI without live URL) |

---

## What runs automatically

### Pure logic (no network)

- `image-convert` format helpers (`normalizeFormat`, `isOutputFormatSupported`, …)
- `tool-availability` — functional vs coming-soon catalog consistency
- Vitest suite: `src/lib/image-convert.test.ts`

### HTTP — key pages (expect 200 + HTML shell)

| Path | Why |
|------|-----|
| `/` | Hebrew-default home |
| `/jpg-to-png` | Live client-side image converter (HE) |
| `/en/jpg-to-png` | Locale-prefixed tool route |
| `/image-compressor`, `/merge-pdf` | Other functional client tools |
| `/pdf-to-docx` | Coming-soon stub still serves SPA |
| `/blog` | Blog index |

### Static SEO files

- `sitemap.xml` — valid `<urlset>`, contains functional tool slugs
- `robots.txt`, `ads.txt`, `llms.txt` — non-empty

### API probes (no billing)

| Endpoint | Expected |
|----------|----------|
| `GET /health` | JSON `{ status: "OK", uptime, db: { ok } }` — always **200** when the Node process is up; `db.ok: false` means MySQL/Prisma is unreachable (site check warns, does not fail) |
| `GET /api/conversions/health` | `{ ok: true, service: "conversions" }` |
| `GET /api/usage/today` | Usage snapshot shape, `max: 5` for free tier |
| `POST /api/usage/record` `{}` | **400** `INVALID_BODY` (does not increment counters) |
| `GET /api/tools/config` | JSON `{ tools: [...] }` — **200** even when DB is down (defaults from `KNOWN_TOOL_IDS`) |
| `POST /api/conversions` | **202** with `jobId` (queue live) or **501** on legacy deploy; **429** when daily limit hit |

Also verifies `/health` returns JSON (not SPA HTML) — catches Plesk static-layer misconfiguration.

When the queue is live, `site:check` also polls `GET /api/conversions/:id` until `COMPLETED` and streams `GET /api/conversions/:id/file`. Enqueue records usage server-side (same `UsageLog` as `/api/usage/record`). The in-process worker deletes jobs and on-disk files older than `CONVERSION_JOB_TTL_HOURS` (default 24h) on each tick.

### CDN / Cloudflare

- Reads `cf-ray` and `cache-control` on static assets (informational warning if missing on production)

---

## Edge cases to watch manually

These need browser context or are intentionally out of scope for the CLI probe:

| Area | Risk | How to verify |
|------|------|---------------|
| **Daily limit (5/day)** | `PremiumLock` fake-ad bypass; custom tools skip limits | Convert 6× on generic `ToolPage`; confirm 429 from API |
| **Ad consent** | Ads must not load before `tamir_consent_v1` | DevTools → no Adsterra until accept |
| **Download gate** | Free tier: 1st click = ad, 2nd = download | Click download twice on converted file |
| **Hebrew vs `/en`** | `/he/...` should redirect or 404; Hebrew has no prefix | Navigate `/he/jpg-to-png` |
| **Coming-soon tools** | Direct URL to stub shows `ComingSoonPanel` | Open `/mp3-to-wav`, `/pdf-to-docx` |
| **Cloudflare cache** | Stale `sitemap.xml` or `index.html` after deploy | Purge cache or check `CF-Cache-Status` |
| **API swallowed by SPA** | `/api/*` returns `index.html` | Site check flags this automatically |
| **Queue / async conversion** | Stub worker (passthrough); real FFmpeg pending | `site:check` exercises enqueue → poll → download when DB is up |
| **Mock mode in prod** | `VITE_USE_MOCK_CONVERSION=true` fakes non-image tools | Audit env on deploy |
| **Premium tool lock** | 15s timer unlock ≠ real subscription | Premium user should skip lock entirely |

---

## Production-grade feature backlog (prioritized)

1. **P0 — Monolith API routing** — Ensure Express fronts `/api/*` in production ([production-readiness.md](./production-readiness.md))
2. **P1 — Server conversion pipeline** — `POST /api/conversions` → upload, queue, workers; `ConversionJob` writes
3. **P1 — Freemium enforcement** — Wire `PremiumLock` to `useSubscription().isPremium`; limits on custom tools
4. **P2 — Playwright E2E** — Drag-drop JPG → PNG, download gate double-click, consent banner
5. **P2 — AI image generator** — Real API + credit deduction
6. **P2 — Video compressor component** — Or remove misleading `customComponent`
7. **P3 — Hebrew OCR** — Catalog entry + `POST /api/ocr`
8. **P3 — Usage analytics** — Populate `fileSizeBytes` / `processingTimeMs` in `UsageLog`
9. **P3 — Health dashboard** — Aggregate `/health` + DB ping for status page
10. **P3 — Blog i18n** — Translate or locale-gate Hebrew-only posts

---

## CI integration

Add to `.github/workflows/ci.yml` (optional scheduled job against production):

```yaml
  site-check-prod:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'  # or workflow_dispatch
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - name: Production site check
        env:
          SITE_URL: https://tamir.li
          API_URL: https://tamir.li
        run: npm run site:check
```

For PRs, run against a preview URL or skip API checks when backend is unavailable.

---

## Cursor Automation (scheduled agent)

See [.cursor/automations/site-check.md](../.cursor/automations/site-check.md) for a draft Cursor Automation that re-runs this check on a cron schedule and reports failures.

---

## Related files

| File | Role |
|------|------|
| `scripts/autonomous-site-check.ts` | CLI harness |
| `src/lib/image-convert.test.ts` | Unit tests |
| `src/lib/tool-availability.ts` | Functional vs SOON source of truth |
| `backend/src/app.ts` | `/health` with uptime + `db.ok` DB ping |
| `src/components/UsageNavPill.tsx` | Nav usage indicator (free tier) |
