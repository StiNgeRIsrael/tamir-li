# Deploy tamir.li frontend to Plesk

Static SPA (Vite + React Router) hosted on **Plesk** (Apache/nginx). DNS is managed in **Cloudflare** — see [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md).

**Not used for production frontend:** GitHub Pages (`.github/workflows/deploy-frontend.yml` is optional and disabled by default for Plesk users).

---

## Overview

| Step | Action |
|------|--------|
| 1 | Build locally or in CI: `npm run build:prod` |
| 2 | Upload contents of `dist/` to Plesk document root (`httpdocs`) |
| 3 | Enable SSL (Plesk Let's Encrypt and/or Cloudflare Full) |
| 4 | Verify SPA routes, `ads.txt`, `sitemap.xml`, `robots.txt` |

The build copies everything from `public/` into `dist/`, including `.htaccess`, `ads.txt`, `sitemap.xml`, and `robots.txt`.

---

## Prerequisites

- Node.js 22+ locally (or use CI to produce `dist/`)
- Plesk access for `tamir.li` (document root, usually `httpdocs`)
- Cloudflare DNS pointing apex and `www` to the Plesk server IP — confirm with your host (likely `74.208.236.85`)

---

## Environment variables (baked at build time)

Vite embeds `VITE_*` values into the JS bundle at **build** time. Set them in `.env.production.local` (see `.env.example`) before running `npm run build:prod`:

```env
VITE_SITE_ORIGIN=https://tamir.li
VITE_API_URL=https://api.tamir.li
VITE_GTM_ID=GTM-XXXXXXX
VITE_ADSENSE_CLIENT=ca-pub-4410150504570814
VITE_ADSENSE_SLOT_BANNER=...
VITE_ADSENSE_SLOT_SIDEBAR=...
VITE_ADSENSE_SLOT_INLINE=...
```

After changing any `VITE_*` value, rebuild and re-upload `dist/`.

---

## Build

```bash
npm ci
npm run build:prod
```

This runs `prebuild` → `generate:sitemap` (uses `VITE_SITE_ORIGIN`) then `vite build`.

Confirm these files exist in `dist/` before upload:

- `index.html`
- `.htaccess` — Apache SPA fallback for React Router
- `ads.txt`
- `sitemap.xml`
- `robots.txt`
- `assets/` (hashed JS/CSS)

---

## Upload to Plesk

### Manual (FTP / SFTP / File Manager)

1. Plesk → **Domains** → `tamir.li` → **File Manager** (or connect via SFTP).
2. Open the document root (`httpdocs` for the main domain, or the subdomain docroot if applicable).
3. **Back up** existing files if replacing a live site.
4. Delete old static assets in `httpdocs` (or replace in place).
5. Upload **all contents** of local `dist/` into `httpdocs` — not the `dist` folder itself.
6. Ensure `.htaccess` is present (some FTP clients hide dotfiles; enable “show hidden files”).

### Optional: Plesk Git deploy

Plesk → **Git** can pull the repo and run a deploy script, for example:

```bash
npm ci
npm run build:prod
rsync -a --delete dist/ ./httpdocs/
```

Store production env vars in Plesk environment settings or a protected `.env.production.local` on the server (never commit secrets).

### Node.js on Plesk

**Not required** for this frontend — it is a static SPA. Only use Plesk Node.js if you later add SSR; the current app does not need it.

---

## SPA routing (Apache)

`public/.htaccess` is copied to `dist/.htaccess` on build. It rewrites unknown paths to `index.html` so React Router handles client-side routes (e.g. `/tools/pdf-to-word`).

If you use **nginx** on Plesk instead of Apache, add equivalent `try_files` in the server block — `.htaccess` is ignored by nginx.

---

## SSL / HTTPS

Choose one or combine:

| Layer | Setting |
|-------|---------|
| **Cloudflare** | SSL/TLS → **Full** or **Full (strict)** (recommended with orange-cloud proxy) |
| **Plesk** | **SSL/TLS Certificates** → Let's Encrypt for `tamir.li` and `www.tamir.li` |

Avoid Cloudflare **Flexible** if Plesk serves HTTPS — use Full so traffic is encrypted end-to-end.

---

## Backend API (`api.tamir.li`)

The Express backend is **separate** from the static frontend:

- Host on the same Plesk server (subdomain + Node.js) or a VPS
- Point Cloudflare `api` A/CNAME to that host — see [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md)
- Set `VITE_API_URL=https://api.tamir.li` at frontend build time

See `docs/stripe-setup.md` for webhook URL: `https://api.tamir.li/api/billing/webhook`.

---

## Post-deploy checks

```bash
curl -I https://tamir.li/
curl https://tamir.li/ads.txt
curl -I https://tamir.li/sitemap.xml
curl -I https://tamir.li/tools/pdf-to-word
```

Browser:

- [ ] `https://tamir.li` loads the home page
- [ ] Deep link (e.g. `/blog`) loads without 404 (SPA fallback)
- [ ] `https://tamir.li/ads.txt` shows the AdSense line
- [ ] `https://tamir.li/sitemap.xml` returns XML
- [ ] GTM / AdSense fire in production (check Network tab)

---

## Related docs

- [`dns-setup-tamir-li.md`](./dns-setup-tamir-li.md) — Cloudflare DNS for Plesk
- [`adsense-setup.md`](./adsense-setup.md) — AdSense approval
- [`google-analytics-setup.md`](./google-analytics-setup.md) — GTM / GA4
- [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) — optional GitHub Pages deploy (not used for Plesk)

---

## GitHub Actions deploy (recommended)

Workflow: [`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml)

| Trigger | When it runs |
|---------|----------------|
| **workflow_dispatch** | Actions → Deploy to Plesk → Run workflow |
| **push to `main`** | After merge to `main` (optional automatic deploy) |

Steps: `npm ci` → `npm run build:prod` with `VITE_*` from repo settings → upload `dist/` to Plesk via **FTPS** (SamKirkland/FTP-Deploy-Action).

### Repository variables (Settings → Secrets and variables → Actions → Variables)

| Name | Example | Required |
|------|---------|----------|
| `VITE_SITE_ORIGIN` | `https://tamir.li` | Yes |
| `VITE_API_URL` | `https://api.tamir.li` | Recommended |
| `PLESK_FTP_SERVER_DIR` | `./` or `/httpdocs/` | Optional (default `./`) |
| `PLESK_FTP_PORT` | `21` | Optional (default `21`) |

### Repository secrets (Settings → Secrets and variables → Actions → Secrets)

| Secret | Description |
|--------|-------------|
| `PLESK_FTP_HOST` | Plesk FTP/FTPS hostname (e.g. `ftp.tamir.li` or server IP) |
| `PLESK_FTP_USER` | FTP account username (document root should be `httpdocs`) |
| `PLESK_FTP_PASSWORD` | FTP account password |
| `VITE_GTM_ID` | Google Tag Manager container ID (optional) |
| `VITE_ADSENSE_CLIENT` | AdSense publisher ID (optional) |
| `VITE_ADSENSE_SLOT_BANNER` | Ad slot ID (optional) |
| `VITE_ADSENSE_SLOT_SIDEBAR` | Ad slot ID (optional) |
| `VITE_ADSENSE_SLOT_INLINE` | Ad slot ID (optional) |

Create secrets from your machine with [GitHub CLI](https://cli.github.com/) (repo root):

```bash
gh auth login
gh variable set VITE_SITE_ORIGIN --body "https://tamir.li"
gh variable set VITE_API_URL --body "https://api.tamir.li"
gh secret set PLESK_FTP_HOST
gh secret set PLESK_FTP_USER
gh secret set PLESK_FTP_PASSWORD
# Optional analytics / ads (prompts for value):
gh secret set VITE_GTM_ID
gh secret set VITE_ADSENSE_CLIENT
```

Use `--body "value"` instead of a prompt when scripting non-interactive setup.

### SFTP instead of FTPS

If your host only exposes SFTP (SSH), replace the deploy step with [wlixcc/SFTP-Deploy-Action](https://github.com/wlixcc/SFTP-Deploy-Action) and secrets `PLESK_SSH_HOST`, `PLESK_SSH_USER`, `PLESK_SSH_PASSWORD` (or key). Document the same `dist/` → `httpdocs` target path.

### Alternative: Plesk Git extension (manual)

1. Plesk → **Domains** → `tamir.li` → **Git** → add repository URL (GitHub HTTPS or deploy key).
2. Set deployment path to `httpdocs` or a staging folder.
3. **Deploy actions** → enable **Additional deploy actions** and run:

   ```bash
   export VITE_SITE_ORIGIN=https://tamir.li
   export VITE_API_URL=https://api.tamir.li
   npm ci
   npm run build:prod
   cp -a dist/. ./httpdocs/
   ```

4. Store `VITE_*` and npm tokens in Plesk environment variables; never commit `.env` files.

Plesk Git does not run GitHub Actions — you either pull on the server or use the workflow above.
