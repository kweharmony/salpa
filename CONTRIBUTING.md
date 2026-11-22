# Contributing to Salpa

Спасибо за интерес к проекту Salpa! Мы приветствуем любой вклад в развитие приложения.

## Оглавление

- [Code of Conduct](#code-of-conduct)
- [Как помочь проекту](#как-помочь-проекту)
- [Процесс разработки](#процесс-разработки)
- [Настройка окружения](#настройка-окружения)
- [Структура проекта](#структура-проекта)
- [Правила кодирования](#правила-кодирования)
- [Тестирование](#тестирование)
- [Pull Request процесс](#pull-request-процесс)

## Code of Conduct

Мы придерживаемся принципов уважительного общения и открытости. Пожалуйста:
- Будьте вежливы и уважительны к другим участникам
- Приветствуйте новичков и помогайте им
- Конструктивно критикуйте код, а не людей
- Фокусируйтесь на улучшении проекта

## Как помочь проекту

### 1. Сообщение об ошибках (Bug Reports)

Если вы нашли ошибку:

1. Проверьте, не создан ли уже [issue](https://github.com/kweharmony/salpa/issues)
2. Создайте новый issue с описанием:
   - Шаги для воспроизведения
   - Ожидаемое поведение
   - Фактическое поведение
   - Скриншоты (если применимо)
   - Информация о браузере и ОС

**Пример:**

```markdown
**Описание:**
При конвертации PNG >10MB появляется ошибка "Out of memory"

**Воспроизведение:**
1. Загрузить PNG файл размером 15MB
2. Выбрать формат JPG
3. Нажать "Конвертировать"

**Ожидаемое поведение:**
Успешная конвертация файла

**Фактическое поведение:**
Ошибка "Out of memory" и зависание браузера

**Окружение:**
- Браузер: Chrome 120.0
- ОС: Windows 11
- RAM: 8GB
```

### 2. Предложение новых функций (Feature Requests)

Хотите предложить новую функцию?

1. Создайте issue с меткой `enhancement`
2. Опишите:
   - Зачем нужна эта функция
   - Как она должна работать
   - Примеры использования

### 3. Добавление поддержки форматов

Хотите добавить новый формат конвертации?

1. Проверьте [список форматов](../README.md#поддерживаемые-форматы)
2. Создайте issue для обсуждения
3. Убедитесь, что формат можно конвертировать через Web API
4. Следуйте структуре существующих конвертеров

### 4. Улучшение документации

Документация никогда не бывает идеальной:
- Исправление опечаток
- Добавление примеров
- Перевод на другие языки
- Улучшение README

### 5. Код

Вклад в код приветствуется! См. разделы ниже.

## Процесс разработки

### 1. Fork репозитория

```bash
# Клонируйте свой форк
git clone https://github.com/YOUR_USERNAME/salpa.git
cd salpa

# Добавьте upstream
git remote add upstream https://github.com/kweharmony/salpa.git
```

### 2. Создайте ветку

```bash
# Синхронизируйте с upstream
git fetch upstream
git checkout main
git merge upstream/main

# Создайте feature ветку
git checkout -b feature/new-format-support
# или
git checkout -b fix/memory-leak-in-video-converter
```

**Правила именования веток:**
- `feature/` - новые функции
- `fix/` - исправление багов
- `docs/` - документация
- `refactor/` - рефакторинг
- `test/` - тесты

### 3. Разработка

```bash
# Установите зависимости
npm install

# Запустите dev сервер
npm run dev

# Откройте http://localhost:3000
```

### 4. Коммиты

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add SVG to PNG conversion support"
git commit -m "fix: resolve memory leak in audio converter"
git commit -m "docs: update deployment guide for Vercel"
git commit -m "refactor: extract format detection to separate service"
```

**Типы коммитов:**
- `feat:` - новая функция
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование кода (без изменения логики)
- `refactor:` - рефакторинг кода
- `test:` - добавление или исправление тестов
- `chore:` - изменения в сборке или вспомогательных инструментах

### 5. Push и Pull Request

```bash
# Push в ваш fork
git push origin feature/new-format-support

# Создайте Pull Request на GitHub
```

## Настройка окружения

### Требования

- Node.js 22.13+
- npm или yarn
- Современный браузер (Chrome, Firefox, Edge)

### Установка

```bash
# Клонирование
git clone https://github.com/kweharmony/salpa.git
cd salpa

# Установка зависимостей
npm install

# Запуск в dev режиме
npm run dev

# Сборка для продакшена
npm run build

# Проверка типов
npx tsc --noEmit

# Линтинг
npm run lint
```

### VS Code настройка (рекомендуется)

Установите расширения:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

Создайте `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Структура проекта

```
salpa/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Главная страница (конвертер)
│   │   ├── about/             # О проекте
│   │   ├── formats/           # Список форматов
│   │   ├── faq/               # FAQ
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Глобальные стили
│   │   └── icon.tsx           # Динамический favicon
│   │
│   ├── components/
│   │   ├── layout/            # Header, Footer, Logo
│   │   ├── features/          # Функциональные компоненты
│   │   └── ui/                # shadcn/ui компоненты
│   │
│   ├── hooks/
│   │   └── useFileConverter.ts # Главный хук конвертации
│   │
│   └── lib/
│       ├── converters/        # Логика конвертации
│       │   ├── index.ts       # ConverterService (главный)
│       │   ├── image-converter.ts
│       │   ├── text-converter.ts
│       │   ├── audio-converter.ts
│       │   └── video-converter.ts
│       ├── types.ts           # TypeScript типы
│       ├── utils.ts           # Утилиты
│       └── faq-data.ts        # Данные для FAQ
│
├── docs/                      # Документация
├── public/                    # Статические файлы
└── User/design/               # Дизайн файлы
```

### Ключевые файлы

- **`src/lib/converters/index.ts`** - главный сервис конвертации
- **`src/hooks/useFileConverter.ts`** - React хук управления состоянием
- **`src/lib/types.ts`** - все TypeScript типы и интерфейсы
- **`src/app/page.tsx`** - UI главной страницы

## Правила кодирования

### TypeScript

```typescript
// ✅ Хорошо: Используйте типы
interface ConversionOptions {
  quality?: number;
  format: string;
}

async function convert(file: File, options: ConversionOptions): Promise<Blob> {
  // ...
}

// ❌ Плохо: any
async function convert(file: any, options: any) {
  // ...
}
```

### React компоненты

```typescript
// ✅ Хорошо: Функциональные компоненты с типами
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn("btn", `btn-${variant}`)}
    >
      {children}
    </button>
  );
}

// ❌ Плохо: без типов
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### Именование

```typescript
// Компоненты - PascalCase
export function FileDropzone() {}

// Функции и переменные - camelCase
const convertFile = async (file: File) => {}

// Константы - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Типы и интерфейсы - PascalCase
interface FileConversionResult {}
type ConversionStatus = 'idle' | 'converting' | 'complete';
```

### Стили (Tailwind)

```tsx
// ✅ Хорошо: используйте cn() для условных классов
import { cn } from '@/lib/utils';

<button 
  className={cn(
    "px-4 py-2 rounded-lg",
    isActive && "bg-primary text-white",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
/>

// ❌ Плохо: строковая конкатенация
<button 
  className={`px-4 py-2 ${isActive ? 'bg-primary' : ''}`}
/>
```

### Асинхронный код

```typescript
// ✅ Хорошо: try-catch с типизацией ошибок
async function convertImage(file: File): Promise<Blob> {
  try {
    const result = await processImage(file);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Image conversion failed:', error.message);
    }
    throw error;
  }
}

// ❌ Плохо: без обработки ошибок
async function convertImage(file: File) {
  return await processImage(file);
}
```

## Тестирование

`npm test` проверяет конвертеры и форматы. `npm run test:e2e` проверяет production-сборку в Chromium после `npm run build` и `npx playwright install chromium`.

### Ручное тестирование

Перед созданием PR протестируйте:

1. **Функциональность**
   - Загрузка файлов разных форматов
   - Конвертация во все доступные форматы
   - Скачивание результатов

2. **Граничные случаи**
   - Очень большие файлы (50-100MB)
   - Очень маленькие файлы (<1KB)
   - Файлы с кириллицей в названии
   - Одновременная конвертация нескольких файлов

3. **Ошибки**
   - Неподдерживаемый формат
   - Поврежденный файл
   - Отмена конвертации

4. **UI/UX**
   - Мобильная версия
   - Темная тема (если добавлена)
   - Загрузка больших файлов (прогресс-бар)

### Браузеры

Тестируйте минимум в:
- ✅ Chrome (последняя версия)
- ✅ Firefox (последняя версия)
- ✅ Safari (если есть macOS)
- ✅ Edge

## Pull Request процесс

### 1. Перед созданием PR

- [ ] Код работает локально
- [ ] Нет TypeScript ошибок (`npx tsc --noEmit`)
- [ ] Нет ESLint ошибок (`npm run lint`)
- [ ] Протестировано в нескольких браузерах
- [ ] Обновлена документация (если нужно)
- [ ] Добавлены комментарии к сложным участкам

### 2. Создание PR

**Заголовок:** Используйте Conventional Commits

```
feat: add HEIC to JPG conversion support
fix: memory leak in video converter for large files
docs: add deployment guide for Docker
```

**Описание:** Используйте шаблон

```markdown
## Описание
Краткое описание изменений

## Мотивация и контекст
Зачем нужны эти изменения? Какую проблему решают?

## Связанные Issue
Fixes #123
Related to #456

## Тип изменений
- [ ] Bug fix (изменение, исправляющее проблему)
- [ ] New feature (изменение, добавляющее функциональность)
- [ ] Breaking change (изменение, ломающее обратную совместимость)
- [ ] Documentation update

## Чеклист
- [ ] Код соответствует стайл-гайду
- [ ] Я провел самостоятельный code review
- [ ] Я добавил комментарии к сложным участкам
- [ ] Я обновил документацию
- [ ] Изменения не генерируют новых предупреждений
- [ ] Я протестировал функциональность

## Скриншоты (если применимо)
```

### 3. Code Review

После создания PR:
1. Автоматически запустятся проверки (lint, build)
2. Мейнтейнеры проведут code review
3. Внесите правки, если требуется
4. После одобрения PR будет смержен

### 4. После мерджа

Ваши изменения:
- Автоматически задеплоятся на Vercel
- Будут доступны пользователям
- Вы получите благодарность в CHANGELOG

## Приоритетные задачи

Сейчас особенно нужна помощь с:

### Высокий приоритет
- [ ] Поддержка SVG → растровые форматы
- [ ] Оптимизация памяти для больших файлов
- [ ] Поддержка темной темы
- [x] Unit-тесты для конвертеров
- [x] E2E-тесты (Playwright)

### Средний приоритет
- [x] Поддержка PDF → изображения
- [x] Пакетная конвертация с экспортом в ZIP
- [ ] История конвертаций (localStorage)
- [x] Офлайн-режим с кэшированием движков

### Низкий приоритет
- [ ] Интеграция с облачными хранилищами
- [x] Расширенные настройки качества
- [ ] Предпросмотр результата перед скачиванием

## Вопросы?

- Создайте [Discussion](https://github.com/kweharmony/salpa/discussions)
- Напишите в [Issues](https://github.com/kweharmony/salpa/issues)

## Лицензия

Создавая PR, вы соглашаетесь, что ваш код будет распространяться под лицензией MIT.

---

Спасибо за вклад в Salpa! 🎉
