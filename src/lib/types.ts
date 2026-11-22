import type { Message } from "./i18n";

export type FileStatus = "pending" | "converting" | "completed" | "error" | "cancelled";

export interface ConversionOptions {
  quality?: number;
  maxDimension?: number;
  videoQuality?: "low" | "medium" | "high";
  bitrate?: number;
  fastVideo?: boolean;
}

export type ConversionOutput =
  | { kind: "download"; blob: Blob; filename: string; method?: "copy" | "encode"; note?: Message }
  | { kind: "print"; html: string; title: string };

export interface ConvertibleFile {
  id: string;
  file: File;
  name: string;
  size: number;
  category: FormatInfo["category"];
  sourceFormat: string;
  targetFormat: string;
  status: FileStatus;
  progress: number;
  error?: Message;
  options?: ConversionOptions;
  result?: ConversionOutput;
}

export interface FormatCategory {
  id: string;
  name: string;
  formats: FormatInfo[];
}

export interface FormatInfo {
  extension: string;
  name: string;
  description: string;
  category: "image" | "document" | "audio" | "video";
  convertTo: string[];
  mimeTypes?: string[];
}

// Каталог форматов, файлового диалога и доступных направлений конвертации.
export const SUPPORTED_FORMATS: FormatInfo[] = [
  // Images (поддерживаются ImageConverter)
  { extension: "png", name: "PNG", description: "Portable Network Graphics", category: "image", mimeTypes: ["image/png"], convertTo: ["jpg", "webp", "bmp", "ico", "pdf"] },
  { extension: "jpg", name: "JPG", description: "JPEG Image", category: "image", mimeTypes: ["image/jpeg", "image/jpg"], convertTo: ["png", "webp", "bmp", "ico", "jpg", "pdf"] },
  { extension: "jpeg", name: "JPEG", description: "JPEG Image", category: "image", convertTo: ["png", "webp", "bmp", "ico", "jpg", "pdf"] },
  { extension: "webp", name: "WebP", description: "WebP Image", category: "image", mimeTypes: ["image/webp"], convertTo: ["png", "jpg", "bmp", "ico", "webp", "pdf"] },
  { extension: "bmp", name: "BMP", description: "Bitmap Image", category: "image", mimeTypes: ["image/bmp"], convertTo: ["png", "jpg", "webp", "ico", "pdf"] },
  { extension: "ico", name: "ICO", description: "Icon Image", category: "image", mimeTypes: ["image/x-icon", "image/vnd.microsoft.icon"], convertTo: ["png", "jpg", "webp", "bmp", "pdf"] },
  { extension: "tiff", name: "TIFF", description: "Tagged Image File Format", category: "image", mimeTypes: ["image/tiff"], convertTo: ["png", "jpg", "webp", "bmp", "ico", "pdf"] },
  { extension: "tif", name: "TIF", description: "Tagged Image File Format", category: "image", convertTo: ["png", "jpg", "webp", "bmp", "ico", "pdf"] },
  { extension: "avif", name: "AVIF", description: "AV1 Image File Format", category: "image", mimeTypes: ["image/avif"], convertTo: ["png", "jpg", "webp", "bmp", "ico", "pdf"] },

  { extension: "heic", name: "HEIC", description: "High Efficiency Image Coding", category: "image", mimeTypes: ["image/heic", "image/heic-sequence"], convertTo: ["jpg", "png", "webp", "pdf"] },
  { extension: "heif", name: "HEIF", description: "High Efficiency Image File Format", category: "image", mimeTypes: ["image/heif", "image/heif-sequence"], convertTo: ["jpg", "png", "webp", "pdf"] },

  // Documents
  { extension: "docx", name: "Word", description: "Office Open XML Document", category: "document", mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], convertTo: ["pdf", "txt", "html"] },
  { extension: "pdf", name: "PDF", description: "Portable Document Format", category: "document", mimeTypes: ["application/pdf"], convertTo: ["docx", "txt", "png", "jpg"] },
  { extension: "txt", name: "TXT", description: "Plain Text", category: "document", mimeTypes: ["text/plain"], convertTo: ["md", "json", "csv", "html", "xml", "docx"] },
  { extension: "md", name: "Markdown", description: "Markdown Document", category: "document", mimeTypes: ["text/markdown"], convertTo: ["txt", "json", "csv", "html", "xml"] },
  { extension: "csv", name: "CSV", description: "Comma-Separated Values", category: "document", mimeTypes: ["text/csv"], convertTo: ["txt", "md", "json", "html", "xml"] },
  { extension: "json", name: "JSON", description: "JavaScript Object Notation", category: "document", mimeTypes: ["application/json"], convertTo: ["txt", "md", "csv", "html", "xml"] },
  { extension: "html", name: "HTML", description: "HyperText Markup Language", category: "document", mimeTypes: ["text/html"], convertTo: ["txt", "md", "json", "csv", "xml"] },
  { extension: "xml", name: "XML", description: "Extensible Markup Language", category: "document", mimeTypes: ["text/xml", "application/xml"], convertTo: ["txt", "md", "json", "csv", "html"] },
  { extension: "yaml", name: "YAML", description: "YAML Ain't Markup Language", category: "document", mimeTypes: ["application/yaml", "text/yaml", "application/x-yaml", "text/x-yaml"], convertTo: ["json", "txt"] },
  { extension: "yml", name: "YML", description: "YAML Ain't Markup Language", category: "document", convertTo: ["json", "txt"] },

  // Audio (поддерживаются AudioConverter)
  { extension: "mp3", name: "MP3", description: "MPEG Audio Layer III", category: "audio", mimeTypes: ["audio/mpeg", "audio/mp3"], convertTo: ["wav"] },
  { extension: "wav", name: "WAV", description: "Waveform Audio File", category: "audio", mimeTypes: ["audio/wav", "audio/wave", "audio/x-wav"], convertTo: ["mp3"] },
  { extension: "ogg", name: "OGG", description: "Ogg Vorbis Audio", category: "audio", mimeTypes: ["audio/ogg"], convertTo: ["mp3", "wav"] },
  { extension: "flac", name: "FLAC", description: "Free Lossless Audio Codec", category: "audio", mimeTypes: ["audio/flac"], convertTo: ["mp3", "wav"] },
  { extension: "aac", name: "AAC", description: "Advanced Audio Coding", category: "audio", mimeTypes: ["audio/aac"], convertTo: ["mp3", "wav"] },
  { extension: "m4a", name: "M4A", description: "MPEG-4 Audio", category: "audio", mimeTypes: ["audio/mp4", "audio/x-m4a"], convertTo: ["mp3", "wav"] },
  { extension: "wma", name: "WMA", description: "Windows Media Audio", category: "audio", mimeTypes: ["audio/x-ms-wma"], convertTo: ["mp3", "wav"] },

  { extension: "weba", name: "WebM Audio", description: "WebM audio", category: "audio", mimeTypes: ["audio/webm"], convertTo: ["mp3", "wav"] },

  // Video (поддерживаются VideoConverter)
  { extension: "mp4", name: "MP4", description: "MPEG-4 Video", category: "video", mimeTypes: ["video/mp4"], convertTo: ["webm", "avi", "mov", "gif", "mp3", "wav"] },
  { extension: "webm", name: "WebM", description: "WebM Video", category: "video", mimeTypes: ["video/webm"], convertTo: ["mp4", "avi", "mov", "gif", "mp3", "wav"] },
  { extension: "avi", name: "AVI", description: "Audio Video Interleave", category: "video", mimeTypes: ["video/x-msvideo", "video/avi"], convertTo: ["mp4", "webm", "mov", "gif", "mp3", "wav"] },
  { extension: "mov", name: "MOV", description: "QuickTime Movie", category: "video", mimeTypes: ["video/quicktime"], convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav"] },
  { extension: "mkv", name: "MKV", description: "Matroska Video", category: "video", mimeTypes: ["video/x-matroska", "video/mkv"], convertTo: ["mp4", "webm", "avi", "mov", "mp3", "wav", "gif"] },
  { extension: "gif", name: "GIF", description: "Graphics Interchange Format (Animated)", category: "video", mimeTypes: ["image/gif"], convertTo: ["mp4", "webm", "avi", "mov"] },
  { extension: "flv", name: "FLV", description: "Flash Video", category: "video", mimeTypes: ["video/x-flv"], convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav", "mov"] },
  { extension: "wmv", name: "WMV", description: "Windows Media Video", category: "video", mimeTypes: ["video/x-ms-wmv"], convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav", "mov"] },
  { extension: "3gp", name: "3GP", description: "3GPP Multimedia", category: "video", mimeTypes: ["video/3gpp"], convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav", "mov"] },
];

export function getFormatInfo(extension: string): FormatInfo | undefined {
  return SUPPORTED_FORMATS.find(f => f.extension.toLowerCase() === extension.toLowerCase());
}

export const FILE_ACCEPT = SUPPORTED_FORMATS.flatMap((format) => [
  `.${format.extension}`,
  ...(format.mimeTypes ?? []),
]).join(",");

export function detectFormat(file: File): FormatInfo | undefined {
  const extension = getFileExtension(file.name);
  const namedFormat = getFormatInfo(extension);
  const mime = file.type.toLowerCase().split(";")[0];
  const mediaFormat = SUPPORTED_FORMATS.find((format) => format.mimeTypes?.includes(mime));
  if ((extension === "mp4" || extension === "webm") && mediaFormat?.category === "audio") {
    return mediaFormat;
  }
  return namedFormat ?? mediaFormat;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
}
