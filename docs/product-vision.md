# Product vision — tamir.li (תמיר לי)

Practical reference for what we are building, why, and how we make money. Not a marketing page.

**Related:** [AGENTS.md](../AGENTS.md) (agent quick reference) · [implementation-status.md](./implementation-status.md) (what works today) · [monetization-readiness-plan.md](./monetization-readiness-plan.md) (launch checklist)

---

## Goal

Ship and grow a **profitable, production-grade** online conversion hub that:

- Captures organic search traffic for `{format}-to-{format}` queries in Hebrew and six other locales.
- Delivers **real conversions** (client-side today for most image/PDF/text tools; server queue for audio and future heavy formats).
- Monetizes free users through **consent-gated ads** and converts power users to **premium subscriptions** (and AI credit packs).
- Runs lean on Plesk: API + SPA monolith, MySQL, queued server jobs — not synchronous heavy processing on the web thread.
- Feels trustworthy: honest coming-soon badges, clear daily limits, no fake tool output on stub pages.

**North star UX:** drag a file → pick a format → download. Every feature decision should move the product closer to that loop.

---

## Purpose

### Why tamir.li exists

People need quick file format changes — photos for a form, PDFs for email, audio for a phone — without installing desktop software or creating an account for basic use. Israeli users especially lack good **Hebrew-first, RTL-native** options; global users need the same tools with localized URLs and copy.

### What we optimize for

| Priority | Meaning |
|----------|---------|
| **Speed & simplicity** | Minimal steps from upload to download; PWA-installable for repeat use |
| **Localization** | Hebrew default (no `/he` prefix); 6 translated locales; RTL where needed |
| **Honesty** | Stub tools show coming-soon + links to working alternatives — never fake success |
| **Sustainability** | Free tier is ad-supported and capped; premium funds ad-free unlimited use |

### What we are not

- A file storage or sharing platform
- A desktop replacement with every codec and batch pipeline (yet)
- An ad farm that blocks conversion before value is delivered

