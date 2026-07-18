import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isRtdnAuthConfigured,
  parseGooglePlayRtdnBody,
  subscriptionIdToPlan,
  verifyRtdnToken,
} from './google-play';

const RTDN_SECRET_KEY = 'GOOGLE_PLAY_RTDN_SECRET';

describe('verifyRtdnToken', () => {
  const original = process.env[RTDN_SECRET_KEY];

  afterEach(() => {
    if (original === undefined) delete process.env[RTDN_SECRET_KEY];
    else process.env[RTDN_SECRET_KEY] = original;
  });

  it('allows any request when no secret is configured (backward compatible)', () => {
    delete process.env[RTDN_SECRET_KEY];
    expect(isRtdnAuthConfigured()).toBe(false);
    expect(verifyRtdnToken(undefined)).toBe(true);
    expect(verifyRtdnToken('anything')).toBe(true);
  });

  it('treats a whitespace-only secret as unset', () => {
    process.env[RTDN_SECRET_KEY] = '   ';
    expect(isRtdnAuthConfigured()).toBe(false);
    expect(verifyRtdnToken(undefined)).toBe(true);
  });

  it('accepts the matching token and rejects mismatches when configured', () => {
    process.env[RTDN_SECRET_KEY] = 's3cret-token';
    expect(isRtdnAuthConfigured()).toBe(true);
    expect(verifyRtdnToken('s3cret-token')).toBe(true);
    expect(verifyRtdnToken('wrong')).toBe(false);
    expect(verifyRtdnToken('')).toBe(false);
    expect(verifyRtdnToken(undefined)).toBe(false);
    expect(verifyRtdnToken(null)).toBe(false);
  });

  it('does not accept a token that only shares a prefix', () => {
    process.env[RTDN_SECRET_KEY] = 'abcdef';
    expect(verifyRtdnToken('abc')).toBe(false);
    expect(verifyRtdnToken('abcdefg')).toBe(false);
  });
});

describe('parseGooglePlayRtdnBody', () => {
  it('decodes a base64 Pub/Sub push envelope', () => {
    const notification = {
      version: '1.0',
      packageName: 'com.tamir.li',
      subscriptionNotification: {
        notificationType: 4,
        purchaseToken: 'tok-123',
        subscriptionId: 'tamir_premium_monthly',
      },
    };
    const data = Buffer.from(JSON.stringify(notification), 'utf8').toString('base64');
    const parsed = parseGooglePlayRtdnBody({ message: { data } });
    expect(parsed?.subscriptionNotification?.purchaseToken).toBe('tok-123');
    expect(parsed?.subscriptionNotification?.subscriptionId).toBe('tamir_premium_monthly');
  });

  it('returns null for malformed or empty bodies', () => {
    expect(parseGooglePlayRtdnBody(null)).toBeNull();
    expect(parseGooglePlayRtdnBody({})).toBeNull();
    expect(parseGooglePlayRtdnBody({ message: {} })).toBeNull();
    expect(parseGooglePlayRtdnBody({ message: { data: 'not-base64-json!!' } })).toBeNull();
  });
});

describe('subscriptionIdToPlan', () => {
  const original = process.env.GOOGLE_PLAY_PRODUCT_YEARLY;

  afterEach(() => {
    if (original === undefined) delete process.env.GOOGLE_PLAY_PRODUCT_YEARLY;
    else process.env.GOOGLE_PLAY_PRODUCT_YEARLY = original;
  });

  beforeEach(() => {
    delete process.env.GOOGLE_PLAY_PRODUCT_YEARLY;
  });

  it('maps the default yearly product to YEARLY, everything else to MONTHLY', () => {
    expect(subscriptionIdToPlan('tamir_premium_yearly')).toBe('YEARLY');
    expect(subscriptionIdToPlan('tamir_premium_monthly')).toBe('MONTHLY');
    expect(subscriptionIdToPlan('something_else')).toBe('MONTHLY');
  });

  it('honors a custom yearly product id from env', () => {
    process.env.GOOGLE_PLAY_PRODUCT_YEARLY = 'custom_yearly';
    expect(subscriptionIdToPlan('custom_yearly')).toBe('YEARLY');
    expect(subscriptionIdToPlan('tamir_premium_yearly')).toBe('MONTHLY');
  });
});
