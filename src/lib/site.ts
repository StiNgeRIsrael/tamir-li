/** Canonical public origin (no trailing slash). Override in `.env` with `VITE_SITE_ORIGIN`. */
export const SITE_ORIGIN = (
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_SITE_ORIGIN ??
  (typeof process !== "undefined" ? process.env.VITE_SITE_ORIGIN : undefined) ??
  "https://tamir.li"
).replace(/\/$/, "");

import type { ToolCategory } from "@/lib/tools-data";

/** Default Open Graph / Twitter card image (PWA asset). */
export const DEFAULT_OG_IMAGE = "/pwa-512x512.png";

/** Category-specific OG images for tool pages (1200×630 SVG). */
export const CATEGORY_OG_IMAGE: Record<ToolCategory, string> = {
  image: "/og/category-image.svg",
  video: "/og/category-video.svg",
  audio: "/og/category-audio.svg",
  document: "/og/category-document.svg",
  ai: "/og/category-ai.svg",
};

export function categoryOgImage(category: ToolCategory): string {
  return CATEGORY_OG_IMAGE[category] ?? DEFAULT_OG_IMAGE;
}

export function siteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean}`;
}

export function absoluteImageUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return siteUrl(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`);
}
