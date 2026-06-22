import fs from 'fs';
import path from 'path';

const STORAGE_DIR =
  process.env.CONVERSION_STORAGE_DIR ??
  path.resolve(__dirname, '..', '..', 'data', 'conversions');

export function getStorageDir(): string {
  return STORAGE_DIR;
}

export function ensureStorageDir(): void {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export function jobDir(jobId: string): string {
  return path.join(STORAGE_DIR, jobId);
}

export function ensureJobDir(jobId: string): string {
  const dir = jobDir(jobId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function formatToExtension(fmt: string): string {
  return fmt.replace(/^\./, '').toLowerCase();
}

export function outputFilePath(jobId: string, toFormat: string): string {
  const ext = formatToExtension(toFormat);
  return path.join(jobDir(jobId), `output.${ext}`);
}

export function mimeFromExtension(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };
  return map[ext.toLowerCase()] ?? 'application/octet-stream';
}
