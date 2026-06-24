import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { JobStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth.middleware';
import {
  buildUsageResponse,
  checkLimitAndRecordUsage,
  getOrCreateSessionId,
  isPremiumUser,
} from '../lib/usage-shared';
import { notifyConversionWorker } from '../lib/conversion-worker';
import {
  ensureJobDir,
  ensureStorageDir,
  formatToExtension,
  mimeFromExtension,
  outputFilePath,
} from '../lib/conversion-storage';
import {
  MAX_BATCH_FILES_FREE,
  MAX_FILE_BYTES_PREMIUM,
  maxFileBytes,
} from '../lib/freemium-limits';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

function multipartUpload(req: Request, res: Response, next: NextFunction): void {
  const ct = req.headers['content-type'] ?? '';
  if (ct.includes('multipart/form-data')) {
    upload.array('files')(req, res, next);
  } else {
    next();
  }
}

function serializeJob(job: {
  id: string;
  toolId: string;
  status: JobStatus;
  fromFormat: string;
  toFormat: string;
  priority: boolean;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  fileSizeBytes: bigint | null;
  outputStoragePath: string | null;
}) {
  return {
    id: job.id,
    toolId: job.toolId,
    status: job.status,
    fromFormat: job.fromFormat,
    toFormat: job.toFormat,
    priority: job.priority,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    fileSizeBytes: job.fileSizeBytes != null ? Number(job.fileSizeBytes) : null,
    hasOutputFile: Boolean(job.outputStoragePath && fs.existsSync(job.outputStoragePath)),
  };
}

function parseBodyFields(req: Request): {
  toolId?: string;
  fromFormat?: string;
  toFormat?: string;
  fileSizeBytes?: bigint;
} {
  const toolId = req.body?.toolId as string | undefined;
  const fromFormat = req.body?.fromFormat as string | undefined;
  const toFormat = req.body?.toFormat as string | undefined;
  const rawSize = req.body?.fileSizeBytes;
  const fileSizeBytes =
    typeof rawSize === 'number' && Number.isFinite(rawSize) && rawSize >= 0
      ? BigInt(Math.floor(rawSize))
      : typeof rawSize === 'string' && rawSize.length > 0 && Number.isFinite(Number(rawSize)) && Number(rawSize) >= 0
        ? BigInt(Math.floor(Number(rawSize)))
        : undefined;
  return { toolId, fromFormat, toFormat, fileSizeBytes };
}

async function assertJobAccess(
  job: { userId: string | null },
  req: Request,
  res: Response
): Promise<boolean> {
  if (job.userId && req.userId && job.userId !== req.userId) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Not your job' });
    return false;
  }
  return true;
}

/**
 * Enqueue a server-side conversion job (video, heavy documents).
 * Image conversions run client-side in the SPA (see src/lib/image-convert.ts).
 */
router.post('/', optionalAuth, multipartUpload, async (req: Request, res: Response) => {
  try {
    const { toolId, fromFormat, toFormat, fileSizeBytes } = parseBodyFields(req);
    if (!toolId || !fromFormat || !toFormat) {
      res.status(400).json({ error: 'INVALID_BODY', message: 'toolId, fromFormat, and toFormat are required' });
      return;
    }

    const userId = req.userId;
    const sessionId = getOrCreateSessionId(req, res);
    const priority = userId ? await isPremiumUser(userId) : false;

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const tierMaxBytes = maxFileBytes(priority);

    if (!priority && files.length > MAX_BATCH_FILES_FREE) {
      res.status(400).json({
        error: 'BATCH_LIMIT',
        message: 'Free tier allows one file per conversion batch',
      });
      return;
    }

    for (const file of files) {
      if (file.size > tierMaxBytes) {
        res.status(413).json({
          error: 'FILE_TOO_LARGE',
          message: priority
            ? `File exceeds ${MAX_FILE_BYTES_PREMIUM / (1024 * 1024)}MB premium limit`
            : 'File exceeds 50MB free tier limit',
        });
        return;
      }
    }

    if (fileSizeBytes != null && fileSizeBytes > BigInt(tierMaxBytes)) {
      res.status(413).json({
        error: 'FILE_TOO_LARGE',
        message: priority
          ? `File exceeds ${MAX_FILE_BYTES_PREMIUM / (1024 * 1024)}MB premium limit`
          : 'File exceeds 50MB free tier limit',
      });
      return;
    }

    const usageResult = await checkLimitAndRecordUsage({
      userId,
      sessionId,
      toolId,
      fromFormat,
      toFormat,
      isPremium: priority,
    });
    if (!usageResult.ok) {
      res.status(429).json({
        error: 'DAILY_LIMIT',
        message: 'Daily conversion limit reached',
        ...buildUsageResponse(usageResult.used, false),
      });
      return;
    }

    ensureStorageDir();

    const job = await prisma.conversionJob.create({
      data: {
        userId,
        toolId,
        fromFormat,
        toFormat,
        priority,
        fileSizeBytes,
        status: JobStatus.PENDING,
      },
    });

    let inputStoragePath: string | null = null;

    if (files.length > 0) {
      const dir = ensureJobDir(job.id);
      const first = files[0];
      const safeName = path.basename(first.originalname || 'input').replace(/[^\w.-]+/g, '_');
      inputStoragePath = path.join(dir, `input-${safeName}`);
      fs.writeFileSync(inputStoragePath, first.buffer);
    }

    if (inputStoragePath) {
      await prisma.conversionJob.update({
        where: { id: job.id },
        data: { inputStoragePath },
      });
    }

    notifyConversionWorker();

    res.status(202).json({
      jobId: job.id,
      status: job.status,
      message: 'Job enqueued for processing',
    });
  } catch (e) {
    console.error('[conversions/post]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not enqueue conversion job' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'conversions' });
});

router.get('/:id/file', optionalAuth, async (req: Request, res: Response) => {
  try {
    const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
    if (!jobId) {
      res.status(400).json({ error: 'INVALID_ID', message: 'Job id required' });
      return;
    }

    const job = await prisma.conversionJob.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Job not found' });
      return;
    }
    if (!(await assertJobAccess(job, req, res))) return;

    if (job.status !== JobStatus.COMPLETED) {
      res.status(404).json({ error: 'NOT_READY', message: 'Output not available yet' });
      return;
    }

    const outputPath = job.outputStoragePath;
    if (!outputPath || !fs.existsSync(outputPath)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Output file not found' });
      return;
    }

    const ext = formatToExtension(job.toFormat);
    const filename = `converted.${ext}`;
    res.setHeader('Content-Type', mimeFromExtension(ext));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(outputPath).pipe(res);
  } catch (e) {
    console.error('[conversions/file]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not stream output file' });
  }
});

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const jobId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
    if (!jobId) {
      res.status(400).json({ error: 'INVALID_ID', message: 'Job id required' });
      return;
    }
    const job = await prisma.conversionJob.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Job not found' });
      return;
    }
    if (!(await assertJobAccess(job, req, res))) return;
    res.json(serializeJob(job));
  } catch (e) {
    console.error('[conversions/get]', e);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Could not load job status' });
  }
});

export default router;
