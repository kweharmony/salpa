import { type Locale } from "./i18n";
import { type FormatInfo } from "./types";

const chinese: Record<string, string> = {
  png: "可移植网络图形",
  jpg: "JPEG 图像",
  jpeg: "JPEG 图像",
  webp: "WebP 图像",
  bmp: "位图图像",
  ico: "图标文件",
  tiff: "标签图像文件格式",
  tif: "标签图像文件格式",
  avif: "AV1 图像文件格式",
  heic: "高效图像编码格式",
  heif: "高效图像文件格式",
  txt: "纯文本",
  md: "Markdown 文档",
  csv: "逗号分隔值",
  json: "JavaScript 对象表示法",
  html: "超文本标记语言",
  xml: "可扩展标记语言",
  yaml: "YAML 数据格式",
  yml: "YAML 数据格式",
  pdf: "可移植文档格式",
  docx: "Office Open XML 文档",
  mp3: "MPEG 第三层音频",
  wav: "波形音频文件",
  ogg: "Ogg Vorbis 音频",
  flac: "无损音频编码",
  aac: "高级音频编码",
  m4a: "MPEG-4 音频",
  wma: "Windows Media 音频",
  weba: "WebM 音频",
  mp4: "MPEG-4 视频",
  webm: "WebM 视频",
  avi: "音频视频交错格式",
  mov: "QuickTime 视频",
  mkv: "Matroska 视频",
  gif: "图形交换格式（动画）",
  flv: "Flash 视频",
  wmv: "Windows Media 视频",
  "3gp": "3GPP 多媒体",
};

export function describeFormat(format: FormatInfo, locale: Locale): string {
  return locale === "zh-Hans" ? chinese[format.extension] ?? format.description : format.description;
}
