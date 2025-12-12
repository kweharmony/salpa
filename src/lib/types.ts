export type FileStatus = "pending" | "converting" | "completed" | "error";

export interface ConvertibleFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  sourceFormat: string;
  targetFormat: string;
  status: FileStatus;
  progress: number;
  error?: string;
  result?: Blob;
  resultUrl?: string;
  resultFilename?: string;
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
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Format conversion mappings - синхронизировано с реальными конвертерами
export const SUPPORTED_FORMATS: FormatInfo[] = [
  // Images (поддерживаются ImageConverter)
  { extension: "png", name: "PNG", description: "Portable Network Graphics", category: "image", convertTo: ["jpg", "webp", "bmp", "ico"] },
  { extension: "jpg", name: "JPG", description: "JPEG Image", category: "image", convertTo: ["png", "webp", "bmp", "ico"] },
  { extension: "jpeg", name: "JPEG", description: "JPEG Image", category: "image", convertTo: ["png", "webp", "bmp", "ico"] },
  { extension: "webp", name: "WebP", description: "WebP Image", category: "image", convertTo: ["png", "jpg", "bmp", "ico"] },
  { extension: "bmp", name: "BMP", description: "Bitmap Image", category: "image", convertTo: ["png", "jpg", "webp", "ico"] },
  { extension: "ico", name: "ICO", description: "Icon Image", category: "image", convertTo: ["png", "jpg", "webp", "bmp"] },
  { extension: "tiff", name: "TIFF", description: "Tagged Image File Format", category: "image", convertTo: ["png", "jpg", "webp", "bmp"] },
  { extension: "tif", name: "TIF", description: "Tagged Image File Format", category: "image", convertTo: ["png", "jpg", "webp", "bmp"] },
  { extension: "avif", name: "AVIF", description: "AV1 Image File Format", category: "image", convertTo: ["png", "jpg", "webp", "bmp"] },

  // Documents (поддерживаются TextConverter)
  { extension: "txt", name: "TXT", description: "Plain Text", category: "document", convertTo: ["md", "json", "csv", "html", "xml"] },
  { extension: "md", name: "Markdown", description: "Markdown Document", category: "document", convertTo: ["txt", "json", "csv", "html", "xml"] },
  { extension: "csv", name: "CSV", description: "Comma-Separated Values", category: "document", convertTo: ["txt", "md", "json", "html", "xml"] },
  { extension: "json", name: "JSON", description: "JavaScript Object Notation", category: "document", convertTo: ["txt", "md", "csv", "html", "xml"] },
  { extension: "html", name: "HTML", description: "HyperText Markup Language", category: "document", convertTo: ["txt", "md", "json", "csv"] },
  { extension: "xml", name: "XML", description: "Extensible Markup Language", category: "document", convertTo: ["txt", "md", "json", "csv", "html"] },
  { extension: "yaml", name: "YAML", description: "YAML Ain't Markup Language", category: "document", convertTo: ["json", "txt"] },
  { extension: "yml", name: "YML", description: "YAML Ain't Markup Language", category: "document", convertTo: ["json", "txt"] },

  // Audio (поддерживаются AudioConverter)
  { extension: "mp3", name: "MP3", description: "MPEG Audio Layer III", category: "audio", convertTo: ["wav"] },
  { extension: "wav", name: "WAV", description: "Waveform Audio File", category: "audio", convertTo: ["mp3"] },
  { extension: "ogg", name: "OGG", description: "Ogg Vorbis Audio", category: "audio", convertTo: ["mp3", "wav"] },
  { extension: "flac", name: "FLAC", description: "Free Lossless Audio Codec", category: "audio", convertTo: ["mp3", "wav"] },
  { extension: "aac", name: "AAC", description: "Advanced Audio Coding", category: "audio", convertTo: ["mp3", "wav"] },
  { extension: "m4a", name: "M4A", description: "MPEG-4 Audio", category: "audio", convertTo: ["mp3", "wav"] },
  { extension: "wma", name: "WMA", description: "Windows Media Audio", category: "audio", convertTo: ["mp3", "wav"] },

  // Video (поддерживаются VideoConverter)
  { extension: "mp4", name: "MP4", description: "MPEG-4 Video", category: "video", convertTo: ["webm", "avi", "mov", "gif", "mp3", "wav"] },
  { extension: "webm", name: "WebM", description: "WebM Video", category: "video", convertTo: ["mp4", "avi", "mov", "gif", "mp3", "wav"] },
  { extension: "avi", name: "AVI", description: "Audio Video Interleave", category: "video", convertTo: ["mp4", "webm", "mov", "gif", "mp3", "wav"] },
  { extension: "mov", name: "MOV", description: "QuickTime Movie", category: "video", convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav"] },
  { extension: "mkv", name: "MKV", description: "Matroska Video", category: "video", convertTo: ["mp4", "webm", "avi", "mov", "mp3", "wav"] },
  { extension: "gif", name: "GIF", description: "Graphics Interchange Format (Animated)", category: "video", convertTo: ["mp4", "webm", "avi", "mov"] },
  { extension: "flv", name: "FLV", description: "Flash Video", category: "video", convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav"] },
  { extension: "wmv", name: "WMV", description: "Windows Media Video", category: "video", convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav"] },
  { extension: "3gp", name: "3GP", description: "3GPP Multimedia", category: "video", convertTo: ["mp4", "webm", "avi", "gif", "mp3", "wav"] },
];

export function getFormatInfo(extension: string): FormatInfo | undefined {
  return SUPPORTED_FORMATS.find(f => f.extension.toLowerCase() === extension.toLowerCase());
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
  return Math.random().toString(36).substring(2, 11);
}
