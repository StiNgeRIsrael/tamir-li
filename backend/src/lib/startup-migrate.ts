import { spawnSync, type SpawnSyncReturns } from 'child_process';

import { existsSync } from 'fs';

import path from 'path';

import {

  extractFailedMigrationName,

  extractPrismaErrorCode,

  isAlreadyExistsError,

  truncateCliOutput,

} from './migration-cli-parse';

import { prisma } from './prisma';



const LOG_PREFIX = '[startup-migrate]';

const MAX_MIGRATE_RESOLVE_CYCLES = 3;

/** Init migration — disposable DB may have User table from db push without _prisma_migrations row. */

export const INIT_MIGRATION_NAME = '20260101000000_init';



/** Tables that imply a migration was applied outside Prisma migrate. */

export const PROACTIVE_MIGRATION_TABLES: ReadonlyArray<{ migration: string; table: string }> = [

  { migration: INIT_MIGRATION_NAME, table: 'User' },

  { migration: '20260624120000_ad_settings', table: 'AdSettings' },
  { migration: '20260624150000_ai_settings_and_generation_log', table: 'AiSettings' },

];



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



type SpawnSyncFn = typeof spawnSync;



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



function parseSpawnFailure(

  result: SpawnSyncReturns<string>,

  label: string,

): Extract<MigrateResult, { ok: false }> {

  const exitCode = result.status ?? 1;

  const cliOutput = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();

  const prismaCode = cliOutput ? extractPrismaErrorCode(cliOutput) : undefined;

  const failedMigration = cliOutput ? extractFailedMigrationName(cliOutput) : undefined;

  const error = `${label} failed (exit ${exitCode})${prismaCode ? ` — Prisma ${prismaCode}` : ''}`;

  return { ok: false, error, prismaCode, failedMigration, cliOutput };

}



