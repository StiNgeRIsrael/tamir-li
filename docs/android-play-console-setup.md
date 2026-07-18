# Android Play Console setup — Tamir.li

Operator checklist for publishing the Capacitor app (`com.tamir.li`). Cursor implements code; you complete these console steps.

## Technical compliance (code — verified)

| Requirement | Status |
|-------------|--------|
| Package name `com.tamir.li` | Matches Play Console |
| targetSdk **36** (Android 16) | Exceeds API 35 minimum (Aug 2025) |
| Play Billing Library **8.3.0** | Via `@capgo/native-purchases` |
| AD_ID + Ad Services permissions | Merged from Google Mobile Ads SDK |
| HTTPS only (`usesCleartextTraffic=false`) | `AndroidManifest.xml` |
| Backup / device-transfer rules | Excludes WebView prefs & cache |
| Production AdMob App ID in native shell | `strings.xml` |
| Digital Asset Links | `public/.well-known/assetlinks.json` — deploy after upload |

After upload, open **App bundle explorer** → confirm **Memory page size: Supports 16 KB** (AGP 8.13).

---

## Session A (~20 min) — Developer account + app

1. [Play Console signup](https://play.google.com/console/signup) — pay **$25** one-time fee
2. **Create app**
   - Name: **תמיר לי | Tamir.li**
   - Default language: **Hebrew**
   - App: **Free** (Premium is in-app subscription)
   - Category: **Tools** or **Productivity**
3. Package name: **`com.tamir.li`** (immutable)

## Session B (~20 min) — AdMob

1. [admob.google.com](https://admob.google.com) → **Apps** → Add app → Android → **`com.tamir.li`**
2. Create ad units: **Banner**, **Interstitial**, **Rewarded**
3. Paste into GitHub secrets / `.env.production` (see [`admob-setup.md`](./admob-setup.md)):
   - `VITE_ADMOB_APP_ID`
   - `VITE_ADMOB_SLOT_BANNER`
   - `VITE_ADMOB_SLOT_INTERSTITIAL`
   - `VITE_ADMOB_SLOT_REWARDED`
4. AdMob → **Blocking controls** → block sensitive categories
5. Play Console → **Policy** → **App content** → **Advertising ID** → declare that the app **uses** the advertising ID (AdMob)

## Session C (~20 min) — Play Billing + API

1. Play Console → **Monetize** → **Subscriptions**:
   - `tamir_premium_monthly` — ₪19.90/month
   - `tamir_premium_yearly` — ₪191.04/year
2. **In-app products** (optional): `credits_10`, `credits_30`, `credits_60`, `credits_120`
3. **GCP:** enable **Google Play Android Developer API** (`androidpublisher.googleapis.com`) — **not** Android Management API (that is EMM/device management only)
4. **Setup** → **API access** → link Google Cloud project → create **service account**
5. Download JSON → store as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` on API server (Plesk)
6. Invite the service account email in Play Console → **Users and permissions** (view app + monetization; testing tracks if uploading)
7. Enable **Real-time developer notifications** (Pub/Sub) → point to `https://tamir.li/api/billing/google/rtdn`
8. **Cursor MCP (optional):** wire the same service account for agents — [play-console-mcp-setup.md](./play-console-mcp-setup.md)

## Build & upload AAB

Signing backup: `E:\Documents\tamir-li-android-signing\` (keystore + passwords — keep offline).

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
npm run cap:sync
npm run android:bundle
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` to **Internal testing**.

On first upload, accept **Google Play App Signing** (recommended).

## Store listing (minimum)

| Asset | Spec |
|-------|------|
| Icon | 512×512 — use `public/pwa-512x512.png` |
| Feature graphic | 1024×500 |
| Screenshots | 2+ phone captures |
| Short description | ≤80 chars — e.g. המרת קבצים מהירה — תמונות, PDF, וידאו |
| Full description | Hebrew + mention free tier / Premium |
| Privacy policy | https://tamir.li/privacy |

## App content declarations (Play Console)

Complete every item under **Policy → App content**:

| Declaration | Answer for Tamir.li |
|-------------|---------------------|
| **Privacy policy** | `https://tamir.li/privacy` |
| **App access** | Parts of app require Google sign-in (Premium checkout); core converters work without account |
| **Ads** | Yes — contains ads (AdMob, free tier only) |
| **Advertising ID** | Yes — used for advertising / analytics (AdMob) |
| **Content rating** | IARC questionnaire — Tools, no violence; not child-directed |
| **Target audience** | 18+ or general audience (not designed for children) |
| **News app** | No |
| **COVID / health** | No |
| **Data safety** | See table below |
| **Government apps** | No |
| **Financial features** | In-app purchases / subscriptions only (Play Billing) |

## Data safety form (copy-paste guide)

The app is a **WebView shell** loading `https://tamir.li`. Declare what the **combined** app + website collects:

| Data type | Collected? | Purpose | Shared? |
|-----------|------------|---------|---------|
| Email address | Yes (optional) | Account / Premium | No (Google Sign-In) |
| App interactions | Yes | Analytics (GTM/GA4, consent-gated) | Google |
| Device or other IDs | Yes | Advertising (AdMob AAID) | Google |
| Files you provide | Processed locally / in browser | Conversion | Not stored on servers by default |
| Purchase history | Yes | Subscriptions | Google Play |
| Crash logs | Optional | Stability | No |

- **Encryption in transit:** Yes (HTTPS)
- **Data deletion:** Users can contact support / delete account via site policy
- **Committed to Play Families:** No

## Digital Asset Links

Upload keystore SHA-256 is in [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json). **Deploy the site** after any keystore change.

Verify: [Digital Asset Links tool](https://developers.google.com/digital-asset-links/tools/generator) — package `com.tamir.li`, domain `tamir.li`.

## Google Sign-In (native — required for Premium checkout)

The WebView GIS button is unreliable. The app uses **`@capgo/capacitor-social-login`** (native Google account sheet), then opens **Play Billing**.

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Keep the existing **Web client ID** (same as `VITE_GOOGLE_CLIENT_ID` / server `GOOGLE_CLIENT_ID`) — used as `webClientId` for SocialLogin
3. Create an **Android** OAuth client (if missing):
   - Package: `com.tamir.li`
   - SHA-1: from your upload/signing keystore **and** Play App Signing certificate
4. Rebuild & upload AAB after adding the SocialLogin plugin (`versionCode` 2+)

Purchase funnel (onboarding / Premium): **tap CTA → Google account sheet → Play purchase sheet**. No intermediate “save settings” screen.

## Rollout

```
Internal testing → Closed testing → Production
```

Play Store URL: https://play.google.com/store/apps/details?id=com.tamir.li
