# Admin features roadmap

Operational admin tools for tamir.li site management. Prioritized for support, billing reconciliation, and abuse handling.

**Legend:** P0 = ship now · P1 = next sprint · P2 = later · Effort: S (&lt;1 day) · M (1–3 days) · L (&gt;3 days)

| # | Feature | Description | Priority | Effort | API endpoints |
|---|---------|-------------|----------|--------|---------------|
| 1 | **Grant premium manually** | Comp or support grant: set ACTIVE subscription for 30d / 90d / 1y / lifetime without PayPal/Stripe checkout. Grants initial monthly AI credits. | **P0** | S | `PATCH /api/admin/users/:id/grant-premium` |
| 2 | **Grant AI credits** | Add purchasable-style credits to a user's balance (support compensation, promos). | **P0** | S | `PATCH /api/admin/users/:id/grant-credits` |
| 2b | **Grant bonus conversions** | Add conversion quota beyond daily free limit (persistent pool on `User.bonusConversions`). | **P0** | S | `POST /api/admin/users/:id/grant-conversions` |
| 3 | **Revoke premium manually** | End comp or paid access immediately (set CANCELED / past period end); optional note. | P1 | S | `PATCH /api/admin/users/:id/revoke-premium` |
| 4 | **Extend subscription end date** | Push `currentPeriodEnd` for active subs (goodwill extension, billing fixes). | P1 | S | `PATCH /api/admin/billing/subscriptions/:id/extend` |
| 5 | **Reset daily usage count** | Delete today's `UsageLog` rows for a user/session so free tier limit resets. | P1 | S | `DELETE /api/admin/users/:id/usage/today` |
| 6 | **View user conversion history** | Paginated usage + `ConversionJob` timeline per user in admin drawer. | P1 | M | `GET /api/admin/users/:id/activity` |
| 7 | **Block / unblock user** | Toggle `User.blocked` (already shipped via `PATCH /api/admin/users/:id`). | P0 | — | `PATCH /api/admin/users/:id` (exists) |
| 8 | **Refund marker on payment** | Mark payment as refunded / add `refundedAt` metadata without calling PayPal API. | P1 | M | `PATCH /api/admin/billing/payments/:id/refund` |
| 9 | **Force-cancel PayPal subscription** | Call PayPal cancel API + sync local `Subscription` status. | P1 | M | `POST /api/admin/billing/subscriptions/:id/cancel` |
| 10 | **Export users / payments CSV** | Download filtered user or payment list for accounting / support. | P2 | M | `GET /api/admin/users/export`, `GET /api/admin/billing/payments/export` |
| 11 | **Admin audit log** | Persist who changed what (grants, blocks, tool toggles) with actor, target, payload. | P2 | L | `GET /api/admin/audit-log`; write hooks on mutating routes |
| 12 | **Impersonate user (read-only)** | Short-lived JWT as target user for reproducing issues; no billing mutations. | P2 | L | `POST /api/admin/users/:id/impersonate` |

### Shipped this cycle (2026-06-24)

1. Grant premium manually — API + AdminUsers dialog
2. Grant AI credits — API + AdminUsers dialog
3. **Grant bonus conversions** — `POST /api/admin/users/:id/grant-conversions`, `User.bonusConversions`, AdminUsers dialog
4. **AI admin settings** — `GET/PATCH /api/admin/ai/settings`, `POST /api/ai/generate-image`, AdminAi page at `/admin/ai`
5. **Per-task AI cost log** — `AiGenerationLog` table, `GET /api/admin/ai/generations`, user AI stats at `GET /api/admin/users/:id/ai-stats`

### Related (already partial)

| Feature | Status | Notes |
|---------|--------|-------|
| Tool enable / featured / sort | Shipped | `GET/PATCH /api/admin/tools/:toolId`, AdminTools page |
| Ad zone config | Shipped | `GET/PATCH /api/admin/ads/settings`, AdminAds page |
| AI runtime config + cost log | Shipped | `GET/PATCH /api/admin/ai/settings`, `GET /api/admin/ai/generations`, `/admin/ai` |
| Role management | Shipped | `PATCH /api/admin/users/:id` roles array |
| Billing read-only | Shipped | Stats, payments, subscriptions lists |

### Ideas for a future cycle

- **Email user / copy email** — UI-only copy button on user row (no API).
- **Lifetime premium / comp account** — covered by grant-premium `lifetime` duration (shipped P0).
- **Manual ad test mode** — env or per-session flag to show placeholder ads without live zones.
- **Feature flags per tool** — extend `ToolConfig` with `premiumOnlyOverride`, `maxFileMb`, etc.
