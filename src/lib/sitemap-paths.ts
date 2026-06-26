import {
  tools,
  getAllSlugsForTool,
  getDefaultSlug,
  buildFormatSlug,
  IMAGE_CONVERTER_SITEMAP_PAIRS,
  CATEGORY_HUB_CATEGORIES,
  getCategoryHubPath,
} from "./tools-data";
import { blogArticles } from "./blog-data";
import { ALTERNATIVE_SLUGS, getAlternativePath, collectRootAlternativePaths } from "./alternative-pages-data";
import { USE_CASE_SLUGS, getUseCasePath, getUseCasePublicPath, collectRootUseCasePaths } from "./use-case-pages-data";
import { LOCALES, localePath, type Locale } from "./i18n";
import { SITE_ORIGIN } from "./site";
import { isToolFunctional } from "./tool-availability";

export type SitemapPathKind =
  | "home"
  | "static"
  | "tool"
  | "blog-index"
  | "blog-post"
  | "category-hub"
  | "alternative"
  | "use-case"
  | "widget";

export interface SitemapPathEntry {
  path: string;
  kind: SitemapPathKind;
  lastmod?: string;
}

/** Slugs for functional tools only; image-converter uses default + popular pairs. */
export function collectToolSlugs(): string[] {
  const slugs = new Set<string>();

  for (const tool of tools) {
    if (!isToolFunctional(tool.id)) continue;

    if (tool.id === "image-converter") {
      slugs.add(getDefaultSlug(tool));
      for (const { from, to } of IMAGE_CONVERTER_SITEMAP_PAIRS) {
        slugs.add(buildFormatSlug(from, to));
      }
      continue;
    }

    if (tool.customComponent) {
      slugs.add(tool.id);
      continue;
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
    { path: "/widget", kind: "widget" },
    { path: "/press", kind: "static" },
  ];

  for (const category of CATEGORY_HUB_CATEGORIES) {
    paths.push({ path: getCategoryHubPath(category), kind: "category-hub" });
  }

  for (const slug of collectToolSlugs()) {
    paths.push({ path: `/${slug}`, kind: "tool" });
  }

  for (const slug of ALTERNATIVE_SLUGS) {
    paths.push({ path: getAlternativePath(slug), kind: "alternative" });
  }

  for (const path of collectRootUseCasePaths()) {
    paths.push({ path, kind: "use-case" });
  }

  for (const path of collectRootAlternativePaths()) {
    paths.push({ path, kind: "alternative" });
  }

  for (const slug of USE_CASE_SLUGS) {
    const publicPath = getUseCasePublicPath(slug);
    if (publicPath.startsWith("/use-cases/")) {
      paths.push({ path: publicPath, kind: "use-case" });
    }
  }

  for (const article of blogArticles) {
    paths.push({ path: `/blog/${article.slug}`, kind: "blog-post", lastmod: article.date });
  }

  return paths;
}

/** Blog is Hebrew-only; alternative/use-case/widget are he+en pilots. */
export function getLocalesForSitemapEntry(entry: SitemapPathEntry): Locale[] {
  if (entry.kind === "blog-index" || entry.kind === "blog-post") {
    return ["he"];
  }
  if (entry.kind === "alternative" || entry.kind === "use-case" || entry.kind === "widget") {
    return ["he", "en"];
  }
  return [...LOCALES];
}

export function getSitemapPriority(kind: SitemapPathKind): string {
  switch (kind) {
    case "home":
      return "1.0";
    case "tool":
      return "0.9";
    case "category-hub":
      return "0.85";
    case "alternative":
    case "use-case":
      return "0.8";
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

/** Every indexed URL (matches SEOHead hreflang alternates per path kind). */
export function getAllSitemapUrls(origin: string = SITE_ORIGIN): string[] {
  const urls: string[] = [];
  for (const entry of getBasePaths()) {
    for (const locale of getLocalesForSitemapEntry(entry)) {
      urls.push(`${origin.replace(/\/$/, "")}${localePath(entry.path, locale)}`);
    }
  }
  return urls;
}
