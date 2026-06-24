# Google Analytics setup for Tamir.li

Production uses **direct GA4** via `gtag.js` and measurement ID **`G-EBE6D6BPZ0`**. The codebase wires **Google Consent Mode v2**: gtag loads on app boot, storage defaults to denied, and the cookie banner unlocks full measurement on accept. SPA `page_view` and funnel events fire immediately (cookieless pings while denied).

> **Do not enable both `VITE_GTM_ID` and `VITE_GA4_ID`** — that double-counts. Use direct GA4 **or** GTM, not both.

---

## Deploy requirement (Plesk / CI)

`VITE_GA4_ID` is baked in at **build time**. Set it before every production build:

```bash
VITE_GA4_ID=G-EBE6D6BPZ0 npm run build
```

On **Plesk Node.js**: add `VITE_GA4_ID=G-EBE6D6BPZ0` to the environment variables used by the build step (or `.env.production.local` on the build host). Rebuild and redeploy after changing it.

| Variable | Production value | Required |
|----------|------------------|----------|
| `VITE_GA4_ID` | `G-EBE6D6BPZ0` | **Yes** (direct GA4 mode) |
| `VITE_GTM_ID` | — | **No** — leave unset when using direct GA4 |
| `VITE_SITE_ORIGIN` | `https://tamir.li` | Recommended |

---

## How consent works

1. `index.html` sets Consent Mode v2 defaults (`analytics_storage: denied`, `ad_storage: denied`, `wait_for_update: 500`) before any Google scripts load.
2. `main.tsx` calls `bootAnalytics()` — when `VITE_GA4_ID` is set (and `VITE_GTM_ID` is not), `gtag.js` injects immediately.
3. Cookie banner (`CookieConsent`) calls `saveConsent(analytics, ads)` → `gtag('consent', 'update', …)`.
4. **Before accept:** GA4 sends cookieless pings and modeled data; no analytics cookies.
5. **After accept:** `analytics_storage: granted` — full cookies, user stitching (`user_id`), and enhanced signals.
6. **Adsterra** scripts load only when `ads: true` (`ad_storage` granted) — unchanged.
7. SPA route changes fire `page_view` on every navigation via `AnalyticsPageTracker` (works in both denied and granted states).
8. **GTM path** (`VITE_GTM_ID` only): container still loads after analytics consent (not on boot).

---

## GA4 Admin — enable enhanced measurement

In [Google Analytics](https://analytics.google.com/) → **Admin** → **Data streams** → **Tamir.li Web** → **Enhanced measurement**, enable:

- Page views (supplemental — app sends manual SPA `page_view`)
- Scrolls
- Outbound clicks
- Site search
- Form interactions
- File downloads
- Video engagement

Direct `gtag` config uses `send_page_view: false` (SPA sends manual `page_view`). Consent Mode controls storage — no `allow_google_signals` override before consent.

---

## Event inventory (sent to GA4)

| Event | GA4 type | Where | Parameters |
|-------|----------|-------|------------|
| `page_view` | Recommended | SPA route changes | `page_path`, `page_location`, `page_title`, `page_type`, `blog_slug`, `slug` |
| `tool_view` | Custom | Tool pages | `tool_id`, `slug` |
| `file_upload` | Custom | Tool upload | `tool_id`, `file_count` |
| `convert_start` | Custom | Conversion / custom tool start | `tool_id`, `format`, `source` |
| `convert_success` | Custom | Conversion done | `tool_id`, `format`, `duration_ms`, `source` |
| `paywall_hit` | Custom | Limit / premium gate | `tool_id`, `type` (`daily_limit` \| `premium_tool`) |
| `upgrade_click` | Custom | Premium CTA | `plan`, `source` |
| `view_promotion` | **Recommended** | Premium page / exit modal | `promotion_name`, `creative_name`, `location_id`, `plan`, `currency`, `value` |
| `begin_checkout` | **Recommended** | Checkout start | `plan`, `source`, `currency`, `value`, `items` |
| `purchase` | **Recommended** | PayPal return | `plan`, `source`, `transaction_id`, `currency`, `value`, `items` |
| `file_download` | Recommended / custom | Download click | `tool_id`, `file_index`, `source` |
| `file_download_all` | Custom | Download all | `tool_id`, `file_count` |
| `ad_click_download` | Custom | Ad-gated download step 1 | `file_index`, `method`, `tool_id` |
| `sign_up` | **Recommended** | First Google sign-in | `method` (`google`) |
| `login` | **Recommended** | Returning Google sign-in | `method` (`google`) |
| `sign_out` | Custom | Sign out | `method` |
| `cookie_consent` | Custom | User accepts cookies | `analytics`, `ads` |
| `ai_generate_start` | Custom | AI image gen start | `tool_id`, `style`, `aspect_ratio` |
| `ai_generate_success` | Custom | AI image gen success | `tool_id`, `style`, `aspect_ratio` |

`page_type` values: `home`, `blog_index`, `blog_post`, `premium`, `tool`, `other`.

---

## Testing with GA4 DebugView

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) Chrome extension.
2. Set `VITE_GA4_ID=G-EBE6D6BPZ0` locally (`.env.development.local`).
3. Run `npm run dev`, open the site — **before** accepting cookies, check Network for `google-analytics.com/g/collect` (cookieless pings).
4. Accept cookies → `analytics_storage: granted`; confirm richer events in DebugView.
5. Browser console: `dataLayer` shows events immediately after gtag loads.

