import { Router, Request, Response } from 'express';
import {
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth.middleware';
import {
  CHECKOUT_PLANS,
  CREDIT_PLANS,
  type CheckoutPlan,
  type CreditPlanKey,
  addPurchasedCredits,
  getFrontendOrigin,
  grantInitialPremiumCredits,
  isActivePremium,
  logSubscriptionPayment,
  resetMonthlyPremiumCredits,
} from '../lib/billing-shared';
import {
  capturePayPalOrder,
  createPayPalOrder,
  createPayPalSubscription,
  getPayPalManageUrl,
  getPayPalSubscription,
  ilsToAgorot,
  isPayPalConfigured,
  verifyPayPalWebhook,
} from '../lib/paypal';

const router = Router();

const ENABLE_STRIPE = process.env.ENABLE_STRIPE === 'true';

function getPayPalPlanId(plan: 'monthly' | 'yearly'): string | null {
  if (plan === 'monthly') return process.env.PAYPAL_PLAN_MONTHLY?.trim() || null;
  return process.env.PAYPAL_PLAN_YEARLY?.trim() || null;
}

function mapPayPalSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return SubscriptionStatus.ACTIVE;
    case 'APPROVAL_PENDING':
    case 'APPROVED':
      return SubscriptionStatus.TRIALING;
    case 'SUSPENDED':
      return SubscriptionStatus.PAST_DUE;
    case 'CANCELLED':
    case 'EXPIRED':
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.CANCELED;
  }
}

function planFromPayPalPlanId(planId: string | undefined): SubscriptionPlan {
  const yearly = process.env.PAYPAL_PLAN_YEARLY?.trim();
  return planId && yearly && planId === yearly
    ? SubscriptionPlan.YEARLY
    : SubscriptionPlan.MONTHLY;
}

async function syncSubscriptionFromPayPal(
  paypalSub: Awaited<ReturnType<typeof getPayPalSubscription>>,
  userId: string
): Promise<void> {
  const plan = planFromPayPalPlanId(paypalSub.plan_id);
  const status = mapPayPalSubscriptionStatus(paypalSub.status);
  const nextBilling = paypalSub.billing_info?.next_billing_time;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paymentProvider: PaymentProvider.PAYPAL,
      paypalSubscriptionId: paypalSub.id,
      plan,
      status,
      currentPeriodStart: paypalSub.start_time ? new Date(paypalSub.start_time) : new Date(),
      currentPeriodEnd: nextBilling ? new Date(nextBilling) : null,
      cancelAtPeriodEnd: status === SubscriptionStatus.CANCELED,
    },
    update: {
      paymentProvider: PaymentProvider.PAYPAL,
      paypalSubscriptionId: paypalSub.id,
      plan,
      status,
      currentPeriodStart: paypalSub.start_time ? new Date(paypalSub.start_time) : undefined,
      currentPeriodEnd: nextBilling ? new Date(nextBilling) : null,
      cancelAtPeriodEnd: status === SubscriptionStatus.CANCELED,
    },
  });
}

async function resolveUserIdFromPayPalSubscription(subscriptionId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({
    where: { paypalSubscriptionId: subscriptionId },
    select: { userId: true },
  });
  if (sub?.userId) return sub.userId;

  try {
    const paypalSub = await getPayPalSubscription(subscriptionId);
    return paypalSub.custom_id ?? null;
  } catch {
    return null;
  }
}

function parseCreditCustomId(customId: string | undefined): { userId: string; plan: CreditPlanKey } | null {
  if (!customId) return null;
  const [userId, plan] = customId.split('|');
  if (!userId || !plan || !(plan in CREDIT_PLANS)) return null;
  return { userId, plan: plan as CreditPlanKey };
}

function billingUnavailable(res: Response): boolean {
  if (!isPayPalConfigured()) {
    res.status(503).json({
      error: 'BILLING_UNAVAILABLE',
      message:
        'Billing is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in backend environment.',
    });
    return true;
  }
  return false;
}

