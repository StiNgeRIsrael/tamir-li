import { Router, Request, Response } from 'express';
import {
  CONFIG_CACHE_KEYS,
  PUBLIC_STATS_CACHE_TTL_MS,
  getCachedConfig,
  setCachedConfig,
} from '../lib/config-cache';
import { prisma } from '../lib/prisma';

const router = Router();

export type PublicStatsPayload = {
  conversionsToday: number;
  conversionsTotal: number;
  updatedAt: string;
};

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function loadPublicStats(): Promise<PublicStatsPayload> {
  const dayStart = startOfUtcDay();
  const [conversionsToday, conversionsTotal] = await Promise.all([
    prisma.usageLog.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.usageLog.count(),
  ]);
  return {
    conversionsToday,
    conversionsTotal,
    updatedAt: new Date().toISOString(),
  };
}

const PUBLIC_STATS_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

/** Aggregate conversion counts for marketing hero — no PII. */
router.get('/public', async (_req: Request, res: Response) => {
  res.set('Cache-Control', PUBLIC_STATS_CACHE_CONTROL);
  const cached = getCachedConfig<PublicStatsPayload>(CONFIG_CACHE_KEYS.PUBLIC_STATS);
  if (cached) {
    res.json(cached);
    return;
  }
  try {
    const payload = await loadPublicStats();
    setCachedConfig(CONFIG_CACHE_KEYS.PUBLIC_STATS, payload, PUBLIC_STATS_CACHE_TTL_MS);
    res.json(payload);
  } catch (e) {
    console.error('[stats/public] Prisma failure:', e);
    res.status(503).json({ error: 'STATS_UNAVAILABLE', message: 'Could not load public stats' });
  }
});

export default router;
