# Implementation status — tamir.li

Code-level audit of what is **fully implemented**, **partial**, **stubbed**, or **missing**. Derived from reading routes, components, hooks, and Prisma usage (2026-06-22).

For **deployment / production routing** (static layer vs Node monolith), see [production-readiness.md](./production-readiness.md).  
For **tool catalog, SEO slugs, and API reference**, see [tools-and-features.md](./tools-and-features.md).

---

## Summary stats

| Status | Count | Meaning |
|--------|------:|---------|
| ✅ Complete | **32** | Wired end-to-end; works when required env + DB are configured |
| 🟡 Partial | **17** | Implemented but incomplete, bypassable, fallback-only, or env-gated |
| ❌ Stub | **11** | UI or route exists; no real processing |
| 🔜 Not started | **6** | Planned or schema-only; no application code |

*Counts are feature rows in the tables below, not lines of code.*

---

## What works end-to-end today

| Scenario | Works | Notes |
|----------|-------|-------|
| **Local dev** (`npm run dev:all` + MySQL + `backend/.env`) | Auth, usage, billing, admin, tool config | Generic converters use **mock mode** by default (`allowMockFileConversion()`) |
| **Local dev — real file output** | Image compress/resize, PDF manager, text tools | Custom components; no server conversion |
| **Production — static SPA only** | SEO pages, blog, sitemap, client-side custom tools, mock if `VITE_USE_MOCK_CONVERSION=true` | `/api/*` may return SPA HTML if Node is not fronting routes — see [production-readiness.md](./production-readiness.md) |
| **Production — monolith configured** | Same as local for auth/billing/usage/admin | Generic format converters still **501** unless mock flag is on |

---

## Frontend — tools

| Tool / area | Status | Notes | Key files |
|-------------|--------|-------|-----------|
| Image format converter (`image-converter`, ~42 slugs) | ✅ Complete | Client-side canvas conversion in browser; `recordUsage` on success; TIFF output not supported | `src/lib/image-convert.ts`, `src/pages/ToolPage.tsx` |
| Image compressor | ✅ Complete | Canvas `toBlob`; quality slider | `src/components/tools/ImageCompressorTool.tsx` |
| Image resizer | ✅ Complete | Canvas resize; presets | `src/components/tools/ImageResizerTool.tsx` |
| PNG → ICO | ❌ Stub | Generic mock flow | `src/pages/ToolPage.tsx` |
| SVG → PNG | ❌ Stub | Generic mock flow | `src/pages/ToolPage.tsx` |
| Video converter (premium) | ❌ Stub | Generic mock; premium gate bypassable (see Freemium) | `src/pages/ToolPage.tsx`, `src/lib/tools-data.ts` |
| Video compressor (premium) | ❌ Stub | `customComponent: "video-compressor"` but **no component** — falls through to generic mock | `src/lib/tools-data.ts`, `src/pages/ToolPage.tsx` |
| Audio converter | ✅ Complete | Server-side via ffmpeg (`POST /api/conversions` queue) | `backend/src/lib/conversion-worker.ts`, `src/pages/ToolPage.tsx` |
| PDF → Word | ❌ Stub | Generic mock | `src/pages/ToolPage.tsx` |
| Word → PDF | ❌ Stub | Generic mock | `src/pages/ToolPage.tsx` |
| PDF manager (`merge-pdf`) | ✅ Complete | pdf-lib merge/reorder/rotate; pdf.js thumbnails | `src/components/tools/PdfManagerTool.tsx` |
| Text tools | ✅ Complete | TXT ↔ MD ↔ HTML; stats | `src/components/tools/TextToolsComponent.tsx` |
| AI image generator | 🟡 Partial | Paywall UI; `isPremium` / `credits` **hardcoded** `false`/`0`; 3s fake generation, no API | `src/components/tools/AiImageGeneratorTool.tsx` |
| Hebrew OCR (`HebOcrTool`) | ❌ Stub | Simulated progress; download is toast only; **not in catalog** | `src/components/tools/HebOcrTool.tsx` |

**Custom tools bypass** generic `ToolPage` usage limits, premium locks, and `recordUsage` — only the generic conversion flow enforces freemium.

---

## Frontend — platform

