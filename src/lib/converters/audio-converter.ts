/**
 * Audio Converter Service
 * Конвертация аудио с использованием Web Audio API и lamejs
 */

export type AudioFormat = 'mp3' | 'wav';

export interface AudioConversionOptions {
  format: AudioFormat;
  bitrate?: number; // для MP3: 128, 192, 256, 320
}

// Кэш для lamejs модуля
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lamejsModule: any = null;
let lamejsLoading: Promise<any> | null = null;

async function loadScriptFromText(jsText: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const blob = new Blob([jsText], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    script.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось загрузить MP3 энкодер'));
    };

    document.head.appendChild(script);
  });
}

async function loadLamejsGlobal(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Конвертация аудио в MP3 доступна только в браузере');
  }

  if ((window as any).lamejs?.Mp3Encoder) {
    return (window as any).lamejs;
  }

  // Загружаем готовый browser-бандл (внутри него все зависимости, включая MPEGMode)
  // через CDN, чтобы избежать проблем Next/ESM при импорте CJS исходников.
  const url = 'https://unpkg.com/lamejs@1.2.1/lame.min.js';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Не удалось загрузить MP3 энкодер. Проверьте подключение к интернету.');
  }
  const jsText = await res.text();
  await loadScriptFromText(jsText);

  if (!(window as any).lamejs?.Mp3Encoder) {
    throw new Error('MP3 энкодер не инициализировался');
  }

  return (window as any).lamejs;
}

/**
 * Динамически загружает lamejs модуль
 */
async function getLamejs() {
  if (lamejsModule) {
    return lamejsModule;
  }

  if (lamejsLoading) {
    return lamejsLoading;
  }

  lamejsLoading = (async () => {
    // Основной путь: глобальный browser-бандл
    try {
      lamejsModule = await loadLamejsGlobal();
      return lamejsModule;
    } catch {
      // Fallback: основной entry (может работать в некоторых окружениях)
      // @ts-expect-error - lamejs не имеет типов
      const lamejs = await import('lamejs');
      lamejsModule = lamejs.default || lamejs;
      return lamejsModule;
    } finally {
      lamejsLoading = null;
    }
  })();

  return lamejsLoading;
}

export class AudioConverter {
  /**
   * Конвертирует аудио в указанный формат
   */
  static async convert(
    file: File,
    options: AudioConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const { format, bitrate = 192 } = options;

    onProgress?.(5);

    // Декодируем аудио через Web Audio API
    const audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(15);

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    onProgress?.(30);

    let result: Blob;

    if (format === 'mp3') {
      result = await this.encodeToMp3(audioBuffer, bitrate, onProgress);
    } else {
      result = this.encodeToWav(audioBuffer, onProgress);
    }

    await audioContext.close();

    onProgress?.(100);

    return result;
  }

  /**
   * Кодирует AudioBuffer в MP3 с использованием lamejs
   */
  private static async encodeToMp3(
    audioBuffer: AudioBuffer,
    bitrate: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const lamejs = await getLamejs();

    const channels = Math.min(audioBuffer.numberOfChannels, 2);
    const sampleRate = audioBuffer.sampleRate;

    const mp3Data: BlobPart[] = [];

    // Получаем данные каналов
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;

    // Конвертируем Float32 в Int16
    const leftInt16 = this.floatTo16BitPCM(left);
    const rightInt16 = this.floatTo16BitPCM(right);

    const blockSize = 1152; // Размер блока для MP3
    const totalBlocks = Math.ceil(leftInt16.length / blockSize);

    // Для стерео используем Joint Stereo режим
    if (channels === 2) {
      const mp3encoder = new lamejs.Mp3Encoder(2, sampleRate, bitrate);

      for (let i = 0; i < leftInt16.length; i += blockSize) {
        const leftChunk = leftInt16.subarray(i, i + blockSize);
        const rightChunk = rightInt16.subarray(i, i + blockSize);

        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);

        if (mp3buf.length > 0) {
          mp3Data.push(new Uint8Array(mp3buf));
        }

        // Обновляем прогресс (30-90%)
        const currentBlock = Math.floor(i / blockSize);
        const progress = 30 + (currentBlock / totalBlocks) * 60;
        onProgress?.(Math.min(progress, 90));
      }

      // Финализация
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    } else {
      // Моно
      const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrate);

      for (let i = 0; i < leftInt16.length; i += blockSize) {
        const leftChunk = leftInt16.subarray(i, i + blockSize);

        const mp3buf = mp3encoder.encodeBuffer(leftChunk);

        if (mp3buf.length > 0) {
          mp3Data.push(new Uint8Array(mp3buf));
        }

        // Обновляем прогресс (30-90%)
        const currentBlock = Math.floor(i / blockSize);
        const progress = 30 + (currentBlock / totalBlocks) * 60;
        onProgress?.(Math.min(progress, 90));
      }

      // Финализация
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf));
      }
    }

    return new Blob(mp3Data, { type: 'audio/mpeg' });
  }

  /**
   * Кодирует AudioBuffer в WAV
   */
  private static encodeToWav(
    audioBuffer: AudioBuffer,
    onProgress?: (progress: number) => void
  ): Blob {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    onProgress?.(50);

    // Интерливим каналы
    const interleaved = this.interleave(audioBuffer);

    onProgress?.(70);

    // Создаём WAV заголовок и данные
    const dataLength = interleaved.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV Header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, format, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitDepth / 8, true);
    view.setUint16(32, channels * bitDepth / 8, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    onProgress?.(85);

    // Записываем аудио данные
    const offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Интерливит многоканальный аудио в один массив
   */
  private static interleave(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const result = new Float32Array(length * channels);

    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < channels; ch++) {
        result[i * channels + ch] = audioBuffer.getChannelData(ch)[i];
      }
    }

    return result;
  }

  /**
   * Конвертирует Float32Array в Int16Array
   */
  private static floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  /**
   * Записывает строку в DataView
   */
  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Проверяет, поддерживается ли формат
   */
  static isSupported(mimeType: string): boolean {
    const supportedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/mp4',
      'audio/webm',
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Возвращает доступные форматы для конвертации
   */
  static getAvailableFormats(sourceFormat: string): AudioFormat[] {
    const formats: AudioFormat[] = ['mp3', 'wav'];
    const sourceExt = sourceFormat.toLowerCase();

    // Нормализуем форматы
    const normalizedSource = sourceExt === 'wave' ? 'wav' : sourceExt;

    return formats.filter(f => f !== normalizedSource);
  }

  /**
   * Получает длительность аудио файла в секундах
   */
  static async getDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось загрузить аудио'));
      });

      audio.src = url;
    });
  }
}
