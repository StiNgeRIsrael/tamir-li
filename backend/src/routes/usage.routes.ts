import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  buildUsageResponse,
  checkLimitAndRecordUsage,
  countTodayUsage,
  getOrCreateSessionId,
  isPremiumUser,
} from '../lib/usage-shared';

const router = Router();

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

    const usageResult = await checkLimitAndRecordUsage({
      userId,
      sessionId,
      toolId,
      fromFormat,
      toFormat,
      isPremium: premium,
    });
    if (!usageResult.ok) {
      res.status(429).json({
        error: 'DAILY_LIMIT',
        message: 'Daily conversion limit reached',
        ...buildUsageResponse(usageResult.used, false),
      });
      return;
    }

    const usedAfter = await countTodayUsage(userId, sessionId);
    res.json(buildUsageResponse(usedAfter, premium));
  } catch (e) {
    console.error('[usage/record]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not record usage' });
  }
});

export default router;
