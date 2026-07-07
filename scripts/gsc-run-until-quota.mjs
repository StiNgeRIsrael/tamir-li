/**
 * GSC Request indexing until daily quota declined.
 * Uses the "Inspect any URL" search bar (more reliable than &id= deep links).
 */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const PROPERTY = "sc-domain%3Atamir.li";
const INSPECT_BASE = `https://search.google.com/search-console/inspect?resource_id=${PROPERTY}`;
const USER_DATA = resolve(root, ".gsc-playwright-profile");

const QUOTA_PATTERNS = [
  /daily limit/i,
  /quota/i,
  /too many/i,
  /try again later/i,
  /indexing request rejected/i,
  /cannot request indexing/i,
  /limit reached/i,
  /rate limit/i,
];

function readLines(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function getPendingUrls() {
  const done = new Set(readLines(resolve(root, "gsc-request-indexed.txt")));
  const daily = readLines(resolve(root, "gsc-daily-batch.txt"));
  const queue = readLines(resolve(root, "gsc-browser-batch.txt"));
  const seen = new Set();
  const urls = [];
  for (const u of [...daily, ...queue]) {
    if (done.has(u) || seen.has(u)) continue;
    seen.add(u);
    urls.push(u);
  }
  return urls;
}

async function waitForGscReady(page) {
  console.log("Opening GSC… log in in the browser window (up to 10 min).\n");
  await page.goto(INSPECT_BASE, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const deadline = Date.now() + 600_000;
  while (Date.now() < deadline) {
    if (page.isClosed()) throw new Error("Browser closed — keep the window open while logging in.");
    if (/search\.google\.com\/search-console/.test(page.url())) {
      const input = page.locator('input[aria-label*="Inspect" i]').first();
      try {
        await input.waitFor({ state: "visible", timeout: 10_000 });
        console.log("GSC ready.\n");
        return input;
      } catch {
        /* loading */
      }
    }
    await page.waitForTimeout(3000);
  }
  throw new Error("Login timeout.");
}

async function inspectUrl(page, inspectInput, pageUrl) {
  await inspectInput.click({ clickCount: 3 });
  await inspectInput.fill(pageUrl);
  await inspectInput.press("Enter");

  // Wait for inspection result panel (up to 45s)
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(3000);
    const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
    if (
      /url is on google|submitted and indexed|not on google|not indexed|discovered|crawled|unknown/i.test(
        text,
      )
    ) {
      return text;
    }
  }
  return (await page.locator("body").innerText().catch(() => "")) ?? "";
}

async function submitOne(page, inspectInput, pageUrl) {
  console.log(`→ ${pageUrl}`);
  const text = await inspectUrl(page, inspectInput, pageUrl);

  if (/url is on google|submitted and indexed/i.test(text)) {
    return { status: "skip-indexed", pageUrl };
  }

  if (QUOTA_PATTERNS.some((p) => p.test(text))) {
    return { status: "quota", pageUrl, message: "quota in panel" };
  }

  // Request indexing — visible button only
  try {
    await clickRequestIndexing(page);
  } catch {
    const fallback = page.locator('[role="button"][aria-label*="Request indexing" i]').filter({ visible: true }).first();
    if ((await fallback.count()) === 0) {
      await page.screenshot({ path: resolve(root, "gsc-debug-last.png"), fullPage: true });
      return { status: "skip-no-button", pageUrl };
    }
    await fallback.scrollIntoViewIfNeeded();
    await fallback.click({ timeout: 15_000 });
  }

  console.log("  live test…");

  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(4000);
    const t = (await page.locator("body").innerText().catch(() => "")) ?? "";
    if (QUOTA_PATTERNS.some((p) => p.test(t))) {
      return { status: "quota", pageUrl, message: t.slice(0, 300) };
    }
    if (/indexing requested|successfully|live test.*passed|request submitted/i.test(t)) {
      await page.getByRole("button", { name: /dismiss|close|got it/i }).first().click({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(3000);
      return { status: "requested", pageUrl };
    }
    if (/dismiss/i.test(t) && /tested|live/i.test(t)) {
      await page.getByText(/^dismiss$/i).first().click({ timeout: 5000 }).catch(() => page.keyboard.press("Escape"));
      await page.waitForTimeout(3000);
      return { status: "requested", pageUrl };
    }
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(2000);
  return { status: "requested", pageUrl, message: "timeout-assumed" };
}

async function clickRequestIndexing(page) {
  const btn = page.getByRole("button", { name: /request indexing/i }).filter({ visible: true }).first();
  await btn.waitFor({ state: "visible", timeout: 20_000 });
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await btn.click({ timeout: 15_000 });
}

const urls = getPendingUrls();
console.log(`Pending: ${urls.length} URL(s)\n`);

const browser = await chromium.launchPersistentContext(USER_DATA, {
  headless: false,
  slowMo: 30,
  viewport: { width: 1400, height: 900 },
  channel: "chrome",
});
const page = browser.pages()[0] ?? (await browser.newPage());

const requested = [];
const skipped = [];
let quotaHit = false;

try {
  const inspectInput = await waitForGscReady(page);

  for (const url of urls) {
    if (quotaHit) break;
    try {
      const result = await submitOne(page, inspectInput, url);

      if (result.status === "requested") {
        console.log("  ✓ requested");
        requested.push(url);
      } else if (result.status === "skip-indexed") {
        console.log("  skip — already indexed");
        skipped.push(url);
      } else if (result.status === "quota") {
        console.log(`  ✗ QUOTA: ${result.message ?? "declined"}`);
        quotaHit = true;
      } else {
        console.log("  skip — no button (see gsc-debug-last.png)");
        skipped.push(url);
      }
    } catch (err) {
      console.log(`  ✗ error: ${err.message?.slice(0, 120) ?? err}`);
      await page.goto(INSPECT_BASE, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
} finally {
  await browser.close();
}

console.log("\n=== Summary ===");
console.log(`Requested: ${requested.length}`);
console.log(`Skipped:   ${skipped.length}`);
console.log(`Quota hit: ${quotaHit ? "YES — stopped" : "no"}`);
if (requested.length) {
  console.log(`\nnpm run gsc:daily -- ${requested.join(" ")}`);
}
process.stdout.write(JSON.stringify({ requested, skipped, quotaHit }));
