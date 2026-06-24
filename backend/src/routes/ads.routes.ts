import { Router, Request, Response } from 'express';
import { ensureAdSettings, serializeAdSettings, type AdSettingsPayload } from '../lib/ad-settings';
import {
  CONFIG_CACHE_KEYS,
  getCachedConfig,
  setCachedConfig,
} from '../lib/config-cache';

const router = Router();

const CONFIG_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

/** Public runtime ad config (zone keys are not secret — visible in embed code). */
router.get('/config', async (_req: Request, res: Response) => {
  res.set('Cache-Control', CONFIG_CACHE_CONTROL);
  const cached = getCachedConfig<AdSettingsPayload>(CONFIG_CACHE_KEYS.ADS);
  if (cached) {
    res.json(cached);
    return;
  }
  try {
    const row = await ensureAdSettings();
    const payload = serializeAdSettings(row);
    setCachedConfig(CONFIG_CACHE_KEYS.ADS, payload);
    res.json(payload);
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
