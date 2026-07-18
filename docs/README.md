# Internal documentation — tamir.li

**Canonical repo:** [github.com/StiNgeRIsrael/tamir-li](https://github.com/StiNgeRIsrael/tamir-li)  
**Production:** [tamir.li](https://tamir.li) — Node.js monolith on Plesk (API + SPA on one host). DNS via Cloudflare.  
**Last doc review:** 2026-06-28 (goal, purpose, business model defined in AGENTS.md + product-vision.md).

---

## Strategy & product

| Doc | When to read |
|-----|----------------|
| [product-vision.md](./product-vision.md) | **Goal, purpose, business model**, users, roadmap |
| [../AGENTS.md](../AGENTS.md) | AI agents — goal/purpose/revenue pillars, stack, conventions |
| [implementation-status.md](./implementation-status.md) | Code audit: live / partial / stub |
| [production-readiness.md](./production-readiness.md) | Prod feature matrix, probes |
| [tools-and-features.md](./tools-and-features.md) | Tool catalog, SEO slugs, API table |

---

## Start here (engineering)

| Doc | When to read |
|-----|----------------|
| [deploy-checklist.md](./deploy-checklist.md) | Pre/post deploy on `main` |
| [plesk-node-deploy.md](./plesk-node-deploy.md) | **Primary** production deploy (Node monolith) |
| [local-dev.md](./local-dev.md) | Split frontend + backend locally |
| [autonomous-testing.md](./autonomous-testing.md) | `npm run site:check` — conversion probes (no premium checkout) |

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
| [play-console-mcp-setup.md](./play-console-mcp-setup.md) | Cursor MCP → Google Play Android Developer API |
| [agent-autonomy.md](./agent-autonomy.md) | What agents can wire alone + one-time bootstrap |
| [admob-setup.md](./admob-setup.md) | AdMob app/units, `.env.production`, `app-ads.txt` |

**Package:** `li.tamir.app` · **WebView URL:** `https://tamir.li`  
**Billing:** Google Play (native) · **Ads:** AdMob only (never Adsterra on Android)  
**Web billing:** PayPal unchanged

---

## Monetization

| Doc | Scope |
|-----|--------|
| [product-vision.md](./product-vision.md) | **Canonical** — goal, purpose, business model, funnel |
| [monetization-readiness-plan.md](./monetization-readiness-plan.md) | Launch checklist (web) |
| [monetization-implementation-plan.md](./monetization-implementation-plan.md) | Site-wide ad/checkout gaps |
| [freemium-messaging.md](./freemium-messaging.md) | Upsell copy tone and cycles |
| [adsterra-setup.md](./adsterra-setup.md) | **Web** display ads (admin `/admin/ads`) |
| [admob-setup.md](./admob-setup.md) | **Android** ads |
| [paypal-setup.md](./paypal-setup.md) | **Web** subscriptions (primary) |
| [paypal-mcp-setup.md](./paypal-mcp-setup.md) | Cursor MCP → PayPal (live catalog / webhooks) |
| [play-console-mcp-setup.md](./play-console-mcp-setup.md) | Cursor MCP → Play Console (subscriptions, releases) |
| [stripe-setup.md](./stripe-setup.md) | Optional second rail (`ENABLE_STRIPE=true`) |
| [adsense-setup.md](./adsense-setup.md) | AdSense (pending / optional on web) |

---

## SEO & growth

| Doc | Purpose |
|-----|---------|
| [seo-hacks-checklist.md](./seo-hacks-checklist.md) | SEO sprint tasks |
| [seo-autonomous-log.md](./seo-autonomous-log.md) | Iteration log |
| [google-search-console-indexing.md](./google-search-console-indexing.md) | GSC, sitemap, `npm run gsc:daily`, daily automation |
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
