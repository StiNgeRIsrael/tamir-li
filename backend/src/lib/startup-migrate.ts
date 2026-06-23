import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const LOG_PREFIX = '[startup-migrate]';

export type StartupMigrateState = 'idle' | 'running' | 'success' | 'failed' | 'skipped';

export type StartupMigrateStatus = {
  state: StartupMigrateState;
  error?: string;
  prismaCode?: string;
  /** Failed migration name from P3009 output (e.g. 20260624120000_ad_settings). */
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

/** Pull Prisma P#### codes from CLI output without logging connection strings. */
function extractPrismaErrorCode(output: string): string | undefined {
  return output.match(/\bP\d{4}\b/)?.[0];
}

/** Migration folder name from P3009 CLI output: `20260624120000_ad_settings` failed at … */
function extractFailedMigrationName(output: string): string | undefined {
  return output.match(/`(\d{14}_[^`]+)`\s+failed/)?.[1];
}

/** Pre-launch safe auto-resolve: ad_settings migrations on a disposable DB. */
function isSafeAutoResolveMigration(name: string): boolean {
  return name.includes('ad_settings');
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
      `${LOG_PREFIX} ${error} — app continues; check MySQL reachability and Plesk logs`
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
  const error = `Migration failed (exit ${exitCode})${prismaCode ? ` — Prisma ${prismaCode}` : ''}`;

  console.error(
    `${LOG_PREFIX} ${error} — app will start anyway; check DATABASE_URL, MySQL grants, and Plesk logs`
  );
  if (cliOutput) {
    console.error(`${LOG_PREFIX}`, cliOutput);
  }
  if (result.error) {
    console.error(`${LOG_PREFIX}`, result.error.message);
  }

  return { ok: false, error, prismaCode, failedMigration: extractFailedMigrationName(cliOutput), cliOutput };
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

/** P3009 on ad_settings: clear failed record and redeploy (safe on pre-launch disposable DB). */
function tryRecoverFromP3009(
  root: string,
  schemaPath: string,
  invoke: PrismaInvoke,
  failure: Extract<MigrateResult, { ok: false }>,
): MigrateResult {
  const migrationName = failure.failedMigration ?? extractFailedMigrationName(failure.cliOutput ?? '');
  if (failure.prismaCode !== 'P3009' || !migrationName || !isSafeAutoResolveMigration(migrationName)) {
    return failure;
  }

  console.warn(
    `${LOG_PREFIX} P3009 on ${migrationName} — auto-resolving as rolled-back (pre-launch ad_settings recovery)`,
  );

  const resolveResult = runMigrateResolve(root, schemaPath, invoke, migrationName, 'rolled-back');
  if (!resolveResult.ok) {
    return resolveResult;
  }

  return runMigrateDeploy(root, schemaPath, invoke);
}

function runMigrateWithRetry(root: string, schemaPath: string, invoke: PrismaInvoke): MigrateResult {
  const maxAttempts = 2;
  let lastFailure: MigrateResult = { ok: false, error: 'Migration not attempted' };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    setMigrateStatus({ state: 'running', attempts: attempt });
    if (attempt > 1) {
      console.warn(`${LOG_PREFIX} Retrying migrate deploy (attempt ${attempt}/${maxAttempts})...`);
    }

    const result = runMigrateDeploy(root, schemaPath, invoke);
    if (result.ok) {
      setMigrateStatus({
        state: 'success',
        attempts: attempt,
        finishedAt: new Date().toISOString(),
      });
      return result;
    }

    const recovered =
      result.prismaCode === 'P3009' ? tryRecoverFromP3009(root, schemaPath, invoke, result) : result;
    if (recovered.ok) {
      setMigrateStatus({
        state: 'success',
        attempts: attempt,
        finishedAt: new Date().toISOString(),
      });
      return recovered;
    }

    lastFailure = recovered;
  }

  const failedMigration = lastFailure.ok ? undefined : lastFailure.failedMigration;
  const errorDetail =
    !lastFailure.ok && lastFailure.prismaCode === 'P3009' && failedMigration
      ? `${lastFailure.error} — failed migration: ${failedMigration}`
      : lastFailure.ok
        ? undefined
        : lastFailure.error;

  setMigrateStatus({
    state: 'failed',
    error: errorDetail,
    prismaCode: lastFailure.ok ? undefined : lastFailure.prismaCode,
    failedMigration,
    attempts: maxAttempts,
    finishedAt: new Date().toISOString(),
  });
  console.error(
    `${LOG_PREFIX} All ${maxAttempts} migrate attempts failed — probe GET /health → migrations.state`
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
