import type { AdSettings } from '@prisma/client';
import { prisma } from './prisma';

export const AD_SETTINGS_ID = 'default';

export type AdSettingsPayload = {
  zoneBanner: string | null;
  zoneSidebar: string | null;
  zoneSidebar2: string | null;
  zoneInline: string | null;
  popunderScriptUrl: string | null;
  nativeScriptUrl: string | null;
  nativeContainerId: string | null;
  invokeHost: string | null;
};

export function serializeAdSettings(row: AdSettings): AdSettingsPayload {
  return {
    zoneBanner: row.zoneBanner,
    zoneSidebar: row.zoneSidebar,
    zoneSidebar2: row.zoneSidebar2,
    zoneInline: row.zoneInline,
    popunderScriptUrl: row.popunderScriptUrl,
    nativeScriptUrl: row.nativeScriptUrl,
    nativeContainerId: row.nativeContainerId,
    invokeHost: row.invokeHost,
  };
}

/** Ensure the singleton row exists; safe to call on every read. */
export async function ensureAdSettings(): Promise<AdSettings> {
  return prisma.adSettings.upsert({
    where: { id: AD_SETTINGS_ID },
    create: { id: AD_SETTINGS_ID },
    update: {},
  });
}

function trimOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseAdSettingsPatch(body: Record<string, unknown>): {
  data: Partial<AdSettingsPayload>;
  error?: string;
} {
  const fields = [
    'zoneBanner',
    'zoneSidebar',
    'zoneSidebar2',
    'zoneInline',
    'popunderScriptUrl',
    'nativeScriptUrl',
    'nativeContainerId',
    'invokeHost',
  ] as const;

  const data: Partial<AdSettingsPayload> = {};
  for (const key of fields) {
    if (!(key in body)) continue;
    const parsed = trimOrNull(body[key]);
    if (parsed === undefined) {
      return { data: {}, error: `${key} must be a string or null` };
    }
    data[key] = parsed;
  }
  return { data };
}
