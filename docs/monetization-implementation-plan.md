# Monetization implementation plan — tamir.li

Site-wide checklist for **ad revenue, freemium psychology, premium checkout, SEO funnel, analytics, and enforcement**.  
Audit date: **2026-06-24**. Complements [`monetization-readiness-plan.md`](./monetization-readiness-plan.md) (ops/launch readiness).

Status key: **DONE** / **PARTIAL** / **MISSING** · Priority: **P0** (revenue/leak) → **P3** (polish).

**Autonomous loop:** `.cursor/loops/monetize-loop.pid` · sentinel `AGENT_LOOP_WAKE_MONETIZE` · heartbeat **30m** · prompt targets highest **P0/P1 MISSING** item below.

---

## Blockers (user action — document only)

| Blocker | Status | Action |
|---------|--------|--------|
| `public/ads.txt` | **MISSING** | Paste real Adsterra line from dashboard (`adsterra.com, PUBLISHER_ID, DIRECT`). See [`adsterra-setup.md`](./adsterra-setup.md). |
| PayPal live plans | **PARTIAL** | Verify `PAYPAL_PLAN_MONTHLY` / `PAYPAL_PLAN_YEARLY` on Plesk match ₪19.90/mo + yearly; register webhook `https://tamir.li/api/billing/paypal/webhook`. See [`paypal-setup.md`](./paypal-setup.md). |
| ffmpeg on Plesk | **PARTIAL** | Required for audio/video server queue; without it queued jobs fail. See [`plesk-node-deploy.md`](./plesk-node-deploy.md). |
| AI image API key | **MISSING** | Premium AI tool is UI-only until provider key + credits backend wired. Document env in `.env.example` when added. |

---

## A. Ad & attention

| # | Item | Status | Priority | Files / notes |
|---|------|--------|----------|---------------|
| A1 | Download gate (2-step: ad → download) on **generic** `ToolPage` | **DONE** | — | `src/lib/ads/download-gate.ts`, `src/pages/ToolPage.tsx`, `DownloadGateIndicator.tsx` |
| A2 | Download gate on **custom tools** (compressor, resizer, PDF, text) | **DONE** | — | `src/lib/custom-tool-freemium.ts` → `runGatedDownload` |
| A3 | Download gate on **remaining custom tools** (OCR, AI gen, video, audio…) | **PARTIAL** → **DONE** (OCR, AI) | **P1** | `HebOcrTool.tsx`, `AiImageGeneratorTool.tsx` use `runGatedDownload`; video/audio tools still direct download |
| A4 | Ads on **converting / wait / success** states (`eager`) | **DONE** | — | `ToolPage.tsx` + custom tools (compressor, resizer, PDF, OCR, AI gen) |
| A5 | **Sticky** desktop ad rails (2× sidebar) | **DONE** | — | `src/components/ads/DesktopAdRail.tsx` (`sticky top-[3.75rem]`), `AppLayout.tsx` |
| A6 | Popunder script (optional env / admin) | **PARTIAL** → **DONE** (consent) | **P2** | `VITE_ADSTERRA_POPUNDER_SCRIPT_URL` loads only after ads cookie consent; documented in `.env.example` |
| A7 | `PremiumLock` → **real Adsterra** (remove 15s fake timer) | **DONE** | — | `AdGateLock` + `requireAdViewForUnlock` in `PremiumComponents.tsx` |
| A8 | `DailyLimitLock` → **real Adsterra** (remove 15s fake timer) | **DONE** | — | Same `AdGateLock` pattern |
| A9 | Premium users skip all ad components | **DONE** | — | `setPremiumUser` in `useSubscription` → `adsterra.ts` |
| A10 | Cookie consent before ads/analytics | **DONE** | — | `src/lib/ads/consent.ts` |
| A11 | Interstitial on conversion milestones | **PARTIAL** | **P2** | `AdSlot.tsx` `triggerInterstitial` — used in `HebOcrTool.tsx` only |

---

## B. Freemium psychology

