import { LocalizedError } from '../i18n';
/**
 * Video Converter Service
 * Конвертация видео с использованием ffmpeg.wasm
 */

import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { detectFormat, generateId } from '../types';

export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'gif' | 'mp3' | 'wav';

export interface VideoConversionOptions {
  format: VideoFormat;
  quality?: 'low' | 'medium' | 'high';
  fast?: boolean;
  bitrate?: number;
}

interface VideoConversionResult {
  blob: Blob;
  method: 'copy' | 'encode';
}

interface MediaStream {
  codec_type: string;
  codec_name: string;
  disposition?: { attached_pic?: number };
}

export class VideoConverter {
  private static ffmpeg: FFmpeg | null = null;
  private static nextJob = Promise.resolve();

  private static async getFFmpeg(signal?: AbortSignal): Promise<FFmpeg> {
    if (this.ffmpeg) return this.ffmpeg;

    const wrapperURL = new URL('/engine/ffmpeg/index.js', location.origin).href;
    let wrapper: typeof import('@ffmpeg/ffmpeg');
    try {
      wrapper = await import(/* turbopackIgnore: true */ /* webpackIgnore: true */ wrapperURL);
    } catch {
      throw new LocalizedError('videoLoad');
    }

    signal?.throwIfAborted();
    const ffmpeg = new wrapper.FFmpeg();
    const abort = () => ffmpeg.terminate();
    const timeout = setTimeout(abort, 90_000);
    signal?.addEventListener('abort', abort, { once: true });

    try {
      const core = new URL('/engine/video/', location.origin).href;
      await ffmpeg.load({
        coreURL: `${core}ffmpeg-core.js`,
        wasmURL: `${core}ffmpeg-core.wasm`,
      });
      signal?.throwIfAborted();
      this.ffmpeg = ffmpeg;
      return ffmpeg;
    } catch {
      ffmpeg.terminate();
      signal?.throwIfAborted();
      throw new LocalizedError('videoLoad');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  static convert(
    file: File,
    options: VideoConversionOptions,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<VideoConversionResult> {
    const job = this.nextJob.then(() => this.convertNext(file, options, onProgress, signal));
    this.nextJob = job.then(() => undefined, () => undefined);
    return job;
  }

  private static async convertNext(
    file: File,
    { format, quality = 'medium', fast, bitrate = 192 }: VideoConversionOptions,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<VideoConversionResult> {
    signal?.throwIfAborted();
    onProgress?.(5);

    const ffmpeg = await this.getFFmpeg(signal);
    signal?.throwIfAborted();
    const inputExt = detectFormat(file)?.extension ?? 'mp4';
    const id = generateId();
    const input = `${id}.${inputExt}`;
    const output = `${id}-out.${format}`;
    const metadata = `${id}.json`;
    const onAbort = () => {
      this.ffmpeg = null;
      ffmpeg.terminate();
    };
    let reported = 20;
    const onEncodeProgress = ({ progress }: { progress: number }) => {
      if (!Number.isFinite(progress)) return;
      const percent = Math.min(94, Math.max(25, 25 + progress * 69));
      if (percent >= reported + 1) {
        reported = percent;
        onProgress?.(percent);
      }
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    ffmpeg.on('progress', onEncodeProgress);
    try {
      onProgress?.(15);
      const data = new Uint8Array(await file.arrayBuffer());
      signal?.throwIfAborted();
      await ffmpeg.writeFile(input, data);
      onProgress?.(20);

      let method: VideoConversionResult['method'] = 'encode';
      if (fast && await this.canCopyStreams(ffmpeg, input, metadata, format)) {
        signal?.throwIfAborted();
        const args = ['-i', input, '-map', '0:V:0', '-map', '0:a:0?', '-c', 'copy'];
        if (format !== 'webm') args.push('-movflags', '+faststart');
        if (await ffmpeg.exec([...args, output]) === 0) method = 'copy';
      }

      signal?.throwIfAborted();
      if (method === 'encode') {
        const exitCode = await ffmpeg.exec(this.getEncodingArgs(input, output, format, quality, inputExt, bitrate));
        if (exitCode !== 0) throw new LocalizedError('videoEncode');
      }

      signal?.throwIfAborted();
      const result = await ffmpeg.readFile(output);
      if (typeof result === 'string' || result.length === 0) {
        throw new LocalizedError('outputMissing');
      }
      const blob = new Blob([new Uint8Array(result)], { type: this.getMimeType(format) });
      onProgress?.(100);
      return { blob, method };
    } catch (error) {
      signal?.throwIfAborted();
      throw error;
    } finally {
      signal?.removeEventListener('abort', onAbort);
      ffmpeg.off('progress', onEncodeProgress);
      if (this.ffmpeg === ffmpeg) {
        await Promise.all([input, output, metadata].map((name) =>
          ffmpeg.deleteFile(name).catch(() => undefined),
        ));
      }
    }
  }

  private static async canCopyStreams(
    ffmpeg: FFmpeg,
    input: string,
    metadata: string,
    format: VideoFormat,
  ): Promise<boolean> {
    if (format !== 'mp4' && format !== 'mov' && format !== 'webm') return false;

    try {
      const exit = await ffmpeg.ffprobe([
        '-v', 'error', '-show_streams', '-of', 'json', '-o', metadata, input,
      ], 5000);
      // В core 0.12.10 ffprobe может вернуть -1 даже с готовым JSON.
      if (exit !== 0 && exit !== -1) return false;
      const raw = await ffmpeg.readFile(metadata, 'utf8');
      if (typeof raw !== 'string') return false;
      const { streams }: { streams: MediaStream[] } = JSON.parse(raw);
      const video = streams.find((stream) => stream.codec_type === 'video' && !stream.disposition?.attached_pic);
      const audio = streams.find((stream) => stream.codec_type === 'audio');
      const videoCodecs = format === 'webm' ? ['vp8', 'vp9', 'av1'] : ['h264'];
      const audioCodecs = format === 'webm' ? ['opus', 'vorbis'] : ['aac'];
      return !!video && videoCodecs.includes(video.codec_name) &&
        (!audio || audioCodecs.includes(audio.codec_name));
    } catch {
      return false;
    }
  }

  /**
   * Возвращает аргументы для ffmpeg в зависимости от формата и качества
   */
  private static getEncodingArgs(
    input: string,
    output: string,
    format: VideoFormat,
    quality: 'low' | 'medium' | 'high',
    inputExt: string,
    bitrate: number,
  ): string[] {
    const crfValues: Record<string, number> = {
      low: 35,
      medium: 28,
      high: 23,
    };

    const crf = crfValues[quality];

    // Базовые аргументы
    const baseArgs = ['-i', input];

    // Для GIF входного файла добавляем флаг для лучшей обработки
    const isGifInput = inputExt === 'gif';

    switch (format) {
      case 'mp4':
        // Используем совместимые кодеки
        return [
          ...baseArgs,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', crf.toString(),
          '-pix_fmt', 'yuv420p', // Совместимость с большинством плееров
          ...(isGifInput ? [] : ['-c:a', 'aac', '-b:a', '128k']),
          '-movflags', '+faststart',
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Чётные размеры
          output,
        ];

      case 'webm':
        // VP8 более совместим чем VP9 в wasm
        return [
          ...baseArgs,
          '-c:v', 'libvpx',
          '-crf', crf.toString(),
          '-b:v', '1M',
          ...(isGifInput ? [] : ['-c:a', 'libvorbis', '-b:a', '128k']),
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          output,
        ];

      case 'avi':
        return [
          ...baseArgs,
          '-c:v', 'mpeg4',
          '-q:v', Math.floor(crf / 5).toString(),
          ...(isGifInput ? [] : ['-c:a', 'libmp3lame', '-b:a', '192k']),
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          output,
        ];

      case 'mov':
        return [
          ...baseArgs,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', crf.toString(),
          '-pix_fmt', 'yuv420p',
          ...(isGifInput ? [] : ['-c:a', 'aac', '-b:a', '128k']),
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          output,
        ];

      case 'gif':
        // Генерация GIF (упрощённый фильтр для совместимости)
        return [
          ...baseArgs,
          '-vf', 'fps=10,scale=480:-1:flags=lanczos',
          '-loop', '0',
          output,
        ];

      case 'mp3':
        // Извлечение аудио в MP3
        return [
          ...baseArgs,
          '-vn', // Без видео
          '-c:a', 'libmp3lame',
          '-b:a', `${bitrate}k`,
          output,
        ];

      case 'wav':
        // Извлечение аудио в WAV
        return [
          ...baseArgs,
          '-vn', // Без видео
          '-c:a', 'pcm_s16le',
          '-ar', '44100',
          output,
        ];

      default:
        return [...baseArgs, output];
    }
  }

  /**
   * Возвращает MIME тип для формата
   */
  private static getMimeType(format: VideoFormat): string {
    const mimeTypes: Record<VideoFormat, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      gif: 'image/gif',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}
