/**
 * Build-time SEO manifest for bot prerender middleware.
 * All 7 locales for home, premium, category hubs, and functional tools.
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
import { ALTERNATIVE_SLUGS, getAlternativePath } from "../src/lib/alternative-pages-data";
import { USE_CASE_SLUGS, getUseCasePath } from "../src/lib/use-case-pages-data";
import { localePath, LOCALES, type Locale } from "../src/lib/i18n";
import type { TranslationDict } from "../src/lib/translations/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/seo-manifest.json");

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");

type ManifestEntry = { title: string; description: string };

const TRANSLATIONS: Record<Locale, TranslationDict> = {
  he: heTranslations,
  en: enTranslations,
  es: esTranslations,
  ru: ruTranslations,
  de: deTranslations,
  fr: frTranslations,
  it: itTranslations,
};

const HE_EN_LOCALES: Locale[] = ["he", "en"];

function getTranslations(locale: Locale): TranslationDict {
  return TRANSLATIONS[locale];
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
  if (locale === "he") {
    return {
      title: `${t.brandName} | Tamir.li — המרת קבצים חינם בישראל`,
      description:
        "תמיר לי (Tamir.li) — ממיר קבצים חינמי בעברית: JPG, PNG, PDF, MP4, MP3 ועוד. גרור, בחר פורמט, הורד.",
    };
  }
  const seo = (t as { seo?: { homeTitle?: string; homeDesc?: string } }).seo;
  return {
    title: seo?.homeTitle ?? `${t.brandName} — ${t.brandTagline}`,
    description: seo?.homeDesc ?? t.footer.seoText1,
  };
}

function buildPremiumEntry(locale: Locale): ManifestEntry {
  const t = getTranslations(locale);
  const upgrade = t.upgradePage ?? enTranslations.upgradePage;
  return {
    title: upgrade?.seoTitle ?? `${t.brandName} Premium`,
    description: upgrade?.seoDesc ?? "Premium — unlimited conversions",
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
  const metaDescription =
    hub.seoDescByCategory?.[category as keyof typeof hub.seoDescByCategory] ??
    hub.seoDesc(label);
  return {
    title: hub.seoTitle(label),
    description: metaDescription,
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

function buildAlternativeEntry(slug: string, locale: Locale): ManifestEntry | null {
  const t = getTranslations(locale);
  const alt = t.alternativePage?.[slug as keyof typeof t.alternativePage];
  if (!alt) return null;
  return { title: alt.seoTitle, description: alt.seoDesc };
}

function buildUseCaseEntry(slug: string, locale: Locale): ManifestEntry | null {
  const t = getTranslations(locale);
  const page = t.useCasePage?.[slug as keyof typeof t.useCasePage];
  if (!page) return null;
  return { title: page.seoTitle, description: page.seoDesc };
}

function buildWidgetEntry(locale: Locale): ManifestEntry {
  const w = getTranslations(locale).widgetPage ?? enTranslations.widgetPage;
  return { title: w.seoTitle, description: w.seoDesc };
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
}

addRoute(routes, "/blog", buildBlogEntry());

for (const locale of HE_EN_LOCALES) {
  for (const slug of ALTERNATIVE_SLUGS) {
    const entry = buildAlternativeEntry(slug, locale);
    if (entry) {
      addRoute(routes, localePath(getAlternativePath(slug), locale), entry);
    }
  }
  for (const slug of USE_CASE_SLUGS) {
    const entry = buildUseCaseEntry(slug, locale);
    if (entry) {
      addRoute(routes, localePath(getUseCasePath(slug), locale), entry);
    }
  }
  addRoute(routes, localePath("/widget", locale), buildWidgetEntry(locale));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  origin,
  routes,
};

writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Wrote ${Object.keys(routes).length} routes to public/seo-manifest.json`);