| # | Item | Status | Priority | Files / notes |
|---|------|--------|----------|---------------|
| B1 | Daily usage bar + “almost done” urgency (≤2 left) | **DONE** | — | `UsageLimitNotice`, `ConversionSuccessUsage` in `PremiumComponents.tsx` |
| B2 | Paywall analytics on limit / premium tool | **DONE** | — | `ToolPage.tsx` → `PAYWALL_HIT` |
| B3 | **File size enforcement** 50 MB free / 200 MB premium | **MISSING** | **P0** | Copy in `translations/*.ts` + FAQ; **no client reject** in `FileDropZone` / `ToolPage`; server multer `200MB` for all in `conversions.routes.ts` |
| B4 | **Batch limit** — 1 file free, multi-file premium | **MISSING** | **P1** | `FileDropZone.tsx` defaults `maxFiles=10`, `multiple=true`; no `isPremium` gating |
| B5 | Speed / priority queue **messaging** during wait | **PARTIAL** | **P2** | Marketing: `upgradePage.features` “Skip the queue”; runtime shows `queuePending` only — no premium upsell banner while converting |
| B6 | File-size reject toast + upgrade CTA | **MISSING** | **P1** | New helper + `trackEvent` `paywall_hit` type `file_size` |
| B7 | Anchor pricing (₪150 → ₪19.90) all locales | **DONE** | — | `upgradePage.anchorPrice*` in translations |
| B8 | Custom tools record usage after success | **DONE** | — | `onCustomToolSuccess` in `custom-tool-freemium.ts` |

---

## C. Premium & checkout

| # | Item | Status | Priority | Files / notes |
|---|------|--------|----------|---------------|
| C1 | **Annual plan default** on `/premium` | **DONE** | — | `PremiumPage.tsx` `useState(true)` for `isYearly` |
| C2 | **Exit-intent modal** (mouse leave / back) | **MISSING** | **P1** | No component; add on `PremiumPage` + optionally `ToolPage` at paywall |
| C3 | Comparison table (free vs premium) | **DONE** | — | `PremiumPage.tsx` + `upgradePage.comparisonRows` (7 locales) |
| C4 | Comparison table **enhancements** (highlight row, sticky CTA, social proof) | **PARTIAL** | **P2** | Table exists; no row highlight / mobile sticky checkout bar |
| C5 | Checkout requires Google sign-in | **DONE** | — | `PremiumPage.tsx` `startCheckout` |
| C6 | `upgrade_click` event | **DONE** | — | `PremiumPage.tsx` |
| C7 | `begin_checkout` + ecommerce params | **DONE** | — | `getPlanEcommerceParams` in `src/lib/analytics/purchase.ts` |
| C8 | `purchase` on PayPal return | **DONE** | — | `PremiumPage.tsx` + `purchase.ts` |
| C9 | Credit-pack checkout events | **PARTIAL** | **P2** | Purchase fires on return; `begin_checkout` may omit credit SKUs on AI page |
| C10 | Premium CTAs site-wide (`PremiumBanner`, sidebar) | **DONE** | — | `PremiumComponents.tsx`, `ToolsSidebar` `sidebarNoAds` |

---

## D. SEO funnel

| # | Item | Status | Priority | Files / notes |
|---|------|--------|----------|---------------|
| D1 | Tool page **free vs premium** tier table | **MISSING** | **P1** | `ToolSeoBlocks.tsx` shows **format** comparison only; add tier table (50MB/5 day vs 200MB/unlimited) on top tools |
| D2 | Related tools (internal links) | **DONE** | — | `ToolPage.tsx` `getRelatedTools` → sidebar + mobile section |
| D3 | Category / grid internal links | **DONE** | — | Home + `ToolsSidebar` category nav |
| D4 | Tool JSON-LD + FAQ | **DONE** | — | `ToolSeoBlocks.tsx`, `toolFaqJsonLd` |
| D5 | Premium mention in tool long descriptions | **PARTIAL** | **P3** | Some tools in `toolLongDescriptions`; not consistent |
| D6 | hreflang + sitemap | **DONE** | — | `SEOHead`, `generate-sitemap.ts` |

---

## E. Analytics

| # | Item | Status | Priority | Files / notes |
|---|------|--------|----------|---------------|
| E1 | GA4 **Consent Mode v2** defaults + update | **DONE** | — | `index.html`, `src/lib/analytics/gtm.ts`, `consent.ts` |
| E2 | Direct GA4 boot (`VITE_GA4_ID`) — no GTM double-count | **DONE** | — | `gtm.ts` `bootAnalytics()` |
| E3 | SPA `page_view` on route change | **DONE** | — | `AnalyticsPageTracker.tsx` |
| E4 | Full **event map** documented | **DONE** | — | `docs/google-analytics-setup.md` § Event inventory |
| E5 | `trackEvent` on core funnel | **PARTIAL** | **P1** | Covered: tool, convert, download, paywall, checkout, auth, AI. **Gaps:** file-size reject, exit-intent, batch-limit hit, `select_content` on related-tool clicks |
| E6 | `user_id` after sign-in | **DONE** | — | `AuthContext.tsx` → `setAnalyticsUserId` |
| E7 | Unit tests for consent-gated tracking | **DONE** | — | `src/lib/analytics/events.test.ts` |
| E8 | Admin analytics dashboard | **MISSING** | **P3** | No `/admin/analytics`; GA4 UI only |

