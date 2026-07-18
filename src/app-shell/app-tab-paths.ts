import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";

export type AppTabId = "home" | "catalog" | "premium" | "account";

export const APP_TAB_PATHS: Record<AppTabId, string> = {
  home: "/",
  catalog: "/catalog",
  premium: "/premium",
  account: "/account",
};

/** Strip locale prefix for tab matching. */
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const locales = new Set(["en", "es", "ru", "de", "fr", "it"]);
  if (segments[0] && locales.has(segments[0])) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

export function getActiveAppTab(pathname: string): AppTabId | null {
  const path = stripLocalePrefix(pathname);
  if (path === "/" || path === "") return "home";
  if (path === "/catalog" || path.startsWith("/catalog/")) return "catalog";
  if (path === "/premium" || path.startsWith("/premium/")) return "premium";
  if (path === "/account" || path.startsWith("/account/")) return "account";
  return null;
}

/** True when the current screen is a primary tab (hide back button). */
export function isAppTabRoot(pathname: string): boolean {
  return getActiveAppTab(pathname) !== null;
}

export function appTabHref(tab: AppTabId, locale: Locale): string {
  return localePath(APP_TAB_PATHS[tab], locale);
}
