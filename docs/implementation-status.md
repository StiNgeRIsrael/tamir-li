# Implementation status — tamir.li

Code-level audit of what is **fully implemented**, **partial**, **stubbed**, or **missing**. Cross-checked against `tools-data.ts`, `ToolPage.tsx`, backend routes, and live probes (2026-06-24).

For **deployment / production routing**, see [production-readiness.md](./production-readiness.md) (note: live `/health` and `/api/*` now return JSON as of 2026-06-24 — earlier static-layer audit was fixed).  
For **tool catalog, SEO slugs, and API reference**, see [tools-and-features.md](./tools-and-features.md).  
For **monetization launch checklist**, see [monetization-readiness-plan.md](./monetization-readiness-plan.md).

---

## Launch checklist (revenue / go-live)

Operational gates — not all are code-complete; several need Plesk/env or a manual smoke test.

| Item | Status | Notes |
|------|--------|-------|
| [ ] **ads.txt** | **MISSING** | `public/ads.txt` is placeholder comments only; live `https://tamir.li/ads.txt` matches. Paste Adsterra publisher line before network approval. |
| [ ] **PayPal env** | **PARTIAL** | Routes live when API reachable. Plesk needs `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY`, `PAYPAL_MODE`; verify plan IDs match ₪19.90/mo pricing. |
| [ ] **Usage limit enforcement** | **PARTIAL** | Server enforces 5/day on `/api/usage/record` and conversion enqueue. Subscribers skip locks. **Non-subscribers** can still bypass premium/daily locks via 15s fake-ad timer (`premiumUnlocked` / `usageUnlocked`). localStorage fallback when API fails. |
| [x] **Tool grid** | **DONE** | Homepage + nav show all catalog tools; non-functional ones get SOON badge (`tool-availability.ts`). 9/13 tools marked functional. |
| [x] **Sitemap** | **DONE** | `prebuild` → `scripts/generate-sitemap.ts`; ~854 URLs (122 base × 7 locales). |
| [ ] **Consent + ads** | **PARTIAL** | Consent gating complete. Display ads need Adsterra zone keys in `/admin/ads` or `VITE_ADSTERRA_ZONE_*`; popunder/native optional. |
| [ ] **Premium checkout E2E** | **PARTIAL** | Code path: Google sign-in → `/premium` → PayPal → return → `GET /api/billing/status`. Needs one live/sandbox subscription test after PayPal env + webhook registered. |

Quick prod probe (2026-06-24): `GET https://tamir.li/health` → JSON `db.ok`, `migrations.state: success`; `GET /api/usage/today` → JSON usage snapshot.

---

## Summary stats

| Status | Count | Meaning |
|--------|------:|---------|
| ✅ LIVE | **28** | Wired end-to-end when env + DB configured |
| 🟡 PARTIAL | **19** | Incomplete, env-gated, bypassable, or stub output on some paths |
| ❌ STUB | **8** | UI/route exists; no real file transformation |
| 🔜 MISSING | **7** | Planned or schema-only; no application code |

*Counts are feature rows in the tables below.*

### Tools (13 catalog entries)

| Status | Tool IDs |
|--------|----------|
| ✅ LIVE (9) | `image-converter`, `image-compressor`, `image-resizer`, `svg-to-png`, `png-to-ico`, `merge-pdf`, `text-tools`, `word-to-pdf`, `audio-converter` |
| 🟡 PARTIAL (1) | `ai-image-generator` — real API when Google key set in admin; disabled/503 otherwise |
| ❌ STUB (3) | `video-converter`, `video-compressor`, `pdf-to-word` — SEO pages + mock or server passthrough |
| WIP (not in catalog) | `heb-ocr` component exists; no `tools-data` entry, no `/api/ocr` |

---

## What works end-to-end today