| Feature / area | Status | Notes | Key files |
|----------------|--------|-------|-----------|
| Google login (GIS popup → JWT) | ✅ Complete | End-to-end when API + `VITE_GOOGLE_CLIENT_ID` + backend `GOOGLE_CLIENT_ID` | `src/components/GoogleLoginButton.tsx`, `src/contexts/AuthContext.tsx`, `backend/src/routes/auth.routes.ts` |
| Auth session restore | ✅ Complete | `GET /api/auth/me` on load; clears invalid/blocked tokens | `src/contexts/AuthContext.tsx` |
| Usage limits (5/day free) | 🟡 Partial | Server-side when API works; **localStorage fallback** when API fails; **custom tools skip limits** | `src/hooks/useUsage.ts`, `backend/src/routes/usage.routes.ts` |
| Premium subscription state | 🟡 Partial | `useSubscription` → `/api/billing/status`; drives ad hiding via `setPremiumUser` | `src/hooks/useSubscription.ts`, `src/lib/ads/adsterra.ts` |
| Premium checkout (PayPal) | ✅ Complete | Requires sign-in; redirect checkout; credit capture on return | `src/pages/PremiumPage.tsx`, `src/hooks/useSubscription.ts` |
| Premium tool lock | 🟡 Partial | `PremiumLock` is **15s fake ad timer** → `premiumUnlocked` state; **not** tied to `isPremium` subscription | `src/components/PremiumComponents.tsx`, `src/pages/ToolPage.tsx` |
| Daily limit lock | 🟡 Partial | Same `PremiumLock` bypass via `usageUnlocked` after fake ad | `src/pages/ToolPage.tsx` |
| AI credit packs UI | ✅ Complete | Checkout wired for `credits_*` plans | `src/components/PremiumCredits.tsx` |
| Adsterra display ads | 🟡 Partial | Full iframe/consent/placement code; **requires** `VITE_ADSTERRA_ZONE_*` keys | `src/lib/ads/adsterra.ts`, `src/components/AdSlot.tsx` |
| Download ad gate (2-step) | ✅ Complete | Vignette or `VITE_AD_CLICK_URL` popup; skipped for premium | `src/lib/ads/download-gate.ts` |
| Cookie consent | ✅ Complete | Gates analytics + ads; restores on boot | `src/lib/ads/consent.ts`, `src/components/CookieConsent.tsx` |
| Analytics (GTM / GA4) | 🟡 Partial | Consent-gated; events defined; needs `VITE_GTM_ID` or `VITE_GA4_ID` (not both) | `src/lib/analytics/events.ts`, `src/lib/analytics/gtm.ts` |
| i18n (7 locales) | ✅ Complete | Hebrew default (no prefix); RTL for `he` only | `src/lib/i18n.tsx`, `src/lib/translations/*.ts` |
| SEO (`SEOHead`, hreflang, OG) | ✅ Complete | Per-page metadata; tool JSON-LD | `src/components/SEOHead.tsx`, `src/components/ToolSeoBlocks.tsx` |
| Sitemap generation | ✅ Complete | `prebuild` → `scripts/generate-sitemap.ts` | `src/lib/sitemap-paths.ts`, `public/sitemap.xml` |
| Blog | 🟡 Partial | **22** Hebrew articles; UI strings translated; **content Hebrew-only** | `src/lib/blog-data.ts`, `src/pages/Blog*.tsx` |
| Admin UI | ✅ Complete | Overview, users, tools; `AdminGuard` requires `ADMIN` role + API | `src/pages/admin/*`, `src/components/admin/AdminGuard.tsx` |
| Tool enable/disable (public) | 🟡 Partial | `GET /api/tools/config`; falls back to all enabled if API unavailable | `src/contexts/ToolConfigContext.tsx` |
| PWA | ✅ Complete | `vite-plugin-pwa` + `public/manifest.json`; `/install` page | `vite.config.ts`, `src/pages/InstallPage.tsx` |
| Theme (light/dark) | ✅ Complete | `next-themes` | `src/App.tsx` |
| Static pages | ✅ Complete | premium, install, privacy, terms, about, contact | `src/pages/*Page.tsx` |

---

## Frontend — API client usage

| Endpoint | Called from frontend? | Status on server |
|----------|----------------------|------------------|
| `GET /health` | Yes (probe only) | ✅ Live |
| `POST /api/auth/google` | Yes | ✅ Live |
| `GET /api/auth/me` | Yes | ✅ Live |
| `GET /api/usage/today` | Yes | ✅ Live |
| `POST /api/usage/record` | Yes (generic `ToolPage` success only) | ✅ Live |
| `GET /api/billing/status` | Yes | ✅ Live |
| `POST /api/billing/checkout` | Yes | ✅ Live |
| `POST /api/billing/paypal/capture-order` | Yes | ✅ Live |
| `POST /api/billing/portal` | Yes | ✅ Live |
| `GET /api/tools/config` | Yes | ✅ Live |
| `POST /api/conversions` | Yes (generic tools, non-mock prod) | ❌ **501** |
| `GET /api/conversions/health` | **No** | ✅ Live (unused by SPA) |
| `GET/PATCH /api/admin/*` | Yes | ✅ Live |
| `POST /api/billing/paypal/webhook` | **No** (PayPal → server) | ✅ Live |
| `POST /api/billing/webhook` | **No** (Stripe → server) | 🟡 Stripe webhook only if `ENABLE_STRIPE=true` |
| `POST /api/ocr` | Commented in `HebOcrTool` only | 🔜 Not started |

