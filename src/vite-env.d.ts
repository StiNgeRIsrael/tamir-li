/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_ORIGIN?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** `true` forces mock conversion in production builds (not recommended). */
  readonly VITE_USE_MOCK_CONVERSION?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_GA4_ID?: string;
  /** Google Ads account ID (AW-…) for gtag config — optional. */
  readonly VITE_GOOGLE_ADS_ID?: string;
  /** Comma-separated conversion labels: AW-xxx/label — fires on purchase. */
  readonly VITE_GOOGLE_ADS_CONVERSION_ID?: string;
  /** Adsterra zone keys — one unique key per dashboard ad unit (728×90, 300×250, etc.). */
  readonly VITE_ADSTERRA_ZONE_BANNER?: string;
  readonly VITE_ADSTERRA_ZONE_SIDEBAR?: string;
  readonly VITE_ADSTERRA_ZONE_SIDEBAR_2?: string;
  readonly VITE_ADSTERRA_ZONE_INLINE?: string;
  /** Full popunder/social-bar script URL from Adsterra dashboard (optional). */
  readonly VITE_ADSTERRA_POPUNDER_SCRIPT_URL?: string;
  /** Native ad invoke.js URL from Adsterra dashboard (optional). */
  readonly VITE_ADSTERRA_NATIVE_SCRIPT_URL?: string;
  /** Native ad container element id (e.g. container-abc123). */
  readonly VITE_ADSTERRA_NATIVE_CONTAINER_ID?: string;
  /** Override invoke.js host if Adsterra assigns a different CDN domain. */
  readonly VITE_ADSTERRA_INVOKE_HOST?: string;
  /** Popup URL opened on first download click (two-step download flow). Falls back to vignette if unset. */
  readonly VITE_AD_CLICK_URL?: string;
  /** AdMob Android app ID (ca-app-pub-…~…). */
  readonly VITE_ADMOB_APP_ID?: string;
  readonly VITE_ADMOB_SLOT_BANNER?: string;
  readonly VITE_ADMOB_SLOT_INTERSTITIAL?: string;
  readonly VITE_ADMOB_SLOT_REWARDED?: string;
  readonly VITE_ADMOB_TEST_DEVICE_IDS?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