**Domain:** [https://tamir.li](https://tamir.li)  
**Positioning:** Lightweight alternative to bloated desktop converters and ad-heavy aggregator sites. PWA-installable, mobile-friendly, RTL-native.

---

## Business model

Three reinforcing revenue streams. SEO brings users; the product converts them; ads and subscriptions capture value.

```
Search (SEO) → Land on tool page → Convert file (free tier)
                                      ├── Hit daily limit → Premium upsell
                                      ├── Download gate → Ad impression (web/Android)
                                      └── Return visitor → PWA / subscription

Premium subscriber → No ads, unlimited conversions, premium tools, AI credits
AI power user → Credit packs (one-time) on top of or instead of subscription
```

### Revenue stream 1 — Display ads (free tier)

**Web:** Adsterra zones (banner 728×90, sidebar 300×250, inline 468×60, optional popunder). Loaded only after cookie consent. Free downloads use a two-step gate (vignette/popup then download). See [adsterra-setup.md](./adsterra-setup.md).

**Android app (`li.tamir.app`):** AdMob only — banner, interstitial, rewarded for download gate. Never Adsterra on native. See [admob-setup.md](./admob-setup.md).

**Requirements for revenue:** real `ads.txt` / `app-ads.txt`, zone keys in `/admin/ads` or env, consent banner working, premium users fully suppressed.

### Revenue stream 2 — Premium subscription (recurring)

| Benefit | Free | Premium |
|---------|------|---------|
| Daily conversions | 5 | Unlimited |
| Ads | Yes (consent) | None |
| Video tools, AI generator | Locked | Full access |
| AI credits | — | 6/month included |
| File size (marketing) | 50 MB | 200 MB |

**Pricing (approx.):** ~₪19.90/month or ~₪47/year on web (PayPal primary; Stripe optional). Android uses Google Play Billing for the same tier.

**Checkout flow:** Google sign-in → `/premium` → PayPal (web) or Play purchase (Android) → webhook/verify → `GET /api/billing/status`.

**Messaging:** value-first upsell, not hard sell — see [freemium-messaging.md](./freemium-messaging.md).

### Revenue stream 3 — AI credit packs (one-time)

Purchasable without subscription: 10 / 30 / 60 / 120 credits for the text-to-image tool. PayPal orders on web. Defined in `CREDIT_PLANS` in `backend/src/lib/billing-shared.ts`.

### Acquisition — SEO (not direct revenue, enables the funnel)

Long-tail landing pages (`/jpg-to-png`, `/en/pdf-to-word`, …), hreflang across 7 locales, sitemap ~850 URLs, blog articles, FAQ JSON-LD. Cloudflare DNS → Plesk origin. See [google-search-console-indexing.md](./google-search-console-indexing.md).

### Conversion-push philosophy

The product should **always nudge users toward completing a conversion**: homepage featured tools, nav usage remaining, post-limit upgrade panels, coming-soon alternative links, download gate before file delivery (free tier). Monetization follows value — user gets a converted file; we earn from ads or subscription.

### Current maturity (honest)

The site is **deployable but underdeveloped** relative to the goal: 9/13 catalog tools are fully functional; server video/PDF-word are stubs; ads and PayPal need production env verification. See [implementation-status.md](./implementation-status.md) and [production-readiness.md](./production-readiness.md).

---

## Mission (summary)

Give people a fast, browser-based way to convert files between common formats — without installing software, without an account for basic use, and with Hebrew as the primary language and UX.

## Target users

| Segment | Need |
|---------|------|
| Israeli users (primary) | Quick image/PDF/audio conversions in Hebrew, on phone or desktop |
| Global users | Same tools via `/en`, `/es`, `/ru`, `/de`, `/fr`, `/it` |
| Power users | Unlimited daily use, larger files, video/AI tools, no ads |
| SEO visitors | Land on `{format}-to-{format}` pages from search, convert once, maybe upgrade |

## Core features (today)

### Conversion tools

> **Full inventory** (92 SEO slugs, per-tool implementation status, API table): [tools-and-features.md](./tools-and-features.md)

Catalog lives in `src/lib/tools-data.ts`. Categories:

| Category | Tools | Notes |
|----------|-------|-------|
| **Image** | Format converter, compressor, resizer, PNG→ICO, SVG→PNG | Popular entry points for SEO |
| **Video** | Converter, compressor | Marked `premium: true` |
| **Audio** | Format converter (MP3, WAV, AAC, OGG, FLAC) | Free tier |
| **Document** | PDF↔Word, PDF manager (merge/reorder/rotate), text tools (TXT/MD/HTML) | PDF manager is a custom component |
| **AI** | Text-to-image generator | Premium; consumes AI credits |

URL patterns:

- Format pairs: `/jpg-to-png`, `/mp3-to-wav`, …
- Custom tools: `/image-compressor`, `/pdf-manager`, `/ai-image-generator`, …

Some tools run fully in the browser (canvas, pdf-lib, pdf.js). Server-side pipeline: `POST /api/conversions` **enqueues** jobs (202) — **audio** transcodes with ffmpeg when installed; video/PDF-word remain stub passthrough. **Android native app** gates some server-only tools (`conversion-eligibility.ts`).

### Multi-language (i18n)

Seven locales: **he** (default, no URL prefix), **en**, **es**, **ru**, **de**, **fr**, **it**.

- Copy in `src/lib/translations/*.ts`
- RTL for Hebrew only
- SEO: hreflang alternates on every page, x-default → Hebrew

### Auth & accounts

- **Google sign-in** (optional for free use; required for premium checkout)
- JWT stored client-side; usage tracked server-side when API is configured
- Anonymous users tracked via session cookie (`tamir_sid`) for daily limits

### Admin

Routes under `/admin` (requires Google account in `ADMIN_EMAILS`):

- User overview and blocking
- Per-tool enable/disable, featured flag, sort order (`ToolConfig` in DB)

### PWA

`/install` page + vite-plugin-pwa manifest. Positioned as “add to home screen” for repeat converters.

### Blog

Long-form Hebrew SEO articles in `src/lib/blog-data.ts`, linked to relevant tool pages. Indexed in sitemap with `lastmod`.

---

## Monetization implementation reference

Summary of tiers and revenue streams is in [Business model](#business-model) above. Operational detail:

### Payment flow

1. User signs in with Google (required for checkout; optional for free conversions)
2. **Web:** `/premium` → PayPal checkout → webhook sync
3. **Android app:** `/premium` → Google Play purchase → `POST /api/billing/google/verify`
4. `GET /api/billing/status` drives `useSubscription()` on the client

Setup: [paypal-setup.md](./paypal-setup.md), [android-play-console-setup.md](./android-play-console-setup.md), [stripe-setup.md](./stripe-setup.md) (optional).

### Premium benefits (code-enforced)

| Benefit | Detail |
|---------|--------|
| Unlimited conversions | `usage.routes.ts` skips daily cap for active subscribers |
| Ad-free | All ad components return null; no popunder |
| AI images | **6 credits/month** (`MONTHLY_AI_CREDITS` in billing-shared) |
| Priority queue | `ConversionJob.priority` for premium jobs |
| Premium-only tools | Video converter/compressor, AI image generator |
| Larger files | Marketing: **200 MB**; FAQ mentions up to **500 MB** — verify enforcement before changing copy |

**Pricing (UI):** ~₪19.90/month or ~₪47/year (~20% savings). Anchor ~~₪150~~ in upgrade page. Backend MRR: `SUBSCRIPTION_MRR_AGOROT` in `billing-shared.ts`.

### Ad placements (web)

| Type | Size | Location |
|------|------|----------|
| Banner | 728×90 | Home, blog, tool footers |
| Sidebar | 300×250 ×2 | `DesktopAdRail` |
| Inline | 468×60 | Mid-content on tools/blog |
| Popunder | Script URL | After consent; optional |
| Download vignette | Inline slot | Free-tier download gate |

**Technical:** Zone keys in `/admin/ads` or `VITE_ADSTERRA_ZONE_*` (not Publisher API key). `public/ads.txt` required for Adsterra approval. `setPremiumUser(true)` suppresses all ads.

Launch checklist: [monetization-readiness-plan.md](./monetization-readiness-plan.md). Copy tone: [freemium-messaging.md](./freemium-messaging.md).

---

## SEO strategy

Goal: capture long-tail “convert X to Y” searches in Hebrew and translated locales.

### On-page

- Unique `<title>` and meta description per page/locale (`SEOHead.tsx`)
- Canonical URLs via `VITE_SITE_ORIGIN` (default `https://tamir.li`)
- Open Graph + Twitter cards; category-specific OG SVGs for tools
- JSON-LD: `WebApplication` + `FAQPage` on tool pages
- Internal linking: related tools, blog → tool CTAs, home category grid

### Technical SEO

- **`public/sitemap.xml`** — generated at build from `src/lib/sitemap-paths.ts` (~847 URLs × 7 locales)
- **`public/robots.txt`** — allows crawlers; points to sitemap and `llms.txt`
- **`public/llms.txt`** — summary for AI crawlers
- **hreflang** — all locale alternates + `x-default` → Hebrew
- **PWA manifest** — installability signal

### Content SEO

- One URL per format pair where applicable (`jpg-to-png`, `png-to-jpg`, …)
- Tool-specific FAQ blocks (`src/lib/tool-seo-content.ts`, `ToolSeoBlocks.tsx`)
- Blog articles targeting how-to queries with links to live tools
- Priority URL list for manual GSC indexing: `npm run generate:gsc-priority`

See [google-search-console-indexing.md](./google-search-console-indexing.md).

### Analytics

GTM container loads GA4 after analytics consent. Custom events: conversions, upgrade clicks, ad interactions, downloads. Template: [gtm-container-template.json](./gtm-container-template.json).

---

## Architecture snapshot

```
Browser (React SPA) or Capacitor WebView → tamir.li
  ├── Client-side tools (image, PDF, text)
  ├── Web: Adsterra iframes (consent + !premium)
  ├── Android: AdMob native (banner / interstitial / rewarded)
  └── /api/* → Express
        ├── auth (Google JWT)
        ├── usage (daily limits)
        ├── billing (PayPal webhooks + Google Play verify/RTDN)
        ├── admin
        └── conversions (202 enqueue — audio real; others stub)
```

Production: single Node process on Plesk serves API + static `dist/`. See [plesk-node-deploy.md](./plesk-node-deploy.md).

---

## Roadmap & intended extensions

Based on current code gaps and sensible next steps:

### Near-term (in repo or partially built)

- [x] **Android Capacitor app** — shell, AdMob, Google Play Billing (Play Store publish pending)
- [ ] **Server-side conversion workers** — real video/PDF-word handlers in worker queue
- [ ] **Hebrew OCR tool** — `HebOcrTool.tsx` exists but not yet in `tools-data.ts`
- [ ] **Align file-size limits** — enforce 50/200/500 MB consistently in API and UI copy
- [ ] **More blog posts** — expand topical coverage per locale (currently Hebrew-heavy)

### Medium-term

- [ ] Batch/multi-file conversion UX improvements
- [ ] Email notifications for failed jobs (Resend key in backend env)
- [ ] Stripe as primary billing if PayPal friction is high
- [ ] Additional locales or locale-specific landing pages
- [ ] Tool usage analytics dashboard in admin

### SEO growth

- [ ] More `{from}-to-{to}` landing pages as formats are added
- [ ] Structured data for blog (`Article` schema — partial on `BlogPost.tsx`)
- [ ] Core Web Vitals monitoring (see performance budget on tool pages with ads)

### Monetization tuning

- [ ] A/B test download-gate vs banner-only on high-traffic tools
- [ ] Credit-pack upsell on AI tool when monthly credits exhausted
- [ ] Annual plan emphasis on `/premium` (yearly toggle already exists)

---

## Related documentation

| Doc | Purpose |
|-----|---------|
| [tools-and-features.md](./tools-and-features.md) | Tool catalog, SEO slugs, implementation & API reference |
| [AGENTS.md](../AGENTS.md) | AI agent quick reference |
| [local-dev.md](./local-dev.md) | Dev environment |
| [plesk-node-deploy.md](./plesk-node-deploy.md) | Production deploy |
| [adsterra-setup.md](./adsterra-setup.md) | Ad configuration |
| [paypal-setup.md](./paypal-setup.md) / [stripe-setup.md](./stripe-setup.md) | Billing |
| [google-search-console-indexing.md](./google-search-console-indexing.md) | Search indexing |
