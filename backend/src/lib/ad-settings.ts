import { Prisma, type AdSettings } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Response } from 'express';
import { sanitizeDbError } from './db-health';
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

export const AD_SETTINGS_TABLE_MISSING_MESSAGE =
  'AdSettings table missing — restart the app to run migration 20260624120000_ad_settings (requires DATABASE_URL in Plesk env).';

export function isAdSettingsTableMissing(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const record = err as { code?: string; meta?: { table?: string } };
    if (record.code === 'P2021') {
      const table = record.meta?.table;
      return !table || table.includes('AdSettings');
    }
  }
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2021') {
    const table = (err.meta as { table?: string } | undefined)?.table;
    return !table || table.includes('AdSettings');
  }
  if (err instanceof Error) {
    const lower = err.message.toLowerCase();
    return lower.includes('adsettings') && lower.includes('does not exist');
  }
  return false;
}

/** Map Prisma failures to admin-facing HTTP responses. */
export function respondAdSettingsDbError(
  res: Response,
  err: unknown,
  logLabel: string,
  action: 'load' | 'save' = 'load',
): void {
  console.error(`[${logLabel}]`, err);
  if (isAdSettingsTableMissing(err)) {
    res.status(503).json({
      error: 'MIGRATION_PENDING',
      message: AD_SETTINGS_TABLE_MISSING_MESSAGE,
    });
    return;
  }
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: adSettingsErrorMessage(err, action),
  });
}

/** Lightweight probe for /health — does not create the singleton row. */
export async function pingAdSettingsTable(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.adSettings.findUnique({
      where: { id: AD_SETTINGS_ID },
      select: { id: true },
    });
    return { ok: true };
  } catch (err) {
    if (isAdSettingsTableMissing(err)) {
      return { ok: false, error: 'P2021' };
    }
    return { ok: false, error: sanitizeDbError(err) };
  }
}

/** Emergency DDL when migrate deploy is blocked — matches 20260624120000 + updatedAt default. */
const AD_SETTINGS_CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`AdSettings\` (
    \`id\` VARCHAR(191) NOT NULL DEFAULT 'default',
    \`zoneBanner\` VARCHAR(64) NULL,
    \`zoneSidebar\` VARCHAR(64) NULL,
    \`zoneSidebar2\` VARCHAR(64) NULL,
    \`zoneInline\` VARCHAR(64) NULL,
    \`popunderScriptUrl\` VARCHAR(512) NULL,
    \`nativeScriptUrl\` VARCHAR(512) NULL,
    \`nativeContainerId\` VARCHAR(128) NULL,
    \`invokeHost\` VARCHAR(128) NULL DEFAULT 'www.highperformanceformat.com',
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`.trim();

/** Last-resort table creation when migrations are pending (P2021). */
export async function ensureAdSettingsTableFromSql(): Promise<void> {
  await prisma.$executeRawUnsafe(AD_SETTINGS_CREATE_TABLE_SQL);
}

/** Ensure the singleton row exists; safe to call on every read. */
export async function ensureAdSettings(): Promise<AdSettings> {
  try {
    return await prisma.adSettings.upsert({
      where: { id: AD_SETTINGS_ID },
      create: { id: AD_SETTINGS_ID },
      update: {},
    });
  } catch (err) {
    if (!isAdSettingsTableMissing(err)) {
      throw err;
    }
    console.warn('[ad-settings] AdSettings table missing — applying emergency CREATE TABLE IF NOT EXISTS');
    await ensureAdSettingsTableFromSql();
    return prisma.adSettings.upsert({
      where: { id: AD_SETTINGS_ID },
      create: { id: AD_SETTINGS_ID },
      update: {},
    });
  }
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

/** Map Prisma / infra failures to actionable admin messages (no secrets). */
export function adSettingsErrorMessage(e: unknown, action: 'load' | 'save'): string {
  if (isAdSettingsTableMissing(e)) {
    return AD_SETTINGS_TABLE_MISSING_MESSAGE;
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2000') {
      return 'One or more values exceed the maximum length (zone keys ≤64 chars, URLs ≤512).';
    }
  }
  if (e instanceof TypeError && String(e.message).includes('adSettings')) {
    return 'Database client is out of date. Run prisma generate and redeploy the backend.';
  }
  return action === 'load' ? 'Could not load ad settings' : 'Could not update ad settings';
}

/** Persist patch fields on the singleton row (create if missing). */
export async function saveAdSettings(data: Partial<AdSettingsPayload>): Promise<AdSettings> {
  try {
    return await prisma.adSettings.upsert({
      where: { id: AD_SETTINGS_ID },
      create: { id: AD_SETTINGS_ID, ...data },
      update: data,
    });
  } catch (err) {
    if (!isAdSettingsTableMissing(err)) {
      throw err;
    }
    console.warn('[ad-settings] AdSettings table missing on save — applying emergency CREATE TABLE IF NOT EXISTS');
    await ensureAdSettingsTableFromSql();
    return prisma.adSettings.upsert({
      where: { id: AD_SETTINGS_ID },
      create: { id: AD_SETTINGS_ID, ...data },
      update: data,
    });
  }
}
