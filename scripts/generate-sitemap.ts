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

const urlEntries: string[] = [];

for (const entry of getBasePaths()) {
  const changefreq = getSitemapChangefreq(entry.kind);
  const priority = getSitemapPriority(entry.kind);
  const lastmodTag = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";

  for (const locale of getLocalesForSitemapEntry(entry)) {
    const loc = `${origin}${localePath(entry.path, locale as Locale)}`;
    urlEntries.push(
      `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    );
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;

writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${urlEntries.length} URLs to public/sitemap.xml`);
