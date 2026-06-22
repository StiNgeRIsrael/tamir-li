import { createContext, useContext, ReactNode, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { TranslationDict } from "@/lib/translations/types";

export type Locale = "he" | "en" | "es" | "ru" | "de" | "fr" | "it";

export const LOCALES: Locale[] = ["he", "en", "es", "ru", "de", "fr", "it"];
export const NON_HE_LOCALES: Locale[] = ["en", "es", "ru", "de", "fr", "it"];

export const localeNames: Record<Locale, string> = {
  he: "עברית",
  en: "English",
  es: "Español",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
};

export function isRTL(locale: Locale): boolean {
  return locale === "he";
}

/** BCP 47 language tag for `<html lang>` (Israel-first Hebrew). */
export function htmlLangTag(locale: Locale): string {
  return locale === "he" ? "he-IL" : locale;
}

export function isValidLocale(s: string): s is Locale {
  return LOCALES.includes(s as Locale);
}

/** Prefix a path with locale. Hebrew = no prefix. */
export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "he") return clean;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

interface LocaleContextValue {
  locale: Locale;
  t: TranslationDict;
  dir: "rtl" | "ltr";
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "he",
  t: {},
  dir: "rtl",
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  return useContext(LocaleContext).t;
}

// Lazy-loaded translations
import { heTranslations } from "@/lib/translations/he";
import { enTranslations } from "@/lib/translations/en";
import { esTranslations } from "@/lib/translations/es";
import { ruTranslations } from "@/lib/translations/ru";
import { deTranslations } from "@/lib/translations/de";
import { frTranslations } from "@/lib/translations/fr";
import { itTranslations } from "@/lib/translations/it";

const translationMap: Record<Locale, TranslationDict> = {
  he: heTranslations,
  en: enTranslations,
  es: esTranslations,
  ru: ruTranslations,
  de: deTranslations,
  fr: frTranslations,
  it: itTranslations,
};

export function LocaleProvider({ children, explicitLocale }: { children: ReactNode, explicitLocale?: Locale }) {
  const { locale: localeParam } = useParams<{ locale?: string }>();
  const computedParam = localeParam && isValidLocale(localeParam) ? localeParam : "he";
  const locale: Locale = explicitLocale || computedParam;
  const dir = isRTL(locale) ? "rtl" : "ltr";
  const t = translationMap[locale] || translationMap.he;

  useEffect(() => {
    document.documentElement.lang = htmlLangTag(locale);
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <LocaleContext.Provider value={{ locale, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}
