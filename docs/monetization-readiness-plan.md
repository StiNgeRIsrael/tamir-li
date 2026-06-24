# Monetization readiness plan — tamir.li

Executive checklist for **real monetization launch** (ads + freemium + billing).  
Audit date: **2026-06-24**. Status key: **DONE** / **PARTIAL** / **MISSING**.

---

## 1. Ads

| Item | Status | Notes |
|------|--------|-------|
| Admin `/admin/ads` UI | **DONE** | Save zone keys, popunder URL, native script to DB via `PATCH /api/admin/ads/settings` |
| Public `/api/ads/config` | **DONE** | Cached 60s; falls back to empty payload on Prisma failure; emergency DDL on P2021 |
| `AdConfigProvider` + runtime merge | **DONE** | DB keys override `VITE_ADSTERRA_*` at runtime (`src/lib/ads/adsterra.ts`) |
| `AdSlot` display (banner/sidebar/inline) | **PARTIAL** → **DONE** (this cycle) | Re-subscribes to `useAdConfig` so DB keys apply after fetch without hiding slots during load |
| Wait-state / high-intent ads | **DONE** | `eager` prop on processing/download slots in `ToolPage.tsx` (commit `def5d7d`) |
| Cookie consent gating | **DONE** | `src/lib/ads/consent.ts`; ads/analytics blocked until accept |
| Download gate (2-step) | **DONE** | `download-gate.ts`, `DownloadGateIndicator`, custom tools via `custom-tool-freemium.ts` |
| Popunder | **PARTIAL** → **DONE** (consent) | `loadPopunderScript` only after ads cookie consent; env `VITE_ADSTERRA_POPUNDER_SCRIPT_URL` documented |
| Native ads | **PARTIAL** | `AdNativeSlot` + admin fields; needs both script URL + container ID |
| `ads.txt` | **MISSING** | `public/ads.txt` is placeholder comment only — **must paste Adsterra publisher line before ad network approval** |
| Premium ad suppression | **DONE** | `setPremiumUser` from `useSubscription` |

**Launch blocker:** Real `ads.txt` line from Adsterra dashboard.

---

## 2. Freemium

| Item | Status | Notes |
|------|--------|-------|
| Daily limit (5/day) backend | **DONE** | `MAX_DAILY_FREE = 5` in `backend/src/lib/usage-shared.ts` |
| Daily limit frontend sync | **DONE** | Same constant in `src/hooks/useUsage.ts` |
| Server-side enforcement | **DONE** | `POST /api/usage/record` + conversion queue `checkLimitAndRecordUsage` |
| localStorage fallback | **PARTIAL** | Bypasses server when API down — acceptable for UX, weak for abuse |
| Custom tools skip limits | **PARTIAL** → **DONE** (2026-06-24) | Image/PDF/text tools call `recordUsage` via `onCustomToolSuccess` after vignette |
| Premium subscription check | **DONE** | `GET /api/billing/status` → `useSubscription` → ads + limits |
| Premium tool lock | **PARTIAL** → **DONE** (2026-06-24) | `PremiumLock` / `DailyLimitLock` use real `showAdVignette` + inline `AdSlot` before unlock |
| PayPal checkout (monthly/yearly/credits) | **DONE** | `POST /api/billing/checkout`, capture, webhooks in `billing.routes.ts` |
| Stripe checkout | **MISSING** | Webhook only; no checkout routes unless `ENABLE_STRIPE=true` + full setup |
| Anchor pricing UI (₪150 → ₪19.90) | **DONE** | All 7 locales (`upgradePage.anchorPrice*`) |
| Backend MRR alignment | **DONE** | `SUBSCRIPTION_MRR_AGOROT`: MONTHLY 1990, YEARLY 1592 agorot in `billing-shared.ts` |
| PayPal plan ID env | **PARTIAL** | Requires `PAYPAL_PLAN_MONTHLY` / `PAYPAL_PLAN_YEARLY` on Plesk — **verify live IDs match ILS amounts** |

**Launch blocker:** Confirm live PayPal plan prices match ₪19.90/mo and yearly equivalent; test one sandbox → live subscription.

---

## 3. Admin

| Item | Status | Notes |
|------|--------|-------|
| Overview `/admin` | **DONE** | Users, usage, jobs; billing summary added in uncommitted work |
| Users `/admin/users` | **DONE** | Search, block, roles; subscription badge in progress |
| Tools `/admin/tools` | **DONE** | Enable/disable, featured, sort |
| Ads `/admin/ads` | **DONE** | Full runtime config editor |
| Billing `/admin/billing` | **PARTIAL** → **DONE** (this cycle) | Stats, payments, subscriptions tables; backend routes `/api/admin/billing/*` |
| Analytics dashboard | **MISSING** | GTM/GA4 events exist; no admin analytics page |
| Admin auth | **DONE** | `AdminGuard` + `ADMIN_EMAILS` / role check |

---

## 4. Conversion engines

| Item | Status | Notes |
|------|--------|-------|
| Image converter (~42 slugs) | **DONE** | Client-side canvas (`image-convert.ts`) |
| Image compress / resize | **DONE** | Custom components |
| PDF manager | **DONE** | pdf-lib |
| Text tools | **DONE** | Client-side |
| Audio converter | **DONE** | Server queue + ffmpeg worker |
| Server conversion queue | **DONE** | `POST /api/conversions` enqueues; worker drains (`conversion-worker.ts`) |
| Video / PDF↔Word / SVG / ICO | **STUB** | Mock or generic flow — marketing pages exist, output not real |
| AI image generator | **PARTIAL** | Paywall UI; credits hardcoded; no real API |
| `ConversionJob` telemetry | **PARTIAL** | Jobs written; admin stats read; file size on usage log partial |

