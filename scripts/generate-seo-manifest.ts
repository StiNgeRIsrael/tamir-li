/**
 * Build-time SEO manifest for bot prerender middleware.
 * Hebrew canonical paths only — title, description, optional JSON-LD string.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectToolSlugs } from "../src/lib/sitemap-paths";
import { getToolByFormatSlug, getToolById, getDefaultSlug, tools } from "../src/lib/tools-data";
import { isToolFunctional } from "../src/lib/tool-availability";
import { heTranslations } from "../src/lib/translations/he";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/seo-manifest.json");

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");
const brand = heTranslations.brandName;
const tt = heTranslations.tool;

type ManifestEntry = { title: string; description: string };

const routes: Record<string, ManifestEntry> = {
  "/": {
    title: `${brand} | Tamir.li — המרת קבצים חינם בישראל`,
    description:
      "תמיר לי (Tamir.li) — ממיר קבצים חינמי בעברית: JPG, PNG, PDF, MP4, MP3 ועוד. גרור, בחר פורמט, הורד.",
  },
  "/premium": {
    title: heTranslations.upgradePage?.seoTitle ?? `${brand} Premium`,
    description: heTranslations.upgradePage?.seoDesc ?? "פרימיום ללא מודעות",
  },
};

const TOP_SLUGS = [
  "/",
  ...collectToolSlugs().slice(0, 12),
  "/premium",
  "/tools/image",
  "/tools/document",
  "/blog",
];

for (const slugPath of TOP_SLUGS) {
  if (routes[slugPath]) continue;

  if (slugPath.startsWith("/tools/")) {
    const cat = slugPath.replace("/tools/", "");
    const label = (heTranslations.categories as Record<string, string>)[cat] ?? cat;
    routes[slugPath] = {
      title: `כלי ${label} | ${brand}`,
      description: `כל כלי ההמרה ל${label} ב-${brand} — חינם בדפדפן.`,
    };
    continue;
  }

  if (slugPath === "/blog") {
    routes[slugPath] = {
      title: heTranslations.blog?.seoTitle ?? `בלוג | ${brand}`,
      description: heTranslations.blog?.seoDesc ?? "מדריכי המרת קבצים בעברית",
    };
    continue;
  }

  const slug = slugPath.slice(1);
  const formatMatch = getToolByFormatSlug(slug);
  const tool = formatMatch?.tool ?? getToolById(slug);
  if (!tool || !isToolFunctional(tool.id)) continue;

  const toolNames = heTranslations.toolNames as Record<string, string>;
  const name = toolNames[tool.id] ?? tool.name;

  if (formatMatch) {
    routes[slugPath] = {
      title: `${tt.convertTitle(formatMatch.from, formatMatch.to)} — ${brand}`,
      description: tt.convertDesc(formatMatch.from, formatMatch.to),
    };
  } else {
    routes[slugPath] = {
      title: `${name} — ${brand}`,
      description: tool.longDescription,
    };
  }
}

// Ensure default slugs for all functional tools appear
for (const tool of tools) {
  if (!isToolFunctional(tool.id)) continue;
  const path = `/${getDefaultSlug(tool)}`;
  if (routes[path]) continue;
  const toolNames = heTranslations.toolNames as Record<string, string>;
  routes[path] = {
    title: `${toolNames[tool.id] ?? tool.name} — ${brand}`,
    description: tool.longDescription,
  };
}

const manifest = {
  generatedAt: new Date().toISOString(),
  origin,
  routes,
};

writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Wrote ${Object.keys(routes).length} routes to public/seo-manifest.json`);
