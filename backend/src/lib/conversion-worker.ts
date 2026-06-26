import fs from 'fs';

import { JobStatus } from '@prisma/client';

import { prisma } from './prisma';

import { cleanupExpiredConversionJobs, recoverInterruptedJobs } from './conversion-cleanup';

import { ensureJobDir, outputFilePath } from './conversion-storage';

import { checkFfmpegAvailable, isFfmpegRequiredTool, runFfmpeg } from './ffmpeg';

const POLL_FAST_MS = 5000;
const POLL_IDLE_MS = 30_000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
/** Cap jobs per tick so ffmpeg-heavy bursts do not starve the event loop. */
const MAX_JOBS_PER_TICK = 10;

const FFMPEG_UNAVAILABLE = 'FFMPEG_UNAVAILABLE';

let timer: ReturnType<typeof setTimeout> | null = null;
let pollMs = POLL_FAST_MS;
let processing = false;
let lastCleanupAt = 0;

type FfmpegConvertResult = 'ok' | 'no_ffmpeg' | 'failed';

async function convertWithFfmpeg(
  toolId: string,
  inputPath: string | null,
  outputPath: string,
  toFormat: string
): Promise<FfmpegConvertResult> {
  if (!(await checkFfmpegAvailable())) {
    return 'no_ffmpeg';
  }

  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error(`[conversion-worker] ${toolId} job missing input file`);
    return 'failed';
  }

  try {
    await runFfmpeg(inputPath, outputPath, toolId, toFormat);
    if (!fs.existsSync(outputPath)) {
      return 'failed';
    }
    return 'ok';
  } catch (e) {
    console.error(`[conversion-worker] ${toolId} ffmpeg conversion failed:`, e);
    return 'failed';
  }
}

function runStubConversion(
  jobId: string,
  inputStoragePath: string | null,
  outPath: string,
  fromFormat: string,
  toFormat: string
): void {
  ensureJobDir(jobId);

  if (inputStoragePath && fs.existsSync(inputStoragePath)) {
    fs.copyFileSync(inputStoragePath, outPath);
  } else {
    fs.writeFileSync(
      outPath,
      `Stub conversion output for job ${jobId} (${fromFormat} → ${toFormat})\n`
    );
  }
}

/** Atomically claim the next PENDING job (safe for concurrent workers). */
async function claimNextPendingJob() {
  return prisma.$transaction(async (tx) => {
    const job = await tx.conversionJob.findFirst({
      where: { status: JobStatus.PENDING },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    if (!job) return null;

    const { count } = await tx.conversionJob.updateMany({
      where: { id: job.id, status: JobStatus.PENDING },
      data: { status: JobStatus.PROCESSING },
    });
    if (count === 0) return null;

    return job;
  });
}

async function markJobFailed(jobId: string, errorMessage: string): Promise<void> {
  await prisma.conversionJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.FAILED,
      completedAt: new Date(),
      errorMessage,
      outputStoragePath: null,
    },
  });
}

async function markJobCompleted(jobId: string, outPath: string): Promise<void> {
  await prisma.conversionJob.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      errorMessage: null,
      outputStoragePath: outPath,
    },
  });
}

/** Returns true when a job was picked up (queue may have more). */
async function processNextJob(): Promise<boolean> {
  if (processing) return false;
  processing = true;
  let activeJobId: string | null = null;

  try {
    const job = await claimNextPendingJob();
    if (!job) return false;
    activeJobId = job.id;

    const outPath = outputFilePath(job.id, job.toFormat);
    ensureJobDir(job.id);

    if (isFfmpegRequiredTool(job.toolId)) {
      const result = await convertWithFfmpeg(
        job.toolId,
        job.inputStoragePath,
        outPath,
        job.toFormat
      );

      if (result === 'ok') {
        await markJobCompleted(job.id, outPath);
        return true;
      }

      if (result === 'no_ffmpeg') {
        await markJobFailed(job.id, FFMPEG_UNAVAILABLE);
        return true;
      }

      await markJobFailed(
        job.id,
        job.toolId === 'video-converter' ? 'Video conversion failed' : 'Audio conversion failed'
      );
      return true;
    }

    // Stub for other tools until dedicated handlers ship.
    runStubConversion(
      job.id,
      job.inputStoragePath,
      outPath,
      job.fromFormat,
      job.toFormat
    );

    await markJobCompleted(job.id, outPath);
    return true;
  } catch (e) {
    console.error('[conversion-worker] unexpected job error:', e);
    if (activeJobId) {
      await markJobFailed(activeJobId, 'Unexpected worker error').catch((err: unknown) =>
        console.error('[conversion-worker] failed to mark job FAILED:', err)
      );
    }
    return false;
  } finally {
    processing = false;
  }
}

function maybeRunCleanup(): void {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  void cleanupExpiredConversionJobs().catch((e: unknown) =>
    console.error('[conversion-cleanup]', e)
  );
}

function scheduleWorkerTick(): void {
  timer = setTimeout(workerTick, pollMs);
}

/** Process up to MAX_JOBS_PER_TICK pending jobs before the next poll. */
async function drainPendingJobs(): Promise<boolean> {
  let processedAny = false;
  for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
    if (!(await processNextJob())) break;
    processedAny = true;
  }
  return processedAny;
}

function workerTick(): void {
  maybeRunCleanup();
  void drainPendingJobs()
    .then((hadJob) => {
      pollMs = hadJob ? POLL_FAST_MS : POLL_IDLE_MS;
      scheduleWorkerTick();
    })
    .catch((e: unknown) => {
      console.error('[conversion-worker]', e);
      pollMs = POLL_FAST_MS;
      scheduleWorkerTick();
    });
}

/** Wake the worker immediately after enqueue (avoids up to POLL_IDLE_MS sleep). */
export function notifyConversionWorker(): void {
  pollMs = POLL_FAST_MS;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!processing) {
    workerTick();
  }
}

export function startConversionWorker(): void {
  if (timer) return;
  pollMs = POLL_FAST_MS;
  void recoverInterruptedJobs().catch((e: unknown) =>
    console.error('[conversion-cleanup] recover on start:', e)
  );
  workerTick();
  console.log('[conversion-worker] In-process worker started');
}

export function stopConversionWorker(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export { checkFfmpegAvailable, isFfmpegRequiredTool };
