import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { BrandWordmark } from "@/components/BrandWordmark";
import { UsageNavPill } from "@/components/UsageNavPill";
import { useLocale, localePath } from "@/lib/i18n";
import { isAppTabRoot } from "@/app-shell/app-tab-paths";
import { Button } from "@/components/ui/button";

/** Compact top bar: brand on tabs; back + usage on nested screens (tools). */
export function AppShellHeader() {
  const { locale, dir, t } = useLocale();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabRoot = isAppTabRoot(pathname);
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const copy = (t as { appShell?: { back?: string } }).appShell;

  return (
    <header className="app-shell-header sticky top-0 z-40 shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="flex h-12 min-h-[48px] items-center gap-2 px-3">
        {!tabRoot ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate(localePath("/", locale));
            }}
            aria-label={copy?.back ?? "Back"}
          >
            <BackIcon className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-2" aria-hidden />
        )}

        <button
          type="button"
          className="min-w-0 flex-1 truncate text-start"
          onClick={() => navigate(localePath("/", locale))}
        >
          <BrandWordmark locale={locale} size="sm" />
        </button>

        <UsageNavPill className="!text-xs !px-2 !py-1" />
      </div>
    </header>
  );
}
