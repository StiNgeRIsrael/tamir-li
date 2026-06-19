# DNS setup for tamir.li

Step-by-step guide for moving DNS from IONOS to Cloudflare and pointing the site at **Plesk** (Apache/nginx on IONOS or your host).

**Repo:** `Parlamentum/tamir-s-conversion-hub`  
**Deploy:** Build locally/CI → upload `dist/` to Plesk `httpdocs` — see [`plesk-deploy.md`](./plesk-deploy.md)  
**Not used for frontend:** GitHub Pages, Cloudflare Pages (optional GitHub Actions workflow remains in repo for reference)

---

## Where tamir.li should point

| Host | Purpose | Target (production) |
|------|---------|---------------------|
| `tamir.li` (apex) | Static SPA (tools, blog, ads.txt, sitemap) | **Plesk** server — A record to server IP |
| `www.tamir.li` | Mirror or redirect to apex | CNAME → `tamir.li` or A → same IP as apex |
| `api.tamir.li` | Express backend (Stripe, auth, conversions) | **Separate** — Plesk subdomain, VPS, or other host |

After deploy to Plesk, these URLs must work:

- `https://tamir.li/` — site home
- `https://tamir.li/ads.txt` — AdSense (`public/ads.txt` is copied into `dist/` at build)
- `https://tamir.li/sitemap.xml` — SEO sitemap

Build and upload: see [`plesk-deploy.md`](./plesk-deploy.md).

---

## Critical concept: registrar nameservers vs NS records in a DNS zone

These are **not** the same thing.

### Nameserver delegation (what you must change)

At the **registrar / domain level** (IONOS: domain settings, not the DNS records editor), you tell the global DNS system: “for `tamir.li`, ask these nameservers.”

- **Correct (target):** `kareem.ns.cloudflare.com`, `samara.ns.cloudflare.com`
- **Previous (IONOS):** `ns1039.ui-dns.org`, `ns1093.ui-dns.de`, `ns1075.ui-dns.biz`, `ns1019.ui-dns.com`

Until delegation changes, **Cloudflare does not control DNS** and onboarding stays incomplete.

### NS records inside IONOS “DNS” tab (ineffective for Cloudflare onboarding)

If you added rows like:

| Type | Host | Value |
|------|------|-------|
| NS | `ns1` | `kareem.ns.cloudflare.com` |
| NS | `ns2` | `samara.ns.cloudflare.com` |

those are **child NS records inside IONOS’s zone**. They do **not** replace registrar delegation. The parent zone (`.li` registry → IONOS) still advertises IONOS nameservers, so the world keeps using IONOS DNS.

**Verdict:** Adding Cloudflare NS in the IONOS DNS records tab is **incorrect for onboarding** and can be ignored once you switch delegation.

The `_domainconnect` CNAME in IONOS is only for IONOS “Domain Connect” and becomes irrelevant after Cloudflare nameservers propagate.

---

## Current status (2026-06-19)

