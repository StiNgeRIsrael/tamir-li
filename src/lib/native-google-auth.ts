import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";
import { getGoogleClientId } from "@/lib/google-gsi";
import { isAndroidApp, isNativeApp } from "@/lib/platform";

let initPromise: Promise<boolean> | null = null;

/**
 * True when we should use the native Google account sheet (Capacitor Android + client id).
 * Does not require `isPluginAvailable` — older AABs without SocialLogin still get the
 * native button UI; login then surfaces an update-app error instead of broken GIS.
 */
export function canUseNativeGoogleAuth(): boolean {
  return isNativeApp() && isAndroidApp() && !!getGoogleClientId();
}

/** True when the SocialLogin native plugin is linked into this binary. */
export function isNativeGooglePluginAvailable(): boolean {
  try {
    return Capacitor.isPluginAvailable("SocialLogin");
  } catch {
    return false;
  }
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
 * Throws if the user cancels, the plugin is missing from the AAB, or login fails.
 */
export async function getNativeGoogleIdToken(): Promise<string> {
  if (!canUseNativeGoogleAuth()) {
    throw new Error("NATIVE_GOOGLE_UNAVAILABLE");
  }

  const ready = await ensureInitialized();
  if (!ready) {
    throw new Error(
      isNativeGooglePluginAvailable()
        ? "NATIVE_GOOGLE_UNAVAILABLE"
        : "NATIVE_GOOGLE_UPDATE_REQUIRED"
    );
  }

  try {
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/cancel|dismiss|user.?cancel/i.test(msg)) {
      throw new Error("NATIVE_GOOGLE_CANCELLED");
    }
    if (/not implemented|plugin is not implemented|is not implemented/i.test(msg)) {
      throw new Error("NATIVE_GOOGLE_UPDATE_REQUIRED");
    }
    throw e instanceof Error ? e : new Error("NATIVE_GOOGLE_FAILED");
  }
}
