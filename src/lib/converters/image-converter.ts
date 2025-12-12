/**
 * Image Converter Service
 * Конвертация изображений с использованием Canvas API
 */

export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'ico';

export interface ImageConversionOptions {
  format: ImageFormat;
  quality?: number; // 0.0 - 1.0, только для jpeg и webp
}

export class ImageConverter {
  /**
   * Конвертирует изображение в указанный формат
   */
  static async convert(
    file: File,
    options: ImageConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const { quality = 0.92 } = options;
    // Нормализуем формат: jpg -> jpeg для canvas API
    let format = options.format === 'jpg' ? 'jpeg' : options.format;

    onProgress?.(10);

    // Загрузка изображения
    const img = await this.loadImage(file);
    onProgress?.(40);

    // Создание canvas
    const canvas = document.createElement('canvas');

    // Для ICO ограничиваем размер до 256x256
    let width = img.width;
    let height = img.height;
    if (options.format === 'ico') {
      const maxSize = 256;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
    }

    const ctx = canvas.getContext('2d', {
      alpha: format !== 'jpeg' && format !== 'bmp', // JPEG и BMP не поддерживают прозрачность
    });

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Установка размеров
    canvas.width = width;
    canvas.height = height;

    // Для JPEG и BMP заполняем фон белым (нет прозрачности)
    if (format === 'jpeg' || format === 'bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    onProgress?.(60);

    // Рисуем изображение с высоким качеством
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    onProgress?.(80);

    // Для BMP и ICO используем PNG как промежуточный формат, затем конвертируем
    if (format === 'bmp') {
      const blob = await this.canvasToBMP(canvas);
      onProgress?.(100);
      return blob;
    }

    if (options.format === 'ico') {
      const blob = await this.canvasToICO(canvas);
      onProgress?.(100);
      return blob;
    }

    // Конвертируем в Blob
    const blob = await this.canvasToBlob(canvas, format as 'jpeg' | 'png' | 'webp' | 'gif', quality);
    onProgress?.(100);

    return blob;
  }

  /**
   * Загружает изображение из File
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось загрузить изображение'));
      };

      img.src = url;
    });
  }

  /**
   * Конвертирует canvas в Blob
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    format: ImageFormat,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Не удалось создать Blob'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * Конвертирует canvas в BMP формат
   */
  private static async canvasToBMP(canvas: HTMLCanvasElement): Promise<Blob> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { width, height, data } = imageData;

    // BMP файл (24-bit, без сжатия)
    const rowSize = Math.ceil((width * 3) / 4) * 4; // Строки выравниваются по 4 байта
    const pixelDataSize = rowSize * height;
    const fileSize = 54 + pixelDataSize; // 54 = заголовок BMP

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // BMP File Header (14 bytes)
    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4D); // 'M'
    view.setUint32(2, fileSize, true); // File size
    view.setUint32(6, 0, true); // Reserved
    view.setUint32(10, 54, true); // Offset to pixel data

    // DIB Header (BITMAPINFOHEADER - 40 bytes)
    view.setUint32(14, 40, true); // Header size
    view.setInt32(18, width, true); // Width
    view.setInt32(22, -height, true); // Height (отрицательное = top-down)
    view.setUint16(26, 1, true); // Planes
    view.setUint16(28, 24, true); // Bits per pixel
    view.setUint32(30, 0, true); // Compression (0 = none)
    view.setUint32(34, pixelDataSize, true); // Image size
    view.setInt32(38, 2835, true); // X pixels per meter (72 DPI)
    view.setInt32(42, 2835, true); // Y pixels per meter
    view.setUint32(46, 0, true); // Colors in color table
    view.setUint32(50, 0, true); // Important colors

    // Pixel data (BGR format, top to bottom)
    let offset = 54;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        view.setUint8(offset++, data[i + 2]); // B
        view.setUint8(offset++, data[i + 1]); // G
        view.setUint8(offset++, data[i]);     // R
      }
      // Padding до кратности 4 байтам
      const padding = rowSize - width * 3;
      for (let p = 0; p < padding; p++) {
        view.setUint8(offset++, 0);
      }
    }

    return new Blob([buffer], { type: 'image/bmp' });
  }

  /**
   * Конвертирует canvas в ICO формат
   */
  private static async canvasToICO(canvas: HTMLCanvasElement): Promise<Blob> {
    // Получаем PNG данные
    const pngBlob = await this.canvasToBlob(canvas, 'png', 1);
    const pngBuffer = await pngBlob.arrayBuffer();
    const pngData = new Uint8Array(pngBuffer);

    const width = canvas.width > 255 ? 0 : canvas.width; // 0 означает 256
    const height = canvas.height > 255 ? 0 : canvas.height;

    // ICO Header (6 bytes)
    const headerSize = 6;
    const entrySize = 16;
    const totalSize = headerSize + entrySize + pngData.length;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // ICONDIR
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, 1, true); // Number of images

    // ICONDIRENTRY
    view.setUint8(6, width);  // Width
    view.setUint8(7, height); // Height
    view.setUint8(8, 0);      // Color palette
    view.setUint8(9, 0);      // Reserved
    view.setUint16(10, 1, true); // Color planes
    view.setUint16(12, 32, true); // Bits per pixel
    view.setUint32(14, pngData.length, true); // Image size
    view.setUint32(18, headerSize + entrySize, true); // Offset to image data

    // Copy PNG data
    const uint8View = new Uint8Array(buffer);
    uint8View.set(pngData, headerSize + entrySize);

    return new Blob([buffer], { type: 'image/x-icon' });
  }

  /**
   * Проверяет, поддерживается ли формат для конвертации
   */
  static isSupported(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Возвращает доступные форматы для конвертации
   */
  static getAvailableFormats(sourceFormat: string): ImageFormat[] {
    const formats: ImageFormat[] = ['jpg', 'png', 'webp', 'bmp', 'ico'];
    const sourceExt = sourceFormat.toLowerCase();

    // Нормализуем jpeg -> jpg для сравнения
    const normalizedSource = sourceExt === 'jpeg' ? 'jpg' : sourceExt;

    // Исключаем исходный формат
    return formats.filter(f => f !== normalizedSource);
  }
}
