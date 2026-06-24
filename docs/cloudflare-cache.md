# Cloudflare edge cache — tamir.li deploy

tamir.li sits behind Cloudflare. Vite emits **content-hashed** JS/CSS (`assets/index-*.js`), so those files rarely need a CDN purge after deploy. What *does* need invalidation:

| File | Why |
|------|-----|
| `index.html` | References the latest hashed asset names |
| `sw.js` | Service worker shell — must match the new precache manifest |
| `registerSW.js` | PWA registration bootstrap |

The browser **service worker runtime cache** is cleared when the user accepts the in-app “new version” prompt (`PwaUpdatePrompt` + `registerType: "prompt"`).

---

## Automatic purge on deploy

[`.github/workflows/deploy-plesk.yml`](../.github/workflows/deploy-plesk.yml) runs an optional step **after** a successful Plesk deploy and health check.

- **Skips** when secrets are missing (deploy still succeeds).
- **Purges** Cloudflare URLs for `/`, `/index.html`, `/sw.js`, `/registerSW.js` at `VITE_SITE_ORIGIN` (default `https://tamir.li`).
- Fails the workflow only if secrets are set but the API returns an error.

To purge **everything** instead (simpler, heavier), change the POST body to `{"purge_everything":true}` in the workflow step.

---

## 1. Create a Cloudflare API token

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **My Profile** → **API Tokens**.
2. **Create Token** → use template **“Edit zone DNS”** as a starting point, or **Create Custom Token**.
3. Permissions (minimum):
   - **Zone** → **Cache Purge** → **Purge**
4. Zone Resources:
   - **Include** → **Specific zone** → `tamir.li`
5. Create and copy the token once — it is shown only at creation time.

Do **not** commit the token to the repo or `.env` files tracked in git.

---

## 2. Find the Zone ID

Cloudflare Dashboard → **tamir.li** → **Overview** → right column **Zone ID** (32-character hex string).

---

## 3. Add GitHub repository secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Token from step 1 |
| `CLOUDFLARE_ZONE_ID` | Zone ID from step 2 |

No code changes are required after adding secrets — the next push to `main` will purge on successful deploy.

Optional: set repo variable `VITE_SITE_ORIGIN` if the public origin differs from `https://tamir.li` (used to build purge URLs).

---

## Manual purge (debugging)

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://tamir.li/","https://tamir.li/index.html","https://tamir.li/sw.js","https://tamir.li/registerSW.js"]}'
```

Full zone purge:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

## Related

- Monolith deploy: [`plesk-node-deploy.md`](./plesk-node-deploy.md)
- PWA config: `vite.config.ts` (`registerType: "prompt"`)
- Update UI: `src/components/PwaUpdatePrompt.tsx`
