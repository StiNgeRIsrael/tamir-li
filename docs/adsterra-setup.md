# Adsterra setup — tamir.li

Display ads use **zone keys** from the Adsterra publisher dashboard (script embed). The Publisher API is for stats/management — not required for showing banners in this React app.

## 1. Add your site in Adsterra

1. Log in at [adsterra.com](https://adsterra.com) → **Websites** → **Add website**.
2. Enter `https://tamir.li`, category, and request ad units.
3. After approval, create **separate banner units** for each size/placement (Adsterra requires a unique key per placement on SPAs).

Recommended sizes for this app:

| Placement | Size | Admin field |
|-----------|------|-------------|
| Top/bottom banners | 728×90 | `zoneBanner` |
| Desktop sidebar rails | 300×250 | `zoneSidebar`, `zoneSidebar2` |
| Inline / vignette | 468×60 (or 300×250) | `zoneInline` |
| Native (mid-content) | Native script + container id | `nativeScriptUrl`, `nativeContainerId` |
| Popunder (optional) | Popunder script URL | `popunderScriptUrl` |

From each unit’s embed code, copy the **`key`** value (hex string in `atOptions`).

If the script URL host differs from `www.highperformanceformat.com`, set **Invoke host** in admin (or `VITE_ADSTERRA_INVOKE_HOST` locally).

## 2. Production — admin panel (primary)

After deploy, sign in as admin and open **`/admin/ads`** (Hebrew: `/admin/ads`, other locales: `/en/admin/ads`, etc.).

Paste zone keys and script URLs from the Adsterra dashboard → **Save**. Settings are stored in MySQL (`AdSettings` table) and served at runtime via `GET /api/ads/config` — **no rebuild required** when keys change.

Requires:

- `DATABASE_URL` in Plesk custom env (migration `20260624120000_ad_settings` runs on app restart)
- Admin role (`ADMIN_EMAILS` + Google sign-in)

## 3. Local dev — optional `VITE_*` fallback

For local development without the API, add to `.env.development.local` (see `.env.example`):

```env
VITE_ADSTERRA_ZONE_BANNER=your_728x90_key
VITE_ADSTERRA_ZONE_SIDEBAR=your_300x250_key
VITE_ADSTERRA_ZONE_SIDEBAR_2=your_second_300x250_key
VITE_ADSTERRA_ZONE_INLINE=your_inline_key
VITE_ADSTERRA_NATIVE_SCRIPT_URL=https://example.adsterra-cdn.com/your_native_key/invoke.js
VITE_ADSTERRA_NATIVE_CONTAINER_ID=container-your_native_key
# Optional:
# VITE_ADSTERRA_POPUNDER_SCRIPT_URL=https://...
# VITE_ADSTERRA_INVOKE_HOST=www.highperformanceformat.com
```

Restart `npm run dev` after changing env vars. Runtime DB config takes precedence when `VITE_API_URL` points at a backend with saved settings.

**Note:** Do not put your Adsterra API key in `VITE_*` vars — it would be exposed in the browser bundle. API keys are for server-side reporting only.

## 4. CI / legacy build-time secrets (optional)

GitHub Actions can still pass `VITE_ADSTERRA_*` into `npm run build` via [`deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml) as a fallback when the DB row is empty. **Prefer `/admin/ads`** for production — avoids redeploy on key rotation.

## 5. ads.txt

Replace `public/ads.txt` with the authorization line(s) from Adsterra (Partner Care or dashboard). Deploy so `https://tamir.li/ads.txt` is reachable.

## 6. How placements work in the app

- **Banner** (`type="banner"`): home, blog, tool footers — 728×90 iframe.
- **Sidebar** (`type="sidebar"`): `DesktopAdRail` (two sticky 300×250 units); second rail uses `zoneSidebar2` when `slotId` ends with `-2`.
- **Inline** (`type="inline"`): mid-page tool/blog slots and conversion vignette overlay.
- **Native** (`AdNativeSlot`): one mid-content unit per page (home, tool, blog index/post) — script + container id from dashboard; loads after consent.
- **Popunder**: loaded once after ad cookie consent if `popunderScriptUrl` is set; also triggered on some conversion milestones via `triggerInterstitial()`.
- **Premium users**: all ad components return `null`; no scripts loaded.
- **No consent / unset config**: muted placeholders only; no broken layout.

Implementation: each live unit renders in an isolated `<iframe srcDoc=…>` so multiple `atOptions` scripts do not conflict (standard React SPA pattern for Adsterra).

## 7. Migration from Google AdSense

| AdSense | Adsterra |
|---------|----------|
| `VITE_ADSENSE_CLIENT` | Not needed (per-zone keys) |
| `VITE_ADSENSE_SLOT_BANNER` | `zoneBanner` (admin) |
| `VITE_ADSENSE_SLOT_SIDEBAR` | `zoneSidebar` + `zoneSidebar2` |
| `VITE_ADSENSE_SLOT_INLINE` | `zoneInline` |
| `VITE_ADSENSE_SLOT_INTERSTITIAL` / `ANCHOR` | `popunderScriptUrl` (optional) |
| `google.com, pub-…` in ads.txt | Adsterra-provided ads.txt line |

Remove old `VITE_ADSENSE_*` secrets from GitHub/Plesk after switching.

## 8. API reference

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/ads/config` | Public | Runtime zone keys for frontend |
| `GET /api/admin/ads/settings` | Admin | Same fields for admin form |
| `PATCH /api/admin/ads/settings` | Admin | Update any subset of fields |
