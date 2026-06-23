import { describe, it, expect } from "vitest";
import { LOCALES, localePath, type Locale } from "./i18n";
import { SITE_ORIGIN } from "./site";

/** Mirrors SEOHead hreflang mapping. */
const HREFLANG_FOR_LOCALE: Record<Locale, string> = {
  he: "he-IL",
  en: "en",
  es: "es",
  ru: "ru",
  de: "de",
  fr: "fr",
  it: "it",
};

/** Mirrors SEOHead basePath stripping from location.pathname. */
function stripLocalePrefix(pathname: string, locale: Locale): string {
  let basePath = pathname;
  if (locale !== "he") {
    const prefix = `/${locale}`;
    if (basePath.startsWith(prefix)) {
      basePath = basePath.slice(prefix.length) || "/";
    }
  }
  return basePath;
}

function hreflangAlternates(pathname: string, locale: Locale) {
  const basePath = stripLocalePrefix(pathname, locale);
  const links = LOCALES.map((loc) => ({
    hreflang: HREFLANG_FOR_LOCALE[loc],
    href: `${SITE_ORIGIN}${localePath(basePath, loc)}`,
  }));
  links.push({
    hreflang: "x-default",
    href: `${SITE_ORIGIN}${localePath(basePath, "he")}`,
  });
  return { basePath, links };
}

describe("SEOHead hreflang alternates (sample tool pages)", () => {
  it("jpg-to-png from Hebrew route", () => {
    const { basePath, links } = hreflangAlternates("/jpg-to-png", "he");
    expect(basePath).toBe("/jpg-to-png");
    expect(links).toHaveLength(LOCALES.length + 1);
    expect(links.find((l) => l.hreflang === "he-IL")?.href).toBe(`${SITE_ORIGIN}/jpg-to-png`);
    expect(links.find((l) => l.hreflang === "en")?.href).toBe(`${SITE_ORIGIN}/en/jpg-to-png`);
    expect(links.find((l) => l.hreflang === "x-default")?.href).toBe(`${SITE_ORIGIN}/jpg-to-png`);
  });

  it("pdf-to-word from /en strips locale prefix for alternates", () => {
    const { basePath, links } = hreflangAlternates("/en/pdf-to-word", "en");
    expect(basePath).toBe("/pdf-to-word");
    expect(links.find((l) => l.hreflang === "he-IL")?.href).toBe(`${SITE_ORIGIN}/pdf-to-word`);
    expect(links.find((l) => l.hreflang === "de")?.href).toBe(`${SITE_ORIGIN}/de/pdf-to-word`);
  });

  it("video-converter x-default matches Hebrew alternate", () => {
    const { links } = hreflangAlternates("/video-converter", "he");
    const heLink = links.find((l) => l.hreflang === "he-IL");
    const xDefault = links.find((l) => l.hreflang === "x-default");
    expect(xDefault?.href).toBe(`${SITE_ORIGIN}/video-converter`);
    expect(xDefault?.href).toBe(heLink?.href);
  });
});
