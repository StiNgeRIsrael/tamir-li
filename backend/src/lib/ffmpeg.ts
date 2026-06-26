import { spawn } from 'child_process';

const FFMPEG_TOOL_IDS = new Set(['audio-converter', 'video-converter']);

let ffmpegAvailable: boolean | null = null;

export function getFfmpegPath(): string {
  const configured = process.env.FFMPEG_PATH?.trim();
  return configured || 'ffmpeg';
}

export function isFfmpegRequiredTool(toolId: string): boolean {
  return FFMPEG_TOOL_IDS.has(toolId);
}

export function ffmpegAudioCodecArgs(toFormat: string): string[] {
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

export function ffmpegVideoCodecArgs(toFormat: string): string[] {
  switch (toFormat.toUpperCase()) {
    case 'MP4':
      return [
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
      ];
    case 'WEBM':
      return ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus'];
    case 'AVI':
      return ['-c:v', 'mpeg4', '-q:v', '5', '-c:a', 'mp3'];
    case 'MOV':
      return ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-f', 'mov'];
    case 'MKV':
      return ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-f', 'matroska'];
    default:
      return ['-c:v', 'libx264', '-c:a', 'aac'];
  }
}

export function ffmpegCodecArgs(toolId: string, toFormat: string): string[] {
  if (toolId === 'video-converter') {
    return ffmpegVideoCodecArgs(toFormat);
  }
  return ffmpegAudioCodecArgs(toFormat);
}

export async function checkFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;

  const ffmpeg = getFfmpegPath();
  ffmpegAvailable = await new Promise<boolean>((resolve) => {
    const proc = spawn(ffmpeg, ['-version'], { stdio: 'ignore' });
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });

  if (!ffmpegAvailable) {
    console.warn(`[ffmpeg] not found (${ffmpeg}); ffmpeg-dependent conversions unavailable`);
  }

  return ffmpegAvailable;
}

/** Test helper — reset cached probe result. */
export function resetFfmpegAvailabilityCache(): void {
  ffmpegAvailable = null;
}

export function runFfmpeg(
  inputPath: string,
  outputPath: string,
  toolId: string,
  toFormat: string
): Promise<void> {
  const ffmpeg = getFfmpegPath();
  const args = ['-y', '-i', inputPath, ...ffmpegCodecArgs(toolId, toFormat), outputPath];

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