| Scenario | Works | Notes |
|----------|-------|-------|
| **Local dev** (`npm run dev:all` + MySQL + `backend/.env`) | Auth, usage, billing, admin, conversions queue, AI (if key set) | Mock mode default for non-client generic tools (`allowMockFileConversion()`) |
| **Production monolith** (2026-06-24) | API JSON, DB, migrations, usage API | `/health` confirms `db.ok`, `adSettingsTable.ok`, `aiSettingsTable.ok` |
| **Client-side real output** | Image convert/compress/resize, SVG→PNG, PNG→ICO, Word→PDF, PDF manager, text tools | Canvas / pdf-lib / mammoth+jspdf in browser |
| **Server-side real output** | Audio converter only | `POST /api/conversions` → queue → ffmpeg (`conversion-worker.ts`); without ffmpeg on host → passthrough stub |
| **Server-side stub output** | Video, PDF→Word (if enqueued) | Worker copies input bytes or writes placeholder text — **not** real transcode |

---

## LIVE

### Frontend — tools

| Tool / area | Notes | Key files |
|-------------|-------|-----------|
| Image format converter (`image-converter`, ~42 slugs) | Client canvas; `recordUsage` on success; TIFF input only (no TIFF output) | `src/lib/image-convert.ts`, `ToolPage.tsx` |
| SVG → PNG, PNG → ICO | Client canvas via `usesClientImageConversion` | `image-convert.ts`, `tool-availability.ts` |
| Image compressor / resizer | Custom components; `onCustomToolSuccess` → vignette + `recordUsage` | `ImageCompressorTool.tsx`, `ImageResizerTool.tsx`, `custom-tool-freemium.ts` |
| Word → PDF | Client `convertWordFileToPdf`; DOC legacy rejected | `word-to-pdf.ts`, `ToolPage.tsx` |
| PDF manager (`merge-pdf`) | pdf-lib merge/reorder/rotate; usage recorded | `PdfManagerTool.tsx` |
| Text tools | TXT ↔ MD ↔ HTML; usage recorded | `TextToolsComponent.tsx` |
| Audio converter | Server queue + ffmpeg when available | `useConversionJob.ts`, `conversion-worker.ts` |
| SOON / functional badges | 9 functional IDs; direct URL to stub tool shows `ComingSoonPanel` | `tool-availability.ts`, `ComingSoonPanel.tsx` |

### Frontend — platform

| Feature | Notes | Key files |
|---------|-------|-----------|
| Google login (GIS → JWT) | End-to-end when API + client IDs match | `GoogleLoginButton.tsx`, `auth.routes.ts` |
| Auth session restore | `GET /api/auth/me`; clears invalid/blocked tokens | `AuthContext.tsx` |
| Premium checkout (PayPal) | Checkout, capture, portal, webhooks | `PremiumPage.tsx`, `billing.routes.ts` |
| AI credit packs UI | Checkout for `credits_*` plans | `PremiumCredits.tsx` |
| Download ad gate (2-step) | Vignette or `VITE_AD_CLICK_URL`; skipped for premium | `download-gate.ts` |
| Cookie consent | Gates analytics + ads | `consent.ts`, `CookieConsent.tsx` |
| i18n (7 locales) | Hebrew default (no `/he` prefix); RTL for `he` | `i18n.tsx`, `translations/*.ts` |
| SEO (`SEOHead`, hreflang, OG, JSON-LD) | Per-page metadata; tool FAQ blocks; home `@graph` with SearchAction + SiteNavigationElement; favicons in `public/` | `SEOHead.tsx`, `home-json-ld.ts`, `ToolSeoBlocks.tsx` |
| Sitemap generation | Every build | `generate-sitemap.ts`, `sitemap-paths.ts` |
| Admin UI | Overview, users, tools, ads, billing, AI settings | `pages/admin/*`, `AdminGuard.tsx` |
| PWA + theme + static pages | install, privacy, terms, about, contact | `vite.config.ts`, `pages/*` |
| Homepage tool grid | Search, categories, SOON badges, featured functional order | `Index.tsx` |

### Backend — routes

