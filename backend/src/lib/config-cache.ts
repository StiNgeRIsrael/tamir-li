type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

/** Matches HTTP Cache-Control max-age=60 on public config routes. */
export const CONFIG_CACHE_TTL_MS = 60_000;

export const CONFIG_CACHE_KEYS = {
  ADS: 'ads/config',
  TOOLS: 'tools/config',
  PUBLIC_STATS: 'stats/public',
} as const;

/** Aggregate usage counts — refresh less often than tool config. */
export const PUBLIC_STATS_CACHE_TTL_MS = 300_000;

export function getCachedConfig<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCachedConfig<T>(key: string, value: T, ttlMs = CONFIG_CACHE_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateConfigCache(key: string): void {
  store.delete(key);
}
