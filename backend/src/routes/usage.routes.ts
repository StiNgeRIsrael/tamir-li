import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth.middleware';
import { SubscriptionStatus } from '@prisma/client';

const router = Router();

const SESSION_COOKIE = 'tamir_sid';
const MAX_DAILY_FREE = 5;

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function setSessionCookie(res: Response, sessionId: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function getOrCreateSessionId(req: Request, res: Response): string {
  const existing = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (existing && typeof existing === 'string' && existing.length > 0) {
    return existing;
  }
  const sessionId = randomUUID();
  setSessionCookie(res, sessionId);
  return sessionId;
}

async function isPremiumUser(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== SubscriptionStatus.ACTIVE) return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd <= new Date()) return false;
  return true;
}

async function countTodayUsage(userId: string | undefined, sessionId: string): Promise<number> {
  const startOfDay = startOfTodayUtc();
  if (userId) {
    return prisma.usageLog.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });
  }
  return prisma.usageLog.count({
    where: { sessionId, userId: null, createdAt: { gte: startOfDay } },
  });
}

function buildUsageResponse(used: number, isPremium: boolean) {
  const max = isPremium ? null : MAX_DAILY_FREE;
  const remaining = isPremium ? null : Math.max(0, MAX_DAILY_FREE - used);
  return { used, max, isPremium, remaining };
}

router.get('/today', optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const sessionId = getOrCreateSessionId(req, res);
    const premium = userId ? await isPremiumUser(userId) : false;
    const used = await countTodayUsage(userId, sessionId);
    res.json(buildUsageResponse(used, premium));
  } catch (e) {
    console.error('[usage/today]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load usage' });
  }
});

router.post('/record', optionalAuth, async (req: Request, res: Response) => {
  try {
    const toolId = req.body?.toolId as string | undefined;
    if (!toolId || typeof toolId !== 'string') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'toolId required' });
      return;
    }

    const fromFormat = typeof req.body?.fromFormat === 'string' ? req.body.fromFormat : null;
    const toFormat = typeof req.body?.toFormat === 'string' ? req.body.toFormat : null;

    const userId = req.userId;
    const sessionId = getOrCreateSessionId(req, res);
    const premium = userId ? await isPremiumUser(userId) : false;

    if (!premium) {
      const used = await countTodayUsage(userId, sessionId);
      if (used >= MAX_DAILY_FREE) {
        res.status(429).json({
          error: 'DAILY_LIMIT',
          message: 'Daily conversion limit reached',
          ...buildUsageResponse(used, false),
        });
        return;
      }
    }

    await prisma.usageLog.create({
      data: {
        userId: userId ?? null,
        sessionId: userId ? null : sessionId,
        toolId,
        fromFormat,
        toFormat,
        isPremium: premium,
      },
    });

    const usedAfter = await countTodayUsage(userId, sessionId);
    res.json(buildUsageResponse(usedAfter, premium));
  } catch (e) {
    console.error('[usage/record]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not record usage' });
  }
});

export default router;
