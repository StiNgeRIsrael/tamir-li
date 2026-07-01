# AGENTS.md — tamir.li conversion hub

Guide for AI coding agents and new contributors. Read this before making changes.

For the full product narrative (users, roadmap, monetization detail), see [docs/product-vision.md](docs/product-vision.md).

---

## Goal

Build a **production-grade, profitable** Hebrew-first file conversion hub where:

1. Users **find** tools via search (SEO) and **complete** conversions in the browser — drag a file, pick a format, download. No desktop software.
2. The site **converts traffic into revenue** through ads (free tier) and premium subscriptions, without breaking trust, consent, or conversion UX.
3. Server load stays **light** — heavy work is queued (`POST /api/conversions` → 202 + poll), not run synchronously on the web process. See [docs/conversion-queue.md](docs/conversion-queue.md).
4. The product **feels whole** — functional tools, honest coming-soon states, clear limits, working billing, and continuous improvement via `npm run site:check` ([docs/autonomous-testing.md](docs/autonomous-testing.md)).

**Success looks like:** SEO visitors land on `{from}-to-{to}` pages, convert reliably, hit clear free limits or upgrade paths, and the stack stays maintainable on a single Plesk Node.js host behind Cloudflare DNS.

---

## Purpose

**tamir.li** (תמיר לי) exists to give people a **fast, trustworthy, localized** way to convert files online — especially Israeli users in Hebrew (RTL, default locale), with the same tools available globally via `/en`, `/es`, `/ru`, `/de`, `/fr`, `/it`.

We are a **lightweight alternative** to bloated desktop converters and ad-heavy aggregator sites: PWA-installable, mobile-friendly, and honest about what works today vs. what is coming soon (`tool-availability.ts`, `ComingSoonPanel`).

**What we are not:** a generic file-hosting service, a desktop app replacement with every codec, or a site that pretends stub tools produce real output.

---

## Business model

Revenue comes from **free-tier traffic monetization** and **premium subscriptions**. SEO is the acquisition engine; conversion UX is the activation engine; ads and subscriptions are the monetization engine. Do not optimize one leg at the expense of the others.

### 1. SEO (acquisition)

- Rank for long-tail queries: `jpg-to-png`, `pdf-to-word`, `mp3-to-wav`, … across **7 locales** (~850+ URLs in sitemap).
- One URL per format pair where applicable; unique title/description/hreflang/JSON-LD per page.
- Blog + FAQ content drives internal links to live tools.
- **DNS:** Cloudflare in front of Plesk ([docs/dns-setup-tamir-li.md](docs/dns-setup-tamir-li.md), [docs/cloudflare-cache.md](docs/cloudflare-cache.md)).

### 2. Freemium (conversion → subscription)

| | Free | Premium |
|---|------|---------|
| Daily conversions | 5 | Unlimited |
| Ads | Yes (with consent) | None |
| Premium-only tools | Locked | Full access |
| AI image gen | — | 6 credits/month + purchasable packs |
| File size (marketing) | 50 MB | 200 MB (align enforcement before changing copy) |

- **Web checkout:** PayPal (default), Stripe optional (`ENABLE_STRIPE=true`). Requires Google sign-in.
- **Android app:** Google Play Billing — same premium benefits; PayPal is web-only.
- **Upsell tone:** value-first, understated ([docs/freemium-messaging.md](docs/freemium-messaging.md)). Always surface remaining usage and premium paths — homepage CTAs, nav usage pill, download gate, coming-soon alt-tool links.

### 3. Ads (free-tier monetization — web only today)

| Platform | Network | Status |
|----------|---------|--------|
| **Web** | Adsterra (+ Hilltopads primary in code) | **Target** — consent-gated banners, sidebar, inline, popunder; two-step download gate on free tier. Needs live zone keys / `public/ads.txt`. |
| **Web** | AdSense | **Not in use** — no account; do not assume AdSense slots or `adsense-setup.md` is active. |
| **Android app** | AdMob | **Not in use** — no AdMob account approved yet. Code exists (`src/lib/ads/admob.ts`, `native-ad-ramp.ts`) but **no ads serve** until `VITE_ADMOB_*` + Play Console ad declaration are configured. **Never** Adsterra or web popups on native. |

