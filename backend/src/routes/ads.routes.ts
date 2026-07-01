import { Router, Request, Response } from 'express';
import { ensureAdSettings, serializeAdSettings, type AdSettingsPayload } from '../lib/ad-settings';
import {
  CONFIG_CACHE_KEYS,
  getCachedConfig,
  setCachedConfig,
} from '../lib/config-cache';
import {
  HILLTOP_API_CACHE_TTL_MS,
  isHilltopApiConfigured,
  resolveHilltopAdsFromApi,
  type HilltopAdsApiPayload,
} from '../lib/hilltopads-api';

const router = Router();

export type PublicAdConfigPayload = AdSettingsPayload & HilltopAdsApiPayload;

const CONFIG_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

const EMPTY_HILLTOP: HilltopAdsApiPayload = {
  hilltopBannerInvocationCode: null,
  hilltopSidebarInvocationCode: null,
  hilltopMobileBannerInvocationCode: null,
  hilltopPopunderUrl: null,
};

const EMPTY_AD_CONFIG: PublicAdConfigPayload = {
  zoneBanner: null,
  zoneSidebar: null,
  zoneSidebar2: null,
  zoneInline: null,
  popunderScriptUrl: null,
  nativeScriptUrl: null,
  nativeContainerId: null,
  invokeHost: null,
  hilltopBannerScriptUrl: null,
  hilltopSidebarScriptUrl: null,
  hilltopMobileBannerScriptUrl: null,
  hilltopPopunderUrl: null,
  ...EMPTY_HILLTOP,
};

async function buildPublicAdConfig(): Promise<PublicAdConfigPayload> {
  const row = await ensureAdSettings();
  const payload: PublicAdConfigPayload = {
    ...serializeAdSettings(row),
    ...EMPTY_HILLTOP,
  };

  const hilltopFromApi = await resolveHilltopAdsFromApi();
  if (hilltopFromApi) {
    if (hilltopFromApi.hilltopBannerInvocationCode) {
      payload.hilltopBannerInvocationCode = hilltopFromApi.hilltopBannerInvocationCode;
    }
    if (hilltopFromApi.hilltopSidebarInvocationCode) {
      payload.hilltopSidebarInvocationCode = hilltopFromApi.hilltopSidebarInvocationCode;
    }
    if (hilltopFromApi.hilltopMobileBannerInvocationCode) {
      payload.hilltopMobileBannerInvocationCode = hilltopFromApi.hilltopMobileBannerInvocationCode;
    }
    if (hilltopFromApi.hilltopPopunderUrl) {
      payload.hilltopPopunderUrl = hilltopFromApi.hilltopPopunderUrl;
    }
  }

  return payload;
}

/** Public runtime ad config (zone keys are not secret — visible in embed code). */
router.get('/config', async (_req: Request, res: Response) => {
  const cacheTtl = isHilltopApiConfigured() ? HILLTOP_API_CACHE_TTL_MS : undefined;
  res.set('Cache-Control', CONFIG_CACHE_CONTROL);
  const cached = getCachedConfig<PublicAdConfigPayload>(CONFIG_CACHE_KEYS.ADS);
  if (cached) {
    res.json(cached);
    return;
  }
  try {
    const payload = await buildPublicAdConfig();
    setCachedConfig(CONFIG_CACHE_KEYS.ADS, payload, cacheTtl);
    res.json(payload);
  } catch (e) {
    console.error('[ads/config] Prisma failure, serving empty config:', e);
    res.json(EMPTY_AD_CONFIG);
  }
});

export default router;
