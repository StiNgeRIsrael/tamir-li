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

/** Normalize request path to manifest key (strip locale prefix, default Hebrew). */
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

export function buildBotHtml(entry: SeoManifestEntry, canonicalUrl: string): string {
  const escapedTitle = entry.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedDesc = entry.description.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: entry.title,
    description: entry.description,
    url: canonicalUrl,
  };

  return `<!DOCTYPE html>
<html lang="he-IL" dir="rtl">
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

  const key = normalizeManifestPath(urlPath);
  const entry = manifest.routes[key];
  if (!entry) return null;

  const canonicalUrl = `${origin.replace(/\/$/, "")}${key === "/" ? "/" : key}`;
  return buildBotHtml(entry, canonicalUrl);
}
