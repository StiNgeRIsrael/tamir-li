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
3. Create two **Plans** (ILS currency recommended):

| Plan key (API) | Billing cycle | Suggested name | Env var |
|----------------|---------------|----------------|---------|
| `monthly` | Monthly | Tamir.li Premium — Monthly | `PAYPAL_PLAN_MONTHLY` |
| `yearly` | Yearly | Tamir.li Premium — Yearly | `PAYPAL_PLAN_YEARLY` |

Copy each **Plan ID** (`P-...`) into backend env (Plesk).

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

## 4. Environment variables (Plesk / `backend/.env`)

| Variable | Where | Example / notes |
|----------|-------|-----------------|
| `PAYPAL_CLIENT_ID` | Backend | Sandbox Client ID from app |
| `PAYPAL_CLIENT_SECRET` | Backend | Sandbox Secret |
| `PAYPAL_WEBHOOK_ID` | Backend | Webhook ID (`WH-...` or dashboard ID) |
| `PAYPAL_MODE` | Backend | `sandbox` or `live` |
| `PAYPAL_PLAN_MONTHLY` | Backend | `P-...` monthly plan ID |
| `PAYPAL_PLAN_YEARLY` | Backend | `P-...` yearly plan ID |
| `CORS_ORIGIN` | Backend | `https://tamir.li` (first origin = checkout return URLs) |
| `VITE_API_URL` | Frontend build | `https://tamir.li` |
| `VITE_PAYPAL_CLIENT_ID` | Frontend (optional) | Same Client ID if using JS SDK later |

Do **not** commit secrets. Do not rewrite production `backend/.env` from the repo.

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
- [ ] Premium users: no AdSense scripts loaded.

## 7. Go live

1. Create a **Live** REST API app and subscription plans (same structure).
2. Set `PAYPAL_MODE=live` and live Client ID / Secret / Plan IDs.
3. Register live webhook: `https://tamir.li/api/billing/paypal/webhook`.
4. Rebuild frontend with production env vars.
5. Complete PayPal business account verification for Israel.

## 8. Re-enable Stripe (optional)

Set `ENABLE_STRIPE=true` and Stripe env vars per `docs/stripe-setup.md`. Stripe webhook remains at `/api/billing/webhook`.
