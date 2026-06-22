# Tools & features reference — tamir.li

Comprehensive inventory derived from `src/lib/tools-data.ts`, routes, components, and backend APIs. Use this when adding tools, debugging conversion behavior, or answering “what exists today?”

For product positioning and monetization rationale, see [product-vision.md](./product-vision.md).  
For a full code audit (complete / partial / stub), see [implementation-status.md](./implementation-status.md).

---

## Summary counts

| Item | Count | Source |
|------|------:|--------|
| Catalog tools | **13** | `tools` array in `src/lib/tools-data.ts` |
| SEO tool slugs | **92** | `collectToolSlugs()` in `src/lib/sitemap-paths.ts` |
| Locales | **7** | `he` (default, no prefix), `en`, `es`, `ru`, `de`, `fr`, `it` |
| Blog posts | **22** | `blogArticles` in `src/lib/blog-data.ts` |
| Base sitemap paths | **122** | home + static + blog + tool slugs |
| Indexed URLs (all locales) | **854** | `122 × 7` — `public/sitemap.xml` (regenerated on build) |
| Static pages | **6** | premium, install, privacy, terms, about, contact |
| Admin API routes | **5** | stats, users list/patch, tools list/patch |

### Tools per category

| Category | Catalog tools | Unique SEO slugs |
|----------|--------------:|-----------------:|
| Image | 5 | 39 |
| Video | 2 | 21 |
| Audio | 1 | 20 |
| Document | 4 | 11 |
| AI | 1 | 1 |

---

## Implementation status legend

| Status | Meaning |
|--------|---------|
| **Client real** | Conversion runs in the browser; output file is genuinely transformed |
| **Mock** | UI simulates progress; download re-exports the **source** file with a new extension (`triggerFileDownload` in `src/lib/ads/download-gate.ts`) |
| **API stub** | Frontend calls `POST /api/conversions` → **501** unless mock mode is on |
| **Premium UI** | Tool or feature gated behind subscription; may still be mock underneath |
| **WIP** | Component exists but not in catalog / not routed |

**Mock mode:** `allowMockFileConversion()` in `src/lib/feature-flags.ts` — **on by default in dev**, off in production unless `VITE_USE_MOCK_CONVERSION=true`.

---

## Tools by category

Routes use Hebrew default (no prefix). Other locales prefix the path: `/en/jpg-to-png`, `/es/image-compressor`, etc.

### Image (5 tools, 39 slugs)

| Name (HE) | ID | Default route | Premium | Implementation | Notes |
|-----------|-----|---------------|---------|----------------|-------|
| המרת פורמט תמונה | `image-converter` | `/jpg-to-png` | Free | **Mock** (generic `ToolPage`) | 7→6 format matrix: JPG, PNG, WEBP, GIF, BMP, TIFF, SVG in; SVG excluded as output. **42** pairwise slugs; overlaps deduped in sitemap |
| דחיסת תמונה | `image-compressor` | `/image-compressor` | Free | **Client real** | Canvas `toBlob`; quality slider. Custom component |
| שינוי גודל תמונה | `image-resizer` | `/image-resizer` | Free | **Client real** | Canvas resize; social presets. Custom component |
| PNG ל-ICO | `png-to-ico` | `/png-to-ico` | Free | **Mock** | Single slug; favicon use case |
| SVG ל-PNG | `svg-to-png` | `/svg-to-png` | Free | **Mock** | Single slug |

**Popular** (homepage): image-converter, image-compressor.

### Video (2 tools, 21 slugs)

| Name (HE) | ID | Default route | Premium | Implementation | Notes |
|-----------|-----|---------------|---------|----------------|-------|
| המרת פורמט וידאו | `video-converter` | `/mp4-to-avi` | **Yes** | **Mock** + premium lock | MP4, AVI, MOV, MKV, WEBM — 20 pairwise slugs |
| דחיסת וידאו | `video-compressor` | `/video-compressor` | **Yes** | **Mock** + premium lock | `customComponent: "video-compressor"` but **no dedicated component** — falls through to generic `ToolPage` mock flow. Also `mov-to-mp4` slug |

### Audio (1 tool, 20 slugs)

| Name (HE) | ID | Default route | Premium | Implementation | Notes |
|-----------|-----|---------------|---------|----------------|-------|
| המרת פורמט אודיו | `audio-converter` | `/mp3-to-wav` | Free | **Mock** | MP3, WAV, AAC, OGG, FLAC — all pairwise slugs |

### Document (4 tools, 11 slugs)

| Name (HE) | ID | Default route | Premium | Implementation | Notes |
|-----------|-----|---------------|---------|----------------|-------|
| PDF ל-Word | `pdf-to-word` | `/pdf-to-docx` | Free | **Mock** | Single slug `pdf-to-docx` |
| Word ל-PDF | `word-to-pdf` | `/docx-to-pdf` | Free | **Mock** | `docx-to-pdf`, `doc-to-pdf` |
| מנהל PDF | `merge-pdf` | `/merge-pdf` | Free | **Client real** | pdf-lib + pdf.js — merge, reorder, rotate pages. `customComponent: "pdf-manager"` |
| כלי טקסט | `text-tools` | `/text-tools` | Free | **Client real** | TXT ↔ MD ↔ HTML via `marked` + `turndown`; word/char counts. Custom component |

