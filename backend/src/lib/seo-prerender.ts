import fs from "node:fs";
import path from "node:path";

const BOT_UA =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|applebot|semrushbot|ahrefsbot/i;

export interface SeoManifestEntry {
  title: string;
  description: string;
}

export interface SeoManifest {
  generatedAt: string;
  origin: string;
  routes: Record<string, SeoManifestEntry>;
}

let cachedManifest: SeoManifest | null = null;

export function isSeoBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA.test(userAgent);
}

export function loadSeoManifest(distDir: string): SeoManifest | null {
  if (cachedManifest) return cachedManifest;
  const manifestPath = path.join(distDir, "seo-manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    cachedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as SeoManifest;
    return cachedManifest;
  } catch {
    return null;
  }
}

/** Normalize request path to Hebrew manifest key (strip locale prefix). */
export function normalizeManifestPath(urlPath: string): string {
  const locales = ["en", "es", "ru", "de", "fr", "it"];
  for (const loc of locales) {
    const prefix = `/${loc}`;
    if (urlPath === prefix) return "/";
    if (urlPath.startsWith(`${prefix}/`)) {
      return urlPath.slice(prefix.length) || "/";
    }
  }
  return urlPath || "/";
}

export function extractManifestLocale(urlPath: string): "he" | "en" {
  if (urlPath === "/en" || urlPath.startsWith("/en/")) return "en";
  return "he";
}

function resolveManifestEntry(
  manifest: SeoManifest,
  urlPath: string
): SeoManifestEntry | undefined {
  const exact = manifest.routes[urlPath || "/"];
  if (exact) return exact;
  return manifest.routes[normalizeManifestPath(urlPath)];
}

export function buildBotHtml(
  entry: SeoManifestEntry,
  canonicalUrl: string,
  locale: "he" | "en" = "he"
): string {
  const escapedTitle = entry.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedDesc = entry.description.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const htmlLang = locale === "en" ? "en" : "he-IL";
  const htmlDir = locale === "en" ? "ltr" : "rtl";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: entry.title,
    description: entry.description,
    url: canonicalUrl,
  };

  return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${htmlDir}">
<head>
  <meta charset="UTF-8" />
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <p>${escapedDesc}</p>
  <p><a href="${canonicalUrl}">${canonicalUrl}</a></p>
</body>
</html>`;
}

export function trySeoPrerender(
  distDir: string,
  urlPath: string,
  userAgent: string | undefined,
  origin: string
): string | null {
  if (!isSeoBot(userAgent)) return null;

  const manifest = loadSeoManifest(distDir);
  if (!manifest) return null;

  const entry = resolveManifestEntry(manifest, urlPath);
  if (!entry) return null;

  const canonicalPath = urlPath || "/";
  const canonicalUrl = `${origin.replace(/\/$/, "")}${canonicalPath === "/" ? "/" : canonicalPath}`;
  return buildBotHtml(entry, canonicalUrl, extractManifestLocale(canonicalPath));
}
