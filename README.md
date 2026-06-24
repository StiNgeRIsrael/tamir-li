# tamir.li — conversion hub

Hebrew-first online file conversion at [tamir.li](https://tamir.li). Vite/React frontend, Express/Prisma backend, deployed as a Node.js monolith on Plesk.

## Documentation

| Doc | Audience |
|-----|----------|
| [AGENTS.md](./AGENTS.md) | AI coding agents — stack, conventions, do/don't |
| [docs/tools-and-features.md](./docs/tools-and-features.md) | Full tool catalog, SEO slugs, APIs, implementation status |
| [docs/product-vision.md](./docs/product-vision.md) | Product mission, freemium, ads, SEO |
| [docs/local-dev.md](./docs/local-dev.md) | Local development setup |
| [docs/plesk-node-deploy.md](./docs/plesk-node-deploy.md) | Production deployment |

## Quick start

Requires Node.js ≥ 22.

```sh
git clone https://github.com/stingerisrael/tamir-s-conversion-hub.git
cd tamir-s-conversion-hub
npm install
npm run dev:all
```

Frontend: http://localhost:8080 · API: http://localhost:3001

See [docs/local-dev.md](./docs/local-dev.md) for environment variables, database setup, and split-process details.

## Tech stack

- **Frontend:** Vite, TypeScript, React, shadcn/ui, Tailwind CSS
- **Backend:** Express, Prisma, MySQL 8
- **Auth:** Google Identity Services → JWT
- **Billing:** PayPal (default), Stripe optional

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Frontend + backend (local dev) |
| `npm run build` | Production build (SPA + sitemap) |
| `npm start` | Serve built app + API (production) |
| `npm test` | Run test suite |
