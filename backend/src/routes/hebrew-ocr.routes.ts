import { Router, Request, Response } from 'express';
import multer from 'multer';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const execFileAsync = promisify(execFile);

async function tesseractAvailable(): Promise<boolean> {
  try {
    await execFileAsync('tesseract', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hebrew OCR — Tesseract on server when available.
 * POST multipart: file (PDF/JPG/PNG)
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'NO_FILE', message: 'Upload a PDF or image file.' });
    return;
  }

  const hasTesseract = await tesseractAvailable();
  if (!hasTesseract) {
    res.status(503).json({
      error: 'OCR_NOT_CONFIGURED',
      message: 'Tesseract is not installed on the API server. Install tesseract-ocr and tesseract-ocr-heb.',
    });
    return;
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tamir-ocr-'));
  const ext = path.extname(file.originalname) || '.png';
  const inputPath = path.join(tmpDir, `input${ext}`);
  const outputBase = path.join(tmpDir, 'output');

  try {
    await fs.writeFile(inputPath, file.buffer);
    await execFileAsync('tesseract', [inputPath, outputBase, '-l', 'heb+eng', '--oem', '1', '--psm', '3']);
    const text = await fs.readFile(`${outputBase}.txt`, 'utf8');

    const filename = `${file.originalname.replace(/\.[^.]+$/, '')}_ocr.txt`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(text);
  } catch (e) {
    console.error('[hebrew-ocr]', e);
    res.status(500).json({ error: 'OCR_FAILED', message: 'Could not process the document.' });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'hebrew-ocr' });
});

export default router;