- Ads load only after cookie consent on **web**. Premium suppresses ad components (`setPremiumUser` in `adsterra.ts`).
- Android free tier today: **no ad revenue** — focus on conversion UX + **Google Play subscriptions** (see below).
- When AdMob is added later: [docs/admob-setup.md](docs/admob-setup.md). Until then, native ad ramp is a no-op (`shouldUseAdMob()` is false).

### 4. Android in-app purchases (Google Play Billing)

| Item | Status |
|------|--------|
| Client (`@capgo/native-purchases`) | **DONE** — `usePlayBilling.ts`, wired from `useSubscription` → `/premium` when `nativeBilling` |
| Server verify | **DONE** — `POST /api/billing/google/verify`, `google-play.ts`, RTDN route |
| Play Console products | **Operator** — create subscriptions in Play Console (IDs must match `GOOGLE_PLAY_PRODUCTS` in `platform.ts`) |
| Service account on API | **Operator** — `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` + `GOOGLE_PLAY_PACKAGE_NAME=com.tamir.li` on Plesk |

**Product IDs** (must match Play Console exactly):

- `tamir_premium_monthly` — subscription  
- `tamir_premium_yearly` — subscription  
- `credits_10`, `credits_30`, `credits_60`, `credits_120` — optional one-time (AI credits)

**Flow:** Google sign-in → `/premium` → Play purchase sheet → `POST /api/billing/google/verify` → `GET /api/billing/status` → premium + no ads. PayPal checkout is **web only** (not shown as primary on Android).

**Operator checklist:** [docs/android-play-console-setup.md](docs/android-play-console-setup.md) — Session C (Billing + API access).

### 5. AI credit packs (add-on revenue)

One-time purchases (10 / 30 / 60 / 120 credits) for the AI image generator without a subscription. Defined in `backend/src/lib/billing-shared.ts`.

### Agent monetization priorities

When implementing features, **bias toward getting users to convert files** and **surfacing upgrade paths** at natural moments (limit reached, download gate, premium-locked tool). Do not implement dark patterns, fake urgency, or bypass consent for ads. Autonomous testing must **not** trigger real premium purchases ([docs/autonomous-testing.md](docs/autonomous-testing.md)).

---

## North star (one line)

**Drag a file → pick a format → download the result.**