---

## Backend — routes

| Route | Status | Notes | Key files |
|-------|--------|-------|-----------|
| `GET /health` | ✅ Complete | JSON health check | `backend/src/app.ts` |
| `POST /api/auth/google` | ✅ Complete | Google ID token verify, user upsert, JWT, `ADMIN_EMAILS` grant | `backend/src/routes/auth.routes.ts` |
| `GET /api/auth/me` | ✅ Complete | Bearer JWT; profile + roles | `backend/src/routes/auth.routes.ts` |
| `GET /api/usage/today` | ✅ Complete | Optional auth; `tamir_sid` cookie for anonymous | `backend/src/routes/usage.routes.ts` |
| `POST /api/usage/record` | ✅ Complete | Enforces 5/day for non-premium; does not validate conversion happened | `backend/src/routes/usage.routes.ts` |
| `POST /api/conversions` | ❌ Stub | Always **501** `CONVERSION_NOT_READY` | `backend/src/routes/conversions.routes.ts` |
| `GET /api/conversions/health` | ✅ Complete | Ping only | `backend/src/routes/conversions.routes.ts` |
| `GET /api/tools/config` | ✅ Complete | Public enabled/featured/sort | `backend/src/routes/tools.routes.ts` |
| `POST /api/billing/checkout` | ✅ Complete | PayPal subscription or credit order | `backend/src/routes/billing.routes.ts` |
| `POST /api/billing/paypal/capture-order` | ✅ Complete | Credit pack capture | `backend/src/routes/billing.routes.ts` |
| `GET /api/billing/status` | ✅ Complete | Premium + credits | `backend/src/routes/billing.routes.ts` |
| `POST /api/billing/portal` | ✅ Complete | PayPal manage URL | `backend/src/routes/billing.routes.ts` |
| `POST /api/billing/paypal/webhook` | ✅ Complete | Subscription lifecycle + credit capture | `backend/src/routes/billing.routes.ts` |
| `POST /api/billing/webhook` | 🟡 Partial | Stripe webhook handler only; **no Stripe checkout API routes** | `backend/src/routes/billing-stripe.routes.ts` |
| `GET /api/admin/stats` | ✅ Complete | Users, usage, top tools; reads empty `ConversionJob` table | `backend/src/routes/admin.routes.ts` |
| `GET/PATCH /api/admin/users` | ✅ Complete | Search, block, role edit (incl. `MODERATOR`) | `backend/src/routes/admin.routes.ts` |
| `GET/PATCH /api/admin/tools` | ✅ Complete | ToolConfig CRUD | `backend/src/routes/admin.routes.ts` |
| `POST /api/ocr` | 🔜 Not started | Referenced only in frontend comments | — |
| Email/password auth | 🔜 Not started | `passwordHash` in schema; always `null` | `backend/prisma/schema.prisma` |

---

## Prisma models vs usage

| Model | Status | Notes |
|-------|--------|-------|
| `User` | ✅ Used | Auth, admin |
| `Profile` | ✅ Used | Auth |
| `UserRole` | ✅ Used | `ADMIN` / `MODERATOR` / `USER`; no moderator-specific middleware |
| `ToolConfig` | ✅ Used | Public config + admin |
| `Subscription` | ✅ Used | Billing + premium checks |
| `Payment` | 🟡 Partial | Written on PayPal/Stripe payments; **never read** in routes |
| `AiCredit` | ✅ Used | Balance in billing status; grant/reset on subscription |
| `UsageLog` | 🟡 Partial | Created on `/api/usage/record`; `fileSizeBytes` / `processingTimeMs` **never set** |
| `ConversionJob` | 🔜 Not started | Schema + admin stats `groupBy` only; **no writes** anywhere |

---

## Mock mode & conversion pipeline

