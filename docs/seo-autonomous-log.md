# SEO Autonomous Agent Log

Continuous improvement log for tamir.li SEO iterations.

---

## Iteration 1 ? 2026-06-26

### Deploy status (production vs local)

| Signal | Production (`https://tamir.li`) | Local (this branch) |
|--------|----------------------------------|---------------------|
| Homepage static SEO | **Live** ? hreflang, canonical, JSON-LD, OG tags in `index.html` | Matches |
| `seo-manifest.json` | **404 Not Found** ? bot prerender inactive | Generated at build (`14 routes`) |
| Tool pages (e.g. `/jpg-to-png`) | SPA shell / homepage meta for crawlers without manifest | Bot prerender + slug SEO blocks ready post-deploy |
| Sitemap | Old format (no `xhtml:link` hreflang) until redeploy | **337 URLs** with hreflang alternates |

**Verdict:** Partial deploy ? frontend shell SEO landed; backend bot prerender + new sitemap not yet on production. **Deploy required** for full SEO stack.

### GSC findings (`sc-domain:tamir.li`)

**URL Inspection (tier-1 sample):**
- `https://tamir.li/` ? **PASS**, Submitted and indexed (last crawled 2026-06-25)
- `https://tamir.li/jpg-to-png` ? **NEUTRAL**, URL unknown to Google (never crawled)

**Indexing issues (14 tier-1 URLs checked):**
- **Indexed (2):** `/`, `/en`
- **Discovered ? currently not indexed (8):** `/es`, `/ru`, `/de`, `/fr`, `/it`, `/premium`, `/en/premium`, `/es/premium`
- **Unknown to Google (4):** `/ru/premium`, `/de/premium`, `/fr/premium`, `/it/premium` (partial batch)
- No canonical conflicts or robots blocks detected

### Skill audit gaps addressed

From `seo-mastery` checklist vs repo:
- hreflang in sitemap ? **added** (`xhtml:link` per URL)
- og:image dimensions ? **added** (`SEOHead` + `index.html`)
- E-E-A-T About page ? **expanded** to de, es, fr
- Format-pair content depth ? **added** jpg-to-png, png-to-jpg, webp-to-jpg (7 locales)
- Trust snippet on tool pages ? **added** (privacy/HTTPS block in `ToolSeoBlocks`)
- Bot prerender canonical bug ? **fixed** (locale-prefixed URLs now canonicalize correctly)

### Changes made (files)

- `scripts/generate-sitemap.ts` ? hreflang alternates in XML
- `public/sitemap.xml` ? regenerated (337 URLs)
- `src/components/SEOHead.tsx` ? og:image:width/height/alt
- `index.html` ? static og:image dimensions
- `src/lib/site.ts` ? `getOgImageDimensions()` helper
- `src/lib/tool-seo-content.ts` ? slug-specific FAQs + lookup by format slug
- `src/components/ToolSeoBlocks.tsx` ? trust block; formatSlug prop
- `src/pages/ToolPage.tsx` ? slug-aware SEO blocks + FAQ JSON-LD
- `backend/src/lib/seo-prerender.ts` ? canonical URL fix
- `src/lib/translations/{he,en,de,es,fr,ru,it}.ts` ? trust copy; de/es/fr aboutPage

### Verification

- `npm test` ? 142 passed
- `npm run build` ? success (sitemap + seo-manifest prebuild OK)

### Next iteration priorities

1. **Deploy to production** ? critical for bot prerender (`seo-manifest.json`), hreflang sitemap, tool SEO blocks
2. **IndexNow ping** ? tier-1 URLs + top tool slugs after deploy (`npm run indexnow`)
3. **GSC re-inspect** ? `/jpg-to-png`, `/premium`, locale homepages; request indexing for tier-1
4. **Expand seo-manifest** ? cover all 337 sitemap routes (currently 14 top routes)
5. **Locale indexing** ? investigate why `/es`?`/it` are discovered-but-not-indexed (crawl priority, internal links)
6. **Core Web Vitals** ? Lighthouse on homepage + top tool pages post-deploy
7. **More format pairs** ? pdf-to-word, mp4-to-mp3 slug content if GSC shows demand

## Loop ? 2026-06-26 (UTC+3 local)

