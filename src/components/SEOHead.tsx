import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLocale, LOCALES, localePath, type Locale } from "@/lib/i18n";
import { siteUrl, DEFAULT_OG_IMAGE, absoluteImageUrl, categoryOgImage } from "@/lib/site";
import type { ToolCategory } from "@/lib/tools-data";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object;
}

/** `hreflang` values aligned with primary market (Israel) for Hebrew. */
const HREFLANG_FOR_LOCALE: Record<Locale, string> = {
  he: "he-IL",
  en: "en",
  es: "es",
  ru: "ru",
  de: "de",
  fr: "fr",
  it: "it",
};

const OG_LOCALE_FOR_LOCALE: Record<Locale, string> = {
  he: "he_IL",
  en: "en_US",
  es: "es_ES",
  ru: "ru_RU",
  de: "de_DE",
  fr: "fr_FR",
  it: "it_IT",
};

export function toolCategoryOgImage(category: ToolCategory): string {
  return categoryOgImage(category);
}

export function SEOHead({ title, description, canonical, ogImage, jsonLd }: SEOHeadProps) {
  const location = useLocation();
  const { locale } = useLocale();

  let basePath = location.pathname;
  if (locale !== "he") {
    const prefix = `/${locale}`;
    if (basePath.startsWith(prefix)) {
      basePath = basePath.slice(prefix.length) || "/";
    }
  }

  const url = canonical || siteUrl(location.pathname);
  const imageUrl = absoluteImageUrl(ogImage ?? DEFAULT_OG_IMAGE);

  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "website", true);
    setMeta("og:locale", OG_LOCALE_FOR_LOCALE[locale], true);
    setMeta("og:image", imageUrl, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:image", imageUrl);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    document.querySelectorAll('meta[property^="og:locale:alternate"]').forEach((el) => el.remove());
    LOCALES.filter((l) => l !== locale).forEach((loc) => {
      const alt = document.createElement("meta");
      alt.setAttribute("property", "og:locale:alternate");
      alt.setAttribute("content", OG_LOCALE_FOR_LOCALE[loc]);
      document.head.appendChild(alt);
    });

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());

    LOCALES.forEach((loc: Locale) => {
      const hrefLink = document.createElement("link");
      hrefLink.setAttribute("rel", "alternate");
      hrefLink.setAttribute("hreflang", HREFLANG_FOR_LOCALE[loc]);
      hrefLink.setAttribute("href", siteUrl(localePath(basePath, loc)));
      document.head.appendChild(hrefLink);
    });

    const xDefault = document.createElement("link");
    xDefault.setAttribute("rel", "alternate");
    xDefault.setAttribute("hreflang", "x-default");
    xDefault.setAttribute("href", siteUrl(localePath(basePath, "he")));
    document.head.appendChild(xDefault);

    const existingLd = document.getElementById("page-json-ld");
    if (jsonLd) {
      let script = existingLd as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "page-json-ld";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else {
      existingLd?.remove();
    }
  }, [title, description, url, imageUrl, jsonLd, basePath, locale]);

  return null;
}
