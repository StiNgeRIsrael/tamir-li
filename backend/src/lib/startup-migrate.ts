import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const LOG_PREFIX = '[startup-migrate]';

function resolvePrismaCli(root: string): string | null {
  const binName = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
  const candidates = [
    path.join(root, 'node_modules', '.bin', binName),
    path.join(root, 'backend', 'node_modules', '.bin', binName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Apply pending Prisma migrations before the HTTP server starts.
 *
 * On Plesk, Custom environment variables (including DATABASE_URL) are injected
 * into the running Node process but not into "Run Node.js commands". Running
 * migrate deploy here uses the same env the app already has at runtime.
 */
export function runStartupMigrations(): void {
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

  const prismaCli = resolvePrismaCli(root);
  if (!prismaCli) {
    console.error(
      `${LOG_PREFIX} Prisma CLI not found under ${root} — skipping migrations (run npm run setup once)`
    );
    return;
  }

  console.log(`${LOG_PREFIX} Running prisma migrate deploy...`);

  const result = spawnSync(
    prismaCli,
    ['migrate', 'deploy', `--schema=${schemaPath}`],
    {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  if (result.status === 0) {
    console.log(`${LOG_PREFIX} Migrations applied successfully`);
    return;
  }

  const exitCode = result.status ?? 1;
  console.error(
    `${LOG_PREFIX} Migration failed (exit ${exitCode}) — app will start anyway; check DATABASE_URL, MySQL grants, and Plesk logs`
  );
  if (result.error) {
    console.error(`${LOG_PREFIX}`, result.error.message);
  }
}
