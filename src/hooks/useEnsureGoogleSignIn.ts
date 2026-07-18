import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canUseNativeGoogleAuth, getNativeGoogleIdToken } from "@/lib/native-google-auth";

/**
 * Ensures the user has an app JWT. On Capacitor, uses native Google Sign-In
 * (account sheet) instead of GIS WebView embeds.
 */
export function useEnsureGoogleSignIn() {
  const { user, signInWithGoogleCredential } = useAuth();

  const ensureSignedIn = useCallback(async () => {
    if (user) return user;

    if (!canUseNativeGoogleAuth()) {
      throw new Error("SIGN_IN_REQUIRED");
    }

    const idToken = await getNativeGoogleIdToken();
    await signInWithGoogleCredential(idToken);
  }, [user, signInWithGoogleCredential]);

  return {
    ensureSignedIn,
    canNativeSignIn: canUseNativeGoogleAuth(),
    isSignedIn: !!user,
  };
}
