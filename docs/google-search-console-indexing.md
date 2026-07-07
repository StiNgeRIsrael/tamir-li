# Google Search Console indexing for Tamir.li


**Deploy:** Pushing to main on GitHub triggers an automatic build on [tamir.li](https://tamir.li) (Plesk Node.js); allow ~5 minutes before production reflects new sitemap/SEO assets.
This site has **~337 URLs** in the pruned sitemap (functional tools + category hubs + Hebrew-only blog; 7 locales for tools/static pages). Previously ~847 URLs when every tool slug and blog locale was included. The sitemap is generated at build time from the same route list as the app (`src/lib/sitemap-paths.ts` + `src/lib/tool-availability.ts`).

**Per-URL “Request indexing” in Search Console often speeds up discovery for priority pages**, but Google does **not** offer a public bulk API for everyday site owners to request indexing for every URL. Manual inspection plus a correct sitemap is the practical workflow.

**Sitemap prune (2026):** Only functional tools are indexed; `image-converter` uses popular pairs (not all format combinations); blog paths are Hebrew-only (`/blog`, not `/en/blog`); coming-soon tools get `noindex` on their pages but are omitted from the sitemap.

## Cursor MCP (gscServer) — optional

Manual Google Search Console MCP runs via uvx mcp-search-console in Cursor (not stored in this repo). OAuth credentials stay on your machine only.

| Item | Location |
|------|----------|
| MCP config | C:\Users\sting\.cursor\mcp.json → gscServer |
| OAuth client JSON filename | gsc_client_secrets.json |
| Full path (save Desktop app JSON here) | C:\Users\sting\.cursor\credentials\gsc_client_secrets.json |
| Setup steps | C:\Users\sting\.cursor\credentials\README-gsc.txt |

After you add the JSON file, **fully quit and restart Cursor**. Manual URL Inspection in the [Search Console UI](https://search.google.com/search-console) is still useful for priority URLs (see below).

---

## One-time setup (do once per property)

1. **Verify** the property for `https://tamir.li` in [Google Search Console](https://search.google.com/search-console).
2. **Deploy** a production build so `public/sitemap.xml` is live:
   - Build runs `npm run generate:sitemap` (uses `VITE_SITE_ORIGIN`, default `https://tamir.li`).
3. **Submit the sitemap once**: **Sitemaps** → add `https://tamir.li/sitemap.xml` → Submit.
   - Re-submit only after meaningful URL changes (new tools, locales, blog posts). You do not need to resubmit daily.
   - **After the 2026 prune (847 → 337 URLs):** resubmit so GSC re-reads the file. The live sitemap includes **`xhtml:link` hreflang alternates** for all 7 locales (`he-IL`, `en`, `es`, `ru`, `de`, `fr`, `it`, `x-default`) on each URL — Google uses these to associate language variants. Until GSC refreshes, the Sitemaps report may still show the old 847-URL count.
4. Confirm **Coverage** / **Pages** over the next days — most long-tail URLs will be crawled from the sitemap without manual requests.

---

## Priority URL list (manual indexing)

Generate a tiered list aligned with business value:

```bash
npm run generate:gsc-priority
```

Output file: **`gsc-priority-urls.txt`** (repo root).

| Tier | What | Count (approx.) |
|------|------|-----------------|
| **1** | `/`, `/premium`, `/about`, `/contact`, `/privacy`, `/terms` × all locales | 42 |
| **2** | Popular tool landings (`popular: true` in `src/lib/tools-data.ts`) × locales | varies |
| **3** | Blog, `/install`, format variants, other tools | remainder (~800) |

Helpers:

```bash
# Print only tier 1 (good for week 1)
npm run generate:gsc-priority -- --tier=1

# Print today's batch of 15 URLs in priority order
npm run generate:gsc-priority -- --daily=15
```

Track progress with `gsc-indexing-progress.txt` (gitignored, local to your machine) or a spreadsheet.

```bash
# Next 15 URLs, skipping ones you already submitted
npm run generate:gsc-priority -- --daily=15 --skip-indexed

# After requesting indexing in GSC UI, mark URLs done:
npm run generate:gsc-priority -- https://tamir.li/ https://tamir.li/en/
```

---

## Daily workflow (realistic limits)

Google’s UI limits how often you can **Request indexing** per property (commonly cited as **~10–20 successful requests per day**; exact limits are not published and can vary).

### One command (recommended)

```bash
npm run gsc:daily
```

**Daily automation:** Cursor Automation spec at `.cursor/automations/gsc-daily-indexing.md` (cron 06:00 UTC). Local loop: `/loop 1d` with `.cursor/loops/gsc-daily-indexing.md`.

Prints the next **15 URLs** from `gsc-browser-batch.txt` that still need a browser **Request indexing** submit (skips URLs in `gsc-request-indexed.txt`). Writes `gsc-daily-batch.txt` for copy-paste.

```bash
# After submitting in GSC UI:
npm run gsc:daily -- --mark-done https://tamir.li/ru/about https://tamir.li/hebrew-ocr

# API inspection batch (when browser queue is empty):
npm run gsc:daily -- --inspect

# Smaller batch:
npm run gsc:daily -- --limit=10
```

**Cursor agents:** use gscServer `batch_url_inspection` on today's `gsc-daily-batch.txt` URLs to see verdict before burning UI quota — skip `PASS` / already indexed.

**Cursor browser automation:** with GSC already open and logged in (`search.google.com/search-console/inspect`, property `tamir.li`), an agent can:
1. Read `gsc-daily-batch.txt` (or `npm run gsc:daily` output)
2. For each URL: fill **Inspect any URL** → Enter → **Request indexing** → wait ~90s for live test → **Dismiss**
3. `npm run gsc:daily -- <url>` to mark done in `gsc-request-indexed.txt`

Each request takes ~1–2 minutes (live URL test). Stop at ~12–15/day if Google shows quota limits.

### Recommended routine (~10–15 minutes/day)

1. Run `npm run gsc:daily` (or ask an agent to run it + MCP inspect).
2. Open [URL Inspection](https://search.google.com/search-console/inspect).
3. For each URL in the batch:
   - If MCP shows **PASS** / Submitted and indexed → skip UI request; `--mark-done` anyway.
   - If **unknown** or **discovered-not-indexed** → paste URL → **Request indexing**.
4. **Stop at ~10–15 requests** even if the batch has more — additional requests are usually ignored until the next day.
5. **Mark done** — `npm run gsc:daily -- --mark-done <url> [<url>...]`
6. **Weekly** — check **Pages** / **Indexing** for errors; fix 404s, redirects, and `noindex` mistakes before requesting more URLs.

### Legacy / full sitemap queue

```bash
npm run generate:gsc-priority -- --daily=15 --skip-indexed
```

Track API inspections in `gsc-indexing-progress.txt` (gitignored). The browser queue (`gsc-browser-batch.txt`) is for high-priority landing pages and locale gaps.

### Suggested schedule

| Week | Focus |
|------|--------|
| 1 | Tier 1 only (42 URLs → ~3–4 days at 10–15/day) |
| 2–3 | Tier 2 popular tools |
| Ongoing | Tier 3 in batches; rely on sitemap for the long tail |

Hebrew (`https://tamir.li/...`) and English (`https://tamir.li/en/...`) usually deserve earlier slots than smaller locales.

---

## Sitemap vs URL Inspection

| Method | Role |
|--------|------|
| **Sitemap** | Required baseline. Tells Google all canonical URLs. Submit once; keep accurate on deploy. Each `<url>` includes hreflang alternates (`xhtml:link`) for locale variants — resubmit after major sitemap changes so GSC picks up the new URL set and hreflang graph. |
| **URL Inspection → Request indexing** | Nudge for **priority** URLs or after fixes. Not a substitute for sitemap; not scalable to 847 URLs by hand. |

Both together work best: sitemap for completeness, manual inspection for pages that matter for traffic or were recently updated.

---

## IndexNow (Bing / Yandex)

IndexNow notifies participating engines when URLs change. tamir.li uses it for bulk discovery alongside the sitemap.

| Item | Location |
|------|----------|
| Key file (public) | `public/{INDEXNOW_KEY}.txt` → `https://tamir.li/{key}.txt` |
| Submit script | `npm run indexnow` (`scripts/indexnow-ping.ts`) |
| URL source | Same list as sitemap — `getAllSitemapUrls()` in `src/lib/sitemap-paths.ts` |
| CI | **Deploy to Plesk** workflow pings after Cloudflare purge when `INDEXNOW_KEY` GitHub secret is set |

```bash
# Local / one-off (after key file is live on production):
INDEXNOW_KEY=your-key npm run indexnow

# Preview count without submitting:
INDEXNOW_KEY=your-key npm run indexnow -- --dry-run
```

Set **`INDEXNOW_KEY`** in GitHub → Settings → Secrets and variables → Actions (same value as the `.txt` filename body).

---

## What we cannot automate (today)

- **Search Console MCP** is configured locally in Cursor (gscServer); see section above. This repo does not contain OAuth secrets.
- **Indexing API** ([`indexing.googleapis.com`](https://developers.google.com/search/apis/indexing-api/v3/using-api)) is restricted to job postings and livestream structured data — **not** for general tool/converter pages.
- **URL Inspection API** exists for query/inspection workflows in some setups but does **not** replace the manual “Request indexing” quota for typical publishers.

If Google exposes stable, general-purpose bulk indexing for standard sites in the future, this repo could add a script — until then, use `gsc-priority-urls.txt` and the daily batch flags above.

---

## Related files

| File | Purpose |
|------|---------|
| `scripts/gsc-daily-indexing.ts` | **Daily command** — browser request batch + mark-done |
| `scripts/gsc-priority-urls.ts` | Tiered URL generator (full sitemap queue) |
| `scripts/indexnow-ping.ts` | Post-deploy IndexNow bulk submit |
| `scripts/generate-sitemap.ts` | Writes `public/sitemap.xml` |
| `src/lib/sitemap-paths.ts` | Single source of truth for indexed paths |
| `src/lib/tools-data.ts` | `popular: true` drives tier 2 |
| `gsc-priority-urls.txt` | Generated output (regenerate after route/tool changes) |

---

## Checklist

- [ ] Property verified in Search Console
- [ ] `https://tamir.li/sitemap.xml` submitted and status “Success”
- [ ] `npm run generate:gsc-priority` run on latest `main`
- [ ] Tier 1 URLs inspected / requested (week 1)
- [ ] Tier 2 popular tools batched over following weeks
- [ ] Monitor **Pages** for crawl errors before burning daily request quota
