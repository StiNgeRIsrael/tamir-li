# AGENTS.md — tamir.li conversion hub

Guide for AI coding agents and new contributors. Read this before making changes.

## North star

**tamir.li** (תמיר לי) is a Hebrew-first online file conversion hub: drag a file, pick a format, download the result. No desktop software.

Business model is three-legged:

1. **SEO** — rank for long-tail conversion queries (`jpg-to-png`, `pdf-to-word`, …) across 7 locales.
2. **Freemium** — free tier with daily limits and ads; premium subscription removes limits and ads.
3. **Ads** — **web:** Adsterra display units (free tier, cookie consent). **Android app:** AdMob only — never Adsterra/popups on native.

**Platforms:** Browser at `tamir.li` (primary). Capacitor Android app (`li.tamir.app`) loads `https://tamir.li` in a WebView — same SPA, platform-gated ads and billing.

**Canonical repo:** [StiNgeRIsrael/tamir-li](https://github.com/StiNgeRIsrael/tamir-li). Production deploy: push to `main` → GitHub Actions **Deploy to Plesk**.

Do not optimize for one pillar at the expense of the others (e.g. do not strip SEO metadata to simplify UI; do not bypass consent to load ads).

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Vite 5, React 18, TypeScript, React Router, TanStack Query, shadcn/ui, Tailwind |
| Backend | Express, Prisma, MySQL 8 |
| Auth | Google Identity Services (popup) → JWT in `localStorage` (`tamir_auth_token`) |
| Billing | **Web:** PayPal (default), Stripe optional (`ENABLE_STRIPE=true`). **Android app:** Google Play Billing (`usePlayBilling`) |
| Ads (web) | Adsterra zones via admin DB or `VITE_ADSTERRA_*`; consent-gated |
| Ads (Android) | AdMob — `VITE_ADMOB_*` in `.env.production`, App ID in `android/.../strings.xml` |
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
    ads/           Adsterra, AdMob (Android), consent, download gate
    platform.ts    isNativeApp(), isAndroidApp(), Play product IDs
    conversion-eligibility.ts  Gate server-only tools on native app
  hooks/           useUsage, useSubscription, usePlayBilling

backend/
  src/routes/      auth, billing (PayPal + Google Play), usage, conversions, tools, admin
  src/lib/         billing-shared, paypal, google-play.ts, prisma
  prisma/          schema + migrations

android/           Capacitor shell (package `li.tamir.app`)
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

### Ads (web — Adsterra)

- Zone **keys** (hex embed keys) go in admin `/admin/ads` or `VITE_ADSTERRA_ZONE_*` env vars.
- **Never** put the Adsterra Publisher **API** key in `VITE_*`.
- Ads load only after cookie consent (`src/lib/ads/consent.ts`). Premium users skip all ad components.
- Free-tier downloads: two-step gate on **web** — vignette/popup, then download (`download-gate.ts`).

Details: [docs/adsterra-setup.md](docs/adsterra-setup.md).

### Ads & billing (Android app)

- **AdMob only** on native Android — banner, interstitial, rewarded (`src/lib/ads/admob.ts`). **Never** Adsterra or `VITE_AD_CLICK_URL` popups on Android.
- Ad unit IDs are baked into the **production frontend build** (`.env.production` / `VITE_ADMOB_*`) because the app loads `https://tamir.li`.
- Native App ID also in `android/app/src/main/res/values/strings.xml` (sync via `scripts/sync-admob-android.mjs`).
- **Google Play Billing** for subscriptions on Android; PayPal checkout remains **web only**.
- Gate server-side conversion tools on native (`conversion-eligibility.ts`) — worker queue may return errors for unsupported formats.

Details: [docs/admob-setup.md](docs/admob-setup.md), [docs/android-play-console-setup.md](docs/android-play-console-setup.md).

## What NOT to do

- **Do not commit** `.env`, `backend/.env`, credentials, or API secrets.
- **Do not rewrite** existing `.env` files — only edit `.env.example` or docs when documenting new vars.
- **Do not** expose server secrets via `VITE_*` prefix.
- **Do not** set Plesk document root to `deploy/dist` for the monolith — API routes get swallowed by SPA `.htaccess`. Use application root `httpdocs/deploy`. See [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md).
- **Do not** enable both `VITE_GTM_ID` and `VITE_GA4_ID` (double-counting risk).
- **Do not** assume all server-side conversions work — `POST /api/conversions` **enqueues** jobs (202); only **audio** transcodes with ffmpeg today; video/PDF-word are stub passthrough. Many tools use **client-side** processing. On **Android native**, some server tools are gated (`conversion-eligibility.ts`).
- **Do not** use Adsterra or web popup ads in the Capacitor Android shell — use AdMob only.

## Common tasks

| Task | Where to look |
|------|----------------|
| Add a tool | `src/lib/tools-data.ts`, optional `src/components/tools/`, translations, `ToolPage.tsx` switch |
| Change free limit | `usage.routes.ts` + `useUsage.ts` |
| Premium pricing copy | `src/lib/translations/he.ts` → `upgradePage` |
| Ad placement | `AdSlot.tsx`, `DesktopAdRail.tsx`, `AppLayout.tsx` |
| Deploy | [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md) · [docs/deploy-checklist.md](docs/deploy-checklist.md) |
| Android / Play / AdMob | [docs/android-play-console-setup.md](docs/android-play-console-setup.md), [docs/admob-setup.md](docs/admob-setup.md) |
| Local dev | [docs/local-dev.md](docs/local-dev.md) |
| PayPal / Stripe (web) | [docs/paypal-setup.md](docs/paypal-setup.md), [docs/stripe-setup.md](docs/stripe-setup.md) |
| GSC / indexing | [docs/google-search-console-indexing.md](docs/google-search-console-indexing.md) |

## Deeper docs

- [docs/README.md](docs/README.md) — internal doc index (what's current vs deprecated)
- [docs/implementation-status.md](docs/implementation-status.md) — code audit: complete vs partial vs stub vs missing
- [docs/tools-and-features.md](docs/tools-and-features.md) — full tool catalog, SEO slugs, implementation status, API table
- [docs/product-vision.md](docs/product-vision.md) — mission, features, monetization, roadmap
- [docs/local-dev.md](docs/local-dev.md) — split dev setup
- [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md) — production monolith
- [docs/adsterra-setup.md](docs/adsterra-setup.md) — ad zones and consent
- [docs/google-search-console-indexing.md](docs/google-search-console-indexing.md) — sitemap (~847 URLs, 7 locales)
