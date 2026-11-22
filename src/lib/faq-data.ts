import { inLocale, type Locale, type MessageKey, type Translation } from "./i18n";

export const FAQ_CATEGORIES = [
  { id: "all", label: "faqAll" },
  { id: "privacy", label: "faqPrivacy" },
  { id: "limits", label: "faqLimits" },
  { id: "compatibility", label: "faqCompatibility" },
  { id: "technical", label: "faqTechnical" },
] as const satisfies ReadonlyArray<{ id: string; label: MessageKey }>;

type Category = Exclude<(typeof FAQ_CATEGORIES)[number]["id"], "all">;

const faq = [
  {
    id: "privacy-1", category: "privacy",
    question: ["Мои файлы загружаются на сервер?", "Are my files uploaded to a server?", "我的文件会上传到服务器吗？"],
    answer: [
      "Salpa обрабатывает файлы локально в браузере. Исходные файлы и результаты остаются на вашем устройстве.",
      "Salpa processes files in your browser. Originals and converted files stay on your device.",
      "Salpa 在浏览器中本地处理文件，原始文件和转换结果都保留在您的设备上。",
    ],
  },
  {
    id: "privacy-2", category: "privacy",
    question: ["Где хранятся результаты?", "Where are the results kept?", "转换结果保存在哪里？"],
    answer: [
      "Результаты доступны до удаления файла из очереди, очистки списка или закрытия страницы.",
      "Results remain available until you remove a file, clear the queue or close the page.",
      "在移除文件、清空队列或关闭页面前，您都可以下载转换结果。",
    ],
  },
  {
    id: "privacy-3", category: "privacy",
    question: ["Можно ли обрабатывать конфиденциальные документы?", "Can I convert confidential documents?", "可以转换机密文档吗？"],
    answer: [
      "Да. Обработка происходит на вашем устройстве. Для работы можно заранее подготовить офлайн-режим.",
      "Yes. Conversion happens on your device. You can also prepare offline mode ahead of time.",
      "可以。转换在您的设备上进行，也可以提前准备离线模式。",
    ],
  },
  {
    id: "limits-1", category: "limits",
    question: ["Какой максимальный размер файла?", "What is the maximum file size?", "文件大小上限是多少？"],
    answer: [
      "На один файл доступно 500 МиБ для видео и 100 МиБ для остальных форматов. Практический предел зависит от памяти устройства.",
      "The per-file limit is 500 MiB for video and 100 MiB for other formats. The practical limit depends on device memory.",
      "单个视频最大为 500 MiB，其他格式最大为 100 MiB。实际可处理的大小还取决于设备内存。",
    ],
  },
  {
    id: "limits-2", category: "limits",
    question: ["Можно ли конвертировать несколько файлов?", "Can I convert several files at once?", "可以一次转换多个文件吗？"],
    answer: [
      "Да. Добавьте файлы в очередь. Salpa обработает их по порядку, а готовые результаты можно скачать одним ZIP.",
      "Yes. Add them to the queue. Salpa processes them in order, and you can download the finished results as one ZIP.",
      "可以。将文件加入队列，Salpa 会依次处理，并可将已完成的文件打包为一个 ZIP 下载。",
    ],
  },
  {
    id: "limits-3", category: "limits",
    question: ["Какие форматы поддерживаются?", "Which formats are supported?", "支持哪些格式？"],
    answer: [
      "Поддерживаются изображения, включая HEIC, документы, включая PDF и DOCX, аудио и видео. Все направления доступны в разделе «Форматы».",
      "Salpa supports images including HEIC, documents including PDF and DOCX, audio, and video. See Formats for all conversions.",
      "支持多种图像（包括 HEIC）、文档（包括 PDF 和 DOCX）、音频和视频。请在“格式”查看所有转换方向。",
    ],
  },
  {
    id: "compat-1", category: "compatibility",
    question: ["Какие браузеры поддерживаются?", "Which browsers are supported?", "支持哪些浏览器？"],
    answer: [
      "Salpa рассчитана на актуальные версии Chrome, Edge, Firefox и Safari. Поддержка отдельных форматов зависит от браузера.",
      "Salpa is designed for current versions of Chrome, Edge, Firefox and Safari. Some formats depend on browser support.",
      "Salpa 适用于当前版本的 Chrome、Edge、Firefox 和 Safari。部分格式取决于浏览器的支持情况。",
    ],
  },
  {
    id: "compat-2", category: "compatibility",
    question: ["Работает ли Salpa на мобильных устройствах?", "Does Salpa work on mobile?", "Salpa 可以在手机上使用吗？"],
    answer: [
      "Да. Время обработки и допустимый размер файла зависят от мощности и памяти устройства.",
      "Yes. Processing time and usable file size depend on your device’s speed and memory.",
      "可以。处理时间和可处理的文件大小取决于设备性能和内存。",
    ],
  },
  {
    id: "compat-3", category: "compatibility",
    question: ["Нужен ли интернет для работы?", "Do I need an internet connection?", "使用 Salpa 需要联网吗？"],
    answer: [
      "Подготовьте офлайн-режим на главной. Для аудио и видео заранее выберите соответствующие группы. Очистка данных сайта удаляет офлайн-кэш.",
      "Prepare offline mode on the home page. To convert audio or video offline, select those groups first. Clearing site data removes the offline cache.",
      "在首页准备离线模式。若要离线转换音频或视频，请先勾选对应的选项。清除站点数据也会清除离线缓存。",
    ],
  },
  {
    id: "pdf-1", category: "technical",
    question: ["Как сохранить DOCX в PDF и обработать скан?", "How do I save a DOCX as PDF or convert a scan?", "如何将 DOCX 保存为 PDF，或转换扫描件？"],
    answer: [
      "Для DOCX → PDF откройте «Печать в PDF» и выберите «Сохранить как PDF». PDF → DOCX извлекает текстовый слой. Для сканов можно сохранить страницы как PNG или JPG.",
      "For DOCX to PDF, open Print to PDF and choose Save as PDF. PDF to DOCX extracts the text layer. Scanned pages can be saved as PNG or JPG.",
      "将 DOCX 转为 PDF 时，请点击“打印为 PDF”，再选择“另存为 PDF”。PDF 转 DOCX 会提取文本层，扫描页可保存为 PNG 或 JPG。",
    ],
  },
  {
    id: "tech-1", category: "technical",
    question: ["От чего зависит скорость конвертации?", "What affects conversion speed?", "哪些因素影响转换速度？"],
    answer: [
      "Скорость зависит от файла, формата и устройства. Для совместимых видеодорожек смена контейнера позволяет обойтись без перекодирования.",
      "Speed depends on the file, format and device. Compatible video streams can be moved to a new container without re-encoding.",
      "转换速度取决于文件、格式和设备。兼容的视频流可以直接复制到新容器，无需重新编码。",
    ],
  },
  {
    id: "tech-2", category: "technical",
    question: ["Как конвертируются изображения?", "How are images converted?", "图像是如何转换的？"],
    answer: [
      "Браузер декодирует файл, рисует изображение через Canvas и экспортирует его с выбранными настройками.",
      "Your browser decodes the file, draws it on a canvas and exports it with the selected settings.",
      "浏览器解码文件，将图像绘制到画布上，再按选定的设置导出。",
    ],
  },
  {
    id: "tech-3", category: "technical",
    question: ["Сохраняется ли качество при конвертации?", "Does conversion preserve quality?", "转换会保留原有质量吗？"],
    answer: [
      "Качество зависит от формата, размера и профиля. При копировании совместимых видеодорожек содержимое дорожек сохраняется.",
      "Quality depends on the format, size and preset. Copying compatible video streams preserves the encoded content.",
      "质量取决于格式、尺寸和预设。直接复制兼容的视频流会保留已编码的内容。",
    ],
  },
  {
    id: "tech-4", category: "technical",
    question: ["Что происходит с метаданными файла?", "What happens to file metadata?", "文件元数据会怎样处理？"],
    answer: [
      "При экспорте изображения через Canvas EXIF не переносится. У аудио и видео часть метаданных может сохраниться.",
      "Canvas image exports omit EXIF. Some metadata may remain in audio and video files.",
      "通过画布导出的图像不保留 EXIF。音频和视频可能保留部分元数据。",
    ],
  },
] satisfies ReadonlyArray<{ id: string; category: Category; question: Translation; answer: Translation }>;

export function getFaq(locale: Locale) {
  return faq.map(({ question, answer, ...item }) => ({
    ...item,
    question: inLocale(locale, question),
    answer: inLocale(locale, answer),
  }));
}