**Not a launch blocker** for ads/subscription monetization on working tools; **is** a trust/SEO risk on stub tool pages.

---

## 5. SEO

| Item | Status | Notes |
|------|--------|-------|
| Sitemap (~847 URLs) | **DONE** | `prebuild` → `generate-sitemap.ts` |
| hreflang (7 locales) | **DONE** | `SEOHead` alternates; Hebrew default no prefix |
| Tool JSON-LD + FAQ | **DONE** | `ToolSeoBlocks.tsx`; ongoing locale expansion |
| Blog | **PARTIAL** | 22 Hebrew articles; content not localized |
| GSC / indexing | **PARTIAL** | Docs exist; ongoing submission |

**Not a launch blocker** for monetization — hreflang is complete.

---

## 6. Legal / trust

| Item | Status | Notes |
|------|--------|-------|
| Terms of service | **DONE** | `/terms` all locales |
| Privacy policy | **DONE** | `/privacy`; mentions ads/consent |
| Refund policy | **PARTIAL** | Copy on Premium FAQ + terms reference; **no dedicated `/refund` page** |
| Cookie consent copy | **DONE** | Adsterra + analytics disclosed |
| Contact / about | **DONE** | Static pages |

**Recommended:** Dedicated refund section or page before scaling paid traffic.

---

## 7. Production ops

| Item | Status | Notes |
|------|--------|-------|
| Prisma migrations on deploy | **DONE** | `startup-migrate`, P3018/P3009 auto-resolve, `/health` migrate status |
| AdSettings migration | **DONE** | `20260624120000_ad_settings` + emergency DDL fallback |
| Health endpoint | **DONE** | DB ping, ad settings table probe, migrate status |
| Monolith deploy (Node + SPA) | **DONE** | Documented in `plesk-node-deploy.md` |
| `site:check:prod` | **DONE** | `npm run site:check:prod` probes live tamir.li |
| PayPal webhook (live) | **PARTIAL** | Route exists; must register `https://tamir.li/api/billing/paypal/webhook` in live app |
| Conversion storage / ffmpeg | **PARTIAL** | Worker needs ffmpeg on Plesk host for audio/video queue |
| Env secrets on Plesk | **PARTIAL** | Manual — PayPal, Google, Adsterra keys not verifiable from repo |

---

## Prioritized execution queue (loops until 10:00)

| # | Task | Est. | Impact |
|---|------|------|--------|
| 1 | **Ship admin billing dashboard** (stats, payments, subs) | 30 min | Revenue visibility — **this cycle** |
| 2 | **Fix AdSlot DB config re-render** (keep slots visible during load) | 15 min | Ads actually show when keys saved in admin — **this cycle** |
| 3 | Paste real **Adsterra `ads.txt`** line in `public/ads.txt` | 10 min | Ad network approval / fill rate |
| 4 | **Verify live PayPal** plan IDs + one test subscription on production | 45 min | Subscription revenue |
| 5 | Register **live PayPal webhook** + fire test `BILLING.SUBSCRIPTION.ACTIVATED` | 20 min | Premium sync reliability |
| 6 | Enter **Adsterra zone keys** in `/admin/ads` (or Plesk env) + consent accept smoke test | 20 min | Display revenue |
| 7 | Tie **PremiumLock** to real ads (remove fake 15s timer) | 30 min | Freemium integrity — **DONE** |
| 8 | **recordUsage** on custom tools (image/PDF/text) | 45 min | Limit enforcement |
| 9 | Stub tool pages: **ComingSoon** or disable in catalog until real | 60 min | Trust / chargebacks |
| 10 | Admin **analytics** page (GA4 embed or key metrics) | 90 min | Ops |
| 11 | Dedicated **refund policy** page | 30 min | Legal |
| 12 | Stripe re-enable (optional) | 2 h | Second payment rail |

---

## Cycle 1 deliverables (2026-06-24 morning)

- [x] This plan document
- [x] Admin billing UI + API (uncommitted → committed)
- [x] AdSlot re-render when `/api/ads/config` returns DB keys
- [x] Theme A — Ad & attention (real vignette locks, download gates, processing/success ad slots)
- [x] `npm test` pass
- [x] Commit + push
- [ ] `npm run site:check:prod`

---

## What to review at 10:00

1. **Ads:** Sign in as admin → `/admin/ads` → confirm zone keys saved → incognito + accept cookies → verify live ad iframes on a tool page (not just placeholders). Check `https://tamir.li/ads.txt` still needs real Adsterra line if placeholder.
2. **Billing:** `/admin/billing` — MRR, active subs, recent payments visible after a test PayPal subscription; confirm `PAYPAL_PLAN_*` env on Plesk matches ₪19.90 / yearly pricing.
3. **Freemium:** Free user — 5 conversions then limit message; premium user — no ads, unlimited (on generic tool flow). Note custom tools still skip limits until item #8.
4. **Production health:** `https://tamir.li/health` — `db.ok`, `migrations.ok`, `adSettingsTable.ok`; run `npm run site:check:prod` locally for full probe log.
5. **Revenue path smoke test:** Google sign-in → Premium → PayPal sandbox/live approval → return URL → `GET /api/billing/status` shows `isPremium: true` → ads hidden.
