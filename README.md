# Salpa - Браузерный Конвертер Файлов

![Salpa Logo](https://img.shields.io/badge/Salpa-File_Converter-0A7EA4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTIyIDExYzAtMi4yLTIuNC0zLjYtNi0zLjZzLTYgMS40LTYgMy40YzAgMi4yIDIuOCAzIDYgMy44czYgMS42IDYgMy44YzAgMi40LTIuNiA0LjItNiA0LjJzLTYtMS42LTYtMy44IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==)
[![GitHub](https://img.shields.io/badge/GitHub-kweharmony%2Fsalpa-181717?style=for-the-badge&logo=github)](https://github.com/kweharmony/salpa)

Salpa - это веб-приложение для конвертации файлов, которое работает полностью в браузере. Все операции выполняются локально на устройстве пользователя - файлы никогда не покидают компьютер и не загружаются на сервер.

## Ключевые особенности

- **100% приватность** - файлы обрабатываются локально в браузере, без отправки на сервер
- **Без регистрации** - начните работу мгновенно, без создания аккаунта
- **Бесплатно** - без ограничений на количество файлов, без водяных знаков
- **Быстро** - использует современные Web API для максимальной производительности
- **Офлайн-работа** - после загрузки страницы конвертация работает без интернета

## Как пользоваться

### 1. Загрузка файлов
- Перетащите файлы в зону загрузки (drag & drop)
- Или нажмите на зону для выбора файлов через диалог
- Можно загрузить несколько файлов одновременно

### 2. Выбор формата
- Для каждого файла автоматически определяется исходный формат
- Выберите целевой формат из выпадающего списка
- Доступные форматы зависят от типа исходного файла

### 3. Конвертация
- Нажмите кнопку "Конвертировать" для запуска
- Прогресс отображается для каждого файла
- Ошибки показываются с описанием проблемы

### 4. Скачивание
- После конвертации появляется кнопка "Скачать"
- Можно скачать файлы по отдельности или все сразу
- Файлы сохраняются с новым расширением

## Поддерживаемые форматы

### Изображения
| Формат | Описание | Конвертация в |
|--------|----------|---------------|
| PNG | Portable Network Graphics | JPG, WebP, BMP, ICO |
| JPG/JPEG | JPEG Image | PNG, WebP, BMP, ICO |
| WebP | WebP Image | PNG, JPG, BMP, ICO |
| BMP | Bitmap Image | PNG, JPG, WebP, ICO |
| ICO | Icon Image | PNG, JPG, WebP, BMP |
| TIFF/TIF | Tagged Image File Format | PNG, JPG, WebP, BMP |
| AVIF | AV1 Image File Format | PNG, JPG, WebP, BMP |

**Возможности:**
- Конвертация между форматами с сохранением качества
- Настраиваемое качество для JPG и WebP (по умолчанию 92%)
- Автоматическая обработка прозрачности (замена на белый фон для JPG и BMP)
- Конвертация в ICO с автоматическим масштабированием до 256x256
- Генерация BMP файлов (24-bit, без сжатия)

### Текстовые документы
| Формат | Описание | Конвертация в |
|--------|----------|---------------|
| TXT | Plain Text | MD, JSON, CSV, HTML, XML |
| MD | Markdown | TXT, JSON, CSV, HTML, XML |
| CSV | Comma-Separated Values | TXT, MD, JSON, HTML, XML |
| JSON | JavaScript Object Notation | TXT, MD, CSV, HTML, XML |
| HTML | HyperText Markup Language | TXT, MD, JSON, CSV, XML |
| XML | Extensible Markup Language | TXT, MD, JSON, CSV, HTML |
| YAML/YML | YAML Ain't Markup Language | JSON, TXT |

**Возможности:**
- CSV → JSON: автоматическое преобразование таблицы в массив объектов
- JSON → CSV: конвертация массива объектов в таблицу
- CSV → Markdown: генерация Markdown-таблицы
- CSV → HTML: создание HTML-таблицы со стилями
- Markdown → HTML: конвертация с поддержкой заголовков, жирного текста, курсива, ссылок
- JSON → XML: конвертация с вложенной структурой тегов
- CSV → XML: генерация XML с тегами на основе заголовков

### Аудио
| Формат | Описание | Конвертация в |
|--------|----------|---------------|
| MP3 | MPEG Audio Layer III | WAV |
| WAV | Waveform Audio File | MP3 |
| OGG | Ogg Vorbis Audio | MP3, WAV |
| FLAC | Free Lossless Audio Codec | MP3, WAV |
| AAC | Advanced Audio Coding | MP3, WAV |
| M4A | MPEG-4 Audio | MP3, WAV |
| WMA | Windows Media Audio | MP3, WAV |

**Возможности:**
- Декодирование через Web Audio API (поддерживает все форматы, которые воспроизводит браузер)
- Кодирование в MP3 через библиотеку lamejs (загружается из CDN, битрейт 128 kbps)
- Кодирование в WAV (без сжатия, 16-bit PCM)
- Сохранение стерео/моно режима

**Предупреждение о длинных аудио:**
При загрузке аудиофайлов длиннее 3 минут появляется предупреждение о том, что конвертация в MP3 займёт значительное время из-за вычислительной сложности.

### Видео
| Формат | Описание | Конвертация в |
|--------|----------|---------------|
| MP4 | MPEG-4 Video | WebM, AVI, MOV, GIF, MP3, WAV |
| WebM | WebM Video | MP4, AVI, MOV, GIF, MP3, WAV |
| AVI | Audio Video Interleave | MP4, WebM, MOV, GIF, MP3, WAV |
| MOV | QuickTime Movie | MP4, WebM, AVI, GIF, MP3, WAV |
| MKV | Matroska Video | MP4, WebM, AVI, MOV, MP3, WAV |
| GIF | Graphics Interchange Format (Animated) | MP4, WebM, AVI, MOV |
| FLV | Flash Video | MP4, WebM, AVI, GIF, MP3, WAV |
| WMV | Windows Media Video | MP4, WebM, AVI, GIF, MP3, WAV |
| 3GP | 3GPP Multimedia | MP4, WebM, AVI, GIF, MP3, WAV |

**Возможности:**
- Конвертация через ffmpeg.wasm (~25MB, загружается лениво при первом использовании)
- Три уровня качества: низкое (быстрая конвертация), среднее, высокое
- Конвертация в AVI (MPEG-4 кодек) и MOV (H.264 кодек)
- Извлечение аудио в MP3 или WAV
- Создание GIF из видео (10 fps, 480px ширина)
- Конвертация анимированных GIF в видеоформаты

**Предупреждение о длинных видео:**
При загрузке видео длиннее 3 минут появляется предупреждение о том, что конвертация займёт значительное время (примерно 1-2 минуты на каждую минуту видео).

## Архитектура

### Компоненты конвертации

```
ConverterService (index.ts)
├── ImageConverter - конвертация изображений через Canvas API
├── TextConverter - конвертация текстовых файлов
├── AudioConverter - конвертация аудио через Web Audio API + lamejs
└── VideoConverter - конвертация видео через ffmpeg.wasm
```

**ImageConverter:**
- Загрузка изображения через `URL.createObjectURL`
- Рендеринг на Canvas с высоким качеством
- Экспорт через `canvas.toBlob()` в нужный формат
- Генерация BMP файлов с корректным заголовком (24-bit)
- Генерация ICO файлов с PNG-данными внутри

**TextConverter:**
- Чтение файла как текст через `file.text()`
- Парсинг CSV с учётом кавычек и экранирования
- Форматирование JSON с отступами
- Генерация HTML-документов со встроенными стилями
- Конвертация в XML с валидными тегами

**AudioConverter:**
- Декодирование через Web Audio API `decodeAudioData()`
- Динамическая загрузка lamejs из CDN (https://unpkg.com/lamejs@1.2.1) через fetch + blob URL
- Кодирование MP3 через lamejs с фиксированным битрейтом 128 kbps
- Генерация WAV с корректным заголовком (44 байта RIFF/WAVE)
- Предупреждение пользователя о длинных аудио (>3 минуты)

**VideoConverter:**
- Singleton pattern для FFmpeg instance
- Ленивая загрузка ffmpeg.wasm из CDN при первом использовании
- Настраиваемые пресеты качества (ultrafast/fast/medium)
- Поддержка конвертации в AVI и MOV форматы

### Структура проекта

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Главная (конвертер)
│   ├── about/page.tsx         # О проекте
│   ├── formats/page.tsx       # Список форматов
│   └── faq/page.tsx           # Частые вопросы
├── components/
│   ├── layout/
│   │   ├── Header.tsx         # Навигация
│   │   ├── Footer.tsx         # Подвал
│   │   └── SalpaLogo.tsx      # Логотип (5 вариантов)
│   ├── features/
│   │   ├── FileDropzone.tsx   # Зона загрузки файлов
│   │   ├── FileList.tsx       # Список файлов
│   │   ├── FileRow.tsx        # Строка файла
│   │   ├── FormatSelector.tsx # Выбор формата
│   │   ├── FormatBadge.tsx    # Бейдж формата
│   │   ├── FeatureCard.tsx    # Карточка преимущества
│   │   ├── ConversionPanel.tsx # Панель управления
│   │   ├── LongVideoWarning.tsx # Предупреждение о длинных видео
│   │   └── LongAudioWarning.tsx # Предупреждение о длинных аудио
│   └── ui/                    # shadcn/ui компоненты
├── hooks/
│   └── useFileConverter.ts    # Хук управления конвертацией
└── lib/
    ├── converters/
    │   ├── index.ts           # ConverterService
    │   ├── image-converter.ts # Конвертер изображений
    │   ├── text-converter.ts  # Конвертер документов
    │   ├── audio-converter.ts # Конвертер аудио
    │   └── video-converter.ts # Конвертер видео
    ├── types.ts               # TypeScript типы
    └── utils.ts               # Утилиты (cn)
```

## Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| Next.js | 16 | React фреймворк с App Router |
| React | 19 | UI библиотека |
| TypeScript | 5 | Типизация |
| Tailwind CSS | 4 | Стилизация |
| shadcn/ui | - | Компоненты UI |
| Lucide React | - | Иконки |
| lamejs | - | Кодирование MP3 |
| @ffmpeg/ffmpeg | 0.12 | Видео конвертация (WASM) |

### Используемые Web API

- **Canvas API** - рендеринг и экспорт изображений
- **File API** - чтение файлов пользователя
- **Blob API** - создание результатов конвертации
- **URL.createObjectURL** - генерация ссылок для скачивания
- **Web Audio API** - декодирование и обработка аудио
- **SharedArrayBuffer** - требуется для ffmpeg.wasm (настроены COOP/COEP заголовки)

## Установка и запуск

```bash
# Клонирование репозитория
git clone <repository-url>
cd salpa

# Установка зависимостей
npm install

# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен сервера
npm start
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Ограничения

- Максимальный размер файла: 100 MB (500 MB для видео)
- Видео конвертация работает медленнее, чем нативные приложения (~1-2 мин на минуту видео)
- Для видео конвертации требуется браузер с поддержкой SharedArrayBuffer
- SVG → растровые форматы в разработке

## Хостинг

Приложение требует специальных HTTP-заголовков для поддержки SharedArrayBuffer (необходим для ffmpeg.wasm):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Поддерживаемые платформы:**
- ✅ Vercel - полная поддержка (заголовки настраиваются в next.config.ts)
- ✅ Собственный сервер - настройте заголовки в конфигурации сервера
- ❌ GitHub Pages - не поддерживает нужные заголовки (видео конвертация не будет работать)

## Разработка

### Структура логотипа

Логотип имеет 5 вариантов дизайна:
- `monogram` - буква S в круге (по умолчанию)
- `convertFile` - файл со стрелкой
- `convert` - стрелки конвертации
- `drop` - иконка загрузки
- `classic` - текстовый логотип

### Favicon

Favicon генерируется динамически через `src/app/icon.tsx` используя Next.js Image Response API. Отображает монограмму S в круге с прозрачным фоном.

### Toast уведомления

Используется библиотека Sonner с:
- Лимитом 3 видимых уведомления одновременно
- Стабильными ID для обновления существующих toast
- Кнопкой закрытия

## Contributing

Вклады приветствуются! Создавайте issue или pull request в репозитории:
https://github.com/kweharmony/salpa

## Лицензия

MIT
