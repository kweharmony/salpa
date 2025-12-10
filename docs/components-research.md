# Salpa - Исследование компонентов

## Обзор проекта

Salpa - браузерный конвертер файлов с морской тематикой. Все операции выполняются локально.

## Используемые библиотеки

### Основная библиотека: shadcn/ui
- Документация: https://ui.shadcn.com/
- Причина выбора: Высокое качество, кастомизируемость, совместимость с Tailwind CSS v4

### Иконки: Lucide Icons
- Документация: https://lucide.dev/icons/
- Размеры: 16px (small), 24px (default), 32px (large)

## Список компонентов

### Из shadcn/ui:

| Компонент | Применение | Страницы |
|-----------|------------|----------|
| Button | Primary, Secondary, Ghost кнопки | Все |
| Card | Карточки преимуществ, файлов | /, /about |
| Input | Поля поиска | /formats, /faq |
| Select | Выбор формата конвертации | / |
| DropdownMenu | Навигация мобильная | Все |
| Accordion | FAQ вопросы | /faq |
| Progress | Прогресс-бар конвертации | / |
| Badge | Бейджи форматов, статусов | /, /formats |
| Table | Список файлов, форматы | /, /formats |
| Sonner | Toast уведомления | Все |

### Кастомные компоненты:

| Компонент | Описание | Страница |
|-----------|----------|----------|
| Header | Навигация, логотип | Все |
| Footer | Ссылки, версия | Все |
| FileDropzone | Drag & Drop зона | / |
| FileRow | Строка файла в списке | / |
| FormatSelector | Выбор целевого формата | / |
| ConvertButton | Кнопка конвертации | / |
| DownloadButton | Скачивание файла | / |
| FeatureCard | Карточка преимущества | /about |
| FormatFilter | Фильтр форматов | /formats |
| FormatTable | Таблица форматов | /formats |
| FormatBadge | Бейдж формата | /formats |
| SearchBar | Поиск по FAQ | /faq |
| FAQAccordion | Аккордеон вопросов | /faq |
| SalpaLogo | SVG логотип | Все |

## Дизайн-система

### Цвета

**Основные:**
- Primary: #0A7EA4 (морской синий)
- Secondary: #66C2E0 (аквамарин)
- Accent: #FF6B6B (коралловый)

**Нейтральные:**
- Background: #FFFFFF, #F8FAFB, #E5E9EC
- Text: #1A2530 (основной), #6B7684 (вторичный), #A8B0B9 (disabled)

**Статусы:**
- Success: #22C55E
- Error: #EF4444
- Warning: #F59E0B
- Info: #3B82F6

### Типографика

Шрифт: Inter
- H1: 48px/700
- H2: 36px/700
- H3: 24px/600
- H4: 20px/600
- Body: 16px/400
- Small: 14px/400
- Tiny: 12px/400

### Отступы

Базовая единица: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Скругления

- sm: 4px (бейджи)
- md: 8px (кнопки, инпуты)
- lg: 12px (карточки)
- xl: 16px (модальные, dropzone)

### Тени

- elevation-1: 0 1px 3px rgba(26, 37, 48, 0.1)
- elevation-2: 0 4px 12px rgba(26, 37, 48, 0.1)
- elevation-3: 0 12px 32px rgba(26, 37, 48, 0.15)

### Анимации

- fast: 150ms (hover)
- normal: 250ms (dropdown, accordion)
- slow: 350ms (модальные)
- easing: ease-in-out

## Breakpoints

- xs: 0-640px
- sm: 640-768px
- md: 768-1024px
- lg: 1024-1280px
- xl: 1280px+

Container: max-width 1200px, padding 24px
Grid: 12 колонок, gutter 24px
