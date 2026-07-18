# Google Play Console MCP setup (Cursor agents)

Connect Cursor to the **Google Play Android Developer API** so agents can inspect subscriptions, reviews, releases, and (optionally) manage tracks for `com.tamir.li`.

This mirrors [paypal-mcp-setup.md](./paypal-mcp-setup.md): MCP manages Play Console / Publisher API objects; the Node app still needs `GOOGLE_PLAY_*` on Plesk for runtime billing ([android-play-console-setup.md](./android-play-console-setup.md)).

---

## Wrong API vs right API

| API | What it is | Use for Tamir.li? |
|-----|------------|-------------------|
| **Android Management API** (`androidmanagement.googleapis.com`) | Enterprise device / EMM management | **No** — not Play Console |
| **Google Play Android Developer API** (`androidpublisher.googleapis.com`) | Play Console: apps, tracks, subscriptions, purchases, reviews | **Yes** |
| **Play Developer Reporting API** (optional) | Vitals / crash reporting | Optional for MCP vitals tools |

If you only enabled **Android Management API** in GCP, enable **Google Play Android Developer API** as well:

[Enable Android Publisher API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)

---

## 1. GCP + Play Console (one-time)

1. Open your GCP project → **APIs & Services** → enable **Google Play Android Developer API**.
2. **IAM → Service Accounts** → create (or reuse) a service account, e.g. `tamir-play-mcp@YOUR_PROJECT.iam.gserviceaccount.com`.
3. Create a **JSON key** for that account. Store it **only on your machine** (or Cursor Cloud secrets) — never commit it.
4. [Play Console](https://play.google.com/console/) → **Users and permissions** → **Invite new users**:
   - Email = the service account email from the JSON (`client_email`)
   - Permissions (minimum for useful MCP work):
     - **View app information and download bulk reports**
     - **View financial data** / monetization (for subscriptions & orders)
     - **Release to testing tracks** (if agents will upload / manage internal testing)
     - **Reply to reviews** (optional)
5. Play Console → **Setup → API access** → confirm the same GCP project is linked.
6. Wait a few minutes after inviting the service account (Play permissions can lag).

The same JSON can also feed the API server as `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (Plesk) for purchase verification — see Session C in [android-play-console-setup.md](./android-play-console-setup.md).

---

## 2. Install `uv` (runs the MCP)

The project MCP entry uses [`play-store-mcp`](https://github.com/lusky3/play-store-mcp) via `uvx`.

```powershell
# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex
```

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Confirm:

```bash
uvx play-store-mcp --help
```

---

## 3. Project config (already in repo)

`.cursor/mcp.json` includes a `google-play` server:

```json
"google-play": {
  "command": "uvx",
  "args": ["play-store-mcp"]
}
```

**No service-account JSON belongs in this file or in git.**

---

## 4. Wire credentials in Cursor Desktop

1. Save the JSON key locally, e.g.  
   `E:\Documents\tamir-li-android-signing\play-console-sa.json`  
   (or any path outside the repo).
2. Cursor → **Settings → MCP** → **google-play** → Environment (or edit user MCP config):

| Variable | Value |
|----------|--------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Absolute path to the JSON key |
| `PLAY_STORE_MCP_READ_ONLY` | `1` recommended until you trust write tools |

Example user override (not committed):

```json
{
  "mcpServers": {
    "google-play": {
      "command": "uvx",
      "args": ["play-store-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "E:\\Documents\\tamir-li-android-signing\\play-console-sa.json",
        "PLAY_STORE_MCP_READ_ONLY": "1"
      }
    }
  }
}
```

3. Fully quit and restart Cursor.
4. Confirm **google-play** shows as connected (green) with tools available.

Smoke-test prompts for agents:

- “List subscriptions for package `com.tamir.li`”
- “Get release tracks for `com.tamir.li`”
- “Show recent Play reviews for `com.tamir.li`”

---

## 5. Cursor Cloud / background agents

Cloud agents **do not** inherit your desktop key file. To let a cloud agent call Play Console MCP:

1. Add the service account JSON as an **environment secret** in the Cursor Cloud environment (never paste into chat or commit).
2. Set `GOOGLE_APPLICATION_CREDENTIALS` (or `GOOGLE_PLAY_STORE_CREDENTIALS` with the raw JSON) in that environment so `uvx play-store-mcp` can authenticate.
3. Ensure `uv` / `uvx` is available on the agent image (or pin an install step in the environment setup).

Until credentials are in the Cloud environment, this agent can only prepare config/docs — it cannot call Play APIs.

---

## 6. What agents can do (with MCP connected)

Via `play-store-mcp` (Publisher API):

| Area | Examples |
|------|----------|
| Releases | List tracks, deploy AAB, promote, rollout % |
| Monetization | List subscriptions / IAPs, check purchase status |
| Reviews | List reviews, reply |
| Testers | Manage internal/closed tester lists |
| Listings | Read/update store listing copy |

Product IDs this app expects (must match Play Console):

- Subscriptions: `tamir_premium_monthly`, `tamir_premium_yearly`
- Optional credits: `credits_10`, `credits_30`, `credits_60`, `credits_120`

---

## 7. Safety

- Prefer `PLAY_STORE_MCP_READ_ONLY=1` until release automation is intentional.
- Never commit the service account JSON (`.gitignore` already ignores `.cursor/*` except `mcp.json`).
- Prefer a dedicated MCP service account with least privilege (testing-track + view financial, not full account admin).
- Production track uploads still need a human review for first releases.

---

## Live catalog (as of API setup)

Created via Android Publisher API for `com.tamir.li` (service account invited):

| Product ID | Base plan | IL price | State |
|------------|-----------|----------|-------|
| `tamir_premium_monthly` | `monthly` | ₪19.90 | ACTIVE |
| `tamir_premium_yearly` | `yearly` | ₪191.04 | ACTIVE |

Client: `GOOGLE_PLAY_PRODUCTS` + `GOOGLE_PLAY_BASE_PLANS` in `src/lib/platform.ts` (`planIdentifier` = base plan id).

**Still operator:** set Plesk Node.js env `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (full JSON, one line) + `GOOGLE_PLAY_PACKAGE_NAME=com.tamir.li`, then restart the app so `/api/billing/google/verify` works.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Tools missing / server red | Restart Cursor; confirm `uvx` is on PATH; set `GOOGLE_APPLICATION_CREDENTIALS` |
| Permission denied / 403 | Invite SA email in Play Console; enable **Android Publisher** API; wait ~15 min |
| Package not found | App `com.tamir.li` must exist; SA must have app access |
| Confused with Android Management API | That API cannot manage Play subscriptions — enable Publisher API instead |