**Platforms:** Browser at [tamir.li](https://tamir.li) (primary). Capacitor Android app (`com.tamir.li`) loads the live site in a WebView — same SPA, platform-gated monetization (Play Billing on Android; web ads on browser).

**Canonical repo:** [StiNgeRIsrael/tamir-li](https://github.com/StiNgeRIsrael/tamir-li). Production deploy: push to `main` → GitHub Actions **Deploy to Plesk**.

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Vite 5, React 18, TypeScript, React Router, TanStack Query, shadcn/ui, Tailwind |
| Backend | Express, Prisma, MySQL 8 |
| Auth | Google Identity Services (popup) → JWT in `localStorage` (`tamir_auth_token`) |
| Billing | **Web:** PayPal (default), Stripe optional (`ENABLE_STRIPE=true`). **Android app:** Google Play Billing (`usePlayBilling`) — **primary monetization on app until AdMob** |
| Ads (web) | Adsterra / Hilltopads via admin DB or `VITE_ADSTERRA_*`; consent-gated — **not fully live yet** |
| Ads (Android) | **None today** — AdMob code stubbed; enable later with `VITE_ADMOB_*` + [admob-setup.md](docs/admob-setup.md) |
| Analytics | GTM + GA4 (consent-gated) |
| Deploy | Plesk Node.js monolith — Express serves `/api/*` + Vite `dist/` SPA on `tamir.li` |

Node **≥ 22**. Local dev runs split processes (`npm run dev:all`); production is a single process (`npm run build && npm start`).

## Key directories

```
src/
  pages/           Route pages (Index, ToolPage, PremiumPage, Blog*, admin/*)
  components/      UI, ads/, tools/ (custom tool implementations)
  lib/
    tools-data.ts  Tool catalog — source of truth for tool IDs, slugs, categories
    i18n.tsx       Locale routing (he = no prefix; /en, /es, …)
    translations/  Per-locale copy (he.ts is canonical for product tone)
    ads/           Adsterra/Hilltop (web), AdMob hooks (Android, inactive), consent, download gate
    platform.ts    isNativeApp(), isAndroidApp(), Play product IDs (`GOOGLE_PLAY_PRODUCTS`)
    conversion-eligibility.ts  Gate server-only tools on native app
  hooks/           useUsage, useSubscription, usePlayBilling

backend/
  src/routes/      auth, billing (PayPal + Google Play), usage, conversions, tools, admin
  src/lib/         billing-shared, paypal, google-play.ts, prisma
  prisma/          schema + migrations

android/           Capacitor shell (package `com.tamir.li`)
docs/              See docs/README.md — deploy, Android, ads, SEO
scripts/           generate-sitemap.ts, gsc-priority-urls.ts
public/            robots.txt, ads.txt, llms.txt, sitemap.xml (generated at build)
```

### Conventions

- **Tool slugs**: conversion tools use `{from}-to-{to}` (e.g. `jpg-to-png`); custom tools use their `id` (e.g. `image-compressor`, `pdf-manager`). Defined in `src/lib/tools-data.ts`.
- **i18n**: Hebrew is default — URLs have no `/he` prefix. Other locales prefix the path (`/en/jpg-to-png`). All user-facing strings go in `src/lib/translations/*.ts`, not hardcoded in components.
- **SEO**: pages use `<SEOHead>` for title, description, canonical, hreflang, OG tags. Tool pages add JSON-LD (`WebApplication`, `FAQPage`). Sitemap is regenerated on every build (`prebuild` → `scripts/generate-sitemap.ts`).
- **Usage limits**: `MAX_DAILY_FREE = 5` in both `backend/src/routes/usage.routes.ts` and `src/hooks/useUsage.ts` — keep in sync.
- **Premium flag**: `useSubscription()` → `setPremiumUser()` in `src/lib/ads/adsterra.ts` so ad components hide for subscribers.

### UI/UX

When doing design, UI, UX, visual polish, layout, or styling work, **always** read and follow [`.cursor/skills/ui-ux-pro-max/SKILL.md`](.cursor/skills/ui-ux-pro-max/SKILL.md).

1. Run the design-system generator first (from repo root):

   `python .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "tamir.li"`

2. Stack for this project: React + shadcn/ui + Tailwind — use `--stack shadcn` for component patterns or `--stack html-tailwind` for markup/CSS as appropriate.

## Product pillars (agent checklist)

### SEO

- Every public route needs unique title/description per locale.
- Tool pages: category OG images (`public/og/category-*.svg`), internal links, FAQ blocks (`ToolSeoBlocks.tsx`).
- Do not remove hreflang alternates or break locale-prefixed routes in `App.tsx`.
- After adding tools or blog posts, sitemap updates automatically via build — verify `src/lib/sitemap-paths.ts` includes new paths.
- Static SEO files: `public/robots.txt`, `public/ads.txt`, `public/llms.txt`.

### Freemium

| | Free | Premium |
|---|------|---------|
| Daily conversions | 5 | Unlimited |
| Ads | Yes (with consent) | None |
| Premium-only tools | Locked (`premium: true` in tools-data) | Full access |
| AI image gen | — | 6 credits/month + purchasable packs |
| File size (marketing copy) | 50 MB | 200 MB (comparison table; FAQ mentions up to 500 MB — align copy if changing limits) |

Checkout requires Google sign-in. Plans: `monthly`, `yearly`, plus AI credit packs (`credits_10` … `credits_120`). See `backend/src/lib/billing-shared.ts`.

### Ads (web — Adsterra / Hilltopads)

- Zone **keys** (hex embed keys) go in admin `/admin/ads` or `VITE_ADSTERRA_*` env vars.
- **Never** put the Adsterra Publisher **API** key in `VITE_*`.
- Ads load only after cookie consent (`src/lib/ads/consent.ts`). Premium users skip all ad components.
- Free-tier downloads: two-step gate on **web** — vignette/popup, then download (`download-gate.ts`).
- **AdSense:** not in use. **AdMob:** not configured.

Details: [docs/adsterra-setup.md](docs/adsterra-setup.md).

### Android app (Play Billing + ads)

**In-app purchases (primary app monetization today):**

- Subscriptions via **Google Play Billing** — `usePlayBilling` → `NativePurchases.purchaseProduct` → `POST /api/billing/google/verify`.
- Requires Google sign-in, Play Console subscription products (`tamir_premium_monthly`, `tamir_premium_yearly`), and `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` on the API server (`GOOGLE_PLAY_PACKAGE_NAME=com.tamir.li`).
- Optional one-time: `credits_10` … `credits_120` (AI packs).
- PayPal on `/premium` is **web only**; Android uses Play when `nativeBilling` is true.

**Ads on Android:**

- **Currently none** — no AdMob account. Code exists but `shouldUseAdMob()` is false without `VITE_ADMOB_*`.
- When AdMob is added: env vars, `strings.xml` App ID, Play “Advertising ID” declaration; gradual ramp in `native-ad-ramp.ts`.
- **Never** Adsterra or web popups in the Capacitor shell.

Details: [docs/android-play-console-setup.md](docs/android-play-console-setup.md). Future ads: [docs/admob-setup.md](docs/admob-setup.md).

## What NOT to do

- **Do not commit** `.env`, `backend/.env`, credentials, or API secrets.
- **Do not rewrite** existing `.env` files — only edit `.env.example` or docs when documenting new vars.
- **Do not** expose server secrets via `VITE_*` prefix.
- **Do not** set Plesk document root to `deploy/dist` for the monolith — API routes get swallowed by SPA `.htaccess`. Use application root `httpdocs/deploy`. See [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md).
- **Do not** enable both `VITE_GTM_ID` and `VITE_GA4_ID` (double-counting risk).
- **Do not** assume all server-side conversions work — `POST /api/conversions` **enqueues** jobs (202); only **audio** transcodes with ffmpeg today; video/PDF-word are stub passthrough. Many tools use **client-side** processing. On **Android native**, some server tools are gated (`conversion-eligibility.ts`).
- **Do not** use Adsterra or web popup ads in the Capacitor Android shell — when ads are added, use AdMob only.
- **Do not** assume AdMob, AdSense, or Adsterra are earning today — verify env + console before implementing ad-dependent UX as a launch blocker.

## Common tasks

| Task | Where to look |
|------|----------------|
| Add a tool | `src/lib/tools-data.ts`, optional `src/components/tools/`, translations, `ToolPage.tsx` switch |
| Change free limit | `usage.routes.ts` + `useUsage.ts` |
| Premium pricing copy | `src/lib/translations/he.ts` → `upgradePage` |
| Ad placement | `AdSlot.tsx`, `DesktopAdRail.tsx`, `AppLayout.tsx` |
| Deploy | [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md) · [docs/deploy-checklist.md](docs/deploy-checklist.md) |
| Android / Play / IAP | [docs/android-play-console-setup.md](docs/android-play-console-setup.md) — subscriptions, service account, AAB |
| Android ads (future) | [docs/admob-setup.md](docs/admob-setup.md) — only after AdMob account exists |
| Local dev | [docs/local-dev.md](docs/local-dev.md) |
| PayPal / Stripe (web) | [docs/paypal-setup.md](docs/paypal-setup.md), [docs/stripe-setup.md](docs/stripe-setup.md) |
| GSC / indexing | [docs/google-search-console-indexing.md](docs/google-search-console-indexing.md) · `npm run gsc:daily` · `.cursor/automations/gsc-daily-indexing.md` |

## Deeper docs

- [docs/README.md](docs/README.md) — internal doc index (what's current vs deprecated)
- [docs/product-vision.md](docs/product-vision.md) — **goal, purpose, business model**, roadmap
- [docs/implementation-status.md](docs/implementation-status.md) — code audit: complete vs partial vs stub vs missing
- [docs/local-dev.md](docs/local-dev.md) — split dev setup
- [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md) — production monolith
- [docs/adsterra-setup.md](docs/adsterra-setup.md) — ad zones and consent
- [docs/google-search-console-indexing.md](docs/google-search-console-indexing.md) — sitemap (~847 URLs, 7 locales)
