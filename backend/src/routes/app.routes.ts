import { Router, Request, Response } from 'express';
import { ensureAppSettings, serializeAppSettings } from '../lib/app-settings';

const router = Router();

/** Public — clients poll to know when to reset local onboarding state. */
router.get('/onboarding', async (_req: Request, res: Response) => {
  try {
    const row = await ensureAppSettings();
    res.json(serializeAppSettings(row));
  } catch (e) {
    console.error('[app/onboarding]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load app settings' });
  }
});

export default router;