export async function paypalWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!isPayPalConfigured()) {
    res.status(503).json({ error: 'BILLING_UNAVAILABLE', message: 'PayPal webhook is not configured.' });
    return;
  }

  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);

  const verified = await verifyPayPalWebhook(req.headers, rawBody);
  if (!verified) {
    res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' });
    return;
  }

  const event = JSON.parse(rawBody) as {
    event_type: string;
    resource: Record<string, unknown>;
  };

  try {
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const subscriptionId = String(event.resource.id ?? '');
        if (!subscriptionId) break;

        const userId =
          String(event.resource.custom_id ?? '') ||
          (await resolveUserIdFromPayPalSubscription(subscriptionId));
        if (!userId) break;

        const paypalSub = await getPayPalSubscription(subscriptionId);
        await syncSubscriptionFromPayPal(paypalSub, userId);

        if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
          await grantInitialPremiumCredits(userId);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED': {
        const subscriptionId = String(
          (event.resource as { billing_agreement_id?: string }).billing_agreement_id ??
            (event.resource as { id?: string }).id ??
            ''
        );
        if (!subscriptionId) break;

        const userId = await resolveUserIdFromPayPalSubscription(subscriptionId);
        if (!userId) break;

        const paypalSub = await getPayPalSubscription(subscriptionId);
        await syncSubscriptionFromPayPal(paypalSub, userId);

        const amount = event.resource.amount as { value?: string; currency_code?: string } | undefined;
        const paymentId = String(
          (event.resource as { id?: string }).id ?? `${subscriptionId}-${Date.now()}`
        );

        await logSubscriptionPayment(
          userId,
          paymentId,
          ilsToAgorot(amount?.value),
          (amount?.currency_code ?? 'ILS').toLowerCase(),
          'paypal',
          { subscriptionId, eventType: event.event_type }
        );

        const sequence = Number((event.resource as { sequence_number?: number }).sequence_number ?? 1);
        if (sequence > 1) {
          await resetMonthlyPremiumCredits(userId);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscriptionId = String(
          (event.resource as { billing_agreement_id?: string }).billing_agreement_id ?? ''
        );
        if (!subscriptionId) break;

        const userId = await resolveUserIdFromPayPalSubscription(subscriptionId);
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId },
          data: { status: SubscriptionStatus.PAST_DUE },
        });
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        const customId = String((resource as { custom_id?: string }).custom_id ?? '');
        const captureId = String((resource as { id?: string }).id ?? '');
        const amount = (resource as { amount?: { value?: string; currency_code?: string } }).amount;

        const parsed = parseCreditCustomId(customId);
        if (!parsed || !captureId) break;

        const pack = CREDIT_PLANS[parsed.plan];
        await addPurchasedCredits(
          parsed.userId,
          pack.credits,
          captureId,
          ilsToAgorot(amount?.value),
          (amount?.currency_code ?? 'ILS').toLowerCase(),
          'paypal'
        );
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (e) {
    console.error('[billing/paypal/webhook]', event.event_type, e);
    res.status(500).json({ error: 'WEBHOOK_ERROR', message: 'Failed to process webhook' });
  }
}

