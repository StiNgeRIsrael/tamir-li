/**
 * Apply Prisma migrations via CLI (manual SSH or CI run_server_setup with exported DATABASE_URL).
 *
 * Plesk "Run Node.js commands" and CI SSH do NOT inherit Custom environment variables.
 * Production migrations run on app restart via startup-migrate.ts (uses Plesk runtime env).
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, 'backend', '.env');

const PLESK_HINT = `
DATABASE_URL is not available in this shell (Plesk "Run Node.js commands" never inherits Custom environment variables).

Do NOT use "run plesk:db" in Plesk UI — this failure is expected and normal.

Instead:
  1. Set DATABASE_URL in Plesk → Node.js → Custom environment variables (if not already).
  2. Restart the Node.js app — migrations run automatically at boot via startup-migrate (uses process.env.DATABASE_URL).

First deploy / lockfile change: GitHub Actions workflow_dispatch with run_server_setup=true
(requires GitHub secret DATABASE_URL), or SSH with export DATABASE_URL then npm run setup.
`.trim();

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

if (!process.env.DATABASE_URL?.trim()) {
  console.error(PLESK_HINT);
  process.exit(1);
}

const prismaBin =
  process.platform === 'win32'
    ? resolve(root, 'node_modules', '.bin', 'prisma.cmd')
    : resolve(root, 'node_modules', '.bin', 'prisma');

const result = spawnSync(
  prismaBin,
  ['migrate', 'deploy', '--schema=backend/prisma/schema.prisma'],
  { cwd: root, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' }
);

process.exit(result.status ?? 1);