---

## F. Enforcement

| # | Item | Status | Priority | Files / notes |
|---|------|--------|----------|---------------|
| F1 | Server usage API (`GET /today`, `POST /record`) | **DONE** | — | `backend/src/routes/usage.routes.ts`, `usage-shared.ts` |
| F2 | **localStorage fallback** bypasses server when API fails / no API | **MISSING** | **P0** | `src/hooks/useUsage.ts` — `readLocalUsage` / `writeLocalUsage` on error or `!api` |
| F3 | `premiumUnlocked` client bypass (fake ad watch) | **MISSING** | **P0** | `ToolPage.tsx` L107–111, L719 — unlocks premium tools without subscription |
| F4 | `usageUnlocked` client bypass (fake ad watch) | **MISSING** | **P0** | `ToolPage.tsx` L107–111, L721 — grants conversions past daily limit |
| F5 | Server rejects over-limit `POST /record` (429) | **DONE** | — | `usage.routes.ts` |
| F6 | Conversion queue checks limit before enqueue | **DONE** | — | `checkLimitAndRecordUsage` in worker path |
| F7 | Premium tool lock should use `isSubPremium` only | **PARTIAL** | **P0** | Gated by `showPremiumToolLock` but bypassable via F3 |
| F8 | File size enforced server-side per tier | **MISSING** | **P1** | `conversions.routes.ts` — single 200MB limit |

---

## G. User blockers (document only)

See **Blockers** table at top. No code changes until credentials supplied.

---

## Execution queue (loop picks highest open P0 → P1)

| Order | ID | Task | Est. |
|-------|-----|------|------|
| 1 | F3+F4+F7+A7+A8 | Remove `premiumUnlocked` / `usageUnlocked`; wire locks to real Adsterra vignette **without** granting bypass; subscribers use `isPremium` only | 2 h |
| 2 | F2 | Server-only usage: drop localStorage increment; show “connect to continue” when API unavailable | 1 h |
| 3 | B3+F8 | Enforce 50 MB / 200 MB on upload (client + server) + `paywall_hit` `file_size` | 1.5 h |
| 4 | B4 | Free tier `maxFiles=1`; premium `maxFiles=10` in `FileDropZone` / `ToolPage` | 45 m |
| 5 | A3 | Extend `runGatedDownload` to OCR, AI, video tools | 1 h |
| 6 | C2 | Exit-intent modal on `/premium` | 1 h |
| 7 | D1 | Free vs premium table in `ToolSeoBlocks` (top tools, 7 locales) | 1.5 h |
| 8 | B5 | Priority-queue upsell banner while `isProcessing` for free users | 45 m |
| 9 | E5 | Close analytics gaps (`file_size`, `batch_limit`, `exit_intent`, related-tool `select_content`) | 45 m |
| 10 | A6 | Paste popunder URL in admin + smoke test | 15 m (user) |
| 11 | G | Paste `ads.txt`, verify PayPal, ffmpeg, AI key | user |

---

## Progress log (loop updates)

- [x] **2026-06-24** — Plan created (`docs/monetization-implementation-plan.md`); dynamic loop armed (30m heartbeat).
- [x] **2026-06-24** — Home tool icon grid: readable labels on pastel cards, centered orphan rows, stronger soon/premium badges.
- [ ] F3/F4/F7 — client unlock bypass removal (locks show real ads but still grant session unlock)
- [ ] F2 — server-only usage
- [ ] B3 — file size enforcement
- [ ] B4 — batch limits
- [ ] A3 — download gate on video/audio custom tools
- [ ] C2 — exit-intent modal
- [ ] D1 — SEO tier table
- [ ] E5 — analytics gaps

---

## References

- [`AGENTS.md`](../AGENTS.md) — product pillars, env rules
- [`monetization-readiness-plan.md`](./monetization-readiness-plan.md) — launch readiness, admin billing, ads.txt
- [`adsterra-setup.md`](./adsterra-setup.md) — zones, consent, download gate
- [`google-analytics-setup.md`](./google-analytics-setup.md) — Consent Mode v2, event map
- [`.cursor/skills/ui-ux-pro-max/SKILL.md`](../.cursor/skills/ui-ux-pro-max/SKILL.md) — UI work
