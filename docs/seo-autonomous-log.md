# SEO Autonomous Agent Log

Continuous improvement log for tamir.li SEO iterations.

---

## Iteration 1 — 2026-06-26

### Deploy status (production vs local)

| Signal | Production (`https://tamir.li`) | Local (this branch) |
|--------|----------------------------------|---------------------|
| Homepage static SEO | **Live** — hreflang, canonical, JSON-LD, OG tags in `index.html` | Matches |
| `seo-manifest.json` | **404 Not Found** — bot prerender inactive | Generated at build (`14 routes`) |
| Tool pages (e.g. `/jpg-to-png`) | SPA shell / homepage meta for crawlers without manifest | Bot prerender + slug SEO blocks ready post-deploy |
| Sitemap | Old format (no `xhtml:link` hreflang) until redeploy | **337 URLs** with hreflang alternates |

**Verdict:** Partial deploy — frontend shell SEO landed; backend bot prerender + new sitemap not yet on production. **Deploy required** for full SEO stack.

### GSC findings (`sc-domain:tamir.li`)

**URL Inspection (tier-1 sample):**
- `https://tamir.li/` — **PASS**, Submitted and indexed (last crawled 2026-06-25)
- `https://tamir.li/jpg-to-png` — **NEUTRAL**, URL unknown to Google (never crawled)

**Indexing issues (14 tier-1 URLs checked):**
- **Indexed (2):** `/`, `/en`
- **Discovered – currently not indexed (8):** `/es`, `/ru`, `/de`, `/fr`, `/it`, `/premium`, `/en/premium`, `/es/premium`
- **Unknown to Google (4):** `/ru/premium`, `/de/premium`, `/fr/premium`, `/it/premium` (partial batch)
- No canonical conflicts or robots blocks detected

### Skill audit gaps addressed

From `seo-mastery` checklist vs repo:
- hreflang in sitemap — **added** (`xhtml:link` per URL)
- og:image dimensions — **added** (`SEOHead` + `index.html`)
- E-E-A-T About page — **expanded** to de, es, fr
- Format-pair content depth — **added** jpg-to-png, png-to-jpg, webp-to-jpg (7 locales)
- Trust snippet on tool pages — **added** (privacy/HTTPS block in `ToolSeoBlocks`)
- Bot prerender canonical bug — **fixed** (locale-prefixed URLs now canonicalize correctly)

### Changes made (files)

- `scripts/generate-sitemap.ts` — hreflang alternates in XML
- `public/sitemap.xml` — regenerated (337 URLs)
- `src/components/SEOHead.tsx` — og:image:width/height/alt
- `index.html` — static og:image dimensions
- `src/lib/site.ts` — `getOgImageDimensions()` helper
- `src/lib/tool-seo-content.ts` — slug-specific FAQs + lookup by format slug
- `src/components/ToolSeoBlocks.tsx` — trust block; formatSlug prop
- `src/pages/ToolPage.tsx` — slug-aware SEO blocks + FAQ JSON-LD
- `backend/src/lib/seo-prerender.ts` — canonical URL fix
- `src/lib/translations/{he,en,de,es,fr,ru,it}.ts` — trust copy; de/es/fr aboutPage

### Verification

- `npm test` — 142 passed
- `npm run build` — success (sitemap + seo-manifest prebuild OK)

### Next iteration priorities

1. **Deploy to production** — critical for bot prerender (`seo-manifest.json`), hreflang sitemap, tool SEO blocks
2. **IndexNow ping** — tier-1 URLs + top tool slugs after deploy (`npm run indexnow`)
3. **GSC re-inspect** — `/jpg-to-png`, `/premium`, locale homepages; request indexing for tier-1
4. **Expand seo-manifest** — cover all 337 sitemap routes (currently 14 top routes)
5. **Locale indexing** — investigate why `/es`–`/it` are discovered-but-not-indexed (crawl priority, internal links)
6. **Core Web Vitals** — Lighthouse on homepage + top tool pages post-deploy
7. **More format pairs** — pdf-to-word, mp4-to-mp3 slug content if GSC shows demand

## Loop � 2026-06-26 (UTC+3 local)

### Workflow
- Push to \origin/main\ ? Plesk/host auto-build on tamir.li (~5 min observed).
- Poll: \/health\, homepage \static-json-ld-org\, \/sitemap.xml\ URL count, \/tools/image\, \/seo-manifest.json\.

### Git / deploy
- **Commit:** \da882c\ � *Prune sitemap and expand structured SEO for crawlers.*
- **Push:** \5a6925b..fda882c main -> main\ (success, no force).
- **Pre-deploy prod:** health 200, sitemap **847** URLs, no \static-json-ld-org\ in HTML.
- **Post-deploy prod (~5 min):** health 200, sitemap **337** URLs, \static-json-ld-org\ + \static-json-ld-website\ on \/\ and Googlebot fetch of \/tools/image\; \/tools/image\ in sitemap with hreflang; \/seo-manifest.json\ 200.
- **Deploy confirmed:** yes

### Still local (not pushed)
- \.screenshots/\ (untracked)
- \scripts/setup-paypal-plans.ts\ (untracked)

### GSC MCP
- Not run from this subagent (no MCP invoke in tool set). Manual inspection recommended for \https://tamir.li/\ and sitemap resubmit if needed.

### Next loop priorities
1. GSC: URL inspection for \/\, \/tools/image\, pruned high-priority tool URLs; confirm sitemap last read ~337 URLs.
2. IndexNow ping (\scripts/indexnow-ping.ts\) for changed hub/tool URLs after deploy.
3. Validate category hub prerender/JSON-LD for all \/tools/{category}\ routes.
4. Monitor crawl stats for drop from 847?337 (expected consolidation, not error).

