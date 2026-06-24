import { spawn } from 'child_process';
import fs from 'fs';

import { JobStatus } from '@prisma/client';

import { prisma } from './prisma';

import { cleanupExpiredConversionJobs, recoverInterruptedJobs } from './conversion-cleanup';

import { ensureJobDir, outputFilePath } from './conversion-storage';

const POLL_FAST_MS = 5000;
const POLL_IDLE_MS = 30_000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
/** Cap jobs per tick so ffmpeg-heavy bursts do not starve the event loop. */
const MAX_JOBS_PER_TICK = 10;

const AUDIO_TOOL_ID = 'audio-converter';

let timer: ReturnType<typeof setTimeout> | null = null;
let pollMs = POLL_FAST_MS;
let processing = false;
let lastCleanupAt = 0;
let ffmpegAvailable: boolean | null = null;

function getFfmpegPath(): string {
  const configured = process.env.FFMPEG_PATH?.trim();
  return configured || 'ffmpeg';
}

function isAudioConverterJob(toolId: string): boolean {
  return toolId === AUDIO_TOOL_ID;
}

function ffmpegCodecArgs(toFormat: string): string[] {
  switch (toFormat.toUpperCase()) {
    case 'MP3':
      return ['-c:a', 'libmp3lame', '-q:a', '2'];
    case 'WAV':
      return ['-c:a', 'pcm_s16le'];
    case 'AAC':
      return ['-c:a', 'aac', '-b:a', '192k', '-f', 'adts'];
    case 'OGG':
      return ['-c:a', 'libvorbis', '-q:a', '4'];
    case 'FLAC':
      return ['-c:a', 'flac'];
    default:
      return [];
  }
}

async function checkFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;

  const ffmpeg = getFfmpegPath();
  ffmpegAvailable = await new Promise<boolean>((resolve) => {
    const proc = spawn(ffmpeg, ['-version'], { stdio: 'ignore' });
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });

  if (!ffmpegAvailable) {
    console.warn(
      `[conversion-worker] ffmpeg not found (${ffmpeg}); audio conversions will use stub passthrough`
    );
  }

  return ffmpegAvailable;
}

function runFfmpeg(
  inputPath: string,
  outputPath: string,
  toFormat: string
): Promise<void> {
  const ffmpeg = getFfmpegPath();
  const args = ['-y', '-i', inputPath, ...ffmpegCodecArgs(toFormat), outputPath];

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

type AudioConvertResult = 'ok' | 'no_ffmpeg' | 'failed';

async function convertAudioJob(
  inputPath: string | null,
  outputPath: string,
  toFormat: string
): Promise<AudioConvertResult> {
  if (!(await checkFfmpegAvailable())) {
    return 'no_ffmpeg';
  }

  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error('[conversion-worker] audio job missing input file');
    return 'failed';
  }

  try {
    await runFfmpeg(inputPath, outputPath, toFormat);
    if (!fs.existsSync(outputPath)) {
      return 'failed';
    }
    return 'ok';
  } catch (e) {
    console.error('[conversion-worker] ffmpeg conversion failed:', e);
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

/** Returns true when a job was picked up (queue may have more). */
async function processNextJob(): Promise<boolean> {
  if (processing) return false;
  processing = true;
  let activeJobId: string | null = null;

  try {
    const job = await prisma.conversionJob.findFirst({
      where: { status: JobStatus.PENDING },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    if (!job) return false;
    activeJobId = job.id;

    await prisma.conversionJob.update({
      where: { id: job.id },
      data: { status: JobStatus.PROCESSING },
    });

    const outPath = outputFilePath(job.id, job.toFormat);
    ensureJobDir(job.id);

    if (isAudioConverterJob(job.toolId)) {
      const result = await convertAudioJob(job.inputStoragePath, outPath, job.toFormat);

      if (result === 'ok') {
        await prisma.conversionJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.COMPLETED,
            completedAt: new Date(),
            errorMessage: null,
            outputStoragePath: outPath,
          },
        });
        return true;
      }

      if (result === 'no_ffmpeg') {
        runStubConversion(
          job.id,
          job.inputStoragePath,
          outPath,
          job.fromFormat,
          job.toFormat
        );
        await prisma.conversionJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.COMPLETED,
            completedAt: new Date(),
            errorMessage: null,
            outputStoragePath: outPath,
          },
        });
        return true;
      }

      await prisma.conversionJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: 'Audio conversion failed',
          outputStoragePath: null,
        },
      });
      return true;
    }

    // Stub for other tools until FFmpeg/ImageMagick handlers ship.
    runStubConversion(
      job.id,
      job.inputStoragePath,
      outPath,
      job.fromFormat,
      job.toFormat
    );

    await prisma.conversionJob.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        errorMessage: null,
        outputStoragePath: outPath,
      },
    });
    return true;
  } catch (e) {
    console.error('[conversion-worker] unexpected job error:', e);
    if (activeJobId) {
      await prisma.conversionJob
        .update({
          where: { id: activeJobId },
          data: {
            status: JobStatus.FAILED,
            completedAt: new Date(),
            errorMessage: 'Unexpected worker error',
          },
        })
        .catch((err: unknown) => console.error('[conversion-worker] failed to mark job FAILED:', err));
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
