/**
 * Build-time SEO manifest for bot prerender middleware.
 * All 7 locales × sitemap routes for crawlers.
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
import { esTranslations } from "../src/lib/translations/es";
import { ruTranslations } from "../src/lib/translations/ru";
import { deTranslations } from "../src/lib/translations/de";
import { frTranslations } from "../src/lib/translations/fr";
import { itTranslations } from "../src/lib/translations/it";
import { LOCALES, localePath, type Locale } from "../src/lib/i18n";
import { getAlternativePath } from "../src/lib/alternative-pages-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/seo-manifest.json");

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");

type ManifestEntry = { title: string; description: string };
type TranslationDict = typeof heTranslations;

const translationMap: Record<Locale, TranslationDict> = {
  he: heTranslations,
  en: enTranslations,
  es: esTranslations as TranslationDict,
  ru: ruTranslations as TranslationDict,
  de: deTranslations as TranslationDict,
  fr: frTranslations as TranslationDict,
  it: itTranslations as TranslationDict,
};

function getTranslations(locale: Locale): TranslationDict {
  return translationMap[locale] ?? heTranslations;
}

function addRoute(routes: Record<string, ManifestEntry>, path: string, entry: ManifestEntry): void {
  routes[path] = entry;
}

function buildHomeEntry(locale: Locale): ManifestEntry {
  const t = getTranslations(locale);
  if (locale === "he") {
    return {
      title: `${t.brandName} | Tamir.li — המרת קבצים חינם בישראל`,
      description:
        "תמיר לי (Tamir.li) — ממיר קבצים חינמי בעברית: JPG, PNG, PDF, MP4, MP3 ועוד. גרור, בחר פורמט, הורד.",
    };
  }
  return {
    title: t.footer.seoTitle,
    description: t.footer.seoText1,
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
  const hub = t.categoryHub ?? enTranslations.categoryHub;
  const label = (t.categories as Record<string, string>)[category] ?? category;
  const description =
    hub.seoDescByCategory?.[category as keyof typeof hub.seoDescByCategory] ?? hub.seoDesc(label);
  return {
    title: hub.seoTitle(label),
    description,
  };
}

function buildAlternativeEntry(locale: Locale): ManifestEntry | null {
  const t = getTranslations(locale);
  const alt = t.alternativePage?.freeconvert ?? enTranslations.alternativePage?.freeconvert;
  if (!alt) return null;
  return { title: alt.seoTitle, description: alt.seoDesc };
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

for (const locale of LOCALES) {
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

  if (locale === "he" || locale === "en") {
    const altEntry = buildAlternativeEntry(locale);
    if (altEntry) {
      addRoute(routes, localePath(getAlternativePath("freeconvert"), locale), altEntry);
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
