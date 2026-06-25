import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getBasePaths,
  getSitemapChangefreq,
  getSitemapPriority,
} from "../src/lib/sitemap-paths";
import { localePath, type Locale } from "../src/lib/i18n";
import { getLocalesForSitemapEntry } from "../src/lib/sitemap-paths";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../public/sitemap.xml");

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");

/** Matches SEOHead hreflang values. */
const HREFLANG_FOR_LOCALE: Record<Locale, string> = {
  he: "he-IL",
  en: "en",
  es: "es",
  ru: "ru",
  de: "de",
  fr: "fr",
  it: "it",
};

function buildHreflangLinks(entryPath: string, locales: Locale[]): string {
  const links = locales.map((loc) => {
    const href = `${origin}${localePath(entryPath, loc)}`;
    return `\n    <xhtml:link rel="alternate" hreflang="${HREFLANG_FOR_LOCALE[loc]}" href="${href}" />`;
  });
  links.push(
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localePath(entryPath, "he")}" />`
  );
  return links.join("");
}

const urlEntries: string[] = [];

for (const entry of getBasePaths()) {
  const changefreq = getSitemapChangefreq(entry.kind);
  const priority = getSitemapPriority(entry.kind);
  const lastmodTag = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
  const locales = getLocalesForSitemapEntry(entry);
  const hreflangLinks = buildHreflangLinks(entry.path, locales);

  for (const locale of locales) {
    const loc = `${origin}${localePath(entry.path, locale as Locale)}`;
    urlEntries.push(
      `  <url>\n    <loc>${loc}</loc>${lastmodTag}${hreflangLinks}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    );
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join("\n")}
</urlset>
`;

writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${urlEntries.length} URLs to public/sitemap.xml`);
