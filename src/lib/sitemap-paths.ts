import { tools, getAllSlugsForTool } from "./tools-data";
import { blogArticles } from "./blog-data";
import { LOCALES, localePath, type Locale } from "./i18n";
import { SITE_ORIGIN } from "./site";

export type SitemapPathKind = "home" | "static" | "tool" | "blog-index" | "blog-post";

export interface SitemapPathEntry {
  path: string;
  kind: SitemapPathKind;
  lastmod?: string;
}

/** All locale-neutral paths (Hebrew default — no prefix). */
export function collectToolSlugs(): string[] {
  const slugs = new Set<string>();
  for (const tool of tools) {
    if (tool.customComponent) {
      slugs.add(tool.id);
    }
    for (const slug of getAllSlugsForTool(tool)) {
      slugs.add(slug);
    }
  }
  return [...slugs].sort();
}

export function getBasePaths(): SitemapPathEntry[] {
  const paths: SitemapPathEntry[] = [
    { path: "/", kind: "home" },
    { path: "/premium", kind: "static" },
    { path: "/install", kind: "static" },
    { path: "/privacy", kind: "static" },
    { path: "/terms", kind: "static" },
    { path: "/about", kind: "static" },
    { path: "/contact", kind: "static" },
    { path: "/blog", kind: "blog-index" },
  ];

  for (const slug of collectToolSlugs()) {
    paths.push({ path: `/${slug}`, kind: "tool" });
  }

  for (const article of blogArticles) {
    paths.push({ path: `/blog/${article.slug}`, kind: "blog-post", lastmod: article.date });
  }

  return paths;
}

export function getSitemapPriority(kind: SitemapPathKind): string {
  switch (kind) {
    case "home":
      return "1.0";
    case "tool":
      return "0.9";
    case "blog-index":
      return "0.8";
    case "blog-post":
      return "0.7";
    default:
      return "0.5";
  }
}

export function getSitemapChangefreq(kind: SitemapPathKind): string {
  switch (kind) {
    case "home":
      return "daily";
    case "blog-index":
      return "weekly";
    default:
      return "monthly";
  }
}

/** Every indexed URL across all locales (matches SEOHead hreflang alternates). */
export function getAllSitemapUrls(origin: string = SITE_ORIGIN): string[] {
  const urls: string[] = [];
  for (const entry of getBasePaths()) {
    for (const locale of LOCALES) {
      urls.push(`${origin.replace(/\/$/, "")}${localePath(entry.path, locale as Locale)}`);
    }
  }
  return urls;
}
