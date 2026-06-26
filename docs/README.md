# Internal documentation — tamir.li

**Canonical repo:** [github.com/StiNgeRIsrael/tamir-li](https://github.com/StiNgeRIsrael/tamir-li)  
**Production:** [tamir.li](https://tamir.li) — Node.js monolith on Plesk (API + SPA on one host).  
**Last doc review:** 2026-06-26 (Android / AdMob / Play Billing added).

---

## Start here

| Doc | When to read |
|-----|----------------|
| [../AGENTS.md](../AGENTS.md) | AI agents — stack, conventions, do/don't |
| [tools-and-features.md](./tools-and-features.md) | Tool catalog, SEO slugs, API table |
| [implementation-status.md](./implementation-status.md) | Code audit: live / partial / stub |
| [deploy-checklist.md](./deploy-checklist.md) | Pre/post deploy on `main` |
| [plesk-node-deploy.md](./plesk-node-deploy.md) | **Primary** production deploy (Node monolith) |

---

## Deploy & infra

| Doc | Status |
|-----|--------|
| [plesk-node-deploy.md](./plesk-node-deploy.md) | **Current** — Express + `dist/` on `tamir.li` |
| [deploy-checklist.md](./deploy-checklist.md) | **Current** — CI `Deploy to Plesk`, probes |
| [plesk-mysql-troubleshooting.md](./plesk-mysql-troubleshooting.md) | **Current** — DB / migrate quirks |
| [dns-setup-tamir-li.md](./dns-setup-tamir-li.md) | **Current** — Cloudflare → Plesk |
| [cloudflare-cache.md](./cloudflare-cache.md) | **Current** — optional purge after deploy |
| [plesk-deploy.md](./plesk-deploy.md) | **Deprecated** — legacy static `httpdocs` + `api.tamir.li` |
| [docker-plesk-deploy.md](./docker-plesk-deploy.md) | **Optional** — Compose stack, not default |
| [plesk-node-deploy.md](./plesk-node-deploy.md) | GitHub Actions: **Deploy to Plesk** on push to `main` |

**Deploy URL:** [Actions → Deploy to Plesk](https://github.com/StiNgeRIsrael/tamir-li/actions/workflows/deploy-plesk.yml)

---

## Android app (Capacitor)

| Doc | Purpose |
|-----|---------|
| [android-play-console-setup.md](./android-play-console-setup.md) | Operator checklist — Play Console, signing, AAB |
| [admob-setup.md](./admob-setup.md) | AdMob app/units, `.env.production`, `app-ads.txt` |

**Package:** `li.tamir.app` · **WebView URL:** `https://tamir.li`  
**Billing:** Google Play (native) · **Ads:** AdMob only (never Adsterra on Android)  
**Web billing:** PayPal unchanged

---

## Monetization

| Doc | Scope |
|-----|--------|
| [product-vision.md](./product-vision.md) | Mission, freemium, ads strategy |
| [monetization-readiness-plan.md](./monetization-readiness-plan.md) | Launch checklist (web) |
| [monetization-implementation-plan.md](./monetization-implementation-plan.md) | Site-wide ad/checkout gaps |
| [adsterra-setup.md](./adsterra-setup.md) | **Web** display ads (admin `/admin/ads`) |
| [admob-setup.md](./admob-setup.md) | **Android** ads |
| [paypal-setup.md](./paypal-setup.md) | **Web** subscriptions (primary) |
| [stripe-setup.md](./stripe-setup.md) | Optional second rail (`ENABLE_STRIPE=true`) |
| [adsense-setup.md](./adsense-setup.md) | AdSense (pending / optional on web) |

---

## SEO & growth

| Doc | Purpose |
|-----|---------|
| [seo-hacks-checklist.md](./seo-hacks-checklist.md) | SEO sprint tasks |
| [seo-autonomous-log.md](./seo-autonomous-log.md) | Iteration log |
| [google-search-console-indexing.md](./google-search-console-indexing.md) | GSC, sitemap, indexing |
| [google-analytics-setup.md](./google-analytics-setup.md) | GTM / GA4 |
| [gtm-setup-checklist.md](./gtm-setup-checklist.md) | GTM container |
| [medium-syndication.md](./medium-syndication.md) | Content syndication |

---

## Dev & QA

| Doc | Purpose |
|-----|---------|
| [local-dev.md](./local-dev.md) | Split frontend + backend locally |
| [autonomous-testing.md](./autonomous-testing.md) | `site:check` probes |
| [production-readiness.md](./production-readiness.md) | Prod feature matrix (high level) |
| [conversion-queue.md](./conversion-queue.md) | Server conversion jobs + ffmpeg |

---

## Outdated patterns (do not follow)

| Old assumption | Current reality |
|----------------|-----------------|
| Repo `Parlamentum/tamir-s-conversion-hub` | **StiNgeRIsrael/tamir-li** |
| API at `api.tamir.li` | **Same origin** — `https://tamir.li/api/*` (monolith) |
| Static FTPS to `httpdocs` only | **Node app** in `httpdocs/deploy/` via CI |
| `POST /api/conversions` → 501 | **202 enqueue** — audio real with ffmpeg; others stub passthrough |
| One ad network everywhere | **Web:** Adsterra · **Android app:** AdMob |
| One payment rail everywhere | **Web:** PayPal · **Android app:** Google Play Billing |
