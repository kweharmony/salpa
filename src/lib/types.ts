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

// Format conversion mappings
export const SUPPORTED_FORMATS: FormatInfo[] = [
  // Images
  { extension: "png", name: "PNG", description: "Portable Network Graphics", category: "image", convertTo: ["jpg", "webp", "gif"] },
  { extension: "jpg", name: "JPG", description: "JPEG Image", category: "image", convertTo: ["png", "webp", "gif"] },
  { extension: "jpeg", name: "JPEG", description: "JPEG Image", category: "image", convertTo: ["png", "webp", "gif"] },
  { extension: "webp", name: "WebP", description: "WebP Image", category: "image", convertTo: ["png", "jpg", "gif"] },
  { extension: "gif", name: "GIF", description: "Graphics Interchange Format", category: "image", convertTo: ["png", "jpg", "webp"] },
  { extension: "svg", name: "SVG", description: "Scalable Vector Graphics", category: "image", convertTo: ["png", "jpg", "webp"] },

  // Documents
  { extension: "pdf", name: "PDF", description: "Portable Document Format", category: "document", convertTo: ["txt"] },
  { extension: "txt", name: "TXT", description: "Plain Text", category: "document", convertTo: ["md", "pdf"] },
  { extension: "md", name: "Markdown", description: "Markdown Document", category: "document", convertTo: ["txt", "pdf"] },
  { extension: "csv", name: "CSV", description: "Comma-Separated Values", category: "document", convertTo: ["txt", "json"] },

  // Audio
  { extension: "mp3", name: "MP3", description: "MPEG Audio Layer III", category: "audio", convertTo: ["wav", "ogg"] },
  { extension: "wav", name: "WAV", description: "Waveform Audio File", category: "audio", convertTo: ["mp3", "ogg"] },
  { extension: "ogg", name: "OGG", description: "Ogg Vorbis Audio", category: "audio", convertTo: ["mp3", "wav"] },

  // Video
  { extension: "mp4", name: "MP4", description: "MPEG-4 Video", category: "video", convertTo: ["webm"] },
  { extension: "webm", name: "WebM", description: "WebM Video", category: "video", convertTo: ["mp4"] },
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