router.post('/checkout', requireAuth, async (req: Request, res: Response) => {
  if (billingUnavailable(res)) return;

  try {
    const plan = req.body?.plan as CheckoutPlan | undefined;
    if (!plan || !CHECKOUT_PLANS.includes(plan)) {
      res.status(400).json({ error: 'INVALID_PLAN', message: 'Invalid plan' });
      return;
    }

    const userId = req.userId!;
    const origin = getFrontendOrigin();
    const successUrl = `${origin}/premium?checkout=success&plan=${plan}`;
    const cancelUrl = `${origin}/premium?checkout=canceled`;

    const isCredit = plan.startsWith('credits_');

    if (isCredit) {
      const pack = CREDIT_PLANS[plan as CreditPlanKey];
      const { approvalUrl } = await createPayPalOrder(
        pack.amountIls,
        pack.label,
        userId,
        plan,
        successUrl,
        cancelUrl
      );
      res.json({ url: approvalUrl, provider: 'paypal' });
      return;
    }

    const planId = getPayPalPlanId(plan as 'monthly' | 'yearly');
    if (!planId) {
      res.status(503).json({
        error: 'PLAN_NOT_CONFIGURED',
        message: `PayPal plan for "${plan}" is not configured.`,
      });
      return;
    }

    const { approvalUrl } = await createPayPalSubscription(
      planId,
      userId,
      successUrl,
      cancelUrl
    );
    res.json({ url: approvalUrl, provider: 'paypal' });
  } catch (e) {
    console.error('[billing/checkout]', e);
    res.status(500).json({ error: 'CHECKOUT_FAILED', message: 'Could not start checkout' });
  }
});

router.post('/paypal/capture-order', requireAuth, async (req: Request, res: Response) => {
  if (billingUnavailable(res)) return;

  try {
    const orderId = String(req.body?.orderId ?? '').trim();
    if (!orderId) {
      res.status(400).json({ error: 'INVALID_ORDER', message: 'Missing orderId' });
      return;
    }

    const order = await capturePayPalOrder(orderId);
    const unit = order.purchase_units?.[0];
    const parsed = parseCreditCustomId(unit?.custom_id);
    if (!parsed || parsed.userId !== req.userId) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Order does not belong to this user' });
      return;
    }

    const pack = CREDIT_PLANS[parsed.plan];
    const capture = unit?.payments?.captures?.[0];
    const captureId = capture?.id ?? orderId;

    await addPurchasedCredits(
      parsed.userId,
      pack.credits,
      captureId,
      ilsToAgorot(capture?.amount?.value ?? unit?.amount?.value),
      (capture?.amount?.currency_code ?? unit?.amount?.currency_code ?? 'ILS').toLowerCase(),
      'paypal'
    );

    res.json({ captured: true, credits: pack.credits });
  } catch (e) {
    console.error('[billing/paypal/capture-order]', e);
    res.status(500).json({ error: 'CAPTURE_FAILED', message: 'Could not capture order' });
  }
});

router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const [sub, credits] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.aiCredit.findUnique({ where: { userId } }),
    ]);

    const isPremium = sub ? isActivePremium(sub.status, sub.currentPeriodEnd) : false;

    res.json({
      isPremium,
      plan: isPremium ? sub!.plan.toLowerCase() : null,
      periodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      credits: credits?.balance ?? 0,
      provider: sub?.paymentProvider?.toLowerCase() ?? (isPayPalConfigured() ? 'paypal' : null),
    });
  } catch (e) {
    console.error('[billing/status]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load billing status' });
  }
});

router.post('/portal', requireAuth, async (req: Request, res: Response) => {
  if (billingUnavailable(res)) return;

  try {
    const userId = req.userId!;
    const sub = await prisma.subscription.findUnique({ where: { userId } });

    if (!sub?.paypalSubscriptionId && sub?.paymentProvider !== PaymentProvider.PAYPAL) {
      if (ENABLE_STRIPE) {
        res.status(400).json({
          error: 'NO_BILLING_ACCOUNT',
          message: 'No billing account found. Subscribe first.',
        });
        return;
      }
    }

    if (!sub?.paypalSubscriptionId) {
      res.status(400).json({
        error: 'NO_SUBSCRIPTION',
        message: 'No active PayPal subscription found. Subscribe first.',
      });
      return;
    }

    res.json({ url: getPayPalManageUrl(), provider: 'paypal' });
  } catch (e) {
    console.error('[billing/portal]', e);
    res.status(500).json({ error: 'PORTAL_FAILED', message: 'Could not open billing portal' });
  }
});

export default router;

// Stripe integration retained behind ENABLE_STRIPE=true — see billing-stripe.routes.ts if re-enabled.
