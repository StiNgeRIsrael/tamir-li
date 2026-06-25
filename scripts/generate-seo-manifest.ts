/**
 * Build-time SEO manifest for bot prerender middleware.
 * Hebrew canonical paths + English locale-prefixed paths for crawlers.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectToolSlugs } from "../src/lib/sitemap-paths";
import {
  getToolByFormatSlug,
  getToolById,
  CATEGORY_HUB_CATEGORIES,
  getCategoryHubPath,
  type Tool,
} from "../src/lib/tools-data";
import { isToolFunctional } from "../src/lib/tool-availability";
import { heTranslations } from "../src/lib/translations/he";
import { enTranslations } from "../src/lib/translations/en";
import { localePath, type Locale } from "../src/lib/i18n";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/seo-manifest.json");

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");

type ManifestEntry = { title: string; description: string };
type TranslationDict = typeof heTranslations;

const MANIFEST_LOCALES: Locale[] = ["he", "en"];

function getTranslations(locale: Locale): TranslationDict {
  return locale === "en" ? enTranslations : heTranslations;
}

function addRoute(routes: Record<string, ManifestEntry>, path: string, entry: ManifestEntry): void {
  routes[path] = entry;
}

function buildHomeEntry(locale: Locale): ManifestEntry {
  const t = getTranslations(locale);
  if (locale === "en") {
    return {
      title: t.footer.seoTitle,
      description: t.footer.seoText1,
    };
  }
  return {
    title: `${t.brandName} | Tamir.li — המרת קבצים חינם בישראל`,
    description:
      "תמיר לי (Tamir.li) — ממיר קבצים חינמי בעברית: JPG, PNG, PDF, MP4, MP3 ועוד. גרור, בחר פורמט, הורד.",
  };
}

function buildPremiumEntry(locale: Locale): ManifestEntry {
  const t = getTranslations(locale);
  return {
    title: t.upgradePage?.seoTitle ?? `${t.brandName} Premium`,
    description: t.upgradePage?.seoDesc ?? "Premium — unlimited conversions",
  };
}

function buildBlogEntry(): ManifestEntry {
  return {
    title: heTranslations.blog?.seoTitle ?? `בלוג | ${heTranslations.brandName}`,
    description: heTranslations.blog?.seoDesc ?? "מדריכי המרת קבצים בעברית",
  };
}

function buildCategoryHubEntry(category: string, locale: Locale): ManifestEntry {
  const t = getTranslations(locale);
  const label = (t.categories as Record<string, string>)[category] ?? category;
  return {
    title: t.categoryHub.seoTitle(label),
    description: t.categoryHub.seoDesc(label),
  };
}

function buildToolEntry(slug: string, locale: Locale): ManifestEntry | null {
  const t = getTranslations(locale);
  const tt = t.tool;
  const brand = t.brandName;

  const formatMatch = getToolByFormatSlug(slug);
  const tool: Tool | undefined = formatMatch?.tool ?? getToolById(slug);
  if (!tool || !isToolFunctional(tool.id)) return null;

  const toolNames = t.toolNames as Record<string, string>;
  const longDescs = t.toolLongDescriptions as Record<string, string> | undefined;
  const name = toolNames[tool.id] ?? tool.name;

  if (formatMatch) {
    return {
      title: `${tt.convertTitle(formatMatch.from, formatMatch.to)} — ${brand}`,
      description: tt.convertDesc(formatMatch.from, formatMatch.to),
    };
  }

  return {
    title: `${name} — ${brand}`,
    description: longDescs?.[tool.id] ?? tool.longDescription,
  };
}

const routes: Record<string, ManifestEntry> = {};

for (const locale of MANIFEST_LOCALES) {
  addRoute(routes, localePath("/", locale), buildHomeEntry(locale));
  addRoute(routes, localePath("/premium", locale), buildPremiumEntry(locale));

  for (const category of CATEGORY_HUB_CATEGORIES) {
    addRoute(routes, localePath(getCategoryHubPath(category), locale), buildCategoryHubEntry(category, locale));
  }

  for (const slug of collectToolSlugs()) {
    const entry = buildToolEntry(slug, locale);
    if (entry) {
      addRoute(routes, localePath(`/${slug}`, locale), entry);
    }
  }
}

addRoute(routes, "/blog", buildBlogEntry());

const manifest = {
  generatedAt: new Date().toISOString(),
  origin,
  routes,
};

writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Wrote ${Object.keys(routes).length} routes to public/seo-manifest.json`);
