/** Canonical public origin (no trailing slash). Override in `.env` with `VITE_SITE_ORIGIN`. */
export const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.replace(/\/$/, "") || "https://tamir.li";

export function siteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean}`;
}
