# Stripe setup (test mode checklist)

Tamir.li billing uses **Stripe Checkout Sessions** for subscriptions and one-time AI credit packs. Webhooks sync subscription status and grant credits in the backend (`backend/src/routes/billing.routes.ts`).

## 1. Stripe Dashboard (test mode)

1. Enable **Test mode** (toggle in Dashboard).
2. Create **Products** and **Prices** (ILS recommended for Israel):

| Plan key (API) | Type | Suggested product name | Env var |
|----------------|------|------------------------|---------|
| `monthly` | Recurring monthly | Tamir.li Premium — Monthly | `STRIPE_PRICE_MONTHLY` |
| `yearly` | Recurring yearly | Tamir.li Premium — Yearly | `STRIPE_PRICE_YEARLY` |
| `credits_10` | One-time | AI Credits — 10 | `STRIPE_PRICE_CREDITS_10` |
| `credits_30` | One-time | AI Credits — 30 | `STRIPE_PRICE_CREDITS_30` |
| `credits_60` | One-time | AI Credits — 60 | `STRIPE_PRICE_CREDITS_60` |
| `credits_120` | One-time | AI Credits — 120 | `STRIPE_PRICE_CREDITS_120` |

Copy each **Price ID** (`price_...`) into `backend/.env` (do not commit secrets).

3. **Customer portal** (for cancel / update payment): Settings → Billing → Customer portal → enable and save.

## 2. API keys

Prefer a [restricted API key](https://docs.stripe.com/keys/restricted-api-keys) (`rk_`) with only the permissions you need.

| Variable | Where | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | `backend/.env` | Test: `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `backend/.env` | From webhook endpoint (`whsec_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env.production.local` | Test: `pk_test_...` (if used client-side later) |

## 3. Webhook endpoint

**URL (production):** `https://api.tamir.li/api/billing/webhook`  
**URL (local):** use [Stripe CLI](https://docs.stripe.com/stripe-cli) forwarding:

```bash
stripe listen --forward-to localhost:5000/api/billing/webhook
```

**Events to subscribe:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

The handler verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`.

## 4. Backend env (see `backend/.env.example`)

```env
CORS_ORIGIN=https://tamir.li
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_CREDITS_10=price_...
STRIPE_PRICE_CREDITS_30=price_...
STRIPE_PRICE_CREDITS_60=price_...
STRIPE_PRICE_CREDITS_120=price_...
```

`CORS_ORIGIN` first origin is used for Checkout `success_url` / `cancel_url` (`/premium?checkout=...`).

## 5. Frontend env

```env
VITE_API_URL=https://api.tamir.li
```

Checkout is initiated via `POST /api/billing/checkout` (authenticated). No Payment Element on the frontend today.

## 6. Test flow checklist

- [ ] User signs in with Google (`GOOGLE_CLIENT_ID` matches frontend).
- [ ] `GET /api/billing/status` returns `{ isPremium: false, credits: 0 }`.
- [ ] Premium page → monthly/yearly → redirects to Stripe Checkout (test card `4242 4242 4242 4242`).
- [ ] After payment, redirect to `/premium?checkout=success` and status shows `isPremium: true`.
- [ ] Webhook logs show `checkout.session.completed` and `invoice.payment_succeeded`.
- [ ] Credit pack purchase increments `credits` on status endpoint.
- [ ] Customer portal opens from `POST /api/billing/portal`.
- [ ] Premium users: no AdSense scripts loaded; side ads hidden.

## 7. Go live

- Swap test keys and price IDs for live mode.
- Create a **live** webhook endpoint with the same events.
- Complete Stripe account activation and tax settings as needed.
- Review [Stripe go-live checklist](https://docs.stripe.com/get-started/checklist/go-live).
