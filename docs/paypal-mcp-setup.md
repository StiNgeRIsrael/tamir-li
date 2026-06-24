# PayPal MCP setup (Cursor agents)

PayPal’s [Model Context Protocol (MCP)](https://docs.paypal.ai/developer/tools/ai/mcp-quickstart) server lets Cursor agents manage subscriptions, webhooks, invoices, and related tasks in natural language — without putting API secrets in the repo.

This project uses the **remote** MCP server with **OAuth** (recommended). **Production** is configured in `.cursor/mcp.json` so OAuth uses your **live** PayPal business account (not sandbox developer logins).

For Plesk/runtime billing env vars (`PAYPAL_CLIENT_ID`, plan IDs, webhooks), see [paypal-setup.md](./paypal-setup.md).

## 1. Project config (already in repo)

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "paypal": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.paypal.com/sse"]
    }
  }
}
```

No access tokens or client secrets belong in this file.

## 2. Enable in Cursor

1. Open **Cursor Settings** → **MCP** (or **Features → MCP**).
2. Confirm the **paypal** server appears (project-scoped config loads from `.cursor/mcp.json`).
3. Toggle **paypal** on if it is disabled.
4. **Clear stale OAuth** if you previously connected to sandbox (required after switching endpoints):
   ```powershell
   Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"
   ```
5. **Fully quit and restart Cursor** (not just reload window) so `npx mcp-remote` can start.
6. On first connect, Cursor opens PayPal in the browser:
   - Log in to your **live** PayPal business account (production MCP does **not** use sandbox developer accounts).
   - Consent to let the MCP client access your account.
7. Quit and reopen Cursor once more if tools do not show immediately after auth.

After restart, tool descriptors may appear under the workspace `mcps/` cache folder (e.g. `mcps/paypal/tools/*.json`). If the folder is missing, the server is not connected yet — repeat restart and OAuth.

## 3. Sandbox vs production endpoints

| Environment | SSE (default) | Streamable HTTP (alternative) | OAuth login |
|-------------|---------------|-------------------------------|-------------|
| **Sandbox** (dev/test) | `https://mcp.sandbox.paypal.com/sse` | `https://mcp.sandbox.paypal.com/http` | Sandbox developer / test business account |
| **Production** (live) | `https://mcp.paypal.com/sse` | `https://mcp.paypal.com/http` | **Real** PayPal business account |

**When to use which**

| Goal | MCP endpoint | App `PAYPAL_MODE` |
|------|--------------|-------------------|
| Experiment with MCP tools, fake checkouts, sandbox webhooks | Sandbox SSE URL | `sandbox` |
| Create real subscription products/plans for tamir.li on Plesk | **Production** SSE URL (current repo default) | `live` |

**This repo uses production MCP** so agents can create live catalog objects (subscription product, ILS billing plans) that match `PAYPAL_MODE=live` on Plesk. If you only want to test MCP without touching live PayPal resources, temporarily change `.cursor/mcp.json` back to the sandbox URL, clear `%USERPROFILE%\.mcp-auth`, and restart Cursor.

> **Warning:** Production MCP creates **real** PayPal objects (products, plans, webhooks, invoices). Test charges and live subscriptions affect your live account. Use sandbox MCP for dry runs.

## 4. What agents can do

With PayPal MCP enabled (production), agents can help with tasks such as:

- Create **live subscription products** and **billing plans** — e.g. Tamir.li Premium at **₪19.90/month** and **₪191.04/year** (ILS).
- List or configure **webhooks** and verify event types match the app.
- Inspect subscriptions, orders, and catalog items via PayPal’s MCP tool catalog.

Agents still need **Plesk/backend env vars** from [paypal-setup.md](./paypal-setup.md) for the running app (`PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY`, `PAYPAL_WEBHOOK_ID`, etc.). MCP manages PayPal Dashboard objects; the Node app reads plan IDs from environment at runtime.

Official tool list: [PayPal MCP quickstart — MCP server tools](https://docs.paypal.ai/developer/tools/ai/mcp-quickstart).

## 5. Local `@paypal/mcp` alternative (optional)

If you prefer a **local** MCP server with a personal access token (not committed), add this in **user-level** Cursor MCP settings or a local override — **never** in git:

```json
{
  "mcpServers": {
    "paypal-local": {
      "command": "npx",
      "args": ["-y", "@paypal/mcp", "--tools=all"],
      "env": {
        "PAYPAL_ACCESS_TOKEN": "<set outside repo — e.g. OS env or Cursor user secrets>",
        "PAYPAL_ENVIRONMENT": "SANDBOX"
      }
    }
  }
}
```

Set `PAYPAL_ENVIRONMENT` to `PRODUCTION` only for live API work. You can also pass `--access-token` in `args` or set `PAYPAL_ACCESS_TOKEN` in your shell profile.

**Never commit** `PAYPAL_ACCESS_TOKEN`, client secrets, or live credentials.

## 6. Windows / Cursor troubleshooting

- **OAuth stuck, wrong environment, or tools missing:** delete cached auth and reconnect:
  ```powershell
  Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"
  ```
  Then restart Cursor and complete PayPal login again (live account for production MCP).
- **Known issue:** Windows + Cursor + remote MCP can be flaky on first connect; a full restart after OAuth often fixes it.
- **`npx` / Node:** requires Node.js 18+ (project uses Node ≥ 22).
- **Server shows error in MCP panel:** check that `mcp-remote` can reach `https://mcp.paypal.com/sse` (firewall/proxy).

## 7. Security

| Do | Don’t |
|----|--------|
| Use remote MCP OAuth in `.cursor/mcp.json` | Put `PAYPAL_ACCESS_TOKEN` or secrets in the repo |
| Keep REST secrets in Plesk / `backend/.env` (local only) | Commit `backend/.env` or rewrite production `.env` from the repo |
| Use sandbox MCP + sandbox REST app for testing | Point production MCP at sandbox REST app (or vice versa) |
| Clear `.mcp-auth` when switching sandbox ↔ production | Reuse stale OAuth from the wrong environment |

## 8. Next agent session checklist (billing integration)

Once MCP is live, an agent can cross-check PayPal Dashboard vs code. See [paypal-setup.md § Agent setup](./paypal-setup.md#agent-setup-paypal-mcp) for the production readiness checklist (plan IDs, webhook events, env vars).

## 9. Production plan creation (after OAuth)

**Status:** PayPal MCP must show as **connected** in Cursor Settings → MCP (tool descriptors under workspace `mcps/paypal/tools/`). If that folder is missing, complete steps in §2 first — agents cannot create catalog objects until OAuth succeeds.

### User steps (one-time)

1. Clear stale auth: `Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"`.
2. **Cursor Settings → MCP** → enable **paypal** → fully quit and restart Cursor.
3. When the browser opens, log in to your **live** PayPal business account and consent.
4. Restart Cursor once more if tools still do not appear.
5. Re-run the billing agent task or ask: *"Create Tamir.li Premium live product and monthly/yearly ILS plans."*

### Agent runbook (MCP connected)

Ask the agent to create **live** catalog objects:

| Object | Name | Pricing |
|--------|------|---------|
| Product | `Tamir.li Premium` | Subscription |
| Plan (monthly) | `Tamir.li Premium — Monthly` | **₪19.90** / month, ILS, infinite cycles |
| Plan (yearly) | `Tamir.li Premium — Yearly` | **₪191.04** / year, ILS, infinite cycles |

Then:

1. Copy each **Plan ID** (`P-...`) into Plesk / local `backend/.env` as `PAYPAL_PLAN_MONTHLY` and `PAYPAL_PLAN_YEARLY` (never commit real IDs with live credentials).
2. Register production webhook `https://tamir.li/api/billing/paypal/webhook` (or your host) with all eight event types from [paypal-setup.md §3](./paypal-setup.md#3-webhook-endpoint); set `PAYPAL_WEBHOOK_ID`.
3. Smoke test carefully on live: sign in → `/premium` → checkout → approve with a real PayPal account → return URL should include `subscription_id` → `GET /api/billing/status` shows `isPremium: true`.

### Sandbox alternative (testing only)

To create **sandbox** plans instead, switch `.cursor/mcp.json` to `https://mcp.sandbox.paypal.com/sse`, clear `.mcp-auth`, restart, and OAuth with a sandbox account. Use the same product/plan names and ILS prices; copy sandbox `P-...` IDs into env with `PAYPAL_MODE=sandbox`.

### Manual fallback (no MCP)

PayPal Dashboard → **Subscriptions** → create product + two ILS plans with the prices above → copy `P-...` plan IDs into env. Same webhook and smoke-test steps apply.

### Windows OAuth troubleshooting

If OAuth fails after two restarts, clear cached auth and retry (see §6).