### Workflow
- Push to \origin/main\ ? Plesk/host auto-build on tamir.li (~5 min observed).
- Poll: \/health\, homepage \static-json-ld-org\, \/sitemap.xml\ URL count, \/tools/image\, \/seo-manifest.json\.

### Git / deploy
- **Commit:** \da882c\ ? *Prune sitemap and expand structured SEO for crawlers.*
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

---

## Iteration 3 ? Post-deploy follow-up ? 2026-06-26

**Deploy ref:** `fda882c` (confirmed live: 337 sitemap URLs, `seo-manifest.json` 200, static JSON-LD on home).

### GSC MCP (`sc-domain:tamir.li`)

**Property:** `sc-domain:tamir.li` (siteOwner)

**URL Inspection (delta vs Iteration 1 ? pre-deploy baseline: only `/` and `/en` indexed):**

| URL | Verdict | Coverage | Last crawled | Delta vs Iter 1 |
|-----|---------|----------|--------------|-----------------|
| `https://tamir.li/` | PASS | Submitted and indexed | 2026-06-25 | No change (still indexed) |
| `https://tamir.li/jpg-to-png` | NEUTRAL | Unknown to Google | ? | No change (never crawled) |
| `https://tamir.li/tools/image` | NEUTRAL | Unknown to Google | ? | New sample; not yet discovered |
| `https://tamir.li/premium` | NEUTRAL | Unknown to Google | ? | Was "Discovered ? not indexed" in batch; live inspect shows unknown (sitemap not re-read post-prune) |

**Sitemap in GSC:** `https://tamir.li/sitemap.xml` ? last downloaded **2026-06-25**, GSC still reports **847 URLs** (prod now **337** after `fda882c`). Google has not re-fetched the pruned sitemap yet.

**Indexed count:** Still **2 URLs** (`/`, `/en`) ? no new indexing since deploy (~hours ago).

### IndexNow

- `npm run indexnow` ? **`INDEXNOW_KEY not set ? skipping IndexNow ping.`**
- Action needed: set `INDEXNOW_KEY` in env + host `{key}.txt` at site root, then re-run for tier-1 + top tool slugs.

### Git / uncommitted work

- Branch `main` up to date with `origin/main` (`496f643` latest).
- Commit `524ac71e` not found in repo; no valuable uncommitted SEO changes (only untracked `.screenshots/`, `scripts/setup-paypal-plans.ts`).
- **No commit/push performed.**

### Next loop priorities

1. **Resubmit sitemap in GSC** (or wait for recrawl) ? GSC stale at 847 URLs; prod is 337 with hreflang.
2. **Set `INDEXNOW_KEY`** and ping tier-1 URLs + `/jpg-to-png`, `/tools/image`, `/premium`, locale homepages.
3. **Request indexing** in GSC URL Inspection for tier-1 tool + hub URLs once sitemap re-read confirms 337.
4. **Expand `seo-manifest.json`** beyond 14 routes so Googlebot gets prerendered tool/hub HTML on first crawl.
5. **Re-check in 48?72h** ? expect first tool/hub crawls after sitemap refresh + IndexNow; monitor `/en` only locale indexed pattern.

---

## Iteration 2 ? 2026-06-26

### Git / deploy

- **Commit:** `ccf236a` ? *Improve crawler SEO: hreflang sitemap, bot prerender, and tool metadata.*
- **Push:** `fda882c..ccf236a main -> main` (success, no force)
- **Deploy poll (~2 min, attempt 9):** all signals green
  - `https://tamir.li/seo-manifest.json` ? **200** (was 404 in iter 1)
  - `https://tamir.li/sitemap.xml` ? **xhtml:link hreflang** present
  - Googlebot fetch `/jpg-to-png` ? tool title `???? ????? ????? ? ???? ??` (not homepage title)
- **Deploy confirmed:** yes

### GSC MCP (`sc-domain:tamir.li`) ? delta vs Iteration 1

| URL | Verdict | Coverage | Last crawled | Delta vs Iter 1 |
|-----|---------|----------|--------------|-----------------|
| `https://tamir.li/` | PASS | Submitted and indexed | 2026-06-25 | No change |
| `https://tamir.li/jpg-to-png` | NEUTRAL | Unknown to Google | ? | No change (bot prerender now live; crawl pending) |
| `https://tamir.li/premium` | NEUTRAL | Unknown to Google | ? | Was "Discovered ? not indexed" in batch; direct inspect shows unknown (not yet crawled post-deploy) |

