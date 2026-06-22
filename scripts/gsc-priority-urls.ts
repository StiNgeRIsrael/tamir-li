/**
 * Build a tiered URL list for manual Google Search Console "URL Inspection → Request indexing".
 *
 * Usage:
 *   npm run generate:gsc-priority
 *   npm run generate:gsc-priority -- --tier=1
 *   npm run generate:gsc-priority -- --daily=15
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllSitemapUrls, getBasePaths } from "../src/lib/sitemap-paths";
import { LOCALES, localePath, type Locale } from "../src/lib/i18n";
import { getDefaultSlug, getPopularTools } from "../src/lib/tools-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, "../gsc-priority-urls.txt");

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");

/** Core marketing / legal pages — inspect before anything else. */
const TIER1_PATHS = ["/", "/premium", "/about", "/contact", "/privacy", "/terms"] as const;

function urlsForPaths(paths: readonly string[]): string[] {
  const urls: string[] = [];
  for (const path of paths) {
    for (const locale of LOCALES) {
      urls.push(`${origin}${localePath(path, locale as Locale)}`);
    }
  }
  return urls;
}

/** Canonical landing path per popular tool (matches homepage / nav prominence). */
function getTier2ToolPaths(): string[] {
  const paths = new Set<string>();
  for (const tool of getPopularTools()) {
    if (tool.customComponent) {
      paths.add(`/${tool.id}`);
    } else {
      paths.add(`/${getDefaultSlug(tool)}`);
    }
  }
  return [...paths].sort();
}

function parseArgs(): { tier?: number; daily?: number } {
  const opts: { tier?: number; daily?: number } = {};
  for (const arg of process.argv.slice(2)) {
    const tierMatch = arg.match(/^--tier=(\d)$/);
    if (tierMatch) opts.tier = Number(tierMatch[1]);
    const dailyMatch = arg.match(/^--daily=(\d+)$/);
    if (dailyMatch) opts.daily = Number(dailyMatch[1]);
  }
  return opts;
}

const tier1 = urlsForPaths(TIER1_PATHS);
const tier2 = urlsForPaths(getTier2ToolPaths());

const tier12Set = new Set([...tier1, ...tier2]);
const allSitemapUrls = getAllSitemapUrls(origin);
const tier3 = allSitemapUrls.filter((url) => !tier12Set.has(url));

const sections = [
  { label: "Tier 1 — Core pages (homepage, premium, about, contact, privacy, terms)", urls: tier1 },
  { label: "Tier 2 — Popular tool landing pages", urls: tier2 },
  { label: "Tier 3 — Remaining sitemap URLs (blog, install, format variants, other tools)", urls: tier3 },
];

const lines: string[] = [
  `# GSC priority URLs for ${origin}`,
  `# Generated: ${new Date().toISOString()}`,
  `# Total: ${tier1.length + tier2.length + tier3.length} (${tier1.length} tier 1 + ${tier2.length} tier 2 + ${tier3.length} tier 3)`,
  `# Sitemap has ${allSitemapUrls.length} URLs — submit https://${new URL(origin).host}/sitemap.xml once in Search Console.`,
  "",
];

for (const section of sections) {
  lines.push(`# ${section.label}`);
  for (const url of section.urls) {
    lines.push(url);
  }
  lines.push("");
}

writeFileSync(outPath, lines.join("\n"), "utf8");

const { tier, daily } = parseArgs();

if (daily !== undefined) {
  const priorityOrder = [...tier1, ...tier2, ...tier3];
  const batch = priorityOrder.slice(0, daily);
  console.log(`Daily batch (first ${daily} URLs in priority order):\n`);
  for (const url of batch) {
    console.log(url);
  }
  console.log(`\n${batch.length} URL(s). Full list: ${outPath}`);
} else if (tier !== undefined) {
  const section = sections[tier - 1];
  if (!section) {
    console.error("Invalid --tier. Use 1, 2, or 3.");
    process.exit(1);
  }
  console.log(`${section.label} (${section.urls.length} URLs):\n`);
  for (const url of section.urls) {
    console.log(url);
  }
} else {
  console.log(`Wrote ${tier1.length + tier2.length + tier3.length} URLs to gsc-priority-urls.txt`);
  console.log(`  Tier 1: ${tier1.length} (core pages × ${LOCALES.length} locales)`);
  console.log(`  Tier 2: ${tier2.length} (popular tools × ${LOCALES.length} locales)`);
  console.log(`  Tier 3: ${tier3.length} (everything else)`);
  console.log("");
  console.log("Tips:");
  console.log("  npm run generate:gsc-priority -- --tier=1     # print tier 1 only");
  console.log("  npm run generate:gsc-priority -- --daily=15   # today's manual batch");
  console.log("");
  console.log("Inspect in GSC: https://search.google.com/search-console/inspect");
}

// Sanity: tier 1+2+3 should equal sitemap count
const union = new Set([...tier1, ...tier2, ...tier3]);
if (union.size !== allSitemapUrls.length) {
  console.warn(
    `Warning: partitioned ${union.size} URLs but sitemap has ${allSitemapUrls.length} (check for duplicates or drift).`
  );
}
