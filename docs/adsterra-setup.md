# Adsterra setup — tamir.li

Display ads use **zone keys** from the Adsterra publisher dashboard (script embed). The Publisher API is for stats/management — not required for showing banners in this React app.

## 1. Add your site in Adsterra

1. Log in at [adsterra.com](https://adsterra.com) → **Websites** → **Add website**.
2. Enter `https://tamir.li`, category, and request ad units.
3. After approval, create **separate banner units** for each size/placement (Adsterra requires a unique key per placement on SPAs).

Recommended sizes for this app:

| Placement | Size | Env var |
|-----------|------|---------|
| Top/bottom banners | 728×90 | `VITE_ADSTERRA_ZONE_BANNER` |
| Desktop sidebar rails | 300×250 | `VITE_ADSTERRA_ZONE_SIDEBAR`, `VITE_ADSTERRA_ZONE_SIDEBAR_2` |
| Inline / vignette | 468×60 (or 300×250) | `VITE_ADSTERRA_ZONE_INLINE` |
| Native (mid-content) | Native script + container id | `VITE_ADSTERRA_NATIVE_SCRIPT_URL`, `VITE_ADSTERRA_NATIVE_CONTAINER_ID` |
| Popunder (optional) | Popunder script URL | `VITE_ADSTERRA_POPUNDER_SCRIPT_URL` |

From each unit’s embed code, copy the **`key`** value (hex string in `atOptions`).

If the script URL host differs from `www.highperformanceformat.com`, set:

```env
VITE_ADSTERRA_INVOKE_HOST=www.highperformanceformat.com
```

## 2. Local env (never commit secrets)

Add to `.env.development.local` (see `.env.example`):

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

Restart `npm run dev` after changing env vars.

**Note:** Do not put your Adsterra API key in `VITE_*` vars — it would be exposed in the browser bundle. API keys are for server-side reporting only.

## 3. Production / CI

Set GitHub Actions secrets (or Plesk env) matching the `VITE_ADSTERRA_*` names in `.github/workflows/deploy-plesk.yml`.

Docker builds: pass the same vars as build args (see `docker/web/Dockerfile` and `.env.docker.example`).

## 4. ads.txt

Replace `public/ads.txt` with the authorization line(s) from Adsterra (Partner Care or dashboard). Deploy so `https://tamir.li/ads.txt` is reachable.

## 5. How placements work in the app

- **Banner** (`type="banner"`): home, blog, tool footers — 728×90 iframe.
- **Sidebar** (`type="sidebar"`): `DesktopAdRail` (two sticky 300×250 units); second rail uses `VITE_ADSTERRA_ZONE_SIDEBAR_2` when `slotId` ends with `-2`.
- **Inline** (`type="inline"`): mid-page tool/blog slots and conversion vignette overlay.
- **Native** (`AdNativeSlot`): one mid-content unit per page (home, tool, blog index/post) — script + container id from dashboard; loads after consent.
- **Popunder**: loaded once after ad cookie consent if `VITE_ADSTERRA_POPUNDER_SCRIPT_URL` is set; also triggered on some conversion milestones via `triggerInterstitial()`.
- **Premium users**: all ad components return `null`; no scripts loaded.
- **No consent / unset env**: muted placeholders only; no broken layout.

Implementation: each live unit renders in an isolated `<iframe srcDoc=…>` so multiple `atOptions` scripts do not conflict (standard React SPA pattern for Adsterra).

## 6. Migration from Google AdSense

| AdSense | Adsterra |
|---------|----------|
| `VITE_ADSENSE_CLIENT` | Not needed (per-zone keys) |
| `VITE_ADSENSE_SLOT_BANNER` | `VITE_ADSTERRA_ZONE_BANNER` |
| `VITE_ADSENSE_SLOT_SIDEBAR` | `VITE_ADSTERRA_ZONE_SIDEBAR` + `VITE_ADSTERRA_ZONE_SIDEBAR_2` |
| `VITE_ADSENSE_SLOT_INLINE` | `VITE_ADSTERRA_ZONE_INLINE` |
| `VITE_ADSENSE_SLOT_INTERSTITIAL` / `ANCHOR` | `VITE_ADSTERRA_POPUNDER_SCRIPT_URL` (optional) |
| `google.com, pub-…` in ads.txt | Adsterra-provided ads.txt line |

Remove old `VITE_ADSENSE_*` secrets from GitHub/Plesk after switching.
