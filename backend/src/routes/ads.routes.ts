import { Router, Request, Response } from 'express';
import { ensureAdSettings, serializeAdSettings } from '../lib/ad-settings';

const router = Router();

/** Public runtime ad config (zone keys are not secret — visible in embed code). */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const row = await ensureAdSettings();
    res.json(serializeAdSettings(row));
  } catch (e) {
    console.error('[ads/config] Prisma failure, serving empty config:', e);
    res.json({
      zoneBanner: null,
      zoneSidebar: null,
      zoneSidebar2: null,
      zoneInline: null,
      popunderScriptUrl: null,
      nativeScriptUrl: null,
      nativeContainerId: null,
      invokeHost: null,
    });
  }
});

export default router;
