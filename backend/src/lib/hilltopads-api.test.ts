import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearHilltopApiCache,
  fetchHilltopAntiAdBlock,
  isHilltopApiConfigured,
  resolveHilltopAdsFromApi,
} from './hilltopads-api';

describe('hilltopads-api', () => {
  beforeEach(() => {
    clearHilltopApiCache();
    vi.stubEnv('HILLTOPADS_API_KEY', 'test-api-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearHilltopApiCache();
  });

  it('detects API key configuration', () => {
    expect(isHilltopApiConfigured()).toBe(true);
    vi.stubEnv('HILLTOPADS_API_KEY', '');
    expect(isHilltopApiConfigured()).toBe(false);
  });

  it('fetches and caches antiAdBlock response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        status: 'success',
        result: { code: '(function(){})()', directUrl: 'https://example.com/ad' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await fetchHilltopAntiAdBlock(7184921);
    const second = await fetchHilltopAntiAdBlock(7184921);

    expect(first?.code).toBe('(function(){})()');
    expect(first?.directUrl).toBe('https://example.com/ad');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second?.code).toBe('(function(){})()');
  });

  it('resolves all placement fields from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: 'success',
          result: { code: 'code', directUrl: 'https://pop.example' },
        }),
      }),
    );

    const payload = await resolveHilltopAdsFromApi();
    expect(payload?.hilltopBannerInvocationCode).toBe('code');
    expect(payload?.hilltopPopunderUrl).toBe('https://pop.example');
  });
});
