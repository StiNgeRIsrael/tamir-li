import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLocale, LOCALES, localePath, type Locale } from "@/lib/i18n";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object;
}

export function SEOHead({ title, description, canonical, jsonLd }: SEOHeadProps) {
  const location = useLocation();
  const { locale } = useLocale();

  // Strip locale prefix to get base path
  let basePath = location.pathname;
  if (locale !== "he") {
    const prefix = `/${locale}`;
    if (basePath.startsWith(prefix)) {
      basePath = basePath.slice(prefix.length) || "/";
    }
  }

  const url = canonical || `https://tamirli.co.il${location.pathname}`;

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
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);

    // hreflang tags
    // Remove old hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

    LOCALES.forEach((loc: Locale) => {
      const hrefLink = document.createElement("link");
      hrefLink.setAttribute("rel", "alternate");
      hrefLink.setAttribute("hreflang", loc);
      hrefLink.setAttribute("href", `https://tamirli.co.il${localePath(basePath, loc)}`);
      document.head.appendChild(hrefLink);
    });

    // x-default points to English
    const xDefault = document.createElement("link");
    xDefault.setAttribute("rel", "alternate");
    xDefault.setAttribute("hreflang", "x-default");
    xDefault.setAttribute("href", `https://tamirli.co.il${localePath(basePath, "en")}`);
    document.head.appendChild(xDefault);

    // JSON-LD
    if (jsonLd) {
      let script = document.getElementById("json-ld") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "json-ld";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, url, jsonLd, basePath]);

  return null;
}
