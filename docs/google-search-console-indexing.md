# Google Search Console indexing for Tamir.li

This site has **~847 URLs** across 7 locales (Hebrew default + `/en`, `/es`, `/ru`, `/de`, `/fr`, `/it`). The sitemap is generated at build time from the same route list as the app (`src/lib/sitemap-paths.ts`).

**Per-URL “Request indexing” in Search Console often speeds up discovery for priority pages**, but Google does **not** offer a public bulk API for everyday site owners to request indexing for every URL. Manual inspection plus a correct sitemap is the practical workflow.

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

### Recommended routine (~10–15 minutes/day)

1. **Morning** — open [URL Inspection](https://search.google.com/search-console/inspect).
2. Run `npm run generate:gsc-priority -- --daily=15 --skip-indexed` (skips URLs in `gsc-indexing-progress.txt`).
3. For each URL:
   - Paste the full URL → **Enter**.
   - Wait for “URL is on Google” or “URL is not on Google”.
   - If not indexed (or you changed the page recently) → **Request indexing**.
   - Skip if Google already shows a recent successful crawl and the page is indexed.
4. **Stop at ~10–15 requests** even if you have time — additional requests are usually ignored until the next day.
5. **Mark done** — `npm run generate:gsc-priority -- <url> [<url>...]` appends to `gsc-indexing-progress.txt`.
6. **Weekly** — check **Pages** / **Indexing** for errors; fix 404s, redirects, and `noindex` mistakes before requesting more URLs.

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
| **Sitemap** | Required baseline. Tells Google all canonical URLs. Submit once; keep accurate on deploy. |
| **URL Inspection → Request indexing** | Nudge for **priority** URLs or after fixes. Not a substitute for sitemap; not scalable to 847 URLs by hand. |

Both together work best: sitemap for completeness, manual inspection for pages that matter for traffic or were recently updated.

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
| `scripts/gsc-priority-urls.ts` | Tiered URL generator |
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