| Route | Notes | Key files |
|-------|-------|-----------|
| `GET /health` | DB ping, migration status, ad/AI table probes | `app.ts` |
| `POST /api/auth/google`, `GET /api/auth/me` | Google verify, JWT, `ADMIN_EMAILS` grant | `auth.routes.ts` |
| `GET /api/usage/today`, `POST /api/usage/record` | 5/day free; `tamir_sid` cookie for anonymous | `usage.routes.ts`, `usage-shared.ts` |
| `POST /api/conversions` | **202 enqueue** (not 501); usage checked at enqueue | `conversions.routes.ts` |
| `GET /api/conversions/:id`, `GET .../file` | Job poll + download | `conversions.routes.ts` |
| `GET /api/tools/config` | Public enabled/featured/sort | `tools.routes.ts` |
| `GET /api/ads/config` | Cached; DB overrides env zone keys | `ads.routes.ts` |
| Billing (PayPal) | checkout, capture, status, portal, webhook | `billing.routes.ts` |
| `POST /api/ai/generate-image` | Google Gemini/Imagen; credit deduct/refund | `ai.routes.ts`, `ai-generation.ts` |
| Admin CRUD | stats, users, tools, ads settings, billing tables, AI settings/logs | `admin.routes.ts` |
| Conversion worker | In-process poll; ffmpeg for audio; cleanup | `conversion-worker.ts`, `conversion-cleanup.ts` |

### Prisma models in use

| Model | Usage |
|-------|-------|
| `User`, `Profile`, `UserRole` | Auth, admin |
| `ToolConfig` | Public config + admin |
| `Subscription`, `AiCredit` | Billing + premium + AI credits |
| `UsageLog` | `/api/usage/record` + conversion enqueue |
| `ConversionJob` | Written on enqueue; worker updates; admin stats |
| `AdSettings` | Runtime ad zone config |
| `AiSettings`, `AiGenerationLog` | AI enable/key/model + audit log |
| `Payment` | Written on PayPal/Stripe events; readable in admin billing |

---

## PARTIAL

| Area | Gap | Key files |
|------|-----|-----------|
| **Usage limits (frontend)** | localStorage fallback when API unreachable; bypassable | `useUsage.ts` |
| **Premium / daily locks** | `PremiumLock` / `DailyLimitLock` skip for `isPremium` subscribers, but non-subscribers unlock via **15s fake ad timer** (`premiumUnlocked`, `usageUnlocked`) — not a real ad view | `PremiumComponents.tsx`, `ToolPage.tsx` |
| **Premium subscription → tool access** | `showPremiumToolLock` uses `isSubPremium`, not combined `isPremium` from usage API alone — correct for billing, but fake timer still bypasses for free users | `ToolPage.tsx` |
| **Adsterra display** | Full iframe/consent/placement code; needs zone keys (admin DB or env) | `adsterra.ts`, `AdSlot.tsx`, `AdminAds.tsx` |
| **Popunder / native ads** | Wired; needs script URLs in admin | `adsterra.ts`, `AdNativeSlot.tsx` |
| **Analytics** | Consent-gated; needs `VITE_GTM_ID` or `VITE_GA4_ID` (not both) | `analytics/events.ts` |
| **Blog** | 22 Hebrew articles; UI translated; content Hebrew-only | `blog-data.ts` |
| **Tool enable/disable (public)** | Falls back to all enabled if API unavailable | `ToolConfigContext.tsx` |
| **AI image generator** | Real when `AiSettings.enabled` + Google API key in admin; otherwise 503; premium + credits required | `AiImageGeneratorTool.tsx`, `ai-generation.ts` |
| **Audio converter (server)** | Passthrough stub if ffmpeg missing on host (`FFMPEG_PATH`) | `conversion-worker.ts` |
| **POST /api/conversions (non-audio)** | Enqueues and completes, but worker uses **stub passthrough** — wrong extension, no transcode | `conversion-worker.ts` |
| **Stripe** | Webhook only when `ENABLE_STRIPE=true`; no Stripe checkout routes in app | `billing-stripe.routes.ts` |
| **Payment model** | Written; surfaced in admin billing — not yet in user-facing history | `admin.routes.ts` |
| **UsageLog metadata** | `fileSizeBytes` / `processingTimeMs` rarely populated | `usage.routes.ts` |
| **PayPal production** | Code complete; env + webhook URL + live plan ID verification pending | Plesk env |
| **Mock mode (dev)** | Generic tools fake progress; prod without mock hits server stub for video/PDF-word | `feature-flags.ts` |

---

## STUB