### AI (1 tool, 1 slug)

| Name (HE) | ID | Default route | Premium | Implementation | Notes |
|-----------|-----|---------------|---------|----------------|-------|
| יצירת תמונות AI | `ai-image-generator` | `/ai-image-generator` | **Yes** | **Premium UI stub** | `isPremium` hardcoded `false` in component; simulated 3s generation, no real API. Credit packs UI present |

---

## WIP / unlisted tools

### Hebrew OCR (`HebOcrTool`)

| Field | Value |
|-------|-------|
| Component | `src/components/tools/HebOcrTool.tsx` |
| `ToolPage` branch | `tool.customComponent === "heb-ocr"` |
| In `tools-data.ts` | **No** — not in catalog or sitemap |
| Status | **WIP / simulated** — progress timer only; download is a toast stub |
| Planned API | Commented `POST http://localhost:5000/api/ocr` (route **does not exist** in backend) |
| Inputs | PDF, JPG, PNG (handwritten Hebrew / HebHTR positioning) |
| SEO copy | FAQ in `src/lib/tool-seo-content.ts` references “our OCR tool” for scanned PDFs |

To ship: add tool entry to `tools-data.ts`, implement `/api/ocr` (or wire external worker), add translations, regenerate sitemap.

---

## SEO slug breakdown

### How slugs are built

- **Format pairs:** `{from}-to-{to}` via `buildFormatSlug()` — e.g. `jpg-to-png`, `mp3-to-wav`
- **Custom tools:** tool `id` as slug — e.g. `image-compressor`, `merge-pdf`, `ai-image-generator`
- **Deduplication:** `collectToolSlugs()` uses a `Set` — image-compressor/resizer format pairs overlap with `image-converter` and count once

### Slugs by category (unique, post-dedup)

| Category | Slugs | Examples |
|----------|------:|----------|
| Image | 39 | `jpg-to-png`, `webp-to-jpg`, `image-compressor`, `png-to-ico`, `svg-to-png`, … |
| Video | 21 | `mp4-to-avi`, `mov-to-webm`, `video-compressor`, `mov-to-mp4`, … |
| Audio | 20 | `mp3-to-wav`, `flac-to-mp3`, `ogg-to-aac`, … |
| Document | 11 | `pdf-to-docx`, `docx-to-pdf`, `merge-pdf`, `text-tools`, `txt-to-html`, … |
| AI | 1 | `ai-image-generator` |

### Non-tool indexed paths

| Path | Kind |
|------|------|
| `/` | home |
| `/premium`, `/install`, `/privacy`, `/terms`, `/about`, `/contact` | static |
| `/blog` | blog index |
| `/blog/{slug}` | 22 posts |

Sitemap priority: home `1.0`, tools `0.9`, blog index `0.8`, blog posts `0.7`, static `0.5`.

---

## Platform features

### Internationalization (i18n)

- Seven locales; Hebrew is default with **no** `/he` prefix
- Copy in `src/lib/translations/*.ts` (Hebrew canonical for tone)
- RTL layout for Hebrew only (`isRTL()` in `src/lib/i18n.tsx`)
- `<SEOHead>` emits hreflang alternates matching sitemap locale expansion

### Authentication

- Google Identity Services popup → JWT in `localStorage` (`tamir_auth_token`)
- `GET /api/auth/me` — current user (requires auth)
- `POST /api/auth/google` — sign-in / account creation
- Premium checkout **requires** signed-in user

### Freemium & usage

| | Free | Premium |
|---|------|---------|
| Daily conversions | **5** (`MAX_DAILY_FREE` in `usage.routes.ts` + `useUsage.ts`) | Unlimited |
| Ads | Yes (after consent) | Hidden |
| Premium-only tools | Locked | video-converter, video-compressor, ai-image-generator |
| AI credits | — | 6/month + purchasable packs (`credits_10` … `credits_120`) |
| File size (marketing) | 50 MB | 200 MB (FAQ mentions up to 500 MB) |

Anonymous users: session cookie `tamir_sid` for server-side usage counting.

### Billing

- **PayPal** (default): `POST /api/billing/checkout`, `POST /api/billing/paypal/capture-order`, `GET /api/billing/status`, `POST /api/billing/portal`
- **Stripe** (optional `ENABLE_STRIPE=true`): webhook at `POST /api/billing/webhook` only — no separate Stripe checkout routes in app
- Plans: `monthly`, `yearly`; credit packs via `CREDIT_PLANS` in `backend/src/lib/billing-shared.ts`

### Ads (Adsterra)

- Zone keys via `VITE_ADSTERRA_ZONE_*` (never expose Publisher API key in `VITE_*`)
- Loads only after cookie consent (`src/lib/ads/consent.ts`)
- Placements: banner 728×90, sidebar 300×250 (×2), inline 468×60, optional popunder
- Free-tier **two-step download gate** (`src/lib/ads/download-gate.ts`)
- Isolated iframe per ad unit (`buildAdIframeSrcdoc`)

