# AdMob setup — Tamir.li Android app

The Capacitor app loads **https://tamir.li** in a WebView. Ad unit IDs are baked into the **website build** (`VITE_ADMOB_*`). The **AdMob App ID** must also be in the native Android shell (`strings.xml`).

## Configured IDs (Tamir.li Android — li.tamir.app)

| Variable | Value |
|----------|-------|
| `VITE_ADMOB_APP_ID` | `ca-app-pub-9199955250327376~2471003243` |
| `VITE_ADMOB_SLOT_BANNER` | `ca-app-pub-9199955250327376/9172142962` |
| `VITE_ADMOB_SLOT_INTERSTITIAL` | `ca-app-pub-9199955250327376/1181972302` |
| `VITE_ADMOB_SLOT_REWARDED` | `ca-app-pub-9199955250327376/7859061292` |
| Publisher ID (`app-ads.txt`) | `pub-9199955250327376` |

Native App ID is in `android/app/src/main/res/values/strings.xml`.  
`public/app-ads.txt` is deployed to `https://tamir.li/app-ads.txt`.

**Status:** AdMob + Play Console verification in progress (2026-06-26). Ads may not serve until approval completes; use Google test IDs for internal QA if needed.

Set the four `VITE_ADMOB_*` values as **GitHub repository Variables** (Settings → Secrets and variables → Actions → **Variables** tab — not Secrets). CI and Plesk deploy read them at build time.

If auto-deploy is not configured, download the `plesk-dist` artifact from the **Deploy to Plesk** workflow run and upload to Plesk `httpdocs`.

---

| Variable | AdMob location | Example format |
|----------|----------------|----------------|
| `VITE_ADMOB_APP_ID` | App settings → App ID | `ca-app-pub-XXXXXXXX~YYYYYYYY` |
| `VITE_ADMOB_SLOT_BANNER` | Ad units → Banner | `ca-app-pub-XXXXXXXX/ZZZZZZZZ` |
| `VITE_ADMOB_SLOT_INTERSTITIAL` | Ad units → Interstitial | `ca-app-pub-XXXXXXXX/ZZZZZZZZ` |
| `VITE_ADMOB_SLOT_REWARDED` | Ad units → Rewarded | `ca-app-pub-XXXXXXXX/ZZZZZZZZ` |

Paste all four into this chat when done — Cursor will wire them in.

---

## Step-by-step in AdMob console

### 1. Add the Android app

1. Open [admob.google.com](https://admob.google.com) → **Apps**
2. **Add app** → **No** (app not published yet on Play Store)
3. Platform: **Android**
4. App name: **Tamir.li**
5. Package name: **`li.tamir.app`** (must match exactly)

Copy the **App ID** (`ca-app-pub-…~…`).

### 2. Create ad units

In the app → **Ad units** → **Add ad unit** — create three units:

| Type | Suggested name | Used for |
|------|----------------|----------|
| **Banner** | `tamir_banner` | Tool pages footer |
| **Interstitial** | `tamir_interstitial` | Between conversions |
| **Rewarded** | `tamir_rewarded` | Download gate (watch ad → download) |

Copy each **Ad unit ID** (`ca-app-pub-…/…`).

### 3. Blocking controls (recommended)

**Blocking controls** → block categories you do not want (e.g. dating, gambling) for a family-friendly tools app.

### 4. Link to Play Console (after first AAB upload)

Once the app exists in Play Console, AdMob may prompt to link the Play app — accept so policy review can complete.

---

## Where IDs go in the repo

### A. Website build (required — app loads tamir.li)

Add to `.env.production.local` on your build machine / Plesk:

```env
VITE_ADMOB_APP_ID=ca-app-pub-XXXXXXXX~YYYYYYYY
VITE_ADMOB_SLOT_BANNER=ca-app-pub-XXXXXXXX/1111111111
VITE_ADMOB_SLOT_INTERSTITIAL=ca-app-pub-XXXXXXXX/2222222222
VITE_ADMOB_SLOT_REWARDED=ca-app-pub-XXXXXXXX/3333333333
# Optional: your phone's test device ID (logcat after first ad request)
# VITE_ADMOB_TEST_DEVICE_IDS=ABCDEF1234567890
```

Then:

```bash
npm run build:prod
# Upload dist/ to Plesk (see docs/plesk-deploy.md)
```

### B. Android native shell

The App ID is synced into `android/app/src/main/res/values/strings.xml` automatically:

```bash
npm run cap:sync
```

Or manually set `admob_app_id` in that file to the same value as `VITE_ADMOB_APP_ID`.

Rebuild the AAB after changing the native App ID.

---

## Google test IDs (internal QA only)

Use these until your AdMob app is approved:

| | Test ID |
|---|---------|
| App ID | `ca-app-pub-3940256099942544~3347511713` |
| Banner | `ca-app-pub-3940256099942544/6300978111` |
| Interstitial | `ca-app-pub-3940256099942544/1033173712` |
| Rewarded | `ca-app-pub-3940256099942544/5224354917` |

Replace with your real IDs before Production rollout.

---

## app-ads.txt (optional but recommended)

After AdMob gives you a publisher ID, add a line to `public/app-ads.txt` (deployed at `https://tamir.li/app-ads.txt`):

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Use the same publisher ID as in your AdMob account (may differ from AdSense `pub-4410150504570814`).

---

## Verify on device

1. Install internal-testing build from Play Store
2. Open a tool → convert → download (should show **rewarded** ad on Android)
3. Check logcat for `Ads` / `AdMob` if ads do not load
4. Add device as test device in AdMob → **Settings** → **Test devices**
