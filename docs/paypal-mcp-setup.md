# PayPal MCP setup (Cursor agents)

PayPal’s [Model Context Protocol (MCP)](https://docs.paypal.ai/developer/tools/ai/mcp-quickstart) server lets Cursor agents manage subscriptions, webhooks, invoices, and related tasks in natural language — without putting API secrets in the repo.

This project uses the **remote** MCP server with **OAuth** (recommended). Sandbox is configured by default in `.cursor/mcp.json`.

For Plesk/runtime billing env vars (`PAYPAL_CLIENT_ID`, plan IDs, webhooks), see [paypal-setup.md](./paypal-setup.md).

## 1. Project config (already in repo)

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "paypal": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.sandbox.paypal.com/sse"]
    }
  }
}
```

No access tokens or client secrets belong in this file.

## 2. Enable in Cursor

1. Open **Cursor Settings** → **MCP** (or **Features → MCP**).
2. Confirm the **paypal** server appears (project-scoped config loads from `.cursor/mcp.json`).
3. Toggle **paypal** on if it is disabled.
4. **Fully quit and restart Cursor** (not just reload window) so `npx mcp-remote` can start.
5. On first connect, Cursor opens PayPal in the browser:
   - Log in to your **Sandbox** (or Live) PayPal account.
   - Consent to let the MCP client access your account.
6. Quit and reopen Cursor once more if tools do not show immediately after auth.

After restart, tool descriptors may appear under the workspace `mcps/` cache folder (e.g. `mcps/paypal/tools/*.json`). If the folder is missing, the server is not connected yet — repeat restart and OAuth.

## 3. Sandbox vs production endpoints

| Environment | SSE (default) | Streamable HTTP (alternative) |
|-------------|---------------|-------------------------------|
| **Sandbox** (dev/test) | `https://mcp.sandbox.paypal.com/sse` | `https://mcp.sandbox.paypal.com/http` |
| **Production** (live) | `https://mcp.paypal.com/sse` | `https://mcp.paypal.com/http` |

Use sandbox MCP while developing against `PAYPAL_MODE=sandbox`. Switch `.cursor/mcp.json` to production only when you intentionally manage live PayPal resources.

## 4. What agents can do

With PayPal MCP enabled, agents can help with tasks such as:

- Create **subscription products** and **billing plans** (monthly/yearly ILS amounts for Tamir.li Premium).
- List or configure **webhooks** and verify event types match the app.
- Create and send **test invoices** (general PayPal tooling).
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

- **OAuth stuck or tools missing:** delete cached auth and reconnect:
  ```powershell
  Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"
  ```
  Then restart Cursor and complete PayPal login again.
- **Known issue:** Windows + Cursor + remote MCP can be flaky on first connect; a full restart after OAuth often fixes it.
- **`npx` / Node:** requires Node.js 18+ (project uses Node ≥ 22).
- **Server shows error in MCP panel:** check that `mcp-remote` can reach `https://mcp.sandbox.paypal.com/sse` (firewall/proxy).

## 7. Security

| Do | Don’t |
|----|--------|
| Use remote MCP OAuth in `.cursor/mcp.json` | Put `PAYPAL_ACCESS_TOKEN` or secrets in the repo |
| Keep REST secrets in Plesk / `backend/.env` (local only) | Commit `backend/.env` or rewrite production `.env` from the repo |
| Use sandbox MCP + sandbox REST app for testing | Point sandbox MCP at production while testing |

## 8. Next agent session checklist (billing integration)

Once MCP is live, an agent can cross-check PayPal Dashboard vs code. See [paypal-setup.md § Agent setup](./paypal-setup.md#agent-setup-paypal-mcp) for the production readiness checklist (plan IDs, webhook events, env vars).

## 9. Sandbox plan creation (after OAuth)

**Status:** PayPal MCP must show as **connected** in Cursor Settings → MCP (tool descriptors under workspace `mcps/paypal/tools/`). If that folder is missing, complete steps in §2 first — agents cannot create catalog objects until OAuth succeeds.

### User steps (one-time)

1. **Cursor Settings → MCP** → enable **paypal** → fully quit and restart Cursor.
2. When the browser opens, log in to **PayPal Sandbox** and consent.
3. Restart Cursor once more if tools still do not appear.
4. Re-run the billing agent task or ask: *"Create Tamir.li Premium sandbox product and monthly/yearly ILS plans."*

### Agent runbook (MCP connected)

Ask the agent to create:

| Object | Name | Pricing |
|--------|------|---------|
| Product | `Tamir.li Premium` | Subscription |
| Plan (monthly) | `Tamir.li Premium — Monthly` | **₪19.90** / month, ILS, infinite cycles |
| Plan (yearly) | `Tamir.li Premium — Yearly` | **₪191.04** / year, ILS, infinite cycles |

Then:

1. Copy each **Plan ID** (`P-...`) into Plesk / local `backend/.env` as `PAYPAL_PLAN_MONTHLY` and `PAYPAL_PLAN_YEARLY` (never commit real IDs with live credentials).
2. Register sandbox webhook `https://<host>/api/billing/paypal/webhook` with all eight event types from [paypal-setup.md §3](./paypal-setup.md#3-webhook-endpoint); set `PAYPAL_WEBHOOK_ID`.
3. Smoke test: sign in → `/premium` → monthly checkout → approve in sandbox → return URL should include `subscription_id` → `GET /api/billing/status` shows `isPremium: true`.

### Manual fallback (no MCP)

PayPal Developer Dashboard → **Subscriptions** → create product + two ILS plans with the prices above → copy `P-...` plan IDs into env. Same webhook and smoke-test steps apply.

### Windows OAuth troubleshooting

If OAuth fails after two restarts, clear cached auth and retry (see §6).
