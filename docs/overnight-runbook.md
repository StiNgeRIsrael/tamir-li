# Overnight autonomous runbook — tamir.li

Prioritized queue for ~15-minute autonomous dev cycles. Each cycle: pick one item, implement or verify, run `npm test`, commit with clear message, push to `main` (CI deploys).

## Cycle queue (priority order)

### 1. Verify admin ads deploy + manual test path

**Goal:** Confirm Phase 1 ad settings work in production.

**Steps:**
1. After deploy, probe `GET https://tamir.li/api/ads/config` — expect JSON with null fields or saved keys.
2. Sign in as admin → `/admin/ads` → paste zone keys from Adsterra dashboard → Save.
3. Re-fetch `/api/ads/config` — keys should match.
4. Accept cookie consent on homepage → verify banner/sidebar iframes load (DevTools → Network → `invoke.js`).
5. Document result in cycle commit message.

**Done when:** Admin can rotate keys without rebuild; at least one placement loads after consent.

---

### 2. Freemium: wire PremiumLock to real isPremium on remaining tools

**Goal:** Premium-only tools show lock for free users, unlock for subscribers.

**Where:** `src/pages/ToolPage.tsx`, custom tool components with `premium: true` in `tools-data.ts`, `useSubscription()` hook.

**Steps:**
1. Grep for `PremiumLock` / hardcoded `isPremium={false}` / stub premium checks.
2. Wire `useSubscription().isPremium` (or equivalent) consistently.
3. Test one premium tool logged out vs premium user.

**Done when:** All `premium: true` tools respect subscription state.

---

### 3. Remaining SEO FAQ locales for top 5 stub tools

**Goal:** FAQ blocks in all 7 locales for highest-traffic stub tools.

**Where:** `src/components/ToolSeoBlocks.tsx`, `src/lib/translations/*.ts` (or tool-specific SEO copy).

**Steps:**
1. Identify top 5 stubs from GSC / `docs/tools-and-features.md`.
2. Add FAQ entries in `he.ts` (canonical), mirror to en/es/fr/de/it/ru.
3. Verify JSON-LD FAQPage on tool pages.

**Done when:** 5 tools × 7 locales have unique FAQ content.

---

### 4. pdf-to-word or svg-to-png stub reduction

**Goal:** Reduce mock/stub behavior on one high-value conversion.

**Pick:** `pdf-to-word` (server-side queue) or `svg-to-png` (client-side canvas).

**Steps:**
1. Read current implementation status in `docs/implementation-status.md`.
2. Implement minimal real conversion path (client or server).
3. Add error handling + usage increment.

**Done when:** Happy-path conversion works for a sample file in dev.

---

### 5. Adsterra prod smoke (consent → iframe loaded)

**Goal:** End-to-end ad flow verification script or doc.

**Steps:**
1. Extend `scripts/autonomous-site-check.ts` or add `scripts/ad-smoke.ts`.
2. Check `/api/ads/config` has at least one zone key.
3. Optional: headless check that iframe srcdoc contains invoke host (no consent bypass).

**Done when:** CI or manual script reports ad config readiness.

---

### 6. Compute audit (worker, cleanup)

**Goal:** Review server-side conversion worker resource usage.

**Where:** `backend/src/` conversion queue, `CONVERSION_JOB_TTL_HOURS`, storage cleanup.

**Steps:**
1. Trace job lifecycle PENDING → COMPLETED/FAILED.
2. Verify TTL cleanup runs; ffmpeg processes don't leak.
3. Document findings; fix obvious leaks.

**Done when:** Audit notes in commit or `docs/conversion-queue.md`.

---

### 7. End-of-night summary template

Copy into final commit or PR description:

```markdown
## Overnight summary — YYYY-MM-DD

### Shipped
- [ ] Commits: `<hash>` …
- [ ] Deploy: CI green / manual restart

### Verified
- [ ] /health db.ok
- [ ] /admin/ads saves keys
- [ ] Ads load after consent (Y/N)

### Blocked / needs human
- …

### Next session
1. …
2. …
3. …
```

---

## Conventions (every cycle)

- Read `AGENTS.md` before changes.
- Hebrew default locale; 7 locales for user-facing strings.
- No secrets in git; no Adsterra Publisher API in `VITE_*`.
- `npm test` before commit.
- Max scope: one queue item per cycle unless trivial follow-up.

## Related docs

- [adsterra-setup.md](./adsterra-setup.md) — admin ads primary path
- [deploy-checklist.md](./deploy-checklist.md) — Plesk deploy
- [autonomous-testing.md](./autonomous-testing.md) — site probe
- [implementation-status.md](./implementation-status.md) — feature audit
