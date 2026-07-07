import type { AppSettings } from '@prisma/client';
import { prisma } from './prisma';

const DEFAULT_ID = 'default';

export type AppSettingsPayload = {
  onboardingOfferGeneration: number;
  onboardingRepromptedAt: string | null;
};

export async function ensureAppSettings(): Promise<AppSettings> {
  return prisma.appSettings.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID },
    update: {},
  });
}

export function serializeAppSettings(row: AppSettings): AppSettingsPayload {
  return {
    onboardingOfferGeneration: row.onboardingOfferGeneration,
    onboardingRepromptedAt: row.onboardingRepromptedAt?.toISOString() ?? null,
  };
}

/** Bump global onboarding generation — all app clients will reprompt on next sync. */
export async function repromptOnboardingForAllUsers(): Promise<AppSettings> {
  const current = await ensureAppSettings();
  return prisma.appSettings.update({
    where: { id: DEFAULT_ID },
    data: {
      onboardingOfferGeneration: current.onboardingOfferGeneration + 1,
      onboardingRepromptedAt: new Date(),
    },
  });
}