| Item | Behavior |
|------|----------|
| `allowMockFileConversion()` | **Dev:** on unless `VITE_USE_MOCK_CONVERSION=false`. **Prod:** off unless `VITE_USE_MOCK_CONVERSION=true` |
| Generic `ToolPage` in mock mode | Fake progress bar; download re-exports **unchanged** file bytes with new extension (except `image-converter`, which always uses real client-side conversion) |
| Generic `ToolPage` in prod (no mock) | `image-converter`: client-side canvas; other generic tools: `POST /api/conversions` → 501 toast |
| Workers / queue / storage | 🔜 Not started — `ConversionJob` schema ready; heavy formats (video, documents) planned for server queue |
| SOON UI | Non-functional tools grayed out on homepage/menus with **SOON** badge; direct URL shows `ComingSoonPanel` | `src/lib/tool-availability.ts`, `src/components/ToolSoonBadge.tsx` |

---

## Environment variables by feature

### Frontend (`VITE_*`)

| Feature | Required vars |
|---------|----------------|
| API connectivity | `VITE_API_URL` (prod monolith: same origin; dev: `http://localhost:5000`) |
| Google login | `VITE_GOOGLE_CLIENT_ID` |
| Mock conversions | `VITE_USE_MOCK_CONVERSION` (optional; see above) |
| SEO / canonical | `VITE_SITE_ORIGIN` |
| Adsterra | `VITE_ADSTERRA_ZONE_BANNER`, `_SIDEBAR`, `_SIDEBAR_2`, `_INLINE`, optional `_POPUNDER_SCRIPT_URL`, `_INVOKE_HOST` |
| Download popup gate | `VITE_AD_CLICK_URL` (optional) |
| Analytics | `VITE_GTM_ID` **or** `VITE_GA4_ID` (not both) |
| Stripe (if ever enabled) | `VITE_STRIPE_PUBLISHABLE_KEY` — **no checkout flow in app today** |

### Backend

| Feature | Required vars |
|---------|----------------|
| Core | `DATABASE_URL`, `JWT_SECRET` (≥16 chars), `NODE_ENV`, `PORT` |
| Google auth | `GOOGLE_CLIENT_ID` (must match frontend) |
| CORS (split dev) | `CORS_ORIGIN` |
| Admin bootstrap | `ADMIN_EMAILS` |
| PayPal billing | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY`, `PAYPAL_MODE` |
| Stripe (optional) | `ENABLE_STRIPE=true`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs in `.env.example` |
| Documented but unused | `OPENAI_API_KEY`, `RESEND_API_KEY` in `backend/.env.example` — **no code references** |

---

## Doc discrepancies (fixed or noted)

| Doc | Was | Reality |
|-----|-----|---------|
| [tools-and-features.md](./tools-and-features.md) blog count | 21 posts | **22** posts in `blogArticles` |
| [tools-and-features.md](./tools-and-features.md) indexed URLs | 847 (`121 × 7`) | **854** (`122 × 7`) with 22 blog posts |
| [production-readiness.md](./production-readiness.md) | Lists Hebrew OCR as client-side real tool | **Simulated stub**; not in catalog |
| Stripe checkout | Sometimes implied as alternate live path | **Webhook-only**; no Stripe checkout routes or frontend flow |

---

## Top gaps to prioritize

1. **P0 — Production API routing** — Without Node monolith fronting `/api/*`, auth, billing, usage, and admin are unreachable in prod ([production-readiness.md](./production-readiness.md)).
2. **P1 — Conversion pipeline** — Implement `POST /api/conversions` (upload, queue, workers) or expand client-side real converters for high-traffic slugs.
3. **P1 — Freemium enforcement** — Wire `PremiumLock` to `useSubscription().isPremium`; apply usage limits + `recordUsage` to **custom tools**; remove client-only bypass (`premiumUnlocked` / `usageUnlocked` after fake ad).
4. **P2 — AI image generator** — Connect to `useSubscription` credits; backend generation endpoint; deduct `AiCredit.balance`.
5. **P2 — Video compressor** — Add `VideoCompressorTool` or remove misleading `customComponent`.
6. **P3 — Hebrew OCR** — Add catalog entry + `POST /api/ocr` (or worker) if product priority.
7. **P3 — `ConversionJob` model** — Use when building async conversion pipeline; or remove from admin stats until then.

---

## Related files

| Concern | Path |
|---------|------|
| Agent quick start | [AGENTS.md](../AGENTS.md) |
| Tool catalog & API table | [tools-and-features.md](./tools-and-features.md) |
| Deploy / prod probes | [production-readiness.md](./production-readiness.md) |
| Feature flags | `src/lib/feature-flags.ts` |
| Backend entry | `backend/src/app.ts` |
