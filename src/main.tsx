import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyStoredConsent } from "@/lib/ads/consent";

applyStoredConsent();

createRoot(document.getElementById("root")!).render(<App />);
