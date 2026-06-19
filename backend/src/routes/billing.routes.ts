import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import {
  PaymentStatus,
  PaymentType,
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

const CREDIT_PLANS = {
  credits_10: { envKey: 'STRIPE_PRICE_CREDITS_10', credits: 10 },
  credits_30: { envKey: 'STRIPE_PRICE_CREDITS_30', credits: 30 },
  credits_60: { envKey: 'STRIPE_PRICE_CREDITS_60', credits: 60 },
  credits_120: { envKey: 'STRIPE_PRICE_CREDITS_120', credits: 120 },
} as const;

type CreditPlanKey = keyof typeof CREDIT_PLANS;
type SubscriptionPlanKey = 'monthly' | 'yearly';
type CheckoutPlan = SubscriptionPlanKey | CreditPlanKey;

const CHECKOUT_PLANS: CheckoutPlan[] = [
  'monthly',
  'yearly',
  'credits_10',
  'credits_30',
  'credits_60',
  'credits_120',
];

const MONTHLY_AI_CREDITS = 6;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

function stripeUnavailable(res: Response): boolean {
  if (!getStripe()) {
    res.status(503).json({
      error: 'STRIPE_UNAVAILABLE',
      message: 'Billing is not configured. Set STRIPE_SECRET_KEY in backend environment.',
    });
    return true;
  }
  return false;
}

function getFrontendOrigin(): string {
  const fromCors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  return fromCors || 'http://localhost:8080';
}

function getPriceId(plan: CheckoutPlan): string | null {
  if (plan === 'monthly') return process.env.STRIPE_PRICE_MONTHLY?.trim() || null;
  if (plan === 'yearly') return process.env.STRIPE_PRICE_YEARLY?.trim() || null;
  const pack = CREDIT_PLANS[plan];
  return process.env[pack.envKey]?.trim() || null;
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

function isActivePremium(
  status: SubscriptionStatus,
  periodEnd: Date | null | undefined
): boolean {
  if (status !== SubscriptionStatus.ACTIVE && status !== SubscriptionStatus.TRIALING) {
    return false;
  }
  if (periodEnd && periodEnd <= new Date()) return false;
  return true;
}

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  if (user.subscription?.stripeCustomerId) {
    return user.subscription.stripeCustomerId;
  }

  const stripe = getStripe()!;
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      plan: SubscriptionPlan.MONTHLY,
      status: SubscriptionStatus.CANCELED,
    },
    update: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
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
      stripeCustomerId: String(stripeSub.customer),
      stripeSubscriptionId: stripeSub.id,
      plan,
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
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

async function grantInitialPremiumCredits(userId: string): Promise<void> {
  await prisma.aiCredit.upsert({
    where: { userId },
    create: {
      userId,
      balance: MONTHLY_AI_CREDITS,
      monthlyCredits: MONTHLY_AI_CREDITS,
      lastMonthlyReset: new Date(),
    },
    update: {
      monthlyCredits: MONTHLY_AI_CREDITS,
      balance: { increment: MONTHLY_AI_CREDITS },
      lastMonthlyReset: new Date(),
    },
  });
}

async function resetMonthlyPremiumCredits(userId: string): Promise<void> {
  const existing = await prisma.aiCredit.findUnique({ where: { userId } });
  if (!existing) {
    await grantInitialPremiumCredits(userId);
    return;
  }

  const nonMonthlyBalance = Math.max(0, existing.balance - existing.monthlyCredits);
  await prisma.aiCredit.update({
    where: { userId },
    data: {
      monthlyCredits: MONTHLY_AI_CREDITS,
      balance: nonMonthlyBalance + MONTHLY_AI_CREDITS,
      lastMonthlyReset: new Date(),
    },
  });
}

async function addPurchasedCredits(
  userId: string,
  credits: number,
  paymentIntentId: string,
  amount: number,
  currency: string
): Promise<void> {
  const existing = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId,
        stripePaymentIntentId: paymentIntentId,
        amount,
        currency,
        type: PaymentType.CREDITS,
        status: PaymentStatus.SUCCEEDED,
        metadata: { credits },
      },
    }),
    prisma.aiCredit.upsert({
      where: { userId },
      create: {
        userId,
        balance: credits,
        lifetimePurchased: credits,
      },
      update: {
        balance: { increment: credits },
        lifetimePurchased: { increment: credits },
      },
    }),
  ]);
}

