# Google Analytics setup for Tamir.li

This guide covers everything **you** must configure in Google’s UI. The codebase already wires Consent Mode v2, GTM injection (after consent), funnel events, and SPA `page_view` tracking.

## Environment variables

Copy `.env.example` to `.env.production.local` (or `.env.development.local` for local testing) and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GTM_ID` | **Recommended** | GTM container ID, e.g. `GTM-ABC1234` |
| `VITE_GA4_ID` | Optional | GA4 measurement ID, e.g. `G-XXXXXXXXXX`. **Only use if you are NOT using GTM.** If `VITE_GTM_ID` is set, configure GA4 inside GTM instead (avoids double counting). |
| `VITE_SITE_ORIGIN` | Recommended | `https://tamir.li` — used for canonical URLs |

Rebuild/redeploy after changing env vars (`npm run build`).

---

## Step 1: Create a GA4 property for tamir.li

1. Go to [Google Analytics](https://analytics.google.com/).
2. **Admin** (gear) → **Create** → **Property**.
3. Property name: `Tamir.li`, reporting time zone: **Israel**, currency: **ILS**.
4. Create a **Web** data stream:
   - Website URL: `https://tamir.li`
   - Stream name: `Tamir.li Web`
5. Copy the **Measurement ID** (`G-XXXXXXXXXX`). You will use it in GTM (Step 3), not necessarily in `.env` if everything goes through GTM.

---

## Step 2: Create a GTM container

1. Go to [Google Tag Manager](https://tagmanager.google.com/).
2. **Create Account** (e.g. `Tamir.li`) → **Container** name `tamir.li`, target platform **Web**.
3. Copy the **Container ID** (`GTM-XXXXXXX`) → set `VITE_GTM_ID` in your `.env`.
4. GTM loads **only after** the user accepts analytics cookies (see `src/lib/ads/consent.ts`). Consent Mode defaults are denied in `index.html` before any tags run.

---

## Step 3: Configure tags in GTM (click-by-click)

Open [tagmanager.google.com](https://tagmanager.google.com/) → select container **GTM-5GH9HV38**.

> **Consent is already handled in code** (`index.html` sets Consent Mode defaults; the cookie banner grants `analytics_storage` before GTM loads). You only need to require `analytics_storage` on each tag below.

### 3a. GA4 Configuration tag (one time)

1. Left sidebar → **Tags** → **New**.
2. Tag type → **Google Analytics: GA4 Configuration**.
3. **Measurement ID**: `G-EBE6D6BPZ0`
4. Expand **Configuration settings** → add row: `send_page_view` = `false` (the app sends `page_view` via dataLayer on route changes).
5. **Triggering** → **Consent Initialization – All Pages**.
6. Tag **Consent settings** (gear icon or Advanced Settings) → **Require additional consent for tag to fire** → check **analytics_storage**.
7. Name the tag `GA4 - Configuration` → **Save**.

### 3b. Custom Event trigger (repeat for each event)

For **each** event name in the table below, do this once:

1. Left sidebar → **Triggers** → **New**.
2. Trigger type → **Custom Event**.
3. **Event name**: copy from the **Event name** column (exact match, e.g. `page_view`).
4. Name the trigger `CE - <event name>` (e.g. `CE - page_view`) → **Save**.

| Event name (type exactly) |
|---------------------------|
| `page_view` |
| `tool_view` |
| `file_upload` |
| `convert_start` |
| `convert_success` |
| `paywall_hit` |
| `upgrade_click` |
| `begin_checkout` |
| `purchase` |
| `file_download` |
| `file_download_all` |
| `ad_click_download` |

### 3c. GA4 Event tag (one per trigger)

For **each** trigger from 3b:

1. **Tags** → **New**.
2. Tag type → **Google Analytics: GA4 Event**.
3. **Configuration Tag** → select `GA4 - Configuration`.
4. **Event Name** → same as the trigger (e.g. `page_view`).
5. **Triggering** → select the matching `CE - …` trigger.
6. **Consent settings** → require **analytics_storage**.
7. Name `GA4 - <event name>` → **Save**.

**Optional — event parameters** (Variables → New → Data Layer Variable, then map in each tag):

| Variable name | Data Layer Variable Name |
|---------------|--------------------------|
| `dlv - tool_id` | `tool_id` |
| `dlv - slug` | `slug` |
| `dlv - file_count` | `file_count` |
| `dlv - plan` | `plan` |
| `dlv - source` | `source` |
| `dlv - type` | `type` |
| `dlv - page_type` | `page_type` |
| `dlv - blog_slug` | `blog_slug` |
| `dlv - page_path` | `page_path` |

For `page_view`, add parameters: `page_path` → `{{dlv - page_path}}`, `page_type` → `{{dlv - page_type}}`, `blog_slug` → `{{dlv - blog_slug}}`, `slug` → `{{dlv - slug}}`.

### 3d. Publish

1. Top right → **Submit**.
2. Version name e.g. `GA4 funnel tags` → **Publish**.

---

## Step 4: Events emitted by the codebase (reference)

| Event | Where | Parameters |
|-------|-------|------------|
| `page_view` | SPA route changes | `page_path`, `page_location`, `page_title`, `page_type`, `blog_slug`, `slug` |
| `tool_view` | Tool pages | `tool_id`, `slug` |
| `file_upload` | Tool upload | `tool_id`, `file_count` |
| `convert_start` | Conversion start | `tool_id`, `format`, etc. |
| `convert_success` | Conversion done | `tool_id`, `format`, `duration_ms` |
| `paywall_hit` | Limit / premium gate | `tool_id`, `type` (`daily_limit` \| `premium_tool`) |
| `upgrade_click` | Premium CTA | `plan`, `source` |
| `begin_checkout` | Stripe checkout start | `plan`, `source` |
| `purchase` | Stripe return URL | `plan`, `source` |
| `file_download` | Download click | `tool_id`, `file_index` |
| `file_download_all` | Download all | `tool_id`, `file_count` |
| `ad_click_download` | Ad-gated download | `file_index`, `method` |

---

## Step 5: Link AdSense (separate from GA4)

AdSense and GA4 are **separate** Google products.

1. Apply at [Google AdSense](https://www.google.com/adsense/) with site `https://tamir.li`.
2. After approval, copy **Publisher ID** (`ca-pub-…`) and ad unit slot IDs.
3. Set in `.env`:
   - `VITE_ADSENSE_CLIENT`
   - `VITE_ADSENSE_SLOT_*` (banner, sidebar, inline, etc.)
4. AdSense script loads only when the user accepts **ads** cookies (`saveConsent(true, true)` grants both analytics and ad storage).
5. Optional in GTM: AdSense does not require a GTM tag if you use the built-in `src/lib/ads/adsense.ts` loader.

---

## Step 6: Google Search Console verification

1. Go to [Google Search Console](https://search.google.com/search-console).
2. **Add property** → URL prefix `https://tamir.li`.
3. Verification options:
   - **HTML tag**: add the meta tag to `index.html` `<head>` (one-time deploy), or
   - **DNS TXT** record at your domain registrar (no code change).
4. Submit sitemap: `https://tamir.li/sitemap.xml` (generated at build via `npm run generate:sitemap`).

---

## Testing with GA4 DebugView

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) Chrome extension, **or** add `debug_mode: true` temporarily to your GA4 Configuration tag.
2. Open the site locally or staging with `VITE_GTM_ID` set.
3. Accept cookies (analytics + ads).
4. GA4 → **Admin** → **DebugView** — confirm:
   - `page_view` on home, blog, tool pages
   - `tool_view`, `file_upload`, `convert_start`, `convert_success` when using a tool
   - `paywall_hit`, `upgrade_click`, `begin_checkout` on premium flow
5. GTM **Preview** mode: connect to your URL and watch Tags Fired on each dataLayer event.

### GTM Preview checklist

- [ ] Consent defaults show `analytics_storage: denied` before accept
- [ ] After accept, `GA4 - Configuration` fires
- [ ] `page_view` fires on navigation
- [ ] Custom events appear in dataLayer (browser console: `dataLayer`)

---

## Optional: GTM container template

See `docs/gtm-container-template.json` for a simplified reference export (measurement ID `G-EBE6D6BPZ0`). Import via GTM Admin → Import, or recreate manually from Step 3 above.

---

## Code reference (already implemented)

| File | Role |
|------|------|
| `index.html` | Consent Mode v2 defaults (`denied` until user acts) |
| `src/lib/analytics/gtm.ts` | GTM + optional direct GA4 injection after consent |
| `src/lib/analytics/events.ts` | `trackEvent`, `trackPageView`, event name constants |
| `src/lib/ads/consent.ts` | Cookie choice persistence, consent updates, script loading |
| `src/components/CookieConsent.tsx` | Accept (analytics + ads) / Reject all |
| `src/components/AnalyticsPageTracker.tsx` | SPA `page_view` on route change |
| `src/pages/ToolPage.tsx` | Tool funnel events |
| `src/pages/PremiumPage.tsx` | Checkout / purchase events |

---

## Quick start checklist

1. [ ] Create GA4 property + web stream → copy `G-…`
2. [ ] Create GTM container → copy `GTM-…` → `VITE_GTM_ID`
3. [ ] Add GA4 Configuration tag + consent requirement in GTM
4. [ ] Add Custom Event triggers + GA4 Event tags for funnel
5. [ ] Publish GTM container
6. [ ] Set `VITE_SITE_ORIGIN=https://tamir.li` and deploy
7. [ ] Verify in GA4 DebugView + GTM Preview
8. [ ] (Separate) AdSense approval + `VITE_ADSENSE_*` env vars
9. [ ] (Separate) Search Console verification + sitemap
