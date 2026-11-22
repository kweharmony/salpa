import { LocalizedError, type Message } from '../i18n';
import { detectFormat, type ConversionOptions, type ConversionOutput } from '../types';
import type { ImageFormat } from './image-converter';
import type { TextFormat } from './text-converter';
import type { AudioFormat } from './audio-converter';
import type { VideoFormat } from './video-converter';

export class ConverterService {
  static getAvailableFormats(file: File): string[] {
    return detectFormat(file)?.convertTo ?? [];
  }

  static async convert(
    file: File,
    targetFormat: string,
    onProgress?: (progress: number) => void,
    options?: ConversionOptions,
    signal?: AbortSignal,
  ): Promise<ConversionOutput> {
    signal?.throwIfAborted();
    const validation = this.validate(file);
    if (validation.error) throw new LocalizedError(validation.error.key, validation.error.params);

    const source = detectFormat(file);
    if (!source?.convertTo.includes(targetFormat)) {
      throw new LocalizedError('unsupportedPair');
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'salpa';
    if (source.extension === 'docx' || source.extension === 'pdf' || targetFormat === 'docx' || targetFormat === 'pdf') {
      const { convertDocument } = await import('./office-converter');
      const result = await convertDocument(file, source, targetFormat, baseName, options, onProgress, signal);
      signal?.throwIfAborted();
      return result;
    }

    let blob: Blob;
    let method: 'copy' | 'encode' | undefined;
    switch (source.category) {
      case 'image': {
        const { ImageConverter } = await import('./image-converter');
        blob = await ImageConverter.convert(file, {
          format: targetFormat as ImageFormat,
          quality: options?.quality,
          maxDimension: options?.maxDimension,
        }, onProgress);
        break;
      }
      case 'document': {
        const { TextConverter } = await import('./text-converter');
        blob = await TextConverter.convert(file, {
          format: targetFormat as TextFormat,
          sourceFormat: source.extension,
        }, onProgress);
        break;
      }
      case 'audio': {
        const { AudioConverter } = await import('./audio-converter');
        blob = await AudioConverter.convert(file, {
          format: targetFormat as AudioFormat,
          bitrate: options?.bitrate,
        }, onProgress, signal);
        break;
      }
      case 'video': {
        const { VideoConverter } = await import('./video-converter');
        const result = await VideoConverter.convert(file, {
          format: targetFormat as VideoFormat,
          quality: options?.videoQuality,
          fast: options?.fastVideo,
          bitrate: options?.bitrate,
        }, onProgress, signal);
        blob = result.blob;
        method = result.method;
        break;
      }
    }

    signal?.throwIfAborted();
    return { kind: 'download', blob, filename: `${baseName}.${targetFormat}`, method };
  }

  static validate(file: File): { error?: Message } {
    const format = detectFormat(file);
    if (!format) return { error: { key: 'unsupported' } };
    if (!file.size && (format.category !== 'document' || ['docx', 'pdf'].includes(format.extension))) {
      return { error: { key: 'emptyFile' } };
    }

    const maxMiB = format.category === 'video' ? 500 : 100;
    if (file.size > maxMiB * 1024 * 1024) {
      return { error: { key: 'fileTooLarge', params: { limit: maxMiB } } };
    }
    return {};
  }

  static download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  }
}
