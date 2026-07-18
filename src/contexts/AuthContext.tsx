import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiBaseUrl, probeApiReachable, responseLooksLikeJson } from "@/lib/api/client";
import { patchAuthProfile, type ProfilePatch } from "@/lib/profile-api";
import { ANALYTICS_EVENTS, setAnalyticsUserId, trackEvent } from "@/lib/analytics/events";

const STORAGE_KEY = "tamir_auth_token";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  preferredCategory?: string | null;
  onboardingCompletedAt?: string | null;
  roles: string[];
  blocked?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  apiAvailable: boolean;
  dbAvailable: boolean | null;
  googleConfigured: boolean;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  updateProfile: (patch: import("@/lib/profile-api").ProfilePatch) => Promise<AuthUser>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const apiBase = getApiBaseUrl();
  const googleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);
  const apiAvailable = !!apiBase && apiReachable === true;

  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((t: string | null) => {
    setTokenState(t);
    try {
      if (t) localStorage.setItem(STORAGE_KEY, t);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (!apiBase) {
      setApiReachable(false);
      return;
    }
    let cancelled = false;
    probeApiReachable(apiBase).then((result) => {
      if (!cancelled) {
        setApiReachable(result.reachable);
        setDbAvailable(result.dbOk);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!apiBase || !token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      if (apiReachable === null) return;
      if (!apiReachable) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`${apiBase}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (!res.ok || !responseLooksLikeJson(res)) {
          persistToken(null);
          setUser(null);
          setLoading(false);
          return;
        }
        const json = (await res.json()) as { user: AuthUser };
        if (json.user.blocked) {
          persistToken(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(json.user);
        setAnalyticsUserId(json.user.id);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [apiBase, token, apiReachable, persistToken]);

  const signInWithGoogleCredential = useCallback(
    async (credential: string) => {
      if (!apiBase) throw new Error("NO_API");
      const res = await fetch(`${apiBase}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });
      if (!responseLooksLikeJson(res)) throw new Error("API_UNAVAILABLE");
      const body = (await res.json().catch(() => ({}))) as {
        token?: string;
        user?: AuthUser;
        isNewUser?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || body.message || "SIGN_IN_FAILED");
      }
      if (!body.token || !body.user) throw new Error("INVALID_RESPONSE");
      persistToken(body.token);
      setUser(body.user);
      trackEvent(body.isNewUser ? ANALYTICS_EVENTS.SIGN_UP : ANALYTICS_EVENTS.LOGIN, {
        method: "google",
      });
      setAnalyticsUserId(body.user.id);
    },
    [apiBase, persistToken]
  );

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!token) throw new Error("NOT_AUTHENTICATED");
      const updated = await patchAuthProfile(token, patch);
      setUser(updated);
      return updated;
    },
    [token]
  );

  const signOut = useCallback(() => {
    trackEvent(ANALYTICS_EVENTS.SIGN_OUT, { method: "google" });
    setAnalyticsUserId(null);
    persistToken(null);
    setUser(null);
  }, [persistToken]);

  const value = useMemo(
    () =>
      ({
        user,
        token,
        loading,
        apiAvailable,
        dbAvailable,
        googleConfigured,
        signInWithGoogleCredential,
        updateProfile,
        signOut,
      }) satisfies AuthContextValue,
    [user, token, loading, apiAvailable, dbAvailable, googleConfigured, signInWithGoogleCredential, updateProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
