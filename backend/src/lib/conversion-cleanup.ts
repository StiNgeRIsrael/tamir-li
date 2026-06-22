import fs from 'fs';
import { JobStatus } from '@prisma/client';
import { prisma } from './prisma';
import { jobDir } from './conversion-storage';

const DEFAULT_TTL_HOURS = 24;

export function getJobTtlHours(): number {
  const raw = process.env.CONVERSION_JOB_TTL_HOURS;
  if (!raw) return DEFAULT_TTL_HOURS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_HOURS;
}

/** Delete expired conversion jobs and their on-disk files. Returns count removed. */
export async function cleanupExpiredConversionJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - getJobTtlHours() * 60 * 60 * 1000);

  const expired = await prisma.conversionJob.findMany({
    where: {
      OR: [
        {
          status: { in: [JobStatus.COMPLETED, JobStatus.FAILED] },
          OR: [{ completedAt: { lt: cutoff } }, { completedAt: null, createdAt: { lt: cutoff } }],
        },
        {
          status: JobStatus.PENDING,
          createdAt: { lt: cutoff },
        },
      ],
    },
    select: { id: true },
  });

  if (expired.length === 0) return 0;

  for (const { id } of expired) {
    const dir = jobDir(id);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  const { count } = await prisma.conversionJob.deleteMany({
    where: { id: { in: expired.map((j) => j.id) } },
  });

  if (count > 0) {
    console.log(`[conversion-cleanup] Purged ${count} expired job(s)`);
  }

  return count;
}
