# Agent autonomy — what cloud agents can wire without you

Goal: maximize what Cursor agents can do on **`main`** (CI + Deploy to Plesk) with minimal one-time operator bootstrap.

---

## Capability matrix (this environment)

| Capability | Status | How |
|------------|--------|-----|
| Push to `main` → CI + Plesk deploy | **Yes** | Git push; Actions already configured |
| Probe prod `/health` | **Yes** | Public JSON (DB, migrations, PayPal, Google Play) |
| `npm run site:check:prod` | **Yes** | No secrets required |
| Google Play Android Developer API | **Yes** when SA JSON available | Create/list subscriptions, tracks, listings |
| `npm run play:catalog` / `:ensure` | **Yes** with SA | Verify/create `tamir_premium_*` products |
| PayPal live billing | **Prod already configured** | `/health.billing.configured=true` |
| Set GitHub Actions secrets | **No** (token lacks `secrets` permission) | You add once in GitHub UI |
| SSH into Plesk from agent shell | **No** (no PLESK_* in agent env) | Deploy workflow has SSH via GH secrets |
| Sync Play SA → Plesk `backend/.env` | **Yes after one GH secret** | Deploy step writes env when secret present |
| PayPal / Play MCP in cloud agent | **Not attached** | Desktop MCP or Cursor Cloud Environment |
| Cursor Cloud Environment secrets | **Not linked** (`environment: null`) | Create + attach env (below) |
| AdMob / Play policy / AAB upload | **Operator + Play Console** | Signing keystore stays offline |

---

## One-time bootstrap (do once → agents stay autonomous)

### 1. GitHub secret (unlocks Plesk Play verify)

Repo → **Settings → Secrets and variables → Actions** → New repository secret:

| Name | Value |
|------|--------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full service account JSON (one line or pretty — both OK) |

Optional (defaults exist in code):

| Name | Value |
|------|--------|
| `GOOGLE_PLAY_PACKAGE_NAME` | `com.tamir.li` |

On the next push to `main`, **Deploy to Plesk** writes `backend/.google-play-sa.json` + env pointers and restarts Node. Confirm with:

```bash
curl -s https://tamir.li/health | jq .googlePlay
# expect: "configured": true
```

### 2. Cursor Cloud Environment (unlocks secrets for every agent run)

This run had `environment: null` — no persistent credentials.

1. Cursor → **Cloud / Environments** → create (or edit) an environment for `StiNgeRIsrael/tamir-li`
2. Add secrets / env:
   - `GOOGLE_APPLICATION_CREDENTIALS` — path **or** prefer `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` = full JSON
   - (optional) install `uv` in setup so `uvx play-store-mcp` works
3. Attach that environment to future agent runs

Without this, agents only keep Play access for the session where you upload the key.

### 3. Cursor Desktop MCP (optional)

Already in `.cursor/mcp.json` as `google-play` → `uvx play-store-mcp`. Set `GOOGLE_APPLICATION_CREDENTIALS` in MCP env. Details: [play-console-mcp-setup.md](./play-console-mcp-setup.md).

---

## Autonomous commands agents should use

| Task | Command |
|------|---------|
| Prod health | `curl -s https://tamir.li/health \| jq` |
| Site probe | `npm run site:check:prod` |
| Play catalog verify | `npm run play:catalog` |
| Play catalog create/activate | `npm run play:catalog:ensure` |
| Unit tests | `npm test` |
| Deploy | `git push origin main` |

---

## Wrong API reminder

**Android Management API** ≠ Play Console. Use **Google Play Android Developer API** (`androidpublisher.googleapis.com`).

---

## Still human / console

- Upload signed AAB / promote tracks in Play (or grant release permission + upload artifact)
- AdMob account approval + `VITE_ADMOB_*`
- Paste Adsterra `ads.txt` publisher line
- Rotate service account keys if leaked in chat uploads
- First-time Play Console $25 account / app creation (already done for `com.tamir.li`)