### SEO

- Per-page title, description, canonical, hreflang, OG tags via `<SEOHead>`
- Tool pages: category OG SVGs, `ToolSeoBlocks`, JSON-LD (`WebApplication`, `FAQPage` for top tools)
- Static: `public/robots.txt`, `public/ads.txt`, `public/llms.txt`
- Sitemap regenerated every build (`prebuild` → `scripts/generate-sitemap.ts`)

### Analytics

- GTM **or** GA4 (not both — double-counting risk)
- Consent-gated loading
- Custom events: `tool_view`, `convert_start`, `convert_success`, `file_download`, `paywall_hit`, `upgrade_click`, `purchase`, etc. (`src/lib/analytics/events.ts`)

### Theme

- Light / dark via `next-themes` (`ThemeProvider`, `ThemeToggle`)
- System preference respected

### PWA

- `public/manifest.json` — standalone, RTL, Hebrew default
- Icons: 192×192, 512×512 (maskable)
- `/install` page for “add to home screen”
- `vite-plugin-pwa` in build chain

### Blog

- 21 Hebrew long-form articles in `src/lib/blog-data.ts`
- Each post links to relevant tool slugs
- Route: `/blog`, `/blog/:slug`

### Admin

- Frontend: `/admin` (overview), `/admin/users`, `/admin/tools` — guarded by `AdminGuard` + `ADMIN_EMAILS`
- Backend: `GET/PATCH /api/admin/users`, `GET/PATCH /api/admin/tools`, `GET /api/admin/stats`
- Per-tool `ToolConfig` in DB: enabled, featured, sort order — exposed publicly via `GET /api/tools/config`

### Static pages

| Route | Page |
|-------|------|
| `/premium` | Subscription & credit packs |
| `/install` | PWA install instructions |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |
| `/about` | About |
| `/contact` | Contact |

---

## Backend API reference

| Method | Path | Auth | Status | Purpose |
|--------|------|------|--------|---------|
| GET | `/health` | — | **Live** | Server health |
| POST | `/api/auth/google` | — | **Live** | Google sign-in |
| GET | `/api/auth/me` | JWT | **Live** | Current user profile |
| POST | `/api/conversions` | — | **501** | File conversion pipeline (not wired) |
| GET | `/api/conversions/health` | — | **Live** | Conversions service ping |
| GET | `/api/tools/config` | — | **Live** | Public tool enable/featured/sort |
| GET | `/api/usage/today` | optional | **Live** | Daily usage count |
| POST | `/api/usage/record` | optional | **Live** | Log a conversion |
| POST | `/api/billing/checkout` | JWT | **Live** | Start PayPal checkout |
| POST | `/api/billing/paypal/capture-order` | JWT | **Live** | Complete PayPal order |
| GET | `/api/billing/status` | JWT | **Live** | Subscription + credits |
| POST | `/api/billing/portal` | JWT | **Live** | PayPal manage subscription |
| POST | `/api/billing/paypal/webhook` | — | **Live** | PayPal IPN/webhook |
| POST | `/api/billing/webhook` | — | **Live** (if Stripe enabled) | Stripe webhook |
| GET | `/api/admin/stats` | admin | **Live** | Dashboard metrics |
| GET | `/api/admin/users` | admin | **Live** | User list |
| PATCH | `/api/admin/users/:id` | admin | **Live** | Block/unblock, roles |
| GET | `/api/admin/tools` | admin | **Live** | Tool config list |
| PATCH | `/api/admin/tools/:toolId` | admin | **Live** | Enable/feature/sort tools |
| POST | `/api/ocr` | — | **Not implemented** | Referenced only in `HebOcrTool` comments |

Production serves Vite `dist/` + `/api/*` from one Express process (Plesk monolith). See [plesk-node-deploy.md](./plesk-node-deploy.md).

---

## Quick reference: what actually converts files today?

| Works in browser (real output) | Simulated / API pending |
|-------------------------------|-------------------------|
| Image compress | All format-pair converters (image, video, audio, document) |
| Image resize | Video compress |
| PDF manager (merge/rotate/reorder) | PNG→ICO, SVG→PNG |
| Text tools (TXT/MD/HTML) | AI image generator |
| | Hebrew OCR (WIP) |

Until `POST /api/conversions` is implemented, production generic tools need `VITE_USE_MOCK_CONVERSION=true` for any UX beyond the 501 error toast — which still does not transform file bytes.

---

## Related files

| Concern | Path |
|---------|------|
| Tool catalog | `src/lib/tools-data.ts` |
| Sitemap paths | `src/lib/sitemap-paths.ts` |
| Tool page / routing | `src/pages/ToolPage.tsx`, `src/App.tsx` |
| Custom tool UIs | `src/components/tools/` |
| Backend tool IDs | `backend/src/data/tool-catalog.ts` |
| Feature flags | `src/lib/feature-flags.ts` |
| Agent quick start | [AGENTS.md](../AGENTS.md) |