async function logSubscriptionPayment(
  userId: string,
  paymentIntentId: string,
  amount: number,
  currency: string,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  const existing = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (existing) return;

  await prisma.payment.create({
    data: {
      userId,
      stripePaymentIntentId: paymentIntentId,
      amount,
      currency,
      type: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.SUCCEEDED,
      metadata: metadata ?? {},
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
    console.error('[billing/webhook] signature verification failed', err);
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
          const plan = session.metadata?.plan as CreditPlanKey | undefined;
          const pack = plan ? CREDIT_PLANS[plan] : null;
          if (!pack) break;

          const paymentIntentId = String(session.payment_intent ?? session.id);
          const amount = session.amount_total ?? 0;
          const currency = session.currency ?? 'ils';
          await addPurchasedCredits(userId, pack.credits, paymentIntentId, amount, currency);
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

        const paymentIntentId = String(
          invoice.payment_intent ?? `${invoice.id}-payment`
        );
        await logSubscriptionPayment(
          userId,
          paymentIntentId,
          invoice.amount_paid ?? 0,
          invoice.currency ?? 'ils',
          { invoiceId: invoice.id }
        );

        // Initial invoice is handled in checkout.session.completed — only reset on renewals.
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
    console.error('[billing/webhook]', event.type, e);
    res.status(500).json({ error: 'WEBHOOK_ERROR', message: 'Failed to process webhook' });
  }
}

router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  if (stripeUnavailable(res)) return;

  try {
    const plan = req.body?.plan as CheckoutPlan | undefined;
    if (!plan || !CHECKOUT_PLANS.includes(plan)) {
      res.status(400).json({ error: 'INVALID_PLAN', message: 'Invalid plan' });
      return;
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      res.status(503).json({
        error: 'PRICE_NOT_CONFIGURED',
        message: `Stripe price for "${plan}" is not configured.`,
      });
      return;
    }

    const userId = req.userId!;
    const stripe = getStripe()!;
    const customerId = await getOrCreateStripeCustomer(userId);
    const origin = getFrontendOrigin();
    const isCredit = plan.startsWith('credits_');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isCredit ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/premium?checkout=success&plan=${plan}`,
      cancel_url: `${origin}/premium?checkout=canceled`,
      metadata: { userId, plan },
      ...(isCredit
        ? { payment_intent_data: { metadata: { userId, plan } } }
        : { subscription_data: { metadata: { userId, plan } } }),
    });

    if (!session.url) {
      res.status(500).json({ error: 'CHECKOUT_FAILED', message: 'Could not create checkout session' });
      return;
    }

    res.json({ url: session.url });
  } catch (e) {
    console.error('[billing/checkout]', e);
    res.status(500).json({ error: 'CHECKOUT_FAILED', message: 'Could not start checkout' });
  }
});

router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const [sub, credits] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.aiCredit.findUnique({ where: { userId } }),
    ]);

    const isPremium = sub
      ? isActivePremium(sub.status, sub.currentPeriodEnd)
      : false;

    res.json({
      isPremium,
      plan: isPremium ? sub!.plan.toLowerCase() : null,
      periodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      credits: credits?.balance ?? 0,
    });
  } catch (e) {
    console.error('[billing/status]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load billing status' });
  }
});

router.post('/portal', requireAuth, async (req: Request, res: Response) => {
  if (stripeUnavailable(res)) return;

  try {
    const userId = req.userId!;
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeCustomerId) {
      res.status(400).json({
        error: 'NO_CUSTOMER',
        message: 'No billing account found. Subscribe first.',
      });
      return;
    }

    const stripe = getStripe()!;
    const origin = getFrontendOrigin();
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/premium`,
    });

    if (!session.url) {
      res.status(500).json({ error: 'PORTAL_FAILED', message: 'Could not open customer portal' });
      return;
    }

    res.json({ url: session.url });
  } catch (e) {
    console.error('[billing/portal]', e);
    res.status(500).json({ error: 'PORTAL_FAILED', message: 'Could not open customer portal' });
  }
});

export default router;
