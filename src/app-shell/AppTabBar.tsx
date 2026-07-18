import { Home, LayoutGrid, Crown, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocale } from "@/lib/i18n";
import { appTabHref, type AppTabId } from "@/app-shell/app-tab-paths";
import { cn } from "@/lib/utils";
import { enTranslations } from "@/lib/translations/en";

const TABS: { id: AppTabId; icon: typeof Home }[] = [
  { id: "home", icon: Home },
  { id: "catalog", icon: LayoutGrid },
  { id: "premium", icon: Crown },
  { id: "account", icon: User },
];

export function AppTabBar() {
  const { locale, t } = useLocale();
  const copy =
    (t as { appShell?: typeof enTranslations.appShell }).appShell ?? enTranslations.appShell;

  return (
    <nav
      className="app-tab-bar shrink-0 border-t border-border bg-card/95 backdrop-blur-md"
      aria-label={copy.tabsLabel}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {TABS.map(({ id, icon: Icon }) => {
          const href = appTabHref(id, locale);
          const label = copy.tabs[id];
          return (
            <li key={id} className="flex-1">
              <NavLink
                to={href}
                end={id === "home"}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors",
                    isActive
                      ? id === "premium"
                        ? "text-premium"
                        : "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn("h-5 w-5", isActive && "stroke-[2.25]")}
                      aria-hidden
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
