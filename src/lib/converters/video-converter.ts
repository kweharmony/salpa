/**
 * Video Converter Service
 * Конвертация видео с использованием ffmpeg.wasm
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'gif' | 'mp3' | 'wav';

export interface VideoConversionOptions {
  format: VideoFormat;
  quality?: 'low' | 'medium' | 'high';
}

// Singleton для FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

export class VideoConverter {
  /**
   * Проверяет поддержку SharedArrayBuffer
   */
  private static isSharedArrayBufferSupported(): boolean {
    try {
      return typeof SharedArrayBuffer !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Загружает файл и создаёт Blob URL
   */
  private static async toBlobURL(url: string, mimeType: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return URL.createObjectURL(new Blob([blob], { type: mimeType }));
  }

  /**
   * Получает или инициализирует FFmpeg instance
   */
  private static async getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance) {
      return ffmpegInstance;
    }

    if (ffmpegLoading) {
      return ffmpegLoading;
    }

    ffmpegLoading = (async () => {
      const ffmpeg = new FFmpeg();

      // Проверяем поддержку SharedArrayBuffer для multi-threaded версии
      const useMT = this.isSharedArrayBufferSupported();

      if (useMT) {
        // Multi-threaded версия (быстрее, но требует COOP/COEP)
        const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/umd';

        await ffmpeg.load({
          coreURL: await this.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await this.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await this.toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
        });
      } else {
        // Single-threaded версия (fallback)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await ffmpeg.load({
          coreURL: await this.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await this.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();

    return ffmpegLoading;
  }

  /**
   * Конвертирует видео в указанный формат
   */
  static async convert(
    file: File,
    options: VideoConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const { format, quality = 'medium' } = options;

    onProgress?.(5);

    let ffmpeg: FFmpeg;
    try {
      ffmpeg = await this.getFFmpeg();
    } catch (error) {
      console.error('FFmpeg load error:', error);
      throw new Error('Не удалось загрузить видео конвертер. Проверьте подключение к интернету.');
    }

    onProgress?.(15);

    // Определяем имена файлов
    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputName = `input.${inputExt}`;
    const outputName = `output.${format}`;

    // Записываем входной файл
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
    } catch (error) {
      console.error('FFmpeg writeFile error:', error);
      throw new Error('Не удалось загрузить файл для конвертации.');
    }

    onProgress?.(25);

    // Настраиваем прогресс (создаём handler для последующего удаления)
    const progressHandler = ({ progress }: { progress: number }) => {
      // progress от 0 до 1
      const percent = 25 + progress * 65; // 25-90%
      onProgress?.(Math.min(percent, 90));
    };

    ffmpeg.on('progress', progressHandler);

    // Получаем параметры кодирования
    const args = this.getEncodingArgs(inputName, outputName, format, quality, inputExt);

    try {
      // Выполняем конвертацию
      await ffmpeg.exec(args);

      onProgress?.(92);

      // Читаем результат
      let data;
      try {
        data = await ffmpeg.readFile(outputName);
      } catch (error) {
        console.error('FFmpeg readFile error:', error);
        throw new Error('Ошибка конвертации. Формат может не поддерживаться.');
      }

      // Очищаем файлы
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch {
        // Игнорируем ошибки удаления
      }

      onProgress?.(100);

      const mimeType = this.getMimeType(format);
      // data - это Uint8Array, создаём новый массив для Blob
      const uint8Array = new Uint8Array(data as Uint8Array);
      return new Blob([uint8Array], { type: mimeType });
    } catch (error) {
      // Очищаем входной файл при ошибке
      try {
        await ffmpeg.deleteFile(inputName);
      } catch {
        // Игнорируем
      }
      throw error;
    } finally {
      // Удаляем обработчик прогресса
      ffmpeg.off('progress', progressHandler);
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
    inputExt: string
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
          '-b:a', '192k',
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
      mp3: 'audio/mp3',
      wav: 'audio/wav',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Проверяет, поддерживается ли формат
   */
  static isSupported(mimeType: string): boolean {
    const supportedTypes = [
      'video/mp4',
      'video/webm',
      'video/x-msvideo',
      'video/avi',
      'video/quicktime',
      'video/x-matroska',
      'video/mkv',
      'image/gif', // GIF обрабатывается как видео для конвертации
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Возвращает доступные форматы для конвертации
   */
  static getAvailableFormats(sourceFormat: string): VideoFormat[] {
    const formats: VideoFormat[] = ['mp4', 'webm', 'avi', 'mov', 'gif', 'mp3', 'wav'];
    const sourceExt = sourceFormat.toLowerCase();

    // Для GIF не показываем GIF, MP3, WAV в списке (нет аудио)
    if (sourceExt === 'gif') {
      return ['mp4', 'webm', 'avi', 'mov'];
    }

    return formats.filter(f => f !== sourceExt);
  }

  /**
   * Получает длительность видео файла в секундах
   */
  static async getDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      });

      video.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось загрузить видео'));
      });

      video.src = url;
    });
  }

  /**
   * Проверяет, является ли видео длинным (>3 минут)
   */
  static async isLongVideo(file: File): Promise<boolean> {
    try {
      const duration = await this.getDuration(file);
      return duration > 180; // 3 минуты = 180 секунд
    } catch {
      return false;
    }
  }

  /**
   * Форматирует длительность в читаемый вид
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
