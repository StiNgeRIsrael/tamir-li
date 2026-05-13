import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GSI_SCRIPT = "https://accounts.google.com/gsi/client";

export function UserAuthSection({ compact }: { compact?: boolean }) {
  const { user, loading, apiAvailable, googleConfigured, signInWithGoogleCredential, signOut } = useAuth();
  const { t, locale } = useLocale();
  const auth = (t as Record<string, unknown>).auth as
    | {
        signOut: string;
        account: string;
        signInFailed: string;
      }
    | undefined;

  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!apiAvailable || !googleConfigured || user || loading) return;
    const el = btnRef.current;
    if (!el) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) return;

    el.innerHTML = "";

    const mount = () => {
      const host = btnRef.current;
      if (!host || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential?: string }) => {
          if (!resp.credential) return;
          try {
            await signInWithGoogleCredential(resp.credential);
          } catch {
            toast.error(auth?.signInFailed ?? "Sign-in failed");
          }
        },
        ux_mode: "popup",
        locale: locale === "he" ? "he" : "en",
      });
      window.google.accounts.id.renderButton(host, {
        type: "standard",
        theme: "outline",
        size: compact ? "medium" : "large",
        text: "signin_with",
        shape: "pill",
        logo_alignment: "left",
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      if (window.google?.accounts?.id) mount();
      else existing.addEventListener("load", mount, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = GSI_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = mount;
      document.body.appendChild(script);
    }
  }, [
    apiAvailable,
    googleConfigured,
    user,
    loading,
    signInWithGoogleCredential,
    locale,
    compact,
    auth?.signInFailed,
  ]);

  if (!apiAvailable || !googleConfigured) return null;

  if (loading) {
    return <Skeleton className="h-9 w-[160px] rounded-full hidden sm:block shrink-0" />;
  }

  if (user) {
    const initial = (user.displayName?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2 h-9 shrink-0">
            <Avatar className="h-7 w-7">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium">
              {user.displayName ?? user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem disabled className="flex flex-col items-start gap-0 py-2">
            <span className="text-xs text-muted-foreground">{auth?.account ?? "Account"}</span>
            <span className="text-sm font-medium truncate max-w-[220px]">{user.email}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            {auth?.signOut ?? "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-end">
      <div ref={btnRef} className="[&>div]:flex [&>div]:justify-end" />
    </div>
  );
}
