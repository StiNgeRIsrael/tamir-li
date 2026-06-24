export type PremiumGrantDuration = '30d' | '90d' | '1y' | 'lifetime';

const PREMIUM_DURATIONS = new Set<PremiumGrantDuration>(['30d', '90d', '1y', 'lifetime']);

export const MAX_ADMIN_GRANT_CREDITS = 500;
export const MAX_ADMIN_GRANT_CONVERSIONS = 100;

export function parsePremiumGrantDuration(raw: unknown): PremiumGrantDuration | null {
  if (typeof raw !== 'string') return null;
  return PREMIUM_DURATIONS.has(raw as PremiumGrantDuration)
    ? (raw as PremiumGrantDuration)
    : null;
}

export function computePremiumPeriodEnd(
  duration: PremiumGrantDuration,
  from: Date = new Date()
): Date | null {
  if (duration === 'lifetime') return null;
  const days = duration === '30d' ? 30 : duration === '90d' ? 90 : 365;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function parseGrantCreditsAmount(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_ADMIN_GRANT_CREDITS) return null;
  return n;
}

export function parseGrantConversionsAmount(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_ADMIN_GRANT_CONVERSIONS) return null;
  return n;
}