**Takeaway:** Deploy landed bot prerender + hreflang sitemap on prod; GSC indexing unchanged (expected within hours/days of recrawl).

### IndexNow

- `npm run indexnow` ? **`INDEXNOW_KEY not set ? skipping IndexNow ping.`**

### seo-manifest expansion (local, not yet pushed)

- **Before (prod after `ccf236a`):** 14 routes (bug: `collectToolSlugs()` missing `/` prefix in TOP_SLUGS)
- **After (local build):** **81 routes** ? 41 Hebrew + 40 English (`/en/*`)
  - All 33 functional tool slugs (Hebrew) + category hubs + home/premium/blog
  - English mirror for home, premium, category hubs, and all tool slugs
- **Prerender:** `seo-prerender.ts` ? exact locale path lookup + `html lang`/`dir` for EN bot HTML

### Verification

- `npm test` ? 142 passed
- `npm run build` ? success (337 sitemap URLs, 81 manifest routes)

### Uncommitted iteration 2 files (awaiting next push)

- `scripts/generate-seo-manifest.ts`
- `public/seo-manifest.json`
- `backend/src/lib/seo-prerender.ts`
- `docs/seo-autonomous-log.md`

### Next iteration priorities

1. **Push + deploy** manifest expansion (`81 routes`) so English bot crawls get localized titles
2. **Set `INDEXNOW_KEY`** and ping tier-1 + top 30 tool slugs
3. **GSC:** request indexing for `/jpg-to-png`, `/premium`, `/tools/image`; resubmit sitemap if GSC still shows 847 URLs
4. **Expand manifest** to es/ru/de/fr/it locale paths (currently he + en only)
5. **Monitor** first tool-page crawls 48?72h post-deploy

### Manifest expansion (priority #4 addressed)

| Metric | Before | After |
|--------|--------|-------|
| `seo-manifest.json` routes | **14** | **81** |
| Locales in manifest | Hebrew only (top 12 slugs) | **Hebrew + English** (`he`, `en`) |
| Functional tool slugs | 12 (TOP_SLUGS slice) | **33** (all from `collectToolSlugs()`) |
| Category hubs `/tools/*` | 2 (`image`, `document`) | **5** (image, video, audio, document, ai) |

**Generator changes (`scripts/generate-seo-manifest.ts`):**
- Dropped `TOP_SLUGS` cap; iterate `collectToolSlugs()` + `CATEGORY_HUB_CATEGORIES` for both `he` and `en` via `localePath()`.
- Hebrew blog `/blog` retained (Hebrew-only sitemap entry).

**Prerender changes (`backend/src/lib/seo-prerender.ts`):**
- Exact path lookup first (`/en/jpg-to-png`), then Hebrew fallback via `normalizeManifestPath()`.
- Locale-aware bot HTML (`lang`/`dir`) for English paths.

**Verification:** `npm test` 142 passed; `npm run build` OK (337 sitemap URLs, 81 manifest routes).

**IndexNow:** Not run ? `INDEXNOW_KEY` not set in env (user must set key + host `{key}.txt` at site root).

**Commit/push:** `24859b3` ? *Expand seo-manifest to 81 routes for Hebrew and English bot prerender.* Pushed to `origin/main`.

---

## Iteration 4 ? Manifest deploy verification ? 2026-06-26

**Push ref:** `24859b3` (`496f643..24859b3 main ? main`)

### Production poll (`https://tamir.li/seo-manifest.json`)

| Signal | Pre-deploy | Post-deploy (~2.5 min) |
|--------|------------|------------------------|
| Route count | **14** | **81** |
| `generatedAt` | `2026-06-25T22:03:30.142Z` | `2026-06-25T22:06:55.067Z` |
| HTTP status | 200 | 200 |

**Deploy confirmed:** yes ? expanded manifest live on production.

### Manifest breakdown (local = prod)

- **81 routes:** Hebrew (`/`, `/premium`, 5× `/tools/*`, 33 tool slugs, `/blog`) + English mirror (`/en`, `/en/premium`, 5× `/en/tools/*`, 33× `/en/{slug}`).
- All entries sourced from `collectToolSlugs()` + `CATEGORY_HUB_CATEGORIES` via `isToolFunctional()`.

### IndexNow