| Item | Status |
|------|--------|
| Cloudflare zone created | Likely yes (onboarding UI shown) |
| Registrar NS → Cloudflare | Confirm with `nslookup -type=NS tamir.li` |
| Plesk server IP | **Confirm with host** — likely `74.208.236.85` (IONOS/Plesk) |
| `tamir.li` A record → Plesk | Add in Cloudflare after NS propagation |
| `www.tamir.li` | CNAME → `tamir.li` or A → same IP |
| Plesk SSL (Let's Encrypt) | Enable after DNS points to server |
| `ads.txt` reachable | After build + upload to `httpdocs` |

---

## Step 1 — IONOS: change nameservers at domain level

Do this in IONOS **Domains & SSL** (or **Domains**), not in the DNS records list.

1. Log in to [IONOS](https://www.ionos.com/).
2. Open **Domains** → select **`tamir.li`**.
3. Go to **Nameserver** / **DNS settings** / **Use custom nameservers** (wording varies).
4. Replace IONOS defaults with Cloudflare’s pair only:
   - `kareem.ns.cloudflare.com`
   - `samara.ns.cloudflare.com`
5. Remove the old IONOS nameservers:
   - `ns1039.ui-dns.org`
   - `ns1093.ui-dns.de`
   - `ns1075.ui-dns.biz`
   - `ns1019.ui-dns.com`
6. **Disable DNSSEC** for `tamir.li` at IONOS if it is enabled (Cloudflare onboarding requires this during transfer).
7. Save. Propagation usually takes **15 minutes–48 hours** (often under 2 hours).

**Verify delegation** (repeat until Cloudflare NS appear):

```bash
nslookup -type=NS tamir.li
```

Expected:

```
tamir.li  nameserver = kareem.ns.cloudflare.com
tamir.li  nameserver = samara.ns.cloudflare.com
```

You do **not** need to keep editing IONOS DNS records after this; Cloudflare becomes the DNS panel.

---

## Step 2 — Cloudflare: DNS records for Plesk

In **Cloudflare Dashboard → tamir.li → DNS → Records**, after NS propagation, add:

> **Confirm the Plesk server IP** in Plesk → **Websites & Domains** → **Hosting Settings**, or ask IONOS support. The value below (`74.208.236.85`) matched earlier DNS checks but must be verified before going live.

### Apex `tamir.li` → Plesk

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `74.208.236.85` | Proxied (orange cloud) recommended |

**Do not** add GitHub Pages A records (`185.199.108.153`–`185.199.111.153`) or CNAME to `*.github.io`.

### `www` (recommended)

**Option A — CNAME (preferred)**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `www` | `tamir.li` | Proxied |

**Option B — A record**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `www` | `74.208.236.85` | Proxied |

Optional: **Rules → Redirect rules** — `www.tamir.li/*` → `https://tamir.li/$1` (301).

### SSL/TLS (Cloudflare + Plesk)

| Where | Setting |
|-------|---------|
| **Cloudflare** | SSL/TLS → Overview: **Full** or **Full (strict)** |
| **Plesk** | **SSL/TLS Certificates** → Let's Encrypt for `tamir.li` (and `www` if used) |

- Use **Full** when Plesk has a valid certificate (Let's Encrypt or commercial).
- Avoid **Flexible** — it terminates HTTPS only at Cloudflare and can cause redirect loops or mixed content with Plesk.

---

## Step 3 — Plesk: host the static site

1. Plesk → **Domains** → `tamir.li` → confirm document root (`httpdocs`).
2. Build: `npm run build:prod` with `.env.production.local` (see [`plesk-deploy.md`](./plesk-deploy.md)).
3. Upload **contents** of `dist/` to `httpdocs` (includes `.htaccess` for React Router).
4. Issue **Let's Encrypt** certificate in Plesk if not already active.
5. Test `https://tamir.li` and a deep route (e.g. `/tools`).

---

## Step 4 — `api.tamir.li` (backend, when ready)

The backend is **not** part of the static Plesk frontend upload. When you host it (Plesk Node.js subdomain, VPS, Railway, etc.):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A or CNAME | `api` | Your server hostname or IP | Often **DNS only** (grey cloud) if the host issues its own TLS cert; or Proxied if you want Cloudflare in front |

Stripe webhook URL (see `docs/stripe-setup.md`): `https://api.tamir.li/api/billing/webhook`

Skip this record until the API server exists.

---

## Step 5 — Verification TXT records (GSC / AdSense)

Add these in **Cloudflare DNS** only **after** nameservers point to Cloudflare.

### Google Search Console

1. Search Console → Add property → URL prefix `https://tamir.li`
2. Choose **Domain name provider** → **TXT** verification, or **HTML tag** in `index.html` (no DNS needed for HTML method).

If using DNS TXT:

| Type | Name | Content |
|------|------|---------|
| TXT | `@` | `google-site-verification=XXXXXXXX` (exact string from GSC) |

### Google AdSense

Preferred method for this project: **`ads.txt` at site root** (already in `public/ads.txt`):

```
google.com, pub-4410150504570814, DIRECT, f08c47fec0942fa0
```

No extra DNS record required if `https://tamir.li/ads.txt` returns that line after deploy.

Alternative AdSense methods: meta tag in `<head>` or script snippet — see `docs/adsense-setup.md`.

---

## Step 6 — Post-deploy checks

```bash
# Delegation
nslookup -type=NS tamir.li

# Apex resolves to Plesk IP (confirm IP matches your server)
nslookup tamir.li

# ads.txt (must be plain text, 200 OK)
curl -I https://tamir.li/ads.txt
curl https://tamir.li/ads.txt
```

Browser / tools:

- [ ] `https://tamir.li` loads the SPA (not Plesk default page or 404)
- [ ] Deep links work (React Router via `.htaccess`)
- [ ] `https://tamir.li/ads.txt` shows the `google.com, pub-4410150504570814...` line
- [ ] `https://tamir.li/sitemap.xml` returns XML
- [ ] Cloudflare dashboard shows zone **Active**
- [ ] Plesk Let's Encrypt certificate valid
- [ ] AdSense → Sites → tamir.li → ads.txt **Found** → request review
- [ ] Search Console → verify → submit `https://tamir.li/sitemap.xml`

---

## Quick verdict checklist

| Done? | Task |
|-------|------|
| ☐ | Change **registrar** nameservers at IONOS to Cloudflare (not just NS rows in DNS tab) |
| ☐ | Turn off DNSSEC at IONOS during transfer |
| ☐ | Wait until `nslookup -type=NS tamir.li` shows Cloudflare NS |
| ☐ | **Confirm Plesk server IP** (likely `74.208.236.85`) |
| ☐ | In Cloudflare DNS: A `@` → Plesk IP; CNAME `www` → `tamir.li` (or A `www` → same IP) |
| ☐ | **No** GitHub Pages records (`185.199.x` or `*.github.io`) |
| ☐ | Plesk: upload `dist/`, enable Let's Encrypt, Cloudflare SSL **Full** |
| ☐ | Confirm `https://tamir.li/ads.txt` |
| ☐ | Add GSC TXT in Cloudflare (if using DNS verification) |
| ☐ | Add `api.tamir.li` when backend host exists |

---

## Related docs

- [`plesk-deploy.md`](./plesk-deploy.md) — build, upload, `.htaccess`, env vars
- [`adsense-setup.md`](./adsense-setup.md) — AdSense approval, `ads.txt`, slots
- [`google-analytics-setup.md`](./google-analytics-setup.md) — GTM, GA4, Search Console
- [`stripe-setup.md`](./stripe-setup.md) — `api.tamir.li` webhook
- [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml) — optional GitHub Pages (not used for Plesk)