function runMigrateDeploy(

  root: string,

  schemaPath: string,

  invoke: PrismaInvoke,

  spawnSyncFn: SpawnSyncFn = spawnSync,

): MigrateResult {

  const migrateArgs = ['migrate', 'deploy', `--schema=${schemaPath}`];

  const args = invoke.args.length > 0 ? [...invoke.args, ...migrateArgs] : migrateArgs;



  console.log(`${LOG_PREFIX} Running prisma migrate deploy...`);



  const result = spawnSyncFn(invoke.command, args, {

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



  const failure = parseSpawnFailure(result, 'Migration');

  console.error(

    `${LOG_PREFIX} ${failure.error} — app will start anyway; check DATABASE_URL, MySQL grants, and Plesk logs`,

  );

  if (failure.cliOutput) {

    console.error(`${LOG_PREFIX}`, failure.cliOutput);

  }

  if (result.error) {

    console.error(`${LOG_PREFIX}`, result.error.message);

  }



  return failure;

}



function runMigrateResolve(

  root: string,

  schemaPath: string,

  invoke: PrismaInvoke,

  migrationName: string,

  action: 'rolled-back' | 'applied',

  spawnSyncFn: SpawnSyncFn = spawnSync,

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



  const result = spawnSyncFn(invoke.command, args, {

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



  const failure = parseSpawnFailure(result, 'Resolve');

  console.error(`${LOG_PREFIX} ${failure.error}`);

  if (failure.cliOutput) {

    console.error(`${LOG_PREFIX}`, failure.cliOutput);

  }



  return failure;

}



/** Whether P3018 should auto-resolve via migrate resolve --applied. */

export function getRecoverableP3018Migration(failure: {

  prismaCode?: string;

  cliOutput?: string;

  failedMigration?: string;

}): string | undefined {

  if (failure.prismaCode !== 'P3018') {

    return undefined;

  }

  const migrationName =

    failure.failedMigration ?? extractFailedMigrationName(failure.cliOutput ?? '');

  if (!migrationName) {

    return undefined;

  }

  const cliOutput = failure.cliOutput ?? '';

  if (isAlreadyExistsError(cliOutput)) {

    return migrationName;

  }

  // P3018 with a named migration — still attempt resolve --applied (prod stderr may omit 1050 text).

  return migrationName;

}



/** P3009: init + existing User → applied; otherwise rolled-back then redeploy. */

export function getP3009ResolveAction(

  migrationName: string,

  cliOutput: string,

): 'rolled-back' | 'applied' {

  if (migrationName !== INIT_MIGRATION_NAME) {

    return 'rolled-back';

  }

  if (isAlreadyExistsError(cliOutput) || /\bUser\b/i.test(cliOutput)) {

    return 'applied';

  }

  return 'rolled-back';

}



/** P3009: clear failed record and redeploy (safe on pre-launch disposable DB). */

function tryRecoverFromP3009(

  root: string,

  schemaPath: string,

  invoke: PrismaInvoke,

  failure: Extract<MigrateResult, { ok: false }>,

  spawnSyncFn: SpawnSyncFn,

): MigrateResult {

  const migrationName =

    failure.failedMigration ?? extractFailedMigrationName(failure.cliOutput ?? '');

  if (failure.prismaCode !== 'P3009' || !migrationName) {

    return failure;

  }



  const cliOutput = failure.cliOutput ?? '';

  const action = getP3009ResolveAction(migrationName, cliOutput);



  console.warn(

    `${LOG_PREFIX} P3009 on ${migrationName} — auto-resolving as ${action} (pre-launch disposable DB recovery)`,

  );



  const resolveResult = runMigrateResolve(

    root,

    schemaPath,

    invoke,

    migrationName,

    action,

    spawnSyncFn,

  );

  if (!resolveResult.ok) {

    return {

      ...resolveResult,

      failedMigration: migrationName,

    };

  }



  return runMigrateDeploy(root, schemaPath, invoke, spawnSyncFn);

}



/** P3018: mark migration applied when tables already exist, then redeploy (pre-launch disposable DB). */

function tryRecoverFromP3018(

  root: string,

  schemaPath: string,

  invoke: PrismaInvoke,

  failure: Extract<MigrateResult, { ok: false }>,

  spawnSyncFn: SpawnSyncFn,

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

      : `${LOG_PREFIX} P3018 on ${migrationName} — auto-resolving as applied (pre-launch disposable DB recovery)`,

  );



  const resolveResult = runMigrateResolve(

    root,

    schemaPath,

    invoke,

    migrationName,

    'applied',

    spawnSyncFn,

  );

  if (!resolveResult.ok) {

    return {

      ...resolveResult,

      failedMigration: migrationName,

    };

  }



  return runMigrateDeploy(root, schemaPath, invoke, spawnSyncFn);

}



async function tableExists(tableName: string): Promise<boolean> {

  const rows = await prisma.$queryRaw<Array<{ table_count: bigint }>>`

    SELECT COUNT(*) AS table_count

    FROM information_schema.tables

    WHERE table_schema = DATABASE() AND table_name = ${tableName}

  `;

  return Number(rows[0]?.table_count ?? 0) > 0;

}



async function migrationNeedsAppliedResolve(migrationName: string): Promise<boolean> {

  const rows = await prisma.$queryRaw<Array<{ finished_at: Date | null }>>`

    SELECT finished_at FROM _prisma_migrations WHERE migration_name = ${migrationName} LIMIT 1

  `;

  if (rows.length === 0) {

    return true;

  }

  return rows[0].finished_at == null;

}



/** Before migrate deploy: mark migrations applied when their tables already exist. */

export async function proactivelyResolveExistingTables(

  root: string,

  schemaPath: string,

  invoke: PrismaInvoke,

  spawnSyncFn: SpawnSyncFn = spawnSync,

): Promise<void> {

  for (const { migration, table } of PROACTIVE_MIGRATION_TABLES) {

    try {

      const exists = await tableExists(table);

      if (!exists) {

        continue;

      }

      const needsResolve = await migrationNeedsAppliedResolve(migration);

      if (!needsResolve) {

        continue;

      }

      console.warn(

        `${LOG_PREFIX} Table ${table} exists but ${migration} is not applied — proactive resolve --applied`,

      );

      const resolveResult = runMigrateResolve(

        root,

        schemaPath,

        invoke,

        migration,

        'applied',

        spawnSyncFn,

      );

      if (!resolveResult.ok) {

        console.error(

          `${LOG_PREFIX} Proactive resolve for ${migration} failed — migrate deploy will retry recovery`,

        );

      }

    } catch (err) {

      console.warn(`${LOG_PREFIX} Proactive check for ${migration}/${table} skipped:`, err);

    }

  }

}



export function runMigrateWithRetry(

  root: string,

  schemaPath: string,

  invoke: PrismaInvoke,

  spawnSyncFn: SpawnSyncFn = spawnSync,

): MigrateResult {

  let lastFailure: MigrateResult = { ok: false, error: 'Migration not attempted' };



  for (let cycle = 1; cycle <= MAX_MIGRATE_RESOLVE_CYCLES; cycle++) {

    setMigrateStatus({ state: 'running', attempts: cycle });

    if (cycle > 1) {

      console.warn(

        `${LOG_PREFIX} Retrying migrate deploy after resolve (cycle ${cycle}/${MAX_MIGRATE_RESOLVE_CYCLES})...`,

      );

    }



    const result = runMigrateDeploy(root, schemaPath, invoke, spawnSyncFn);

    if (result.ok) {

      setMigrateStatus({

        state: 'success',

        attempts: cycle,

        finishedAt: new Date().toISOString(),

      });

      return result;

    }



    if (result.prismaCode === 'P3009') {

      const recovered = tryRecoverFromP3009(root, schemaPath, invoke, result, spawnSyncFn);

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

      const recovered = tryRecoverFromP3018(root, schemaPath, invoke, result, spawnSyncFn);

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

export async function runStartupMigrations(): Promise<void> {

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



    await proactivelyResolveExistingTables(root, schemaPath, invoke);

    runMigrateWithRetry(root, schemaPath, invoke);

  } catch (err) {

    const error = err instanceof Error ? err.message : String(err);

    console.error(`${LOG_PREFIX} Unexpected error — app continues:`, err);

    setMigrateStatus({ state: 'failed', error, finishedAt: new Date().toISOString() });

  }

}


