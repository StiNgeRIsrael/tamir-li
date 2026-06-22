import { prisma } from './prisma';

const DB_PING_TIMEOUT_MS = 2000;

export type DbPingResult = { ok: true } | { ok: false; error: string };

/** Extract a safe Prisma/MySQL error code — never connection strings or passwords. */
export function sanitizeDbError(err: unknown): string {
  if (err instanceof Error && err.message === 'DB ping timeout') {
    return 'TIMEOUT';
  }

  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    for (const key of ['code', 'errorCode'] as const) {
      const val = record[key];
      if (typeof val === 'string' && /^P\d{4}$/.test(val)) {
        return val;
      }
    }
  }

  if (err instanceof Error) {
    const prismaMatch = err.message.match(/\bP\d{4}\b/);
    if (prismaMatch) return prismaMatch[0];
  }

  return 'UNKNOWN';
}

/** Returns reachability plus a sanitized error code when MySQL/Prisma ping fails. */
export async function pingDatabase(): Promise<DbPingResult> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB ping timeout')), DB_PING_TIMEOUT_MS)
      ),
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: sanitizeDbError(err) };
  }
}
