import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'tamir_sid';
export const MAX_DAILY_FREE = 5;

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function setSessionCookie(res: Response, sessionId: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function getOrCreateSessionId(req: Request, res: Response): string {
  const existing = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (existing && typeof existing === 'string' && existing.length > 0) {
    return existing;
  }
  const sessionId = randomUUID();
  setSessionCookie(res, sessionId);
  return sessionId;
}

export async function isPremiumUser(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== SubscriptionStatus.ACTIVE) return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd <= new Date()) return false;
  return true;
}

export async function getUserBonusConversions(userId: string | undefined): Promise<number> {
  if (!userId) return 0;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bonusConversions: true },
  });
  return user?.bonusConversions ?? 0;
}

async function countTodayUsageInTx(
  tx: Prisma.TransactionClient,
  userId: string | undefined,
  sessionId: string
): Promise<number> {
  const startOfDay = startOfTodayUtc();
  if (userId) {
    return tx.usageLog.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });
  }
  return tx.usageLog.count({
    where: { sessionId, userId: null, createdAt: { gte: startOfDay } },
  });
}

export async function countTodayUsage(userId: string | undefined, sessionId: string): Promise<number> {
  return countTodayUsageInTx(prisma, userId, sessionId);
}

export type RecordUsageParams = {
  userId: string | undefined;
  sessionId: string;
  toolId: string;
  fromFormat: string | null;
  toFormat: string | null;
  isPremium: boolean;
};

function usageLogData(params: RecordUsageParams) {
  return {
    userId: params.userId ?? null,
    sessionId: params.userId ? null : params.sessionId,
    toolId: params.toolId,
    fromFormat: params.fromFormat,
    toFormat: params.toFormat,
    isPremium: params.isPremium,
  };
}

/** Enforce free-tier daily quota (+ optional bonus pool) and insert UsageLog. */
export async function checkLimitAndRecordUsage(
  params: RecordUsageParams
): Promise<
  { ok: true } | { ok: false; used: number; bonusConversions: number }
> {
  const data = usageLogData(params);

  if (params.isPremium) {
    await prisma.usageLog.create({ data });
    return { ok: true };
  }

  return prisma.$transaction(async (tx) => {
    const used = await countTodayUsageInTx(tx, params.userId, params.sessionId);
    if (used < MAX_DAILY_FREE) {
      await tx.usageLog.create({ data });
      return { ok: true as const };
    }

    if (params.userId) {
      const user = await tx.user.findUnique({
        where: { id: params.userId },
        select: { bonusConversions: true },
      });
      const bonus = user?.bonusConversions ?? 0;
      if (bonus > 0) {
        await tx.user.update({
          where: { id: params.userId },
          data: { bonusConversions: { decrement: 1 } },
        });
        await tx.usageLog.create({ data });
        return { ok: true as const };
      }
      return { ok: false as const, used, bonusConversions: bonus };
    }

    return { ok: false as const, used, bonusConversions: 0 };
  });
}

export function buildUsageResponse(used: number, isPremium: boolean, bonusConversions = 0) {
  if (isPremium) {
    return {
      used,
      max: null as number | null,
      isPremium: true,
      remaining: null as number | null,
      bonusConversions: 0,
    };
  }
  const freeRemaining = Math.max(0, MAX_DAILY_FREE - used);
  const remaining = freeRemaining + bonusConversions;
  const max = used + remaining;
  return { used, max, isPremium: false, remaining, bonusConversions };
}
