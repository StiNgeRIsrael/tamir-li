# SEO hacks checklist

Track legal SEO growth tactics for tamir.li. **Deferred:** YouTube Shorts (see `docs/seo-autonomous-log.md`).

| Item | Status | Notes |
|------|--------|-------|
| seo-manifest all 7 locales | done | **289 routes** — `scripts/generate-seo-manifest.ts` (LOCALES × tools/hubs/premium + he/en pilots) |
| Comparison page /alternatives/freeconvert (he+en) | done | `AlternativePage`, sitemap, footer link; prerender OK |
| Use-case landings (2 pilots) | done | `/use-cases/whatsapp-image-compress`, `/use-cases/email-pdf-attach` |
| llms.txt full expansion | done | `public/llms.txt` — hubs, tools, intent pages, locales |
| Blog→tool reverse links on ToolPage | done | `getBlogArticlesLinkingToPath` + `relatedGuides` (Hebrew) |
| Footer links to hubs + top 10 tools | done | `SiteFooter` — 5 hubs + 15 tool links |
| Embeddable widget snippet page/docs | done | `/widget` + `docs/embeddable-widget.md` |
| Medium syndication guide + 1 blog canonical note | done | `docs/medium-syndication.md` + JPG→PNG `syndicationNote` |
| Benchmark PR content draft in docs | done | `docs/benchmark-pr-draft.md` |
| SoftwareApplication on category hubs | done | `CategoryHubPage` JSON-LD (`2b0678c`) |
| npm test + build pass | done | 142 tests; sitemap **345** URLs; manifest **289** routes |
| Production verify after push | done | All new URLs **200**; Googlebot prerender has `<h1>` + page copy |
| GSC inspect key new URLs | done | 5/5 inspected — all **unknown to Google** (new; expect discovery after sitemap refresh) |
| IndexNow | done | Key file `public/0411d0e0f603485ca957edff69e0e608.txt`; `npm run indexnow` submits **546** sitemap URLs; CI pings after deploy when `INDEXNOW_KEY` secret is set |

**Checklist: 14/14 done (100%)** — deferred tactics (YouTube Shorts) excluded per scope.

## Commits

| Hash | Summary |
|------|---------|
| `2b0678c` | Comparison pages, 7-locale manifest base, footer hubs, blog reverse links, SoftwareApplication |
| `3f09307` | Use-case pilots, widget page, Hebrew alt copy, docs, manifest 289 routes, llms.txt expansion |

## Production verify (2026-06-26, post-`3f09307`)

| Signal | Result |
|--------|--------|
| `/health` | 200 |
| `/seo-manifest.json` | 200, **289** routes |
| `/sitemap.xml` | **345** URLs |
| `/alternatives/freeconvert` | 200, prerender OK |
| `/use-cases/whatsapp-image-compress` | 200, prerender OK |
| `/widget` | 200, prerender OK |
| `/en/alternatives/freeconvert` | 200 |

## GSC batch inspect (`sc-domain:tamir.li`, 2026-06-26)

| URL | Verdict | Coverage |
|-----|---------|----------|
| `/alternatives/freeconvert` | NEUTRAL | Unknown to Google |
| `/use-cases/whatsapp-image-compress` | NEUTRAL | Unknown to Google |
| `/widget` | NEUTRAL | Unknown to Google |
| `/en/alternatives/freeconvert` | NEUTRAL | Unknown to Google |
| `/use-cases/email-pdf-attach` | NEUTRAL | Unknown to Google |

**Next:** Resubmit sitemap in GSC UI so 345 URLs replace stale 847 count; request indexing for tier-1 new URLs after crawl.

## Deferred

| Item | Reason |
|------|--------|
| YouTube Shorts | User deferred |
