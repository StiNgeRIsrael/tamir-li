import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { getGoogleClientId, loadGoogleGsiScript } from "@/lib/google-gsi";
import { canUseNativeGoogleAuth, getNativeGoogleIdToken } from "@/lib/native-google-auth";
import { isNativeApp } from "@/lib/platform";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

type GoogleLoginButtonProps = {
  compact?: boolean;
  fullWidth?: boolean;
  className?: string;
  /** Prefer Google's rendered GIS button on web. Ignored on native (always custom + SocialLogin). */
  native?: boolean;
  /** Called after a successful sign-in (native or web). */
  onSignedIn?: () => void;
};

function useAuthCopy() {
  const { t } = useLocale();
  return t.auth as
    | {
        signInWithGoogle?: string;
        signInFailed?: string;
        signInDbUnavailable?: string;
        signInMisconfigured?: string;
        signInLoading?: string;
        signInRetry?: string;
      }
    | undefined;
}

function toastSignInError(code: string, auth: ReturnType<typeof useAuthCopy>) {
  if (code === "DATABASE_UNAVAILABLE") {
    toast.error(
      auth?.signInDbUnavailable ??
        "Sign-in is temporarily unavailable (database offline). Try again later."
    );
  } else if (code === "AUTH_MISCONFIGURED") {
    toast.error(
      auth?.signInMisconfigured ?? "Sign-in is misconfigured on the server. Contact support."
    );
  } else if (code !== "NATIVE_GOOGLE_CANCELLED" && !code.toLowerCase().includes("cancel")) {
    toast.error(auth?.signInFailed ?? "Sign-in failed");
  }
}

/** Capacitor: one tap → native Google account sheet → app JWT. */
function NativeGoogleLoginButton({
  compact,
  fullWidth,
  className,
  onSignedIn,
}: GoogleLoginButtonProps) {
  const { apiAvailable, googleConfigured, signInWithGoogleCredential } = useAuth();
  const auth = useAuthCopy();
  const [busy, setBusy] = useState(false);
  const label = auth?.signInWithGoogle ?? "Login with Google";

  if (!apiAvailable || !googleConfigured) return null;

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (!canUseNativeGoogleAuth()) {
        throw new Error("NATIVE_GOOGLE_UNAVAILABLE");
      }
      const idToken = await getNativeGoogleIdToken();
      await signInWithGoogleCredential(idToken);
      onSignedIn?.();
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      toastSignInError(code, auth);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "lg"}
      className={cn(
        "gap-2 rounded-full border-border bg-card font-semibold shadow-sm hover:bg-muted/60",
        fullWidth && "w-full",
        compact ? "h-9 px-3 text-sm" : "h-12 px-4 text-base",
        className
      )}
      disabled={busy}
      onClick={handleClick}
    >
      {busy ? (
        <Loader2 className={cn("animate-spin", compact ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
      ) : (
        <GoogleIcon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
      )}
      {busy ? (auth?.signInLoading ?? "Loading…") : label}
    </Button>
  );
}

/** Web: styled button with invisible GIS overlay (or Google's rendered button when native=true). */
function WebGoogleLoginButton({
  compact,
  fullWidth,
  className,
  native = false,
  onSignedIn,
}: GoogleLoginButtonProps) {
  const { apiAvailable, googleConfigured, signInWithGoogleCredential } = useAuth();
  const { locale } = useLocale();
  const auth = useAuthCopy();

  const hostRef = useRef<HTMLDivElement>(null);
  const hiddenGsiRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiFailed, setGsiFailed] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  const clientId = getGoogleClientId();
  const label = auth?.signInWithGoogle ?? "Login with Google";

  useEffect(() => {
    if (!apiAvailable || !googleConfigured || !clientId) return;

    let cancelled = false;
    setGsiFailed(false);
    setGsiReady(false);

    const mount = () => {
      if (cancelled || !window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential?: string }) => {
          if (!resp.credential) return;
          try {
            await signInWithGoogleCredential(resp.credential);
            onSignedIn?.();
          } catch (e) {
            toastSignInError(e instanceof Error ? e.message : "", auth);
          }
        },
        ux_mode: "popup",
        locale: locale === "he" ? "he" : "en",
      });

      if (native) {
        const host = hostRef.current;
        if (!host) return;
        host.innerHTML = "";
        window.google.accounts.id.renderButton(host, {
          type: compact ? "icon" : "standard",
          theme: "outline",
          size: compact ? "medium" : "large",
          text: "signin_with",
          shape: compact ? "circle" : "pill",
          logo_alignment: "left",
          width: fullWidth ? 320 : undefined,
        });
      } else {
        const hidden = hiddenGsiRef.current;
        if (!hidden) return;
        hidden.innerHTML = "";
        window.google.accounts.id.renderButton(hidden, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
        });
      }

      if (!cancelled) setGsiReady(true);
    };

    loadGoogleGsiScript()
      .then(mount)
      .catch(() => {
        if (!cancelled) {
          setGsiReady(false);
          setGsiFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    apiAvailable,
    googleConfigured,
    clientId,
    signInWithGoogleCredential,
    locale,
    compact,
    native,
    fullWidth,
    mountKey,
    onSignedIn,
    auth,
  ]);

  if (!apiAvailable || !googleConfigured) return null;

  if (native) {
    return (
      <div className={cn("flex flex-col items-center gap-3", fullWidth && "w-full", className)}>
        <div
          className={cn(
            "flex min-h-[44px] shrink-0 items-center justify-center",
            fullWidth && "w-full [&>div]:w-full [&_iframe]:w-full"
          )}
          ref={hostRef}
          aria-busy={!gsiReady && !gsiFailed}
        />
        {!gsiReady && !gsiFailed && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {auth?.signInLoading ?? "Loading sign-in…"}
          </div>
        )}
        {gsiFailed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setMountKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {auth?.signInRetry ?? "Retry sign-in"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", fullWidth && "w-full", className)}>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className={cn(
          "gap-2 rounded-full border-border bg-card font-medium shadow-sm hover:bg-muted/60",
          fullWidth && "w-full",
          compact ? "h-9 px-3 text-sm" : "h-10 px-4"
        )}
        disabled={!gsiReady}
        tabIndex={-1}
        aria-hidden="true"
      >
        <GoogleIcon className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        {label}
      </Button>
      <div
        ref={hiddenGsiRef}
        className={cn(
          "absolute inset-0 z-10 overflow-hidden opacity-0",
          "[&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full"
        )}
        aria-label={label}
      />
      {!gsiReady && !gsiFailed && (
        <div className="absolute inset-0 z-0 flex items-center justify-center rounded-full bg-card/80">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        </div>
      )}
      {gsiFailed && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute inset-0 z-20 gap-2"
          onClick={() => setMountKey((k) => k + 1)}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {auth?.signInRetry ?? "Retry"}
        </Button>
      )}
    </div>
  );
}

export function GoogleLoginButton(props: GoogleLoginButtonProps) {
  // Prefer native account sheet; fall back to GIS if the plugin isn't in this AAB yet.
  if (isNativeApp() && canUseNativeGoogleAuth()) {
    return <NativeGoogleLoginButton {...props} />;
  }
  return <WebGoogleLoginButton {...props} native={props.native ?? isNativeApp()} />;
}
