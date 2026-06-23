import fs from 'fs';
import { JobStatus } from '@prisma/client';
import { prisma } from './prisma';
import { jobDir } from './conversion-storage';

const DEFAULT_TTL_HOURS = 24;
const DEFAULT_STUCK_MINUTES = 60;

export function getJobTtlHours(): number {
  const raw = process.env.CONVERSION_JOB_TTL_HOURS;
  if (!raw) return DEFAULT_TTL_HOURS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_HOURS;
}

export function getStuckProcessingMinutes(): number {
  const raw = process.env.CONVERSION_JOB_STUCK_MINUTES;
  if (!raw) return DEFAULT_STUCK_MINUTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_STUCK_MINUTES;
}

/** Requeue jobs left PROCESSING after a crash (single in-process worker). */
export async function recoverInterruptedJobs(): Promise<number> {
  const { count } = await prisma.conversionJob.updateMany({
    where: { status: JobStatus.PROCESSING },
    data: { status: JobStatus.PENDING },
  });
  if (count > 0) {
    console.log(`[conversion-cleanup] Requeued ${count} interrupted job(s)`);
  }
  return count;
}

/** Mark PROCESSING jobs stuck past the threshold as FAILED. */
export async function cleanupStuckProcessingJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - getStuckProcessingMinutes() * 60 * 1000);
  const { count } = await prisma.conversionJob.updateMany({
    where: { status: JobStatus.PROCESSING, createdAt: { lt: cutoff } },
    data: {
      status: JobStatus.FAILED,
      completedAt: new Date(),
      errorMessage: 'Conversion timed out',
    },
  });
  if (count > 0) {
    console.log(`[conversion-cleanup] Marked ${count} stuck job(s) as FAILED`);
  }
  return count;
}

/** Delete expired conversion jobs and their on-disk files. Returns count removed. */
export async function cleanupExpiredConversionJobs(): Promise<number> {
  await cleanupStuckProcessingJobs();
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
