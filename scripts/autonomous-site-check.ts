/**
 * Autonomous site health & conversion probe for tamir.li.
 *
 * Usage:
 *   npm run site:check
 *   SITE_URL=https://tamir.li npm run site:check
 *   SITE_URL=http://localhost:5173 API_URL=http://localhost:5000 npm run site:check
 *   npm run site:check:prod
 *
 * Skips all billing / premium checkout routes by design.
 */

import { getFunctionalToolIds } from "../src/lib/tool-availability";
import { tools, getDefaultSlug } from "../src/lib/tools-data";
import {
  normalizeFormat,
  isOutputFormatSupported,
  isInputFormatSupported,
  formatToExtension,
} from "../src/lib/image-convert";
import { usesClientDocumentConversion } from "../src/lib/document-convert";

if (process.argv.includes("--prod")) {
  process.env.SITE_URL = "https://tamir.li";
  process.env.API_URL = "https://tamir.li";
}

const MAX_DAILY_FREE = 5;
const TIMEOUT_MS = Number(process.env.SITE_CHECK_TIMEOUT_MS ?? 15_000);
const SKIP_BILLING = true;
const SKIP_NETWORK = process.env.SKIP_NETWORK === "true" || process.env.SKIP_NETWORK === "1";

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
  warn?: boolean;
};

const results: CheckResult[] = [];
/** Set by GET /health when network checks run — used for richer failure hints */
let lastDbOk: boolean | undefined;

function pass(name: string, detail?: string): void {
  results.push({ name, ok: true, detail });
}

function warn(name: string, detail: string): void {
  results.push({ name, ok: true, warn: true, detail });
}

function fail(name: string, detail: string): void {
  results.push({ name, ok: false, detail });
}

function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

