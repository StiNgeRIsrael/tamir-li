/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_ORIGIN?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** `true` forces mock conversion in production builds (not recommended). */
  readonly VITE_USE_MOCK_CONVERSION?: string;
  readonly VITE_GTM_ID?: string;
  readonly VITE_GA4_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT_BANNER?: string;
  readonly VITE_ADSENSE_SLOT_SIDEBAR?: string;
  readonly VITE_ADSENSE_SLOT_INLINE?: string;
  readonly VITE_ADSENSE_SLOT_INTERSTITIAL?: string;
  readonly VITE_ADSENSE_SLOT_ANCHOR?: string;
  /** Popup URL opened on first download click (two-step download flow). Falls back to vignette if unset. */
  readonly VITE_AD_CLICK_URL?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
