import { Link } from "react-router-dom";
import { Crown, FileText, LogOut, Mail, Shield } from "lucide-react";
import { UserAuthSection } from "@/components/UserAuthSection";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocale, localePath } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { cn } from "@/lib/utils";

export function AppAccountScreen() {
  const { locale, t } = useLocale();
  const { user, signOut } = useAuth();
  const { used, max, remaining, loading: usageLoading } = useUsage();
  const { isPremium, loading: subLoading } = useSubscription();
  const copy =
    (t as { appShell?: typeof enTranslations.appShell }).appShell ?? enTranslations.appShell;
  const nativeHome =
    (t as { nativeHome?: typeof enTranslations.nativeHome }).nativeHome ?? enTranslations.nativeHome;
  const footer = t.footer as { privacy?: string; terms?: string; contact?: string };

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-5 pb-8">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-foreground">{copy.accountTitle}</h1>
        <p className="text-sm text-muted-foreground">{copy.accountSubtitle}</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{copy.signedInAs}</p>
            {user ? (
              <p className="truncate text-sm font-semibold text-foreground">
                {user.displayName || user.email}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{copy.notSignedIn}</p>
            )}
          </div>
          <UserAuthSection />
        </div>
        {user && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {(t.auth as { signOut?: string }).signOut ?? "Sign out"}
          </Button>
        )}
      </section>

      {!subLoading && !usageLoading && (
        <section
          className={cn(
            "rounded-2xl border p-4",
            isPremium ? "border-premium/30 bg-premium/10" : "border-border bg-card"
          )}
        >
          {isPremium ? (
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-premium" aria-hidden />
              <p className="text-sm font-semibold">{nativeHome.premiumActive}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{nativeHome.usageTitle}</span>
                <span className="font-mono text-muted-foreground" dir="ltr">
                  {used}/{max}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{nativeHome.usageRemaining(remaining)}</p>
              <Button asChild className="w-full bg-premium font-bold text-premium-foreground hover:bg-premium/90">
                <Link to={localePath("/premium", locale)}>
                  <Crown className="me-2 h-4 w-4" aria-hidden />
                  {nativeHome.upgradeCta}
                </Link>
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <Link
          to={localePath("/privacy", locale)}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-sm font-medium text-foreground active:bg-muted/50"
        >
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden />
          {footer.privacy ?? "Privacy"}
        </Link>
        <Link
          to={localePath("/terms", locale)}
          className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-sm font-medium text-foreground active:bg-muted/50"
        >
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
          {footer.terms ?? "Terms"}
        </Link>
        <Link
          to={localePath("/contact", locale)}
          className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground active:bg-muted/50"
        >
          <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
          {footer.contact ?? "Contact"}
        </Link>
      </section>

      <p className="text-center text-[11px] text-muted-foreground">{copy.versionHint}</p>
    </div>
  );
}
