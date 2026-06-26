import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "li.tamir.app",
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
  },
};

export default config;
