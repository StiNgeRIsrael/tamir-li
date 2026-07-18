import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { getGoogleClientId } from "@/lib/google-gsi";
import { isNativeApp } from "@/lib/platform";

let initPromise: Promise<boolean> | null = null;

/** True when Capacitor SocialLogin Google provider is usable (native shell + client id). */
export function canUseNativeGoogleAuth(): boolean {
  return isNativeApp() && !!getGoogleClientId() && Capacitor.isPluginAvailable("SocialLogin");
}

async function ensureInitialized(): Promise<boolean> {
  if (!canUseNativeGoogleAuth()) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const webClientId = getGoogleClientId();
    if (!webClientId) return false;
    try {
      await SocialLogin.initialize({
        google: {
          webClientId,
          mode: "online",
        },
      });
      return true;
    } catch {
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

/**
 * Opens the native Google account picker and returns an ID token for POST /api/auth/google.
 * Throws if the user cancels or the plugin is unavailable.
 */
export async function getNativeGoogleIdToken(): Promise<string> {
  const ready = await ensureInitialized();
  if (!ready) {
    throw new Error("NATIVE_GOOGLE_UNAVAILABLE");
  }

  const response = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
      style: "bottom",
      filterByAuthorizedAccounts: false,
      autoSelectEnabled: true,
    },
  });

  if (response.provider !== "google") {
    throw new Error("NATIVE_GOOGLE_FAILED");
  }

  const result = response.result;
  if ("responseType" in result && result.responseType === "offline") {
    throw new Error("NATIVE_GOOGLE_OFFLINE_MODE");
  }

  const idToken = "idToken" in result ? result.idToken : null;
  if (!idToken) {
    throw new Error("NATIVE_GOOGLE_NO_TOKEN");
  }
  return idToken;
}
