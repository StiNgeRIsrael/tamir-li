/**
 * Stripe billing (disabled by default — set ENABLE_STRIPE=true to use).
 * PayPal is the active provider for Israel; see billing.routes.ts and docs/paypal-setup.md.
 */
import { Request, Response } from 'express';
import Stripe from 'stripe';
import {
  PaymentProvider,
  PaymentStatus,
  PaymentType,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  CREDIT_PLANS,
  type CreditPlanKey,
  addPurchasedCredits,
  getFrontendOrigin,
  grantInitialPremiumCredits,
  logSubscriptionPayment,
  resetMonthlyPremiumCredits,
  MONTHLY_AI_CREDITS,
} from '../lib/billing-shared';

type CreditPlanKeyLocal = keyof typeof CREDIT_PLANS;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    case 'canceled':
    case 'incomplete_expired':
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.CANCELED;
  }
}

function planFromStripePrice(priceId: string | undefined): SubscriptionPlan {
  const yearly = process.env.STRIPE_PRICE_YEARLY?.trim();
  return priceId && yearly && priceId === yearly
    ? SubscriptionPlan.YEARLY
    : SubscriptionPlan.MONTHLY;
}

async function syncSubscriptionFromStripe(
  stripeSub: Stripe.Subscription,
  userId: string
): Promise<void> {
  const priceId = stripeSub.items.data[0]?.price?.id;
  const plan = planFromStripePrice(priceId);
  const status = mapStripeStatus(stripeSub.status);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paymentProvider: PaymentProvider.STRIPE,
      stripeCustomerId: String(stripeSub.customer),
      stripeSubscriptionId: stripeSub.id,
      plan,
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      paymentProvider: PaymentProvider.STRIPE,
      stripeCustomerId: String(stripeSub.customer),
      stripeSubscriptionId: stripeSub.id,
      plan,
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });
}

async function resolveUserIdFromCustomer(customerId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  return sub?.userId ?? null;
}

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (process.env.ENABLE_STRIPE !== 'true') {
    res.status(503).json({ error: 'STRIPE_DISABLED', message: 'Stripe billing is disabled.' });
    return;
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    res.status(503).json({
      error: 'STRIPE_UNAVAILABLE',
      message: 'Stripe webhook is not configured.',
    });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('[billing/stripe/webhook] signature verification failed', err);
    res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.userId ||
          (session.customer
            ? await resolveUserIdFromCustomer(String(session.customer))
            : null);

        if (!userId) break;

        if (session.mode === 'subscription' && session.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(String(session.subscription));
          await syncSubscriptionFromStripe(stripeSub, userId);
          await grantInitialPremiumCredits(userId);
        } else if (session.mode === 'payment') {
          const plan = session.metadata?.plan as CreditPlanKeyLocal | undefined;
          const pack = plan ? CREDIT_PLANS[plan] : null;
          if (!pack) break;

          const paymentIntentId = String(session.payment_intent ?? session.id);
          const amount = session.amount_total ?? 0;
          const currency = session.currency ?? 'ils';
          await addPurchasedCredits(userId, pack.credits, paymentIntentId, amount, currency, 'stripe');
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const userId =
          stripeSub.metadata?.userId ||
          (await resolveUserIdFromCustomer(String(stripeSub.customer)));
        if (!userId) break;
        await syncSubscriptionFromStripe(stripeSub, userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const stripeSub = await stripe.subscriptions.retrieve(String(invoice.subscription));
        const userId =
          stripeSub.metadata?.userId ||
          (await resolveUserIdFromCustomer(String(stripeSub.customer)));
        if (!userId) break;

        await syncSubscriptionFromStripe(stripeSub, userId);

        const paymentIntentId = String(invoice.payment_intent ?? `${invoice.id}-payment`);
        await logSubscriptionPayment(
          userId,
          paymentIntentId,
          invoice.amount_paid ?? 0,
          invoice.currency ?? 'ils',
          'stripe',
          { invoiceId: invoice.id }
        );

        if (invoice.billing_reason === 'subscription_cycle') {
          await resetMonthlyPremiumCredits(userId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const stripeSub = await stripe.subscriptions.retrieve(String(invoice.subscription));
        const userId =
          stripeSub.metadata?.userId ||
          (await resolveUserIdFromCustomer(String(stripeSub.customer)));
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: SubscriptionStatus.PAST_DUE },
        });
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (e) {
    console.error('[billing/stripe/webhook]', event.type, e);
    res.status(500).json({ error: 'WEBHOOK_ERROR', message: 'Failed to process webhook' });
  }
}

export { MONTHLY_AI_CREDITS };
