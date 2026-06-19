import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiBaseUrl } from "@/lib/api/client";

const STORAGE_KEY = "tamir_auth_token";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  roles: string[];
  blocked?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  apiAvailable: boolean;
  googleConfigured: boolean;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const apiBase = getApiBaseUrl();
  const googleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const apiAvailable = !!apiBase;

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
    let cancelled = false;

    async function loadMe() {
      if (!apiBase || !token) {
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
        if (!res.ok) {
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
  }, [apiBase, token, persistToken]);

  const signInWithGoogleCredential = useCallback(
    async (credential: string) => {
      if (!apiBase) throw new Error("NO_API");
      const res = await fetch(`${apiBase}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });
      const body = (await res.json().catch(() => ({}))) as { token?: string; user?: AuthUser; message?: string };
      if (!res.ok) {
        throw new Error(body.message || "SIGN_IN_FAILED");
      }
      if (!body.token || !body.user) throw new Error("INVALID_RESPONSE");
      persistToken(body.token);
      setUser(body.user);
    },
    [apiBase, persistToken]
  );

  const signOut = useCallback(() => {
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
        googleConfigured,
        signInWithGoogleCredential,
        signOut,
      }) satisfies AuthContextValue,
    [user, token, loading, apiAvailable, googleConfigured, signInWithGoogleCredential, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
