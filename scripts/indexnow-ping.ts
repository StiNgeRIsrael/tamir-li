/**
 * Ping Bing IndexNow after deploy. Skips silently when INDEXNOW_KEY is unset.
 *
 * Usage:
 *   INDEXNOW_KEY=your-key npm run indexnow
 *   npm run indexnow -- --limit=50
 *   npm run indexnow -- --dry-run
 */
import { getAllSitemapUrls } from "../src/lib/sitemap-paths";

const origin = (process.env.VITE_SITE_ORIGIN || "https://tamir.li").replace(/\/$/, "");
const key = process.env.INDEXNOW_KEY?.trim();
const BATCH_SIZE = 10_000;

function parseLimit(total: number): number {
  const match = process.argv.find((a) => a.startsWith("--limit="));
  if (!match) return total;
  return Math.min(total, Math.max(1, Number(match.split("=")[1]) || total));
}

function isDryRun(): boolean {
  return process.argv.includes("--dry-run");
}

async function verifyKeyFile(keyLocation: string): Promise<boolean> {
  const res = await fetch(keyLocation, { redirect: "follow" });
  if (!res.ok) {
    console.warn(`IndexNow key file not reachable: ${keyLocation} (HTTP ${res.status})`);
    return false;
  }
  const body = (await res.text()).trim();
  if (body !== key) {
    console.warn(`IndexNow key file mismatch at ${keyLocation}`);
    return false;
  }
  return true;
}

async function submitBatch(host: string, keyLocation: string, urls: string[]): Promise<boolean> {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation, urlList: urls }),
  });

  if (res.ok || res.status === 202) {
    console.log(`IndexNow: submitted ${urls.length} URL(s) (HTTP ${res.status})`);
    return true;
  }

  const text = await res.text().catch(() => "");
  console.warn(`IndexNow failed: HTTP ${res.status}${text ? ` — ${text}` : ""}`);
  return false;
}

async function main() {
  if (!key) {
    console.log("INDEXNOW_KEY not set — skipping IndexNow ping.");
    return;
  }

  const host = new URL(origin).host;
  const keyLocation = `${origin}/${key}.txt`;
  const allUrls = getAllSitemapUrls(origin);
  const urls = allUrls.slice(0, parseLimit(allUrls.length));

  if (isDryRun()) {
    console.log(`IndexNow dry run: would submit ${urls.length}/${allUrls.length} URL(s) to ${host}`);
    console.log(`Key location: ${keyLocation}`);
    return;
  }

  if (!(await verifyKeyFile(keyLocation))) {
    console.warn("Deploy the key file before pinging IndexNow.");
    process.exit(1);
  }

  let submitted = 0;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const ok = await submitBatch(host, keyLocation, batch);
    if (!ok) process.exit(1);
    submitted += batch.length;
  }

  console.log(`IndexNow complete: ${submitted}/${allUrls.length} URL(s) submitted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
