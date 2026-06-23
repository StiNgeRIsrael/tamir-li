import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import {
  extractFailedMigrationName,
  extractPrismaErrorCode,
  isAlreadyExistsError,
  truncateCliOutput,
} from './migration-cli-parse';

const LOG_PREFIX = '[startup-migrate]';
const MAX_MIGRATE_RESOLVE_CYCLES = 3;
/** Init migration — disposable DB may have User table from db push without _prisma_migrations row. */
export const INIT_MIGRATION_NAME = '20260101000000_init';

export type StartupMigrateState = 'idle' | 'running' | 'success' | 'failed' | 'skipped';

export type StartupMigrateStatus = {
  state: StartupMigrateState;
  error?: string;
  prismaCode?: string;
  /** Failed migration name from P3009/P3018 output (e.g. 20260101000000_init). */
  failedMigration?: string;
  finishedAt?: string;
  attempts?: number;
};

type PrismaInvoke = {
  command: string;
  args: string[];
};

type MigrateResult =
  | { ok: true }
  | { ok: false; error: string; prismaCode?: string; failedMigration?: string; cliOutput?: string };

let migrateStatus: StartupMigrateStatus = { state: 'idle' };

export function getStartupMigrateStatus(): StartupMigrateStatus {
  return { ...migrateStatus };
}

function setMigrateStatus(partial: StartupMigrateStatus): void {
  migrateStatus = { ...migrateStatus, ...partial };
}

/** Resolve Prisma CLI as a Node entry (avoids Linux .bin shell wrappers with shell:false). */
function resolvePrismaInvoke(root: string): PrismaInvoke | null {
  const jsCandidates = [
    path.join(root, 'backend', 'node_modules', 'prisma', 'build', 'index.js'),
    path.join(root, 'node_modules', 'prisma', 'build', 'index.js'),
  ];

  for (const jsEntry of jsCandidates) {
    if (existsSync(jsEntry)) {
      return { command: process.execPath, args: [jsEntry] };
    }
  }

  const binName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
  const binCandidates = [
    path.join(root, 'backend', 'node_modules', '.bin', binName),
    path.join(root, 'node_modules', '.bin', binName),
  ];

  for (const bin of binCandidates) {
    if (existsSync(bin)) {
      return { command: bin, args: [] };
    }
  }

  return null;
}

function formatFailureError(failure: Extract<MigrateResult, { ok: false }>): string {
  const parts = [failure.error];
  if (failure.failedMigration) {
    parts.push(`failed migration: ${failure.failedMigration}`);
  }
  if (failure.cliOutput) {
    parts.push(truncateCliOutput(failure.cliOutput));
  }
  return parts.join(' — ');
}

function runMigrateDeploy(root: string, schemaPath: string, invoke: PrismaInvoke): MigrateResult {
  const migrateArgs = ['migrate', 'deploy', `--schema=${schemaPath}`];
  const args = invoke.args.length > 0 ? [...invoke.args, ...migrateArgs] : migrateArgs;

  console.log(`${LOG_PREFIX} Running prisma migrate deploy...`);

  const result = spawnSync(invoke.command, args, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    // Windows .bin shims need shell; Linux uses node + prisma/build/index.js directly.
    shell: process.platform === 'win32' && invoke.args.length === 0,
    timeout: 120_000,
  });

  if (result.error?.name === 'AbortError') {
    const error = 'Migration timed out after 120s';
    console.error(
      `${LOG_PREFIX} ${error} — app continues; check MySQL reachability and Plesk logs`,
    );
    return { ok: false, error };
  }

  if (result.status === 0) {
    console.log(`${LOG_PREFIX} Migrations applied successfully`);
    return { ok: true };
  }

  const exitCode = result.status ?? 1;
  const cliOutput = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  const prismaCode = cliOutput ? extractPrismaErrorCode(cliOutput) : undefined;
  const failedMigration = cliOutput ? extractFailedMigrationName(cliOutput) : undefined;
  const error = `Migration failed (exit ${exitCode})${prismaCode ? ` — Prisma ${prismaCode}` : ''}`;

  console.error(
    `${LOG_PREFIX} ${error} — app will start anyway; check DATABASE_URL, MySQL grants, and Plesk logs`,
  );
  if (cliOutput) {
    console.error(`${LOG_PREFIX}`, cliOutput);
  }
  if (result.error) {
    console.error(`${LOG_PREFIX}`, result.error.message);
  }

  return { ok: false, error, prismaCode, failedMigration, cliOutput };
}

