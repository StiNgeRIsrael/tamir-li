# AGENTS.md — tamir.li conversion hub

Guide for AI coding agents and new contributors. Read this before making changes.

## North star

**tamir.li** (תמיר לי) is a Hebrew-first online file conversion hub: drag a file, pick a format, download the result. No desktop software.

Business model is three-legged:

1. **SEO** — rank for long-tail conversion queries (`jpg-to-png`, `pdf-to-word`, …) across 7 locales.
2. **Freemium** — free tier with daily limits and ads; premium subscription removes limits and ads.
3. **Ads** — Adsterra display units on free tier, gated behind cookie consent.

Do not optimize for one pillar at the expense of the others (e.g. do not strip SEO metadata to simplify UI; do not bypass consent to load ads).

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | Vite 5, React 18, TypeScript, React Router, TanStack Query, shadcn/ui, Tailwind |
| Backend | Express, Prisma, MySQL 8 |
| Auth | Google Identity Services (popup) → JWT in `localStorage` (`tamir_auth_token`) |
| Billing | PayPal (default), Stripe optional (`ENABLE_STRIPE=true`) |
| Analytics | GTM + GA4 (consent-gated) |
| Deploy | Plesk Node.js monolith — Express serves `/api/*` + Vite `dist/` SPA |

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
    ads/           Adsterra, consent, download gate
    sitemap-paths.ts  URL list shared with sitemap generator
  hooks/           useUsage, useSubscription

backend/
  src/routes/      auth, billing, usage, conversions, tools, admin
  src/lib/         billing-shared, paypal, prisma
  prisma/          schema + migrations

docs/              Operational guides (deploy, ads, billing, GSC)
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

### Ads (Adsterra)

- Zone **keys** (hex embed keys) go in `VITE_ADSTERRA_ZONE_*` env vars — one key per placement.
- **Never** put the Adsterra Publisher **API** key in `VITE_*` — it would ship in the browser bundle.
- Ads load only after cookie consent (`src/lib/ads/consent.ts`). Premium users skip all ad components.
- Placements: banner 728×90, sidebar 300×250 (×2 rails), inline 468×60, optional popunder script URL.
- Free-tier downloads use a two-step gate (`src/lib/ads/download-gate.ts`): first click shows vignette/popup, second click downloads.
- Each ad unit renders in an isolated iframe (`buildAdIframeSrcdoc`) to avoid `atOptions` collisions in the SPA.

Details: [docs/adsterra-setup.md](docs/adsterra-setup.md).

## What NOT to do

- **Do not commit** `.env`, `backend/.env`, credentials, or API secrets.
- **Do not rewrite** existing `.env` files — only edit `.env.example` or docs when documenting new vars.
- **Do not** expose server secrets via `VITE_*` prefix.
- **Do not** set Plesk document root to `deploy/dist` for the monolith — API routes get swallowed by SPA `.htaccess`. Use application root `httpdocs/deploy`. See [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md).
- **Do not** enable both `VITE_GTM_ID` and `VITE_GA4_ID` (double-counting risk).
- **Do not** assume server-side conversion works — `POST /api/conversions` currently returns **501**. Many tools use client-side processing or mock mode in dev (`VITE_USE_MOCK_CONVERSION`).

## Common tasks

| Task | Where to look |
|------|----------------|
| Add a tool | `src/lib/tools-data.ts`, optional `src/components/tools/`, translations, `ToolPage.tsx` switch |
| Change free limit | `usage.routes.ts` + `useUsage.ts` |
| Premium pricing copy | `src/lib/translations/he.ts` → `upgradePage` |
| Ad placement | `AdSlot.tsx`, `DesktopAdRail.tsx`, `AppLayout.tsx` |
| Deploy | [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md) |
| Local dev | [docs/local-dev.md](docs/local-dev.md) |
| PayPal / Stripe | [docs/paypal-setup.md](docs/paypal-setup.md), [docs/stripe-setup.md](docs/stripe-setup.md) |
| GSC / indexing | [docs/google-search-console-indexing.md](docs/google-search-console-indexing.md) |

## Deeper docs

- [docs/implementation-status.md](docs/implementation-status.md) — code audit: complete vs partial vs stub vs missing (frontend, backend, Prisma, env vars)
- [docs/tools-and-features.md](docs/tools-and-features.md) — full tool catalog, SEO slugs, implementation status, API table
- [docs/product-vision.md](docs/product-vision.md) — mission, features, monetization, roadmap
- [docs/local-dev.md](docs/local-dev.md) — split dev setup
- [docs/plesk-node-deploy.md](docs/plesk-node-deploy.md) — production monolith
- [docs/adsterra-setup.md](docs/adsterra-setup.md) — ad zones and consent
- [docs/google-search-console-indexing.md](docs/google-search-console-indexing.md) — sitemap (~847 URLs, 7 locales)
