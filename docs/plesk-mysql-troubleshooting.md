# Plesk MySQL troubleshooting — tamir.li

Practical checklist when production shows **`db.ok: false`** on `GET /health` but the Node monolith is otherwise live (`uptime`, JSON response, not SPA HTML).

**Symptoms:** `/health` returns `200` with `"db": { "ok": false }`; `/api/usage/today` → **500**; conversion queue enqueue fails; auth/usage limits degraded.

**Not a DB issue:** `/health` returns **HTML** (SPA) — fix document root first. See [deploy-checklist.md](./deploy-checklist.md) and [plesk-node-deploy.md](./plesk-node-deploy.md#fix-static-layer-blocking-node).

---

## 1. Confirm the probe

From your machine or CI:

```bash
curl -sS https://tamir.li/health | jq .
```

**Healthy DB:**

```json
{
  "status": "OK",
  "uptime": 123.45,
  "db": { "ok": true }
}
```

**Node up, DB down:**

```json
{
  "status": "OK",
  "uptime": 123.45,
  "db": { "ok": false }
}
```

Or run the full probe:

```bash
SITE_URL=https://tamir.li API_URL=https://tamir.li npm run site:check
```

Expect a warning: `db.ok is false — MySQL/Prisma unreachable`.

---

## 2. Verify `DATABASE_URL` format

Prisma expects a **MySQL** URL (not PostgreSQL, not a JDBC string):

```
mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Example (same-server Plesk):**

```
mysql://tamirly_user:YourStrongPassword@localhost:3306/tamirly_db
```

| Check | Action |
|-------|--------|
| Scheme | Must start with `mysql://` |
| User / DB name | Use the **full** names Plesk shows after creation (often prefixed with subscription name) |
| Password special chars | URL-encode `@`, `#`, `%`, `:`, `/`, etc. (`@` → `%40`) |
| Host | Same server as Node → **`localhost`** and port **`3306`** |
| Wrong host | Do **not** use public IP, domain name, or “Remote MySQL” host for same-box Node.js |
| Quotes | Plesk env value: no surrounding quotes unless Plesk adds them literally (usually paste raw URL) |

Reference: [backend/.env.example](../backend/.env.example), [plesk-node-deploy.md § Plesk MySQL](./plesk-node-deploy.md#plesk-mysql).

---

## 3. Plesk Node.js environment variables

1. **Plesk** → **Domains** → `tamir.li` → **Node.js** → **Custom environment variables**.
2. Confirm **`DATABASE_URL`** is set (not only in GitHub Actions secrets — runtime reads **Plesk**, not CI).
3. Also required for a working API: `NODE_ENV=production`, `JWT_SECRET` (≥ 16 chars), `GOOGLE_CLIENT_ID`.
4. **Restart app** after any env change (Plesk **Restart** or CI deploy touch).

**Common mistake:** `DATABASE_URL` set in GitHub for `run_server_setup` but **missing** in Plesk UI → migrations may have run once, but the running process has no DB URL.

### Plesk quirk: Run Node.js commands vs runtime env

**Custom environment variables apply to the running Node.js app**, not necessarily to **Run Node.js commands** (`run plesk:db`, `run setup`). Those one-off npm invocations often run without Plesk’s custom env — Prisma then fails with:

`Environment variable not found: DATABASE_URL`

(`prisma generate` still succeeds because it does not need `DATABASE_URL`.)

**Primary fix — auto-migrate on app restart (no `backend/.env` required):**

Set **`DATABASE_URL` only in Plesk → Node.js → Custom environment variables**. On each app start (`NODE_ENV=production`), the backend runs `prisma migrate deploy` before listening — using the same env vars the live process already has. After deploy or schema change: **Restart app** in Plesk (or let CI restart via `tmp/restart.txt`). Check Plesk / Passenger logs for `[startup-migrate]`.

**Alternatives when CLI migrate is still needed:**

| Method | Steps |
|--------|--------|
| **GitHub Actions** (recommended for first install) | workflow_dispatch with **run_server_setup** checked + GitHub secret `DATABASE_URL` — runs `npm run setup` over SSH (see [deploy-plesk.yml](../.github/workflows/deploy-plesk.yml)). |
| **SSH one-liner** | SSH into the subscription, `cd` to app root, `export DATABASE_URL='mysql://...'`, then `npm run plesk:db`. |

Do **not** rely on a server-side `backend/.env` for production — Plesk custom env is the single source of truth for `DATABASE_URL`.

---

## 4. Migrations: auto on restart vs manual CLI

**Normal path (schema change or new deploy):**

1. Set **`DATABASE_URL`** in Plesk custom env (if not already).
2. Deploy code (push to `main` or SFTP).
3. **Restart** the Node.js app — migrations run automatically at startup (`[startup-migrate]` in logs).
4. Verify: `curl -sS https://tamir.li/health` → `"db": { "ok": true }`.

**First deploy / lockfile change:** use GitHub Actions **workflow_dispatch** with **run_server_setup** checked (requires GitHub secret `DATABASE_URL`) to run `npm run setup` over SSH, **or** Plesk **Run Node.js commands** → `run setup` if the runner happens to see env vars.

### `run setup` vs `run plesk:db` (optional CLI)

Use **Plesk → Node.js → Run Node.js commands** (npm args field only — no `npx`, no `cd`). These are **optional** when auto-migrate on restart is enabled; they may still fail without `DATABASE_URL` in the command shell.

| npm args | When to use |
|----------|-------------|
| `run setup` | First deploy, lockfile change, or full reinstall: `npm ci` + backend deps + `prisma migrate deploy` (needs `DATABASE_URL` in shell — use CI **run_server_setup** instead) |
| `run plesk:db` | Manual migrate only if command runner sees `DATABASE_URL` (SSH export or CI) |

### `Environment variable not found: DATABASE_URL` (generate OK, migrate fails)

**Cause:** `prisma generate` does not connect to MySQL; `prisma migrate deploy` does. **Run Node.js commands** often runs without Plesk custom env.

**Fix:** Do **not** create `backend/.env` on the server. Set `DATABASE_URL` in Plesk custom env and **Restart app** — startup auto-migrate uses runtime env. For first-time `npm ci`, use CI **run_server_setup** + GitHub secret `DATABASE_URL`.

Prisma 6 **`migrate deploy` has no `--url` flag** — connection string must come from `process.env.DATABASE_URL`.

**CI alternative:** [deploy-plesk.yml](../.github/workflows/deploy-plesk.yml) **workflow_dispatch** with **run_server_setup** — requires GitHub secret `DATABASE_URL` (SSH does not inherit Plesk env).

---

## 5. Test MySQL from SSH (mysql client)

SSH into the Plesk server as the subscription user (same credentials as deploy workflow).

```bash
# Parse host/port/db from your DATABASE_URL, then:
mysql -h localhost -P 3306 -u tamirly_user -p tamirly_db -e "SELECT 1;"
```

| Result | Likely cause |
|--------|----------------|
| `SELECT 1` succeeds | MySQL is fine — wrong `DATABASE_URL` in Node env, or app not restarted |
| `Access denied` | Wrong password, wrong user, or user not granted on this database |
| `Unknown database` | Database name mismatch (use Plesk full name) |
| `Can't connect` | MySQL not running, wrong host/port, or socket vs TCP issue (see below) |

**Optional — list tables after migrate:**

```bash
mysql -h localhost -u tamirly_user -p tamirly_db -e "SHOW TABLES;"
```

Expect `_prisma_migrations`, `User`, `UsageLog`, etc.

**phpMyAdmin:** Plesk → **Databases** → your DB → **phpMyAdmin** — same checks without CLI.

---

## 6. localhost vs socket (common on Plesk)

| Setup | `DATABASE_URL` host |
|-------|---------------------|
| Node.js and MySQL on **same Plesk server** (typical) | `localhost:3306` — TCP to local MySQL |
| Custom MariaDB socket only | Rare on managed Plesk; if `mysql -h localhost` works, use `localhost` in URL |
| Remote MySQL host | Only if DB is on **another** machine — use that host’s internal hostname/IP and allow remote access |

Plesk UI may show an external “Remote MySQL” hostname — **ignore** for same-server Node.js monolith.

If `localhost` fails in Node but `127.0.0.1` works from CLI, try:

```
mysql://USER:PASSWORD@127.0.0.1:3306/DATABASE_NAME
```

---

## 7. Post-fix verification

1. **Restart** Node.js app in Plesk.
2. `curl -sS https://tamir.li/health` → `"db": { "ok": true }`.
3. `curl -sS https://tamir.li/api/usage/today` → **200** JSON (not 500).
4. Full probe:

```bash
SITE_URL=https://tamir.li API_URL=https://tamir.li npm run site:check
```

Expect exit **0**, no `db.ok is false` warning.

---

## Quick symptom map

| Symptom | Fix |
|---------|-----|
| `/health` → HTML | Document root = `httpdocs/deploy`, not `deploy/dist` — [deploy-checklist.md](./deploy-checklist.md) |
| `/health` JSON, no `db` / `uptime` | Redeploy latest backend bundle |
| `db.ok: false` | This doc — `DATABASE_URL`, grants, migrations, restart |
| Migrations fail “Environment variable not found: DATABASE_URL” in Run Node.js commands | Expected Plesk quirk — set `DATABASE_URL` in custom env and **Restart app** (auto-migrate); or CI **run_server_setup** / SSH `export`; see [§3](#plesk-quirk-run-nodejs-commands-vs-runtime-env) |
| New migration after deploy, `db.ok: false` | Restart Node app; check logs for `[startup-migrate]` errors |
| `run_server_setup` works once, then `db.ok: false` again | Add same `DATABASE_URL` to **Plesk** custom env (not only GitHub secret) |

---

## Related docs

- [deploy-checklist.md](./deploy-checklist.md) — pre/post deploy checklist
- [plesk-node-deploy.md](./plesk-node-deploy.md) — monolith layout, env vars, MySQL creation
- [autonomous-testing.md](./autonomous-testing.md) — `site:check` probe details
- [local-dev.md](./local-dev.md) — local MySQL + Prisma workflow
