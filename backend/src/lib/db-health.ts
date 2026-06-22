import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';
import { prisma } from './prisma';

const DB_PING_TIMEOUT_MS = 2000;

export type DbPingResult = { ok: true } | { ok: false; error: string };

const SYSTEM_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ECONNRESET',
  'EAI_AGAIN',
]);

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Walk Error.cause chains (Node 16+) and nested cause objects. */
function collectErrorChain(err: unknown): unknown[] {
  const chain: unknown[] = [];
  const seen = new Set<unknown>();
  let current: unknown = err;

  while (current != null && !seen.has(current)) {
    seen.add(current);
    chain.push(current);

    if (current instanceof Error) {
      const withCause = current as Error & { cause?: unknown };
      if (withCause.cause != null) {
        current = withCause.cause;
        continue;
      }
    }

    if (typeof current === 'object' && current !== null && 'cause' in current) {
      const next = (current as { cause?: unknown }).cause;
      if (next != null) {
        current = next;
        continue;
      }
    }

    break;
  }

  return chain;
}

function extractPrismaCode(record: Record<string, unknown>): string | undefined {
  for (const key of ['code', 'errorCode'] as const) {
    const val = record[key];
    if (typeof val === 'string' && /^P\d{4}$/.test(val)) {
      return val;
    }
  }
  return undefined;
}

function extractSystemCode(record: Record<string, unknown>): string | undefined {
  const val = record.code;
  if (typeof val !== 'string') return undefined;
  const upper = val.toUpperCase();
  return SYSTEM_ERROR_CODES.has(upper) ? upper : undefined;
}

/** Map common Prisma/MySQL messages when no structured code is present. */
function matchMessagePatterns(message: string): string | undefined {
  const prismaMatch = message.match(/\bP\d{4}\b/);
  if (prismaMatch) return prismaMatch[0];

  const lower = message.toLowerCase();

  if (
    lower.includes('authentication failed') ||
    lower.includes('access denied for user') ||
    lower.includes('using password: yes')
  ) {
    return 'P1000';
  }

  if (
    lower.includes("can't reach database server") ||
    lower.includes('cannot reach database server') ||
    lower.includes('server has gone away')
  ) {
    return 'P1001';
  }

  if (/database [`'"]?\S+[`'"]? does not exist/.test(lower)) {
    return 'P1003';
  }

  if (
    lower.includes('invalid connection string') ||
    lower.includes('error validating datasource') ||
    lower.includes('the provided database string is invalid')
  ) {
    return 'INVALID_URL';
  }

  if (
    lower.includes('connection timed out') ||
    lower.includes('connect timeout') ||
    lower.includes('timed out')
  ) {
    return 'ETIMEDOUT';
  }

  if (lower.includes('connection refused') || lower.includes('econnrefused')) {
    return 'ECONNREFUSED';
  }

  if (lower.includes('getaddrinfo') || lower.includes('enotfound')) {
    return 'ENOTFOUND';
  }

  return undefined;
}

function sanitizeSingleError(err: unknown): string | undefined {
  if (err instanceof Error && err.message === 'DB ping timeout') {
    return 'TIMEOUT';
  }

  if (err instanceof PrismaClientKnownRequestError) {
    return err.code;
  }

  if (err instanceof PrismaClientInitializationError) {
    return err.errorCode ?? matchMessagePatterns(err.message) ?? 'INIT_ERROR';
  }

  if (err instanceof PrismaClientUnknownRequestError) {
    return matchMessagePatterns(err.message) ?? 'UNKNOWN_REQUEST';
  }

  if (err instanceof PrismaClientRustPanicError) {
    return 'RUST_PANIC';
  }

  if (err && typeof err === 'object') {
    const record = err as Record<string, unknown>;
    const prismaCode = extractPrismaCode(record);
    if (prismaCode) return prismaCode;

    const systemCode = extractSystemCode(record);
    if (systemCode) return systemCode;

    const ctorName = (record.constructor as { name?: string } | undefined)?.name;
    if (
      ctorName === 'PrismaClientKnownRequestError' ||
      ctorName === 'PrismaClientInitializationError'
    ) {
      const duckCode = extractPrismaCode(record);
      if (duckCode) return duckCode;
    }
  }

  if (err instanceof Error) {
    return matchMessagePatterns(err.message);
  }

  if (typeof err === 'string') {
    return matchMessagePatterns(err);
  }

  return undefined;
}

/** Extract a safe Prisma/MySQL error code — never connection strings or passwords. */
export function sanitizeDbError(err: unknown): string {
  for (const item of collectErrorChain(err)) {
    const code = sanitizeSingleError(item);
    if (code) return code;
  }
  return 'UNKNOWN';
}

/** Returns reachability plus a sanitized error code when MySQL/Prisma ping fails. */
export async function pingDatabase(): Promise<DbPingResult> {
  if (!hasDatabaseUrl()) {
    return { ok: false, error: 'MISSING_ENV' };
  }

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
