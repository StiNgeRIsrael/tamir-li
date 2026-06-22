import { spawn } from 'child_process';
import fs from 'fs';

import { JobStatus } from '@prisma/client';

import { prisma } from './prisma';

import { cleanupExpiredConversionJobs } from './conversion-cleanup';

import { ensureJobDir, outputFilePath } from './conversion-storage';

const POLL_INTERVAL_MS = 5000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;

const AUDIO_TOOL_ID = 'audio-converter';

let timer: ReturnType<typeof setInterval> | null = null;
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

async function processNextJob(): Promise<void> {
  if (processing) return;
  processing = true;

  try {
    const job = await prisma.conversionJob.findFirst({
      where: { status: JobStatus.PENDING },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    if (!job) return;

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
        return;
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
        return;
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
      return;
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
  } catch (e) {
    console.error('[conversion-worker] unexpected job error:', e);
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

function workerTick(): void {
  maybeRunCleanup();
  void processNextJob().catch((e: unknown) => console.error('[conversion-worker]', e));
}

export function startConversionWorker(): void {
  if (timer) return;
  timer = setInterval(workerTick, POLL_INTERVAL_MS);
  workerTick();
  console.log('[conversion-worker] In-process worker started');
}

export function stopConversionWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
