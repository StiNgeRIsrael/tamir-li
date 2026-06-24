# PayPal setup (sandbox checklist)

Tamir.li billing uses **PayPal Subscriptions** for Premium (monthly/yearly) and **PayPal Orders** for one-time AI credit packs. Webhooks sync subscription status and grant credits in the backend (`backend/src/routes/billing.routes.ts`).

Stripe is disabled by default (`ENABLE_STRIPE` is not set). See `docs/stripe-setup.md` if you re-enable Stripe later.

## 1. PayPal Developer Dashboard

1. Sign in at [developer.paypal.com](https://developer.paypal.com/).
2. **Apps & Credentials** → create or open a **REST API app** (Sandbox first).
3. Copy **Client ID** and **Secret** (show secret once).

## 2. Subscription plans (Premium)

1. Dashboard → **Subscriptions** (or Products & Plans).
2. Create a **Product**: e.g. `Tamir.li Premium`.
3. Create two **Plans** in **ILS** — amounts must match site copy in `upgradePage` translations:

| Plan key (API) | Billing cycle | PayPal price (ILS) | Site copy | Env var |
|----------------|---------------|--------------------|-----------|---------|
| `monthly` | Monthly | **₪19.90** / month | `priceMonthly: "₪19.90"` (anchor ₪150) | `PAYPAL_PLAN_MONTHLY` |
| `yearly` | Yearly | **₪191.04** / year (≈ ₪15.92/mo, 20% off) | `priceYearly: "₪191.04"` | `PAYPAL_PLAN_YEARLY` |

Suggested plan names: `Tamir.li Premium — Monthly`, `Tamir.li Premium — Yearly`.

Copy each **Plan ID** (`P-...`) from the PayPal dashboard into Plesk backend env (see checklist below).

Credit packs do **not** need PayPal products — amounts are set in code (₪8 / ₪21 / ₪39 / ₪72).

## 3. Webhook endpoint

**URL (production):** `https://tamir.li/api/billing/paypal/webhook`

In the app → **Webhooks** → Add webhook:

| Event | Purpose |
|-------|---------|
| `BILLING.SUBSCRIPTION.ACTIVATED` | Activate premium + initial AI credits |
| `BILLING.SUBSCRIPTION.UPDATED` | Plan/status sync |
| `BILLING.SUBSCRIPTION.CANCELLED` | Mark canceled |
| `BILLING.SUBSCRIPTION.SUSPENDED` | Past due |
| `BILLING.SUBSCRIPTION.EXPIRED` | End subscription |
| `BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED` | Log payment; reset monthly credits on renewal |
| `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | Mark past due |
| `PAYMENT.CAPTURE.COMPLETED` | Credit pack purchase (backup to capture API) |

Copy the webhook **ID** into `PAYPAL_WEBHOOK_ID`.

**Local testing:** use [ngrok](https://ngrok.com/) or PayPal webhook simulator pointing to `http://localhost:5000/api/billing/paypal/webhook`.

## 4. Plesk production checklist

Set these in **Plesk → Node.js → Custom environment variables** (application root `httpdocs/deploy`). Backend reads `PAYPAL_*` at runtime; frontend `VITE_*` vars are baked in at **build time** (GitHub Actions or local `npm run build`).

### Backend (required for billing)

| Variable | Value | Notes |
|----------|-------|-------|
| `PAYPAL_CLIENT_ID` | Live REST app Client ID | From PayPal Developer → Apps & Credentials → **Live** |
| `PAYPAL_CLIENT_SECRET` | Live secret | Never expose in `VITE_*` or frontend |
| `PAYPAL_MODE` | `live` | Use `sandbox` only for staging |
| `PAYPAL_WEBHOOK_ID` | `WH-...` or dashboard webhook ID | Webhook URL: `https://tamir.li/api/billing/paypal/webhook` |
| `PAYPAL_PLAN_MONTHLY` | `P-...` | Plan priced at **₪19.90/month** ILS |
| `PAYPAL_PLAN_YEARLY` | `P-...` | Plan priced at **₪191.04/year** ILS (20% off monthly) |
| `CORS_ORIGIN` | `https://tamir.li` | First origin = PayPal return/cancel URLs |
| `DATABASE_URL` | MySQL connection string | Subscriptions stored in Prisma |

### Frontend build (GitHub Actions secrets or build host)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://tamir.li` | Required for usage limits + checkout API |
| `VITE_SITE_ORIGIN` | `https://tamir.li` | Canonical URLs, SEO |
| `VITE_PAYPAL_CLIENT_ID` | Same as `PAYPAL_CLIENT_ID` | Optional today; same live Client ID if enabled later |

### Verify after deploy

- [ ] `GET https://tamir.li/api/billing/status` (with auth) returns JSON — not 501.
- [ ] Premium page → Monthly shows **₪19.90**; checkout redirects to PayPal (not “plan not configured”).
- [ ] After sandbox/live test purchase, webhook fires `BILLING.SUBSCRIPTION.ACTIVATED` and `isPremium: true`.
- [ ] `PAYPAL_PLAN_MONTHLY` / `PAYPAL_PLAN_YEARLY` IDs match the **ILS amounts** in the table above.

Local dev: copy the same keys into `backend/.env` (see `backend/.env.example`). Do **not** commit secrets or rewrite production `.env` from the repo.

## 5. API flow

- `POST /api/billing/checkout` (auth) → PayPal approval URL
- User approves on PayPal → redirect to `/premium?checkout=success&plan=...`
- Credit packs: PayPal adds `token` (order ID); frontend calls `POST /api/billing/paypal/capture-order`
- `GET /api/billing/status` → `{ isPremium, plan, credits, provider }`
- `POST /api/billing/portal` → PayPal AutoPay management URL

## 6. Test flow checklist

- [ ] User signs in with Google.
- [ ] `GET /api/billing/status` returns `{ isPremium: false, credits: 0 }`.
- [ ] Premium page → monthly/yearly → redirects to PayPal Sandbox approval.
- [ ] After approval, `/premium?checkout=success` and status shows `isPremium: true`.
- [ ] Webhook simulator fires `BILLING.SUBSCRIPTION.ACTIVATED`.
- [ ] Credit pack purchase increments `credits` after capture.
- [ ] Manage billing opens PayPal AutoPay page.
- [ ] Premium users: no ad scripts loaded.

## 7. Go live

1. Create a **Live** REST API app and subscription plans (same structure).
2. Set `PAYPAL_MODE=live` and live Client ID / Secret / Plan IDs.
3. Register live webhook: `https://tamir.li/api/billing/paypal/webhook`.
4. Rebuild frontend with production env vars.
5. Complete PayPal business account verification for Israel.

## 8. Re-enable Stripe (optional)

Set `ENABLE_STRIPE=true` and Stripe env vars per `docs/stripe-setup.md`. Stripe webhook remains at `/api/billing/webhook`.
