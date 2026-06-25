/**
 * Ping Bing IndexNow after deploy. Skips silently when INDEXNOW_KEY is unset.
 *
 * Usage:
 *   INDEXNOW_KEY=your-key npm run indexnow
 *   npm run indexnow -- --limit=50
 */
import { getAllSitemapUrls } from "../src/lib/sitemap-paths";
const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");
const key = process.env.INDEXNOW_KEY?.trim();

function parseLimit(): number {
  const match = process.argv.find((a) => a.startsWith("--limit="));
  if (!match) return 100;
  return Math.min(10000, Math.max(1, Number(match.split("=")[1]) || 100));
}

async function main() {
  if (!key) {
    console.log("INDEXNOW_KEY not set — skipping IndexNow ping.");
    return;
  }

  const host = new URL(origin).host;
  const urls = getAllSitemapUrls(origin).slice(0, parseLimit());

  const body = {
    host,
    key,
    keyLocation: `${origin}/${key}.txt`,
    urlList: urls,
  };

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 202) {
    console.log(`IndexNow: submitted ${urls.length} URL(s) (HTTP ${res.status})`);
    return;
  }

  const text = await res.text().catch(() => "");
  console.warn(`IndexNow failed: HTTP ${res.status}${text ? ` — ${text}` : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
