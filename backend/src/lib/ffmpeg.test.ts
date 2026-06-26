import { describe, it, expect } from 'vitest';
import {
  ffmpegAudioCodecArgs,
  ffmpegVideoCodecArgs,
  isFfmpegRequiredTool,
} from './ffmpeg';

describe('ffmpeg helpers', () => {
  it('identifies ffmpeg-dependent tools', () => {
    expect(isFfmpegRequiredTool('audio-converter')).toBe(true);
    expect(isFfmpegRequiredTool('video-converter')).toBe(true);
    expect(isFfmpegRequiredTool('pdf-to-word')).toBe(false);
    expect(isFfmpegRequiredTool('image-converter')).toBe(false);
  });

  it('builds audio codec args', () => {
    expect(ffmpegAudioCodecArgs('MP3')).toContain('libmp3lame');
    expect(ffmpegAudioCodecArgs('WAV')).toContain('pcm_s16le');
  });

  it('builds video codec args', () => {
    expect(ffmpegVideoCodecArgs('MP4')).toContain('libx264');
    expect(ffmpegVideoCodecArgs('WEBM')).toContain('libvpx-vp9');
  });
});
