# Google AdSense setup — tamir.li

Publisher ID: `ca-pub-4410150504570814`

## Ad units created (2026-06-19)

| Placement | Unit name | Slot ID (`data-ad-slot`) | Format |
|-----------|-----------|--------------------------|--------|
| Banner | `tamir.li-banner` | `2357143553` | Display, responsive (`auto`) |
| Sidebar | `tamir.li-sidebar` | `9767740037` | Display, fixed 300×250 |
| Inline | `tamir.li-inline` | `2660395883` | In-article (`in-article`, fluid) |

Env vars (`.env.development.local` / `.env.production.local`):

```env
VITE_ADSENSE_CLIENT=ca-pub-4410150504570814
VITE_ADSENSE_SLOT_BANNER=2357143553
VITE_ADSENSE_SLOT_SIDEBAR=9767740037
VITE_ADSENSE_SLOT_INLINE=2660395883
```

Optional (not created yet): `VITE_ADSENSE_SLOT_INTERSTITIAL`, `VITE_ADSENSE_SLOT_ANCHOR` — enable via **Ads → By site → tamir.li → Overlay formats** (פורמטים שמוצגים בשכבת-על) after site approval.

## Site status in AdSense

| Site | Approval | ads.txt | Notes |
|------|----------|---------|-------|
| `tamir.li` | **Requires review** (נדרשת בדיקה) | **Not found** (לא נמצא) | Added 2026-06-19; ownership verification pending |
| `mc-servers.co.il` | Requires review | Not found | Legacy site on same account |

### Account onboarding blockers

1. **Connect site** — Home → Sites card “קישור האתר שלך” (required). Complete ownership verification:
   - **Recommended:** `ads.txt` at `https://tamir.li/ads.txt` (file already in `public/ads.txt`).
   - Or AdSense script snippet / meta tag on `<head>`.
   - Check “I’ve placed the code” → **Verify** → **Request review**.
2. **Payment details** — Yellow banner: add payment info to activate earning.
3. **Site not live** — AdSense preview cannot load `tamir.li` until DNS/hosting serves the app. Deploy with `public/ads.txt` at root.

## Auto ads

- **Ads → By site → tamir.li:** Auto ads toggle is **ON** (מודעות אוטומטיות).
- Overlay formats (anchor, vignette) available under “פורמטים שמוצגים בשכבת-על” once site is crawlable.
- Auto optimize moved to Google Ads (dismiss “הבנתי” notice).

## ads.txt

Repo file `public/ads.txt`:

```
google.com, pub-4410150504570814, DIRECT, f08c47fec0942fa0
```

After deploy, confirm at `https://tamir.li/ads.txt`. AdSense may take hours to re-crawl.

## Local verification (`localhost:8080`)

1. Ensure `.env.development.local` has slot IDs (see above).
2. Restart Vite dev server after env changes: `npm run dev -- --host 127.0.0.1 --port 8080`
3. Accept cookie consent (ads category).
4. Check DevTools → Network for `googleads.g.doubleclick.net` iframes with `slotname=` matching banner/sidebar/inline IDs.

**Note:** Test/fill ads may show on localhost before `tamir.li` is approved; production fill depends on approval.

## AdSense UI navigation (Hebrew account)

| English | Hebrew in UI |
|---------|----------------|
| Ads | מודעות |
| By ad unit | לפי יחידת מודעות |
| By site | לפי אתר |
| Sites | אתרים |
| Display ads | מודעות לרשת המדיה |
| In-article | מודעות בגוף המאמר |
| Get code | לקבלת קוד |

Direct URLs (replace pub ID if needed):

- Ad units: `https://adsense.google.com/adsense/u/1/pub-4410150504570814/myads/units`
- Sites list: `https://adsense.google.com/adsense/u/1/pub-4410150504570814/sites/list`
- Site auto ads: `https://adsense.google.com/adsense/u/1/pub-4410150504570814/myads/sites/preview?url=tamir.li`

## Remaining manual steps

1. Deploy `tamir.li` with `ads.txt` at domain root.
2. In AdSense **Sites → tamir.li** → verify ownership (ads.txt method) → **Request review**.
3. Complete payment profile if banner persists.
4. Wait for approval (typically days–2 weeks).
