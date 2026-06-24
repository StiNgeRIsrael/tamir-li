import { Prisma, type AiSettings } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import type { Response } from 'express';
import { sanitizeDbError } from './db-health';
import { prisma } from './prisma';

export const AI_SETTINGS_ID = 'default';
export const DEFAULT_AI_MODEL = 'imagen-3.0-generate-002';

export type AiSettingsAdminPayload = {
  googleApiKeyMasked: string | null;
  hasGoogleApiKey: boolean;
  modelName: string;
  enabled: boolean;
};

export function maskApiKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 4) return '****';
  return `****${key.slice(-4)}`;
}

export function serializeAiSettingsAdmin(row: AiSettings): AiSettingsAdminPayload {
  return {
    googleApiKeyMasked: maskApiKey(row.googleApiKey),
    hasGoogleApiKey: Boolean(row.googleApiKey),
    modelName: row.modelName,
    enabled: row.enabled,
  };
}

export const AI_SETTINGS_TABLE_MISSING_MESSAGE =
  'AiSettings table missing — restart the app to run migration 20260624150000_ai_settings_and_generation_log (requires DATABASE_URL in Plesk env).';

export function isAiSettingsTableMissing(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const record = err as { code?: string; meta?: { table?: string } };
    if (record.code === 'P2021') {
      const table = record.meta?.table;
      return !table || table.includes('AiSettings');
    }
  }
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2021') {
    const table = (err.meta as { table?: string } | undefined)?.table;
    return !table || table.includes('AiSettings');
  }
  if (err instanceof Error) {
    const lower = err.message.toLowerCase();
    return lower.includes('aisettings') && lower.includes('does not exist');
  }
  return false;
}

export function respondAiSettingsDbError(
  res: Response,
  err: unknown,
  logLabel: string,
  action: 'load' | 'save' = 'load',
): void {
  console.error(`[${logLabel}]`, err);
  if (isAiSettingsTableMissing(err)) {
    res.status(503).json({
      error: 'MIGRATION_PENDING',
      message: AI_SETTINGS_TABLE_MISSING_MESSAGE,
    });
    return;
  }
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: aiSettingsErrorMessage(err, action),
  });
}

export async function pingAiSettingsTable(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.aiSettings.findUnique({
      where: { id: AI_SETTINGS_ID },
      select: { id: true },
    });
    return { ok: true };
  } catch (err) {
    if (isAiSettingsTableMissing(err)) {
      return { ok: false, error: 'P2021' };
    }
    return { ok: false, error: sanitizeDbError(err) };
  }
}

const AI_SETTINGS_CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`AiSettings\` (
    \`id\` VARCHAR(191) NOT NULL DEFAULT 'default',
    \`googleApiKey\` VARCHAR(256) NULL,
    \`modelName\` VARCHAR(128) NOT NULL DEFAULT 'imagen-3.0-generate-002',
    \`enabled\` BOOLEAN NOT NULL DEFAULT false,
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`.trim();

export async function ensureAiSettingsTableFromSql(): Promise<void> {
  await prisma.$executeRawUnsafe(AI_SETTINGS_CREATE_TABLE_SQL);
}

export async function ensureAiSettings(): Promise<AiSettings> {
  try {
    return await prisma.aiSettings.upsert({
      where: { id: AI_SETTINGS_ID },
      create: { id: AI_SETTINGS_ID },
      update: {},
    });
  } catch (err) {
    if (!isAiSettingsTableMissing(err)) {
      throw err;
    }
    console.warn('[ai-settings] AiSettings table missing — applying emergency CREATE TABLE IF NOT EXISTS');
    await ensureAiSettingsTableFromSql();
    return prisma.aiSettings.upsert({
      where: { id: AI_SETTINGS_ID },
      create: { id: AI_SETTINGS_ID },
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

export type AiSettingsPatch = {
  googleApiKey?: string | null;
  modelName?: string;
  enabled?: boolean;
};

export function parseAiSettingsPatch(body: Record<string, unknown>): {
  data: AiSettingsPatch;
  error?: string;
} {
  const data: AiSettingsPatch = {};

  if ('googleApiKey' in body) {
    const parsed = trimOrNull(body.googleApiKey);
    if (parsed === undefined) {
      return { data: {}, error: 'googleApiKey must be a string or null' };
    }
    data.googleApiKey = parsed;
  }

  if ('modelName' in body) {
    if (typeof body.modelName !== 'string' || !body.modelName.trim()) {
      return { data: {}, error: 'modelName must be a non-empty string' };
    }
    data.modelName = body.modelName.trim();
  }

  if ('enabled' in body) {
    if (typeof body.enabled !== 'boolean') {
      return { data: {}, error: 'enabled must be a boolean' };
    }
    data.enabled = body.enabled;
  }

  return { data };
}

export function aiSettingsErrorMessage(e: unknown, action: 'load' | 'save'): string {
  if (isAiSettingsTableMissing(e)) {
    return AI_SETTINGS_TABLE_MISSING_MESSAGE;
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2000') {
    return 'One or more values exceed the maximum length.';
  }
  return action === 'load' ? 'Could not load AI settings' : 'Could not update AI settings';
}

export async function saveAiSettings(data: AiSettingsPatch): Promise<AiSettings> {
  try {
    return await prisma.aiSettings.upsert({
      where: { id: AI_SETTINGS_ID },
      create: {
        id: AI_SETTINGS_ID,
        googleApiKey: data.googleApiKey ?? null,
        modelName: data.modelName ?? DEFAULT_AI_MODEL,
        enabled: data.enabled ?? false,
      },
      update: data,
    });
  } catch (err) {
    if (!isAiSettingsTableMissing(err)) {
      throw err;
    }
    console.warn('[ai-settings] AiSettings table missing on save — applying emergency CREATE TABLE IF NOT EXISTS');
    await ensureAiSettingsTableFromSql();
    return prisma.aiSettings.upsert({
      where: { id: AI_SETTINGS_ID },
      create: {
        id: AI_SETTINGS_ID,
        googleApiKey: data.googleApiKey ?? null,
        modelName: data.modelName ?? DEFAULT_AI_MODEL,
        enabled: data.enabled ?? false,
      },
      update: data,
    });
  }
}
