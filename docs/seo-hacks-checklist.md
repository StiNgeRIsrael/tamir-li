# SEO hacks checklist

Track legal SEO growth tactics for tamir.li. **Deferred:** YouTube Shorts, IndexNow (see `docs/seo-autonomous-log.md`).

| Item | Status | Notes |
|------|--------|-------|
| seo-manifest all 7 locales | done | `scripts/generate-seo-manifest.ts` — LOCALES × tools/hubs/premium |
| Comparison page /alternatives/freeconvert (he+en) | done | `AlternativePage`, sitemap, footer link |
| Use-case landings (2 pilots) | done | `/use-cases/whatsapp-image-compress`, `/use-cases/email-pdf-attach` |
| llms.txt full expansion | done | `public/llms.txt` — hubs, tools, intent pages, locales |
| Blog→tool reverse links on ToolPage | done | `getBlogArticlesLinkingToPath` + `relatedGuides` (Hebrew) |
| Footer links to hubs + top 10 tools | done | `SiteFooter` — 5 hubs + 15 tool links |
| Embeddable widget snippet page/docs | done | `/widget` + `docs/embeddable-widget.md` |
| Medium syndication guide + 1 blog canonical note | done | `docs/medium-syndication.md` + JPG→PNG article note |
| Benchmark PR content draft in docs | done | `docs/benchmark-pr-draft.md` |
| SoftwareApplication on category hubs | done | `CategoryHubPage` JSON-LD |
| npm test + build pass | pending | Run before push |
| Production verify after push | pending | manifest count, 200s, prerender |
| GSC inspect key new URLs | pending | 3–5 new URLs via GSC MCP |

## Commits (this batch)

_Update after push._

## Deferred

| Item | Reason |
|------|--------|
| YouTube Shorts | User deferred |
| IndexNow | Awaiting `INDEXNOW_KEY` + host file |
