# Product vision — tamir.li (תמיר לי)

Practical reference for what we are building and why. Not a marketing page.

## Mission

Give people a fast, browser-based way to convert files between common formats — without installing software, without an account for basic use, and with Hebrew as the primary language and UX.

**Domain:** [https://tamir.li](https://tamir.li)

**Positioning:** Lightweight alternative to bloated desktop converters and ad-heavy aggregator sites. PWA-installable, mobile-friendly, RTL-native.

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

## Freemium model

### Free tier

- **5 conversions per day** (UTC day on server; localStorage fallback when API unavailable)
- **Ads** after cookie consent (**web:** Adsterra)
- **Two-step download** on free tier: **web** — vignette or popup; **Android app** — AdMob rewarded ad
- Access to non-premium tools only
- Marketing copy: **50 MB** max file size

### Premium tier

Subscription via **PayPal** on **web** (default) or **Stripe** when `ENABLE_STRIPE=true`. **Android app** uses **Google Play Billing** for the same premium benefits.

Benefits (from product copy and code):

| Benefit | Detail |
|---------|--------|
| Unlimited conversions | No daily cap (`usage.routes.ts` skips limit for active subscribers) |
| Ad-free | All ad components return null; no popunder |
| AI images | **6 credits/month** included (`MONTHLY_AI_CREDITS` in billing-shared); resets each billing cycle |
| Priority processing | `ConversionJob.priority` flag in schema (for future worker queue) |
| Premium-only tools | Video converter/compressor, AI image generator |
| Larger files | Comparison table: **200 MB**; FAQ copy mentions up to **500 MB** — verify enforcement before changing marketing |

Pricing (Hebrew UI, approximate): ~₪4.90/month or ~₪47/year (~20% savings). English UI shows USD equivalents.

### AI credit packs (one-time)

Purchasable without subscription: 10 / 30 / 60 / 120 credits (ILS-priced via PayPal order). Defined in `CREDIT_PLANS` in `backend/src/lib/billing-shared.ts`.

### Payment flow

1. User signs in with Google
2. **Web:** `/premium` → PayPal checkout → webhook sync
3. **Android app:** `/premium` → Google Play purchase → `POST /api/billing/google/verify`
4. `GET /api/billing/status` drives `useSubscription()` on the client

Setup guides: [paypal-setup.md](./paypal-setup.md), [android-play-console-setup.md](./android-play-console-setup.md), [stripe-setup.md](./stripe-setup.md) (optional).

---

## Ads monetization

**Web:** Adsterra (see [adsterra-setup.md](./adsterra-setup.md)).  
**Android app:** AdMob only — never Adsterra on native ([admob-setup.md](./admob-setup.md)).

### Strategy

- Monetize free-tier traffic without blocking conversion UX
- Premium subscription is the ad-free upsell
- Respect consent (GDPR-style banner: analytics + ads toggles)

### Placements

| Type | Size | Typical location |
|------|------|------------------|
| Banner | 728×90 | Home, blog, tool page footers |
| Sidebar | 300×250 ×2 | Desktop sticky rails (`DesktopAdRail`) |
| Inline | 468×60 | Mid-content on tools/blog |
| Popunder | Script URL | Optional; after consent + on some conversion milestones |
| Download vignette | Inline slot | Free-tier download gate |

### Technical notes

- Zone keys in `VITE_ADSTERRA_ZONE_*` — **not** the Publisher API key
- `public/ads.txt` must list Adsterra authorization lines
- If env vars unset: muted placeholders, no broken layout
- `setPremiumUser(true)` suppresses all ad loading

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