### Checklist

- [ ] Consent defaults show `analytics_storage: denied` before accept
- [ ] `gtag.js` loads on page load (`ga4-script` in DOM) — not waiting for banner
- [ ] Cookieless `page_view` / pings before accept
- [ ] After accept, full measurement + `user_id` on sign-in
- [ ] `tool_view`, `file_upload`, `convert_start`, `convert_success` on a tool
- [ ] `paywall_hit`, `upgrade_click`, `view_promotion`, `begin_checkout` on premium flow
- [ ] `login` / `sign_up` after Google sign-in
- [ ] `purchase` after PayPal return URL

---

## Optional: GTM instead of direct GA4

If you prefer GTM, set `VITE_GTM_ID` and **unset** `VITE_GA4_ID`. Configure GA4 Configuration tag with measurement ID `G-EBE6D6BPZ0` inside GTM. See legacy GTM steps in git history or `docs/gtm-container-template.json`.

---

## Code reference

| File | Role |
|------|------|
| `index.html` | Consent Mode v2 defaults |
| `src/main.tsx` | `bootAnalytics()` then `applyStoredConsent()` on app boot |
| `src/lib/analytics/gtm.ts` | `bootAnalytics()` (GA4 on load), GTM after consent, `updateConsentMode` |
| `src/lib/analytics/events.ts` | `trackEvent` — fires when GA4/GTM active (cookieless OK) |
| `src/lib/analytics/purchase.ts` | Ecommerce `value` / `items` for checkout events |
| `src/lib/ads/consent.ts` | Cookie persistence, script loading |
| `src/components/CookieConsent.tsx` | Accept / reject banner |
| `src/components/AnalyticsPageTracker.tsx` | SPA `page_view` |
| `src/pages/ToolPage.tsx` | Tool funnel events |
| `src/pages/PremiumPage.tsx` | Checkout / purchase events |
| `src/contexts/AuthContext.tsx` | `login`, `sign_up`, `sign_out`, `user_id` |
| `src/lib/custom-tool-freemium.ts` | Custom tool convert / download events |

---

## Quick start checklist

1. [ ] GA4 property exists with web stream `G-EBE6D6BPZ0`
2. [ ] Enhanced measurement enabled in GA4 Admin
3. [ ] `VITE_GA4_ID=G-EBE6D6BPZ0` set at build on Plesk/CI
4. [ ] `VITE_GTM_ID` **not** set (direct GA4 mode)
5. [ ] `VITE_SITE_ORIGIN=https://tamir.li` and deploy
6. [ ] Verify in GA4 DebugView
7. [ ] (Separate) Search Console verification + sitemap
