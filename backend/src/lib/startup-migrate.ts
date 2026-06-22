import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const LOG_PREFIX = '[startup-migrate]';

type PrismaInvoke = {
  command: string;
  args: string[];
};

/** Resolve Prisma CLI as a Node entry (avoids Linux .bin shell wrappers with shell:false). */
function resolvePrismaInvoke(root: string): PrismaInvoke | null {
  const jsCandidates = [
    path.join(root, 'node_modules', 'prisma', 'build', 'index.js'),
    path.join(root, 'backend', 'node_modules', 'prisma', 'build', 'index.js'),
  ];

  for (const jsEntry of jsCandidates) {
    if (existsSync(jsEntry)) {
      return { command: process.execPath, args: [jsEntry] };
    }
  }

  const binName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
  const binCandidates = [
    path.join(root, 'node_modules', '.bin', binName),
    path.join(root, 'backend', 'node_modules', '.bin', binName),
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

function runMigrateDeploy(root: string, schemaPath: string, invoke: PrismaInvoke): void {
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
    console.error(
      `${LOG_PREFIX} Migration timed out after 120s — app continues; check MySQL reachability and Plesk logs`
    );
    return;
  }

  if (result.status === 0) {
    console.log(`${LOG_PREFIX} Migrations applied successfully`);
    return;
  }

  const exitCode = result.status ?? 1;
  const cliOutput = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  const prismaCode = cliOutput ? extractPrismaErrorCode(cliOutput) : undefined;

  console.error(
    `${LOG_PREFIX} Migration failed (exit ${exitCode})${
      prismaCode ? ` — Prisma ${prismaCode}` : ''
    } — app will start anyway; check DATABASE_URL, MySQL grants, and Plesk logs`
  );
  if (cliOutput) {
    console.error(`${LOG_PREFIX}`, cliOutput);
  }
  if (result.error) {
    console.error(`${LOG_PREFIX}`, result.error.message);
  }
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
      return;
    }

    if (!process.env.DATABASE_URL) {
      console.warn(`${LOG_PREFIX} DATABASE_URL not set — skipping migrations`);
      return;
    }

    const root = process.cwd();
    const schemaPath = path.join(root, 'backend', 'prisma', 'schema.prisma');

    if (!existsSync(schemaPath)) {
      console.warn(`${LOG_PREFIX} Schema not found at ${schemaPath} — skipping migrations`);
      return;
    }

    const invoke = resolvePrismaInvoke(root);
    if (!invoke) {
      console.error(
        `${LOG_PREFIX} Prisma CLI not found under ${root} — skipping migrations (run npm run plesk:backend-install once)`
      );
      return;
    }

    runMigrateDeploy(root, schemaPath, invoke);
  } catch (err) {
    console.error(`${LOG_PREFIX} Unexpected error — app continues:`, err);
  }
}
