# Android Play Console setup — Tamir.li

Operator checklist for publishing the Capacitor app (`li.tamir.app`). Cursor implements code; you complete these console steps.

## Session A (~20 min) — Developer account + app

1. [Play Console signup](https://play.google.com/console/signup) — pay **$25** one-time fee
2. **Create app**
   - Name: **תמיר לי | Tamir.li**
   - Default language: **Hebrew**
   - App: **Free** (Premium is in-app subscription)
   - Category: **Tools** or **Productivity**
3. Paste package name to Cursor: `li.tamir.app`

## Session B (~20 min) — AdMob

1. [admob.google.com](https://admob.google.com) → **Apps** → Add app → Android → `li.tamir.app`
2. Create ad units: **Banner**, **Interstitial**, **Rewarded**
3. Paste into GitHub secrets / `.env.production.local` (see [`admob-setup.md`](./admob-setup.md)):
   - `VITE_ADMOB_APP_ID`
   - `VITE_ADMOB_SLOT_BANNER`
   - `VITE_ADMOB_SLOT_INTERSTITIAL`
   - `VITE_ADMOB_SLOT_REWARDED`
4. AdMob → **Blocking controls** → block sensitive categories

## Session C (~20 min) — Play Billing + API

1. Play Console → **Monetize** → **Subscriptions**:
   - `tamir_premium_monthly` — ₪4.90/month
   - `tamir_premium_yearly` — ₪47.04/year
2. **In-app products** (optional): `credits_10`, `credits_30`, `credits_60`, `credits_120`
3. **Setup** → **API access** → link Google Cloud project → create **service account**
4. Download JSON → store as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` on API server
5. Enable **Real-time developer notifications** (Pub/Sub) → point to `https://tamir.li/api/billing/google/rtdn`

## Build & upload AAB

1. Copy `android/keystore.properties.example` → `android/keystore.properties` and create release keystore (see file comments).
2. Update [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json) with keystore SHA-256, deploy site.

```bash
npm run cap:sync
cd android && ./gradlew bundleRelease
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` to **Internal testing**.

## Store listing (minimum)

| Asset | Spec |
|-------|------|
| Icon | 512×512 — use `public/pwa-512x512.png` |
| Feature graphic | 1024×500 |
| Screenshots | 2+ phone captures |
| Short description | ≤80 chars — e.g. המרת קבצים מהירה — תמונות, PDF, וידאו |
| Privacy policy | https://tamir.li/privacy |

## Data safety form

Declare: Google Sign-In (email), GTM analytics, AdMob advertising ID, files processed locally/not stored.

## Digital Asset Links

After generating signing keystore, update [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json) with SHA-256 fingerprint:

```bash
keytool -list -v -keystore your-release.keystore -alias your-alias
```

Deploy site, verify at [Digital Asset Links tool](https://developers.google.com/digital-asset-links/tools/generator).

## Rollout

```
Internal testing → Closed testing → Production
```

Play Store URL: https://play.google.com/store/apps/details?id=li.tamir.app