| Area | Behavior | Key files |
|------|----------|-----------|
| **Video converter** | Mock in dev; server passthrough in prod; premium lock + ComingSoon on direct URL | `ToolPage.tsx`, `conversion-worker.ts` |
| **Video compressor** | `customComponent: "video-compressor"` but **no component** — generic flow; same stub server behavior | `tools-data.ts`, `ToolPage.tsx` |
| **PDF → Word** | Mock in dev; not in `FUNCTIONAL_TOOL_IDS`; server stub if enqueued | `ToolPage.tsx` |
| **Hebrew OCR** | Simulated progress; download is toast; not in catalog | `HebOcrTool.tsx` |
| **PremiumLock ad surface** | Placeholder “ad playing” UI — no real Adsterra unit in the lock modal | `PremiumComponents.tsx` |
| **Server worker (non-audio)** | `runStubConversion` copies input or writes text placeholder | `conversion-worker.ts` |
| **Generic mock mode** | Re-exports **unchanged** file bytes with new extension | `ToolPage.tsx`, `download-gate.ts` |

---

## MISSING

| Area | Notes |
|------|-------|
| **Real ads.txt line** | Adsterra publisher record not pasted |
| **Video transcode / compress** | No ffmpeg video handlers in worker |
| **PDF → Word engine** | No LibreOffice/CloudConvert/etc. integration |
| **Dedicated video compressor UI** | `VideoCompressorTool` not implemented |
| **`POST /api/ocr`** | Referenced only in `HebOcrTool` comments |
| **Email/password auth** | `passwordHash` in schema; always `null` |
| **Admin analytics dashboard** | GTM/GA4 events exist; no admin metrics page |
| **Stripe checkout flow** | Optional second rail not built |
| **Dedicated `/refund` page** | Copy only in Premium FAQ / terms |

---

## P0 blockers (revenue / launch)

Ranked by impact on ads + subscriptions + trust:

| # | Blocker | Why P0 |
|---|---------|--------|
| 1 | **ads.txt placeholder** | Ad network may not approve or fill without authorized sellers line |
| 2 | **Adsterra zone keys not verified live** | No display revenue until keys in admin/env + consent smoke test |
| 3 | **PayPal env + live E2E subscription test** | Subscription revenue blocked until Plesk secrets, webhook `https://tamir.li/api/billing/paypal/webhook`, and one real checkout |
| 4 | **Freemium lock bypass (fake 15s timer)** | Free users unlock premium tools and daily limit without paying — undermines subscription value |
| 5 | **Stub tool pages indexed (video, pdf-to-word)** | SEO traffic hits non-functional converters → trust/chargeback risk; use ComingSoon/disable or ship engines |
| 6 | **Video / PDF-word server passthrough** | Users who bypass ComingSoon get wrong output — worse than honest “not ready” |
| 7 | **localStorage usage fallback** | When API fails, limits are client-only (acceptable UX, weak abuse resistance) |
| 8 | **AI generator requires admin Google key** | Premium AI feature dead until `/admin/ai` configured |
| 9 | **ffmpeg on Plesk for audio** | Without it, audio “converts” via passthrough stub |
| 10 | **PremiumLock shows fake ad, not real Adsterra** | Paywall UX does not monetize via ads on the lock itself |

