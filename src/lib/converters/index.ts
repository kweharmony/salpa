/**
 * Converter Service - Unified Interface
 * Единый интерфейс для всех конвертеров
 */

import { ImageConverter, ImageFormat } from './image-converter';
import { TextConverter, TextFormat } from './text-converter';
import { AudioConverter, AudioFormat } from './audio-converter';
import { VideoConverter, VideoFormat } from './video-converter';

export type ConversionCategory = 'image' | 'text' | 'audio' | 'video' | 'unsupported';

export interface ConversionResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

export interface ConversionOptions {
  quality?: number;
  videoQuality?: 'low' | 'medium' | 'high';
  bitrate?: number;
}

export class ConverterService {
  /**
   * Определяет категорию файла
   */
  static getCategory(file: File): ConversionCategory {
    const mimeType = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase();

    // GIF обрабатывается как видео (для конвертации в mp4/webm)
    if (mimeType === 'image/gif' || ext === 'gif') {
      return 'video';
    }

    if (ImageConverter.isSupported(mimeType)) {
      return 'image';
    }

    if (TextConverter.isSupported(mimeType)) {
      return 'text';
    }

    if (AudioConverter.isSupported(mimeType)) {
      return 'audio';
    }

    if (VideoConverter.isSupported(mimeType)) {
      return 'video';
    }

    // Проверка по расширению для файлов без MIME
    if (ext) {
      if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico', 'tiff', 'tif', 'avif'].includes(ext)) {
        return 'image';
      }
      if (['txt', 'csv', 'json', 'md', 'html', 'xml', 'yaml', 'yml'].includes(ext)) {
        return 'text';
      }
      if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
        return 'audio';
      }
      if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', '3gp'].includes(ext)) {
        return 'video';
      }
    }

    return 'unsupported';
  }

  /**
   * Возвращает доступные форматы для конвертации
   */
  static getAvailableFormats(file: File): string[] {
    const category = this.getCategory(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    switch (category) {
      case 'image':
        return ImageConverter.getAvailableFormats(ext as ImageFormat);
      case 'text':
        return TextConverter.getAvailableFormats(ext);
      case 'audio':
        return AudioConverter.getAvailableFormats(ext);
      case 'video':
        return VideoConverter.getAvailableFormats(ext);
      default:
        return [];
    }
  }

  /**
   * Конвертирует файл в указанный формат
   */
  static async convert(
    file: File,
    targetFormat: string,
    onProgress?: (progress: number) => void,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    const category = this.getCategory(file);

    if (category === 'unsupported') {
      throw new Error('Формат файла не поддерживается');
    }

    let blob: Blob;
    let mimeType: string;

    switch (category) {
      case 'image':
        blob = await ImageConverter.convert(
          file,
          { format: targetFormat as ImageFormat, quality: options?.quality },
          onProgress
        );
        const imageMimeTypes: Record<string, string> = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
          gif: 'image/gif',
          bmp: 'image/bmp',
          ico: 'image/x-icon',
        };
        mimeType = imageMimeTypes[targetFormat] || `image/${targetFormat}`;
        break;

      case 'text':
        blob = await TextConverter.convert(
          file,
          { format: targetFormat as TextFormat },
          onProgress
        );
        const textMimeTypes: Record<string, string> = {
          txt: 'text/plain',
          csv: 'text/csv',
          json: 'application/json',
          md: 'text/markdown',
          html: 'text/html',
          xml: 'application/xml',
        };
        mimeType = textMimeTypes[targetFormat] || 'application/octet-stream';
        break;

      case 'audio':
        blob = await AudioConverter.convert(
          file,
          { format: targetFormat as AudioFormat, bitrate: options?.bitrate },
          onProgress
        );
        mimeType = targetFormat === 'mp3' ? 'audio/mp3' : 'audio/wav';
        break;

      case 'video':
        blob = await VideoConverter.convert(
          file,
          { format: targetFormat as VideoFormat, quality: options?.videoQuality },
          onProgress
        );
        const videoMimeTypes: Record<string, string> = {
          mp4: 'video/mp4',
          webm: 'video/webm',
          avi: 'video/x-msvideo',
          mov: 'video/quicktime',
          gif: 'image/gif',
          mp3: 'audio/mp3',
          wav: 'audio/wav',
        };
        mimeType = videoMimeTypes[targetFormat] || 'application/octet-stream';
        break;

      default:
        throw new Error('Неизвестная категория файла');
    }

    // Генерируем новое имя файла
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}.${targetFormat}`;

    return { blob, filename, mimeType };
  }

  /**
   * Валидирует файл перед конвертацией
   */
  static validate(file: File): { valid: boolean; error?: string } {
    // Проверка размера (макс 500MB для видео, 100MB для остальных)
    const category = this.getCategory(file);
    const maxSize = category === 'video' ? 500 * 1024 * 1024 : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return { valid: false, error: `Файл слишком большой (макс. ${maxMB}MB)` };
    }

    // Проверка поддержки формата
    if (category === 'unsupported') {
      return { valid: false, error: 'Формат файла не поддерживается' };
    }

    return { valid: true };
  }

  /**
   * Проверяет, является ли видео длинным (>3 минут)
   */
  static async isLongVideo(file: File): Promise<boolean> {
    const category = this.getCategory(file);
    if (category !== 'video') {
      return false;
    }
    return VideoConverter.isLongVideo(file);
  }

  /**
   * Проверяет, является ли аудио длинным (>3 минут)
   */
  static async isLongAudio(file: File): Promise<boolean> {
    const category = this.getCategory(file);
    if (category !== 'audio') {
      return false;
    }

    try {
      const duration = await AudioConverter.getDuration(file);
      return duration > 3 * 60;
    } catch {
      return false;
    }
  }

  /**
   * Получает длительность медиафайла
   */
  static async getDuration(file: File): Promise<number | null> {
    const category = this.getCategory(file);

    if (category === 'audio') {
      return AudioConverter.getDuration(file);
    }

    if (category === 'video') {
      return VideoConverter.getDuration(file);
    }

    return null;
  }

  /**
   * Форматирует длительность
   */
  static formatDuration(seconds: number): string {
    return VideoConverter.formatDuration(seconds);
  }

  /**
   * Скачивает результат конвертации
   */
  static download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Форматирует размер файла для отображения
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Re-export types and converters
export { ImageConverter } from './image-converter';
export type { ImageFormat } from './image-converter';
export { TextConverter } from './text-converter';
export type { TextFormat } from './text-converter';
export { AudioConverter } from './audio-converter';
export type { AudioFormat } from './audio-converter';
export { VideoConverter } from './video-converter';
export type { VideoFormat } from './video-converter';