function runMigrateResolve(
  root: string,
  schemaPath: string,
  invoke: PrismaInvoke,
  migrationName: string,
  action: 'rolled-back' | 'applied',
): MigrateResult {
  const resolveArgs = [
    'migrate',
    'resolve',
    `--${action}`,
    migrationName,
    `--schema=${schemaPath}`,
  ];
  const args = invoke.args.length > 0 ? [...invoke.args, ...resolveArgs] : resolveArgs;

  console.log(`${LOG_PREFIX} Running prisma migrate resolve --${action} ${migrationName}...`);

  const result = spawnSync(invoke.command, args, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32' && invoke.args.length === 0,
    timeout: 60_000,
  });

  if (result.status === 0) {
    console.log(`${LOG_PREFIX} Resolved ${migrationName} as ${action}`);
    return { ok: true };
  }

  const exitCode = result.status ?? 1;
  const cliOutput = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  const prismaCode = cliOutput ? extractPrismaErrorCode(cliOutput) : undefined;
  const error = `Resolve failed (exit ${exitCode})${prismaCode ? ` — Prisma ${prismaCode}` : ''}`;

  console.error(`${LOG_PREFIX} ${error}`);
  if (cliOutput) {
    console.error(`${LOG_PREFIX}`, cliOutput);
  }

  return { ok: false, error, prismaCode, cliOutput };
}

/** P3009: clear failed record and redeploy (safe on pre-launch disposable DB). */
function tryRecoverFromP3009(
  root: string,
  schemaPath: string,
  invoke: PrismaInvoke,
  failure: Extract<MigrateResult, { ok: false }>,
): MigrateResult {
  const migrationName =
    failure.failedMigration ?? extractFailedMigrationName(failure.cliOutput ?? '');
  if (failure.prismaCode !== 'P3009' || !migrationName) {
    return failure;
  }

  console.warn(
    `${LOG_PREFIX} P3009 on ${migrationName} — auto-resolving as rolled-back (pre-launch disposable DB recovery)`,
  );

  const resolveResult = runMigrateResolve(root, schemaPath, invoke, migrationName, 'rolled-back');
  if (!resolveResult.ok) {
    return {
      ...resolveResult,
      failedMigration: migrationName,
    };
  }

  return runMigrateDeploy(root, schemaPath, invoke);
}

/** Whether P3018 output indicates duplicate-table recovery via resolve --applied. */
export function getRecoverableP3018Migration(failure: {
  prismaCode?: string;
  cliOutput?: string;
  failedMigration?: string;
}): string | undefined {
  if (failure.prismaCode !== 'P3018') {
    return undefined;
  }
  const cliOutput = failure.cliOutput ?? '';
  if (!isAlreadyExistsError(cliOutput)) {
    return undefined;
  }
  return failure.failedMigration ?? extractFailedMigrationName(cliOutput);
}

/** P3018: mark migration applied when tables already exist, then redeploy (pre-launch disposable DB). */
function tryRecoverFromP3018(
  root: string,
  schemaPath: string,
  invoke: PrismaInvoke,
  failure: Extract<MigrateResult, { ok: false }>,
): MigrateResult {
  const migrationName = getRecoverableP3018Migration(failure);
  if (!migrationName) {
    return failure;
  }

  const isInitWithUser =
    migrationName === INIT_MIGRATION_NAME &&
    (failure.cliOutput?.includes('User') ?? false);

  console.warn(
    isInitWithUser
      ? `${LOG_PREFIX} P3018 on ${migrationName} (User table exists) — auto-resolving as applied (pre-launch disposable DB recovery)`
      : `${LOG_PREFIX} P3018 on ${migrationName} (already exists) — auto-resolving as applied (pre-launch disposable DB recovery)`,
  );

  const resolveResult = runMigrateResolve(root, schemaPath, invoke, migrationName, 'applied');
  if (!resolveResult.ok) {
    return {
      ...resolveResult,
      failedMigration: migrationName,
    };
  }

  return runMigrateDeploy(root, schemaPath, invoke);
}

