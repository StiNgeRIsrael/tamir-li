import { PaymentStatus, PaymentType, Prisma, SubscriptionStatus } from '@prisma/client';
import { prisma } from './prisma';

export const MONTHLY_AI_CREDITS = 6;

/** MRR estimate per plan (agorot) — aligned with upgradePage pricing copy */
export const SUBSCRIPTION_MRR_AGOROT = {
  MONTHLY: 1990,
  YEARLY: 1592,
} as const;

export const CREDIT_PLANS = {
  credits_10: { credits: 10, amountIls: '8.00', label: 'AI Credits — 10' },
  credits_30: { credits: 30, amountIls: '21.00', label: 'AI Credits — 30' },
  credits_60: { credits: 60, amountIls: '39.00', label: 'AI Credits — 60' },
  credits_120: { credits: 120, amountIls: '72.00', label: 'AI Credits — 120' },
} as const;

export type CreditPlanKey = keyof typeof CREDIT_PLANS;
export type SubscriptionPlanKey = 'monthly' | 'yearly';
export type CheckoutPlan = SubscriptionPlanKey | CreditPlanKey;

export const CHECKOUT_PLANS: CheckoutPlan[] = [
  'monthly',
  'yearly',
  'credits_10',
  'credits_30',
  'credits_60',
  'credits_120',
];

export function getFrontendOrigin(): string {
  const explicit =
    process.env.FRONTEND_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VITE_SITE_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const fromCors = process.env.CORS_ORIGIN?.split(',')[0]?.trim();
  if (fromCors) return fromCors.replace(/\/$/, '');

  if (process.env.NODE_ENV === 'production') return 'https://tamir.li';
  return 'http://localhost:8080';
}

export function isActivePremium(
  status: SubscriptionStatus,
  periodEnd: Date | null | undefined
): boolean {
  if (status !== SubscriptionStatus.ACTIVE && status !== SubscriptionStatus.TRIALING) {
    return false;
  }
  if (periodEnd && periodEnd <= new Date()) return false;
  return true;
}

export async function grantInitialPremiumCredits(userId: string): Promise<void> {
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

export async function resetMonthlyPremiumCredits(userId: string): Promise<void> {
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

export async function addPurchasedCredits(
  userId: string,
  credits: number,
  externalId: string,
  amount: number,
  currency: string,
  provider: 'paypal' | 'stripe'
): Promise<void> {
  const where =
    provider === 'paypal'
      ? { paypalTransactionId: externalId }
      : { stripePaymentIntentId: externalId };

  const existing = await prisma.payment.findFirst({ where });
  if (existing) return;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId,
        ...(provider === 'paypal'
          ? { paypalTransactionId: externalId }
          : { stripePaymentIntentId: externalId }),
        amount,
        currency,
        type: PaymentType.CREDITS,
        status: PaymentStatus.SUCCEEDED,
        metadata: { credits, provider },
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

export async function logSubscriptionPayment(
  userId: string,
  externalId: string,
  amount: number,
  currency: string,
  provider: 'paypal' | 'stripe',
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  const where =
    provider === 'paypal'
      ? { paypalTransactionId: externalId }
      : { stripePaymentIntentId: externalId };

  const existing = await prisma.payment.findFirst({ where });
  if (existing) return;

  await prisma.payment.create({
    data: {
      userId,
      ...(provider === 'paypal'
        ? { paypalTransactionId: externalId }
        : { stripePaymentIntentId: externalId }),
      amount,
      currency,
      type: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.SUCCEEDED,
      metadata: { ...(metadata as object), provider },
    },
  });
}
