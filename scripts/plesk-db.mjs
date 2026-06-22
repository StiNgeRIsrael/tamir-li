/**
 * Apply Prisma migrations on Plesk.
 *
 * Plesk "Run Node.js commands" does not inherit Custom environment variables
 * (those apply to the running app only). Load backend/.env when present so
 * DATABASE_URL is available for `prisma migrate deploy`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, 'backend', '.env');

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
