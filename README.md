# tamir.li — conversion hub

Hebrew-first online file conversion at [tamir.li](https://tamir.li). Vite/React frontend, Express/Prisma backend, deployed as a **Node.js monolith** on Plesk. Optional **Android app** (Capacitor) loads the live site in a WebView.

**Repo:** [github.com/StiNgeRIsrael/tamir-li](https://github.com/StiNgeRIsrael/tamir-li)

## Documentation

| Doc | Audience |
|-----|----------|
| [AGENTS.md](./AGENTS.md) | AI coding agents — stack, conventions, do/don't |
| [docs/README.md](./docs/README.md) | Full internal doc index (deploy, Android, ads, SEO) |
| [docs/tools-and-features.md](./docs/tools-and-features.md) | Tool catalog, SEO slugs, APIs |
| [docs/local-dev.md](./docs/local-dev.md) | Local development |
| [docs/plesk-node-deploy.md](./docs/plesk-node-deploy.md) | Production deployment |
| [docs/android-play-console-setup.md](./docs/android-play-console-setup.md) | Android / Play Store (operator) |
| [docs/admob-setup.md](./docs/admob-setup.md) | AdMob (Android ads) |

## Quick start

Requires Node.js ≥ 22.

```sh
git clone https://github.com/StiNgeRIsrael/tamir-li.git
cd tamir-li
npm install
npm run dev:all
```

Frontend: http://localhost:8080 · API: http://localhost:3001 (see [docs/local-dev.md](./docs/local-dev.md) for ports/env)

## Tech stack

- **Frontend:** Vite, TypeScript, React, shadcn/ui, Tailwind CSS
- **Backend:** Express, Prisma, MySQL 8
- **Auth:** Google Identity Services → JWT
- **Billing (web):** PayPal · **Billing (Android app):** Google Play
- **Ads (web):** Adsterra (+ admin DB) · **Ads (Android app):** AdMob
- **Android:** Capacitor 8, `@capacitor-community/admob`, `@capgo/native-purchases`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Frontend + backend (local dev) |
| `npm run build` | Production build (SPA + backend + sitemap + SEO manifest) |
| `npm start` | Serve built app + API (production monolith) |
| `npm run cap:sync` | Build frontend + sync Capacitor Android project |
| `npm test` | Run test suite |

## Deploy

Push to `main` on **StiNgeRIsrael/tamir-li** triggers [Deploy to Plesk](https://github.com/StiNgeRIsrael/tamir-li/actions/workflows/deploy-plesk.yml). See [docs/deploy-checklist.md](./docs/deploy-checklist.md).
