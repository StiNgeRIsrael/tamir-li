/**
 * Daily GSC indexing workflow for tamir.li.
 *
 * Two tracks:
 * 1. API inspection queue — tiered sitemap URLs (`gsc-indexing-progress.txt`)
 * 2. Browser "Request indexing" queue — high-priority URLs needing UI submit (`gsc-browser-batch.txt`)
 *
 * Usage:
 *   npm run gsc:daily              # print today's browser-request batch (default 15)
 *   npm run gsc:daily -- --inspect # print API inspection batch (skip already inspected)
 *   npm run gsc:daily -- --limit=10
 *   npm run gsc:daily -- --mark-done <url> [<url>...]
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const browserQueuePath = resolve(root, "gsc-browser-batch.txt");
const browserDonePath = resolve(root, "gsc-request-indexed.txt");
const dailyOutPath = resolve(root, "gsc-daily-batch.txt");

const DEFAULT_LIMIT = 15;

function parseArgs(): {
  limit: number;
  inspect: boolean;
  markDone: string[];
} {
  const opts = { limit: DEFAULT_LIMIT, inspect: false, markDone: [] as string[] };
  for (const arg of process.argv.slice(2)) {
    const limitMatch = arg.match(/^--limit=(\d+)$/);
    if (limitMatch) opts.limit = Number(limitMatch[1]);
    if (arg === "--inspect") opts.inspect = true;
    if (arg.startsWith("http://") || arg.startsWith("https://")) opts.markDone.push(arg);
    if (arg === "--mark-done" || arg.startsWith("--mark-done=")) continue;
  }
  return opts;
}

function readLines(path: string): string[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function readDoneSet(): Set<string> {
  return new Set(readLines(browserDonePath));
}

function markBrowserDone(urls: string[]): void {
  const existing = readDoneSet();
  const toAdd = urls.filter((u) => !existing.has(u));
  if (!toAdd.length) {
    console.log("All URLs already in gsc-request-indexed.txt.");
    return;
  }
  const header = existsSync(browserDonePath)
    ? ""
    : "# Browser \"Request indexing\" completed — one URL per line\n";
  appendFileSync(browserDonePath, header + toAdd.map((u) => `${u}\n`).join(""), "utf8");
  console.log(`Marked ${toAdd.length} URL(s) → ${browserDonePath}`);
}

function nextBrowserBatch(limit: number): string[] {
  const queue = readLines(browserQueuePath);
  const done = readDoneSet();
  return queue.filter((u) => !done.has(u)).slice(0, limit);
}

function runInspectBatch(limit: number): void {
  const script = resolve(__dirname, "gsc-priority-urls.ts");
  const result = spawnSync(
    "npx",
    ["tsx", script, `--daily=${limit}`, "--skip-indexed"],
    { cwd: root, encoding: "utf8", shell: true }
  );
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function writeDailyOutput(urls: string[], mode: "browser" | "inspect"): void {
  const lines = [
    `# GSC daily batch — ${new Date().toISOString().slice(0, 10)}`,
    `# Mode: ${mode === "browser" ? "Request indexing (GSC UI)" : "URL Inspection API"}`,
    `# Property: sc-domain:tamir.li`,
    `#`,
    `# Browser: https://search.google.com/search-console/inspect`,
    `# After submitting, mark done: npm run gsc:daily -- --mark-done <url>`,
    "",
    ...urls,
    "",
  ];
  writeFileSync(dailyOutPath, lines.join("\n"), "utf8");
}

const { limit, inspect, markDone } = parseArgs();

if (markDone.length) {
  markBrowserDone(markDone);
  process.exit(0);
}

if (inspect) {
  console.log(`=== GSC API inspection batch (next ${limit}, skip inspected) ===\n`);
  runInspectBatch(limit);
  console.log(`\nTip: use Cursor gscServer batch_url_inspection with URLs above.`);
  process.exit(0);
}

const batch = nextBrowserBatch(limit);
const skipped = readLines(browserQueuePath).length - batch.length - readDoneSet().size;

console.log(`=== GSC daily indexing — browser request batch (${new Date().toISOString().slice(0, 10)}) ===`);
console.log(`Queue: ${browserQueuePath}`);
console.log(`Done tracker: ${browserDonePath}`);
console.log(`Limit: ${limit} URLs (~10–15/day UI quota)\n`);

if (!batch.length) {
  console.log("No URLs left in browser queue. Options:");
  console.log("  1. npm run gsc:daily -- --inspect     # next API inspection batch");
  console.log("  2. Add URLs to gsc-browser-batch.txt after deploy or new landing pages");
  console.log("  3. npm run generate:gsc-priority      # refresh tier list after route changes");
  process.exit(0);
}

for (const url of batch) {
  console.log(url);
}

writeDailyOutput(batch, "browser");

const remaining = readLines(browserQueuePath).filter((u) => !readDoneSet().has(u)).length - batch.length;
console.log(`\n${batch.length} URL(s) for today. ~${Math.max(0, remaining)} remaining in queue.`);
console.log(`Written → ${dailyOutPath}`);
console.log("\nWorkflow:");
console.log("  1. Open https://search.google.com/search-console/inspect");
console.log("  2. Paste each URL → Request indexing (skip if already indexed)");
console.log("  3. npm run gsc:daily -- --mark-done <url> [<url>...]");
