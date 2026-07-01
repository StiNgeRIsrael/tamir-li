const HILLTOP_API_BASE = 'https://api.hilltopads.com/publisher';
/** Hilltop recommends refreshing antiAdBlock codes every 5 minutes. */
export const HILLTOP_API_CACHE_TTL_MS = 4 * 60 * 1000;

export const HILLTOP_DEFAULT_ZONE_IDS = {
  banner: 7184921,
  sidebar: 7184937,
  mobileBanner: 7184953,
  popunder: 7184913,
} as const;

export type HilltopZoneKey = keyof typeof HILLTOP_DEFAULT_ZONE_IDS;

export type HilltopAntiAdBlockResult = {
  code: string;
  directUrl: string;
};

export type HilltopAdsApiPayload = {
  hilltopBannerInvocationCode: string | null;
  hilltopSidebarInvocationCode: string | null;
  hilltopMobileBannerInvocationCode: string | null;
  hilltopPopunderUrl: string | null;
};

type CacheEntry = { value: HilltopAntiAdBlockResult; expiresAt: number };

const zoneCache = new Map<number, CacheEntry>();

function readApiKey(): string | undefined {
  return process.env.HILLTOPADS_API_KEY?.trim() || undefined;
}

function readZoneId(key: HilltopZoneKey): number {
  const envKey = `HILLTOPADS_ZONE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return HILLTOP_DEFAULT_ZONE_IDS[key];
}

export function isHilltopApiConfigured(): boolean {
  return !!readApiKey();
}

type HilltopApiResponse = {
  status?: string;
  result?: { code?: string; directUrl?: string };
  message?: string;
  code?: number;
};

/** Fetch anti-adblock invocation code for a zone (cached ~4 min). */
export async function fetchHilltopAntiAdBlock(
  zoneId: number,
): Promise<HilltopAntiAdBlockResult | null> {
  const apiKey = readApiKey();
  if (!apiKey) return null;

  const cached = zoneCache.get(zoneId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const url = new URL(`${HILLTOP_API_BASE}/antiAdBlock`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('zoneId', String(zoneId));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const data = (await res.json()) as HilltopApiResponse;
    if (data.status !== 'success' || !data.result?.code) {
      console.warn(`[hilltopads-api] zone ${zoneId} failed:`, data.message ?? res.status);
      return null;
    }
    const value: HilltopAntiAdBlockResult = {
      code: data.result.code,
      directUrl: data.result.directUrl?.trim() ?? '',
    };
    zoneCache.set(zoneId, { value, expiresAt: Date.now() + HILLTOP_API_CACHE_TTL_MS });
    return value;
  } catch (err) {
    console.warn(`[hilltopads-api] zone ${zoneId} request error:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Resolve fresh anti-adblock codes for all configured placements. */
export async function resolveHilltopAdsFromApi(): Promise<HilltopAdsApiPayload | null> {
  if (!isHilltopApiConfigured()) return null;

  const [banner, sidebar, mobileBanner, popunder] = await Promise.all([
    fetchHilltopAntiAdBlock(readZoneId('banner')),
    fetchHilltopAntiAdBlock(readZoneId('sidebar')),
    fetchHilltopAntiAdBlock(readZoneId('mobileBanner')),
    fetchHilltopAntiAdBlock(readZoneId('popunder')),
  ]);

  return {
    hilltopBannerInvocationCode: banner?.code ?? null,
    hilltopSidebarInvocationCode: sidebar?.code ?? null,
    hilltopMobileBannerInvocationCode: mobileBanner?.code ?? null,
    hilltopPopunderUrl: popunder?.directUrl || null,
  };
}

/** Clear in-memory zone cache (tests / admin invalidation). */
export function clearHilltopApiCache(): void {
  zoneCache.clear();
}
