import { prisma } from './prisma';

const DB_PING_TIMEOUT_MS = 2000;

/** Returns true when MySQL/Prisma responds to a lightweight ping. */
export async function pingDatabase(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB ping timeout')), DB_PING_TIMEOUT_MS)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}