function runMigrateWithRetry(root: string, schemaPath: string, invoke: PrismaInvoke): MigrateResult {
  let lastFailure: MigrateResult = { ok: false, error: 'Migration not attempted' };

  for (let cycle = 1; cycle <= MAX_MIGRATE_RESOLVE_CYCLES; cycle++) {
    setMigrateStatus({ state: 'running', attempts: cycle });
    if (cycle > 1) {
      console.warn(
        `${LOG_PREFIX} Retrying migrate deploy after resolve (cycle ${cycle}/${MAX_MIGRATE_RESOLVE_CYCLES})...`,
      );
    }

    const result = runMigrateDeploy(root, schemaPath, invoke);
    if (result.ok) {
      setMigrateStatus({
        state: 'success',
        attempts: cycle,
        finishedAt: new Date().toISOString(),
      });
      return result;
    }

    if (result.prismaCode === 'P3009') {
      const recovered = tryRecoverFromP3009(root, schemaPath, invoke, result);
      if (recovered.ok) {
        setMigrateStatus({
          state: 'success',
          attempts: cycle,
          finishedAt: new Date().toISOString(),
        });
        return recovered;
      }
      lastFailure = recovered;
      continue;
    }

    if (result.prismaCode === 'P3018') {
      const recovered = tryRecoverFromP3018(root, schemaPath, invoke, result);
      if (recovered.ok) {
        setMigrateStatus({
          state: 'success',
          attempts: cycle,
          finishedAt: new Date().toISOString(),
        });
        return recovered;
      }
      lastFailure = recovered;
      continue;
    }

    lastFailure = result;
    break;
  }

  const failedMigration = lastFailure.ok ? undefined : lastFailure.failedMigration;
  const errorDetail = lastFailure.ok ? undefined : formatFailureError(lastFailure);

  setMigrateStatus({
    state: 'failed',
    error: errorDetail,
    prismaCode: lastFailure.ok ? undefined : lastFailure.prismaCode,
    failedMigration,
    attempts: MAX_MIGRATE_RESOLVE_CYCLES,
    finishedAt: new Date().toISOString(),
  });
  console.error(
    `${LOG_PREFIX} All ${MAX_MIGRATE_RESOLVE_CYCLES} resolve cycles exhausted — probe GET /health → migrations.state`,
  );
  return lastFailure;
}

/**
 * Apply pending Prisma migrations after the HTTP server is listening.
 *
 * On Plesk, Custom environment variables (including DATABASE_URL) are injected
 * into the running Node process but not into "Run Node.js commands". Running
 * migrate deploy here uses the same env the app already has at runtime.
 *
 * Never throws — migration failures must not crash the Node process (Passenger).
 */
export function runStartupMigrations(): void {
  try {
    if (process.env.NODE_ENV !== 'production') {
      setMigrateStatus({ state: 'skipped', error: 'Not production' });
      return;
    }

    if (!process.env.DATABASE_URL) {
      const error = 'DATABASE_URL not set';
      console.warn(`${LOG_PREFIX} ${error} — skipping migrations`);
      setMigrateStatus({ state: 'skipped', error, finishedAt: new Date().toISOString() });
      return;
    }

    const root = process.cwd();
    const schemaPath = path.join(root, 'backend', 'prisma', 'schema.prisma');

    console.log(`${LOG_PREFIX} cwd=${root} schema=${schemaPath}`);

    if (!existsSync(schemaPath)) {
      const error = `Schema not found at ${schemaPath}`;
      console.warn(`${LOG_PREFIX} ${error} — skipping migrations`);
      setMigrateStatus({ state: 'skipped', error, finishedAt: new Date().toISOString() });
      return;
    }

    const invoke = resolvePrismaInvoke(root);
    if (!invoke) {
      const error = 'Prisma CLI not found (run npm run plesk:backend-install once)';
      console.error(`${LOG_PREFIX} ${error} — skipping migrations`);
      setMigrateStatus({ state: 'failed', error, finishedAt: new Date().toISOString() });
      return;
    }

    runMigrateWithRetry(root, schemaPath, invoke);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`${LOG_PREFIX} Unexpected error — app continues:`, err);
    setMigrateStatus({ state: 'failed', error, finishedAt: new Date().toISOString() });
  }
}
