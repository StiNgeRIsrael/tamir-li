import { localePath, type Locale } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

const HTML_LANG: Record<Locale, string> = {
  he: "he-IL",
  en: "en",
  es: "es",
  ru: "ru",
  de: "de",
  fr: "fr",
  it: "it",
};

const NAV_SLUGS = [
  { nameKey: "jpg-to-png", path: "/jpg-to-png" },
  { nameKey: "pdf-to-word", path: "/pdf-to-word" },
  { nameKey: "image-compressor", path: "/image-compressor" },
  { nameKey: "premium", path: "/premium" },
  { nameKey: "blog", path: "/blog" },
] as const;

interface HomeJsonLdInput {
  locale: Locale;
  brandName: string;
  homeDesc: string;
  faqs: { q: string; a: string }[];
  navLabels: Record<string, string>;
}

/** Locale-aware JSON-LD @graph for the home page (Organization, WebSite, FAQ, navigation). */
export function buildHomeJsonLd({ locale, brandName, homeDesc, faqs, navLabels }: HomeJsonLdInput) {
  const homePath = localePath("/", locale);
  const home = siteUrl(homePath);
  const orgId = `${siteUrl("/")}#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: brandName,
        alternateName: ["Tamir.li", "Tamir Li", "תמיר לי"],
        url: siteUrl("/"),
        logo: {
          "@type": "ImageObject",
          url: siteUrl("/pwa-512x512.png"),
          width: 512,
          height: 512,
        },
        address: { "@type": "PostalAddress", addressCountry: "IL" },
        areaServed: { "@type": "Country", name: "Israel" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@tamir.li",
          availableLanguage: ["Hebrew", "English"],
          areaServed: "IL",
        },
        // sameAs: add official social profile URLs when available
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: brandName,
        alternateName: "Tamir.li",
        url: home,
        description: homeDesc,
        inLanguage: HTML_LANG[locale],
        publisher: { "@id": orgId },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${home}?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebApplication",
        name: brandName,
        alternateName: "Tamir.li",
        description: homeDesc,
        url: home,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript. Modern HTML5 browser.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "ILS",
          description: "Free daily tier with limits; premium subscription available",
        },
        inLanguage: HTML_LANG[locale],
        availableLanguage: ["he-IL", "en", "es", "ru", "de", "fr", "it"],
      },
      ...NAV_SLUGS.map((item) => ({
        "@type": "SiteNavigationElement",
        name: navLabels[item.nameKey] ?? item.nameKey,
        url: siteUrl(localePath(item.path, locale)),
      })),
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };
}
