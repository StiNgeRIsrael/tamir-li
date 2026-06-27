import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyStoredConsent } from "@/lib/ads/consent";
import { captureAdsClickIds } from "@/lib/analytics/google-ads";
import { initAdMob, shouldUseAdMob } from "@/lib/ads/admob";
import { isNativeApp } from "@/lib/platform";

const root = createRoot(document.getElementById("root")!);

async function bootstrap() {
  captureAdsClickIds();
  if (isNativeApp()) {
    document.documentElement.dataset.platform = "native";
  }
  if (shouldUseAdMob()) {
    await initAdMob().catch(() => undefined);
  }
  applyStoredConsent();
  root.render(<App />);
}

void bootstrap();
