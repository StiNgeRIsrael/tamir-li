import { describe, expect, it } from 'vitest';
import { buildUsageResponse, MAX_DAILY_FREE } from './usage-shared';

describe('buildUsageResponse', () => {
  it('returns unlimited for premium', () => {
    expect(buildUsageResponse(12, true)).toEqual({
      used: 12,
      max: null,
      isPremium: true,
      remaining: null,
      bonusConversions: 0,
    });
  });

  it('counts free daily allowance without bonus', () => {
    expect(buildUsageResponse(3, false, 0)).toEqual({
      used: 3,
      max: MAX_DAILY_FREE,
      isPremium: false,
      remaining: 2,
      bonusConversions: 0,
    });
  });

  it('adds bonus conversions to remaining and max', () => {
    expect(buildUsageResponse(0, false, 10)).toEqual({
      used: 0,
      max: MAX_DAILY_FREE + 10,
      isPremium: false,
      remaining: MAX_DAILY_FREE + 10,
      bonusConversions: 10,
    });
    expect(buildUsageResponse(5, false, 8)).toEqual({
      used: 5,
      max: 13,
      isPremium: false,
      remaining: 8,
      bonusConversions: 8,
    });
    expect(buildUsageResponse(7, false, 6)).toEqual({
      used: 7,
      max: 13,
      isPremium: false,
      remaining: 6,
      bonusConversions: 6,
    });
  });
});