- Still skipped ? **`INDEXNOW_KEY` not set** in env. User should set key, host `{key}.txt` at site root, then run `npm run indexnow` for tier-1 + hub/tool URLs.

### GSC / indexing (unchanged since Iteration 3)

- Still **2 indexed URLs** (`/`, `/en`) ? manifest expansion enables bot prerender on first crawl; indexing lag expected until sitemap re-read + crawl budget.
- GSC sitemap still stale at **847 URLs** (prod **337**).

### Next loop priorities

1. User: set **`INDEXNOW_KEY`** and ping tier-1 URLs + top tool/hub slugs.
2. GSC: resubmit sitemap or wait for recrawl to **337 URLs**.
3. Request indexing for `/jpg-to-png`, `/tools/image`, `/en/jpg-to-png` once sitemap refresh confirmed.
4. Re-check GSC indexed count in **48?72h** after IndexNow + sitemap refresh.


---

## Iteration 5 ? Post?81-route manifest + GSC + slug FAQs ? 2026-06-26

**Deploy ref:** `24859b3` / log `5c9e726` (81-route manifest live on prod).

### Production poll

| Signal | Value |
|--------|-------|
| `seo-manifest.json` routes | **81** |
| `generatedAt` | `2026-06-25T22:06:55.067Z` (prod) |
| Sitemap URLs | **337** (prod) |
| GSC sitemap count | **847** (stale ? not re-read since prune) |

### Bot prerender spot-check

- Googlebot UA `GET https://tamir.li/jpg-to-png` ? **200**, tool-specific `<title>` (contains JPG/PNG, not homepage title), `lang="he-IL"`.
- **Confirmed:** 81-route manifest prerender working on production.

### GSC MCP (`sc-domain:tamir.li`) ? `inspect_url_enhanced`

**Delta vs Iteration 3** (indexed count still **2**: `/`, `/en`):

| URL | Verdict | Coverage | Last crawled | Delta vs Iter 3 |
|-----|---------|----------|--------------|-----------------|
| `https://tamir.li/` | PASS | Submitted and indexed | 2026-06-25 | No change |
| `https://tamir.li/jpg-to-png` | NEUTRAL | Unknown to Google | ? | No change |
| `https://tamir.li/en/jpg-to-png` | NEUTRAL | **Discovered ? currently not indexed** | ? | **New** ? English tool URL entered discovery queue |
| `https://tamir.li/tools/image` | NEUTRAL | Unknown to Google | ? | No change |
| `https://tamir.li/premium` | NEUTRAL | Unknown to Google | ? | No change |

**Takeaway:** Manifest expansion enables bot prerender; first English tool URL discovered but **no new indexing** yet. Hebrew `/jpg-to-png` still unknown ? crawl/indexing lag expected until sitemap refresh + IndexNow.

### Slug-specific FAQ content (`tool-seo-content.ts`)

Added slug-level blocks (7 locales each, with `directAnswer` + 3 FAQs):

| Slug | Tool | Status |
|------|------|--------|
| `mp3-to-wav` | audio-converter | **Added** (functional) |
| `docx-to-pdf` | word-to-pdf | **Added** (functional; sitemap slug) |
| `pdf-to-word` | pdf-to-word | **Skipped** (not functional ? Coming Soon) |

### IndexNow

- **`INDEXNOW_KEY` still not set** ? user must set env var + host `{key}.txt` at site root, then run `npm run indexnow` for tier-1 + hub/tool URLs.

### Verification

- `npm test` ? 142 passed
- `npm run build` ? success (337 sitemap URLs, 81 manifest routes)

### Git / deploy

- **Commit:** *(this iteration)* ? *Add slug-specific SEO FAQs for mp3-to-wav and docx-to-pdf.*
- Pushed to `origin/main` ? Plesk auto-deploy (~5 min).

### Next loop priorities

1. User: set **`INDEXNOW_KEY`** and ping `/`, `/en/jpg-to-png`, `/jpg-to-png`, `/tools/image`, `/premium`.
2. GSC: resubmit sitemap or wait for recrawl (**847 ? 337**).
3. Request indexing in GSC for discovered `/en/jpg-to-png` + Hebrew tool URLs.
4. Re-check indexed count in **48?72h** after IndexNow + sitemap refresh.
5. Expand manifest to **es/ru/de/fr/it** locale paths (he + en only today).