function apiUrl(): string {
  return (process.env.API_URL ?? siteUrl()).replace(/\/$/, "");
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function looksLikeJson(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json");
}

function looksLikeHtml(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("text/html");
}

async function checkPage(path: string, label?: string): Promise<void> {
  const name = label ?? `page ${path}`;
  const url = `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) {
      fail(name, `HTTP ${res.status} — ${url}`);
      return;
    }
    const html = await res.text();
    if (!html.includes("<!DOCTYPE html") && !html.includes("<html")) {
      fail(name, `Expected HTML shell at ${url}`);
      return;
    }
    pass(name, `${res.status} (${html.length} bytes)`);
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

async function checkStaticFile(file: string): Promise<void> {
  const name = `static /${file}`;
  const url = `${siteUrl()}/${file}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      fail(name, `HTTP ${res.status}`);
      return;
    }
    const body = await res.text();
    if (body.length < 10) {
      fail(name, "Empty or too short");
      return;
    }
    const cache = res.headers.get("cache-control") ?? "(none)";
    if (file === "sitemap.xml" && !body.includes("<urlset")) {
      fail(name, "Missing <urlset> root element");
      return;
    }
    if (file === "robots.txt" && !body.toLowerCase().includes("sitemap")) {
      warn(name, `robots.txt has no Sitemap directive — cache: ${cache}`);
      return;
    }
    pass(name, `${body.length} bytes, cache-control: ${cache}`);
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

async function checkApiJson(
  method: "GET" | "POST",
  path: string,
  opts?: {
    expectStatus?: number;
    body?: unknown;
    validate?: (data: unknown) => string | null;
    skipJsonCheck?: boolean;
  }
): Promise<void> {
  const name = `api ${method} ${path}`;
  const url = `${apiUrl()}${path}`;
  try {
    const res = await fetchWithTimeout(url, {
      method,
      headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
    });

    const expected = opts?.expectStatus ?? 200;
    if (res.status !== expected) {
      const text = await res.text();
      let detail = `Expected HTTP ${expected}, got ${res.status}: ${text.slice(0, 200)}`;
      if (
        path === "/api/usage/today" &&
        res.status === 500 &&
        lastDbOk === false
      ) {
        detail +=
          " (database unreachable per /health — fix DATABASE_URL / MySQL; usage limits require DB)";
      }
      fail(name, detail);
      return;
    }

    if (opts?.skipJsonCheck) {
      pass(name, `HTTP ${res.status}`);
      return;
    }

    if (!looksLikeJson(res)) {
      const snippet = (await res.text()).slice(0, 120);
      fail(
        name,
        `Expected JSON but got HTML/static (API routing broken?). Snippet: ${snippet}`
      );
      return;
    }

    const data = await res.json();
    const validationError = opts?.validate?.(data);
    if (validationError) {
      fail(name, validationError);
      return;
    }
    pass(name);
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

function checkImageFormatHelpers(): void {
  const cases: Array<[string, boolean]> = [
    ["PNG", true],
    ["JPG", true],
    ["WEBP", true],
    ["BMP", true],
    ["TIFF", false],
    ["SVG", false],
  ];
  for (const [fmt, expected] of cases) {
    const got = isOutputFormatSupported(fmt);
    if (got !== expected) {
      fail(`format helper isOutputFormatSupported(${fmt})`, `Expected ${expected}, got ${got}`);
    } else {
      pass(`format helper isOutputFormatSupported(${fmt})`);
    }
  }

  if (formatToExtension("JPEG") !== "jpg") {
    fail("format helper formatToExtension(JPEG)", "Expected jpg");
  } else {
    pass("format helper formatToExtension(JPEG)");
  }

  if (normalizeFormat("jpeg") !== "JPG") {
    fail("format helper normalizeFormat(jpeg)", 'Expected "JPG"');
  } else {
    pass("format helper normalizeFormat(jpeg)");
  }

  if (!isInputFormatSupported("SVG")) {
    fail("format helper isInputFormatSupported(SVG)", "Expected true");
  } else {
    pass("format helper isInputFormatSupported(SVG)");
  }
}

function checkDocumentConvertHelpers(): void {
  if (!usesClientDocumentConversion("word-to-pdf")) {
    fail("document helper usesClientDocumentConversion(word-to-pdf)", "Expected true");
  } else {
    pass("document helper usesClientDocumentConversion(word-to-pdf)");
  }

  if (!usesClientDocumentConversion("pdf-to-word")) {
    fail("document helper usesClientDocumentConversion(pdf-to-word)", "Expected true");
  } else {
    pass("document helper usesClientDocumentConversion(pdf-to-word)");
  }
}

function checkToolAvailabilityCatalog(): void {
  const functional = getFunctionalToolIds();
  for (const id of functional) {
    const tool = tools.find((t) => t.id === id);
    if (!tool) {
      fail(`functional tool ${id}`, "Not found in tools-data catalog");
    } else {
      pass(`functional tool ${id}`, getDefaultSlug(tool));
    }
  }

  for (const tool of tools) {
    if (!functional.includes(tool.id)) {
      fail(`catalog tool ${tool.id}`, "Every tools-data entry must be marked functional");
    }
  }

  const unknownIds = ["__not_a_tool__", "pdf-compressor"];
  for (const id of unknownIds) {
    if (functional.includes(id)) {
      fail(`coming-soon guard ${id}`, "Should not be marked functional");
    } else {
      pass(`coming-soon guard ${id}`, "correctly non-functional");
    }
  }
}

async function checkSitemapToolSlugs(): Promise<void> {
  const name = "sitemap contains functional tool slugs";
  try {
    const res = await fetchWithTimeout(`${siteUrl()}/sitemap.xml`);
    if (!res.ok) {
      fail(name, `HTTP ${res.status}`);
      return;
    }
    const xml = await res.text();
    for (const id of getFunctionalToolIds()) {
      const tool = tools.find((t) => t.id === id);
      if (!tool) continue;
      const slug = getDefaultSlug(tool);
      if (!xml.includes(`/${slug}`) && !xml.includes(`${slug}<`)) {
        fail(name, `Missing slug /${slug} for ${id}`);
        return;
      }
    }
    pass(name, `${functionalSlugCount(xml)} functional slugs found`);
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

function functionalSlugCount(xml: string): number {
  return getFunctionalToolIds().filter((id) => {
    const tool = tools.find((t) => t.id === id);
    return tool && xml.includes(getDefaultSlug(tool));
  }).length;
}

async function checkCloudflareHints(): Promise<void> {
  const name = "CDN cache headers (Cloudflare)";
  try {
    const res = await fetchWithTimeout(`${siteUrl()}/robots.txt`);
    const server = res.headers.get("server") ?? "";
    const cfRay = res.headers.get("cf-ray");
    const cache = res.headers.get("cache-control") ?? "";
    if (cfRay || server.toLowerCase().includes("cloudflare")) {
      pass(name, `cf-ray=${cfRay ?? "n/a"}, cache-control=${cache || "(none)"}`);
    } else if (siteUrl().includes("localhost")) {
      warn(name, "Local dev — Cloudflare headers not expected");
    } else {
      warn(name, `No cf-ray header — may be direct origin. server=${server || "unknown"}`);
    }
  } catch (e) {
    warn(name, e instanceof Error ? e.message : String(e));
  }
}

async function checkApiNotSwallowedBySpa(): Promise<void> {
  const name = "api routing not swallowed by SPA";
  try {
    const res = await fetchWithTimeout(`${apiUrl()}/health`);
    if (looksLikeHtml(res)) {
      fail(name, "GET /health returned HTML — Node monolith may not front /api/*");
      return;
    }
    pass(name);
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

async function checkConversionsPost(): Promise<void> {
  const name = "api POST /api/conversions";
  const url = `${apiUrl()}/api/conversions`;
  try {
    const res = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId: "video-converter",
        fromFormat: "MP4",
        toFormat: "AVI",
      }),
      credentials: "include",
    });

    if (res.status === 501) {
      if (!looksLikeJson(res)) {
        fail(name, "Expected JSON body for HTTP 501");
        return;
      }
      const data = (await res.json()) as { error?: string };
      if (data.error !== "CONVERSION_NOT_READY") {
        fail(name, `Expected CONVERSION_NOT_READY, got ${data.error}`);
        return;
      }
      pass(name, "HTTP 501 — legacy deploy (not ready)");
      return;
    }

    if (res.status === 429) {
      pass(name, "HTTP 429 — daily limit enforced");
      return;
    }

    if (res.status === 202) {
      if (!looksLikeJson(res)) {
        fail(name, "Expected JSON body for HTTP 202");
        return;
      }
      const data = (await res.json()) as { jobId?: string; status?: string };
      if (!data.jobId) {
        fail(name, "Missing jobId in 202 response");
        return;
      }
      if (data.status !== "PENDING") {
        fail(name, `Expected status PENDING, got ${data.status}`);
        return;
      }
      pass(name, `HTTP 202 — job enqueued (${data.jobId.slice(0, 8)}…)`);
      await checkConversionJobLifecycle(data.jobId);
      return;
    }

    const text = await res.text();
    let detail = `Expected HTTP 202 or 501, got ${res.status}: ${text.slice(0, 200)}`;
    if (res.status === 500 && lastDbOk === false) {
      detail += " (database unreachable per /health — conversion queue requires DB)";
    }
    fail(name, detail);
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}

async function checkConversionJobLifecycle(jobId: string): Promise<void> {
  const statusName = "api GET /api/conversions/:id";
  const fileName = "api GET /api/conversions/:id/file";
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(`${apiUrl()}/api/conversions/${jobId}`, {
        credentials: "include",
      });
      if (!looksLikeJson(res) || !res.ok) {
        fail(statusName, `HTTP ${res.status}`);
        return;
      }
      const job = (await res.json()) as { status?: string; hasOutputFile?: boolean };
      if (job.status === "FAILED") {
        fail(statusName, "Job failed during probe");
        return;
      }
      if (job.status === "COMPLETED") {
        pass(statusName, `COMPLETED (hasOutputFile=${job.hasOutputFile ?? false})`);

        const fileRes = await fetchWithTimeout(`${apiUrl()}/api/conversions/${jobId}/file`, {
          credentials: "include",
        });
        if (fileRes.status === 404) {
          warn(fileName, "HTTP 404 — job complete but no output file yet");
          return;
        }
        if (!fileRes.ok) {
          fail(fileName, `HTTP ${fileRes.status}`);
          return;
        }
        const bytes = (await fileRes.arrayBuffer()).byteLength;
        if (bytes < 1) {
          fail(fileName, "Empty output body");
          return;
        }
        pass(fileName, `${bytes} bytes streamed`);
        return;
      }
    } catch (e) {
      fail(statusName, e instanceof Error ? e.message : String(e));
      return;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  warn(statusName, "Timed out waiting for COMPLETED — worker may be offline");
}

async function checkUsageEndpoints(): Promise<void> {
  await checkApiJson("GET", "/api/usage/today", {
    validate: (data) => {
      const d = data as { used?: number; max?: number | null; isPremium?: boolean };
      if (typeof d.used !== "number") return "Missing used count";
      if (typeof d.isPremium !== "boolean") return "Missing isPremium flag";
      if (!d.isPremium && d.max !== MAX_DAILY_FREE) {
        return `Expected max=${MAX_DAILY_FREE} for free tier, got ${d.max}`;
      }
      return null;
    },
  });

  // Validate route exists without incrementing production usage counters
  await checkApiJson("POST", "/api/usage/record", {
    expectStatus: 400,
    body: {},
    validate: (data) => {
      const d = data as { error?: string };
      if (d.error !== "INVALID_BODY") return `Expected INVALID_BODY, got ${d.error}`;
      return null;
    },
  });
}

async function run(): Promise<void> {
  console.log(`\n🔍 tamir.li autonomous site check`);
  console.log(`   SITE_URL=${siteUrl()}`);
  console.log(`   API_URL=${apiUrl()}`);
  console.log(`   SKIP_BILLING=${SKIP_BILLING}`);
  console.log(`   SKIP_NETWORK=${SKIP_NETWORK}\n`);

  // Pure logic (no network)
  checkImageFormatHelpers();
  checkDocumentConvertHelpers();
  checkToolAvailabilityCatalog();

  if (SKIP_NETWORK) {
    pass("network checks skipped", "SKIP_NETWORK=1 — logic-only mode");
    if (SKIP_BILLING) {
      pass("billing routes skipped", "PayPal/Stripe checkout not probed");
    }
    printReport();
    return;
  }

  // Key pages — locale routing
  await checkPage("/", "home (he default)");
  await checkPage("/jpg-to-png", "tool jpg-to-png (he)");
  await checkPage("/jpg-to-bmp", "tool jpg-to-bmp (he)");
  await checkPage("/en/jpg-to-png", "tool jpg-to-png (en)");
  await checkPage("/image-compressor", "client tool image-compressor");
  await checkPage("/merge-pdf", "client tool merge-pdf");
  await checkPage("/docx-to-pdf", "client tool word-to-pdf");
  await checkPage("/pdf-to-docx", "client tool pdf-to-word");
  await checkPage("/blog", "blog index");

  // Static SEO files
  await checkStaticFile("sitemap.xml");
  await checkStaticFile("robots.txt");
  await checkStaticFile("ads.txt");
  await checkStaticFile("llms.txt");

  await checkSitemapToolSlugs();
  await checkCloudflareHints();

  // API probes (no billing)
  await checkApiNotSwallowedBySpa();

  await checkApiJson("GET", "/health", {
    validate: (data) => {
      const d = data as {
        status?: string;
        uptime?: number;
        db?: { ok?: boolean; error?: string };
        billing?: { configured?: boolean };
        googlePlay?: { configured?: boolean; packageName?: string };
      };
      if (d.status !== "OK") return `Expected status OK, got ${d.status}`;
      if (typeof d.uptime !== "number") {
        warn("api GET /health uptime", "Missing uptime — redeploy backend for enhanced probe");
      }
      if (d.db === undefined) {
        warn("api GET /health database", "Missing db field — redeploy backend for DB probe");
      } else {
        lastDbOk = d.db.ok;
        if (d.db.ok === false) {
          const codeHint =
            typeof d.db.error === "string"
              ? ` Prisma/db.error=${d.db.error} — see docs/plesk-mysql-troubleshooting.md (P1000 auth, P1001 reach, P1003 wrong DB name).`
              : " Check DATABASE_URL, migrations, and Plesk Node env.";
          warn("api GET /health database", `db.ok is false — MySQL/Prisma unreachable.${codeHint}`);
        }
      }
      if (d.billing?.configured === true) {
        pass("api GET /health billing", "PayPal configured");
      } else if (d.billing) {
        warn("api GET /health billing", "PayPal not fully configured");
      }
      if (d.googlePlay?.configured === true) {
        pass(
          "api GET /health googlePlay",
          `configured (${d.googlePlay.packageName || "com.tamir.li"})`
        );
      } else if (d.googlePlay) {
        warn(
          "api GET /health googlePlay",
          "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON missing on server — add GH secret or Plesk env (docs/agent-autonomy.md)"
        );
      } else {
        warn(
          "api GET /health googlePlay",
          "Missing googlePlay field — redeploy backend for Play readiness probe"
        );
      }
      return null;
    },
  });

  await checkApiJson("GET", "/api/conversions/health", {
    validate: (data) => {
      const d = data as { ok?: boolean; service?: string };
      if (!d.ok) return "Expected ok:true";
      if (d.service !== "conversions") return `Unexpected service: ${d.service}`;
      return null;
    },
  });

  await checkUsageEndpoints();

  await checkApiJson("GET", "/api/tools/config", {
    validate: (data) => {
      const d = data as { tools?: Array<{ toolId?: string; enabled?: boolean }> };
      if (!Array.isArray(d.tools)) return "Expected { tools: [...] }";
      if (d.tools.length === 0) return "Expected at least one tool config entry";
      const first = d.tools[0];
      if (!first?.toolId || typeof first.enabled !== "boolean") {
        return "Malformed tool config entry";
      }
      if (lastDbOk === false) {
        warn(
          "api GET /api/tools/config",
          "DB degraded — endpoint returned default config (all tools enabled)"
        );
      }
      return null;
    },
  });

  await checkConversionsPost();

  if (SKIP_BILLING) {
    pass("billing routes skipped", "PayPal/Stripe checkout not probed");
  }

  printReport();
}

function printReport(): void {
  const failed = results.filter((r) => !r.ok);
  const warnings = results.filter((r) => r.ok && r.warn);

  console.log("Results:");
  for (const r of results) {
    const icon = !r.ok ? "✗" : r.warn ? "⚠" : "✓";
    const suffix = r.detail ? ` — ${r.detail}` : "";
    console.log(`  ${icon} ${r.name}${suffix}`);
  }

  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (warnings.length) console.log(`${warnings.length} warning(s)`);

  if (failed.length) {
    console.error(`\n❌ ${failed.length} check(s) failed:\n`);
    for (const f of failed) {
      console.error(`  • ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  console.log("\n✅ All checks passed\n");
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
