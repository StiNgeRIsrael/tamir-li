import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tamir.li",
  appName: "Tamir.li",
  webDir: "dist",
  server: {
    url: "https://tamir.li",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    AdMob: {
      initializeForTesting: process.env.CAPACITOR_ADMOB_TEST === "true",
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