*Production API routing (formerly P0 #1) appears **resolved** as of 2026-06-24 — re-run `npm run site:check:prod` after each deploy.*

---

## Frontend — API client usage

| Endpoint | Called from SPA? | Server status |
|----------|------------------|---------------|
| `GET /health` | Probe / site-check | ✅ LIVE |
| `POST /api/auth/google` | Yes | ✅ LIVE |
| `GET /api/auth/me` | Yes | ✅ LIVE |
| `GET /api/usage/today` | Yes | ✅ LIVE |
| `POST /api/usage/record` | Yes (generic success + custom tools via `onCustomToolSuccess`) | ✅ LIVE |
| `GET /api/billing/status` | Yes | ✅ LIVE |
| `POST /api/billing/checkout` | Yes | ✅ LIVE |
| `POST /api/billing/paypal/capture-order` | Yes | ✅ LIVE |
| `POST /api/billing/portal` | Yes | ✅ LIVE |
| `GET /api/tools/config` | Yes | ✅ LIVE |
| `GET /api/ads/config` | Yes (`AdConfigProvider`) | ✅ LIVE |
| `POST /api/conversions` | Yes (generic non-client tools) | ✅ LIVE (202 enqueue) |
| `GET /api/conversions/:id` | Yes (poll) | ✅ LIVE |
| `GET /api/conversions/:id/file` | Yes (download) | ✅ LIVE |
| `POST /api/ai/generate-image` | Yes (`AiImageGeneratorTool`) | ✅ LIVE (env-gated) |
| `GET/PATCH /api/admin/*` | Yes | ✅ LIVE |
| `POST /api/billing/paypal/webhook` | PayPal → server | ✅ LIVE |
| `POST /api/billing/webhook` | Stripe → server | 🟡 If `ENABLE_STRIPE=true` |
| `POST /api/ocr` | Commented only | 🔜 MISSING |

---

## Mock mode & conversion pipeline

| Item | Behavior |
|------|----------|
| `allowMockFileConversion()` | Dev: on unless `VITE_USE_MOCK_CONVERSION=false`. Prod: off unless `VITE_USE_MOCK_CONVERSION=true` |
| Client image / Word→PDF | Always real in browser — ignores mock flag |
| Generic `ToolPage` in mock mode | Fake progress; unchanged bytes with new extension |
| Generic `ToolPage` in prod (no mock) | Client image/Word paths real; audio/video/PDF-word → API queue |
| Worker | Audio: ffmpeg. **All other tool IDs: stub passthrough** until handlers ship |

---

## Environment variables by feature

### Frontend (`VITE_*`)

| Feature | Required vars |
|---------|----------------|
| API connectivity | `VITE_API_URL` (prod monolith: same origin) |
| Google login | `VITE_GOOGLE_CLIENT_ID` |
| Mock conversions | `VITE_USE_MOCK_CONVERSION` (optional) |
| SEO / canonical | `VITE_SITE_ORIGIN` |
| Adsterra | `VITE_ADSTERRA_ZONE_*` or admin `/admin/ads` → DB |
| Download popup gate | `VITE_AD_CLICK_URL` (optional) |
| Analytics | `VITE_GTM_ID` **or** `VITE_GA4_ID` |

### Backend

| Feature | Required vars |
|---------|----------------|
| Core | `DATABASE_URL`, `JWT_SECRET` (≥16 chars), `NODE_ENV`, `PORT` |
| Google auth | `GOOGLE_CLIENT_ID` |
| Admin bootstrap | `ADMIN_EMAILS` |
| PayPal billing | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY`, `PAYPAL_MODE` |
| Audio conversion | `FFMPEG_PATH` (optional; default `ffmpeg` on PATH) |
| AI generation | Google API key via admin DB (`AiSettings`), not env in repo |
| Stripe (optional) | `ENABLE_STRIPE=true`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

---

## Doc discrepancies (fixed in this audit)

| Doc / claim | Was | Reality (2026-06-24) |
|-------------|-----|----------------------|
| `POST /api/conversions` | 501 `CONVERSION_NOT_READY` | **202 enqueue** + worker; audio real with ffmpeg |
| `AGENTS.md` | “returns 501” | Outdated — queue live; update AGENTS.md separately |
| Audio in tools-and-features | “Mock” | **Server queue** when not in dev mock mode |
| Image converter in tools-and-features | “Mock (generic ToolPage)” | **Client real** via canvas |
| svg/png-to-ico | Stub | **Client real** |
| word-to-pdf | Stub | **Client real** |
| AI generator | Hardcoded credits / fake 3s | **`useSubscription` + `/api/ai/generate-image`** |
| Custom tools skip `recordUsage` | Yes | **No** — `onCustomToolSuccess` records usage |
| Production API | SPA HTML for `/api/*` | **JSON** — Node monolith reachable |
| Blog count in tools-and-features | 21 posts in one line | **22** posts in `blogArticles` |

---

## Related files

| Concern | Path |
|---------|------|
| Agent quick start | [AGENTS.md](../AGENTS.md) |
| Tool catalog & API table | [tools-and-features.md](./tools-and-features.md) |
| Deploy / prod probes | [production-readiness.md](./production-readiness.md) |
| Monetization plan | [monetization-readiness-plan.md](./monetization-readiness-plan.md) |
| Functional tool list | `src/lib/tool-availability.ts` |
| Feature flags | `src/lib/feature-flags.ts` |
| Backend entry | `backend/src/app.ts` |
