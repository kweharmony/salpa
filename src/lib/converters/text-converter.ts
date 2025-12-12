/**
 * Text/Document Converter Service
 * Конвертация текстовых файлов и документов
 */

export type TextFormat = 'txt' | 'md' | 'json' | 'csv' | 'html' | 'xml';

export interface TextConversionOptions {
  format: TextFormat;
}

export class TextConverter {
  /**
   * Конвертирует текстовый файл в указанный формат
   */
  static async convert(
    file: File,
    options: TextConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    const { format } = options;
    const sourceFormat = this.getFormat(file.name);

    onProgress?.(20);

    // Чтение файла как текст
    const text = await file.text();
    onProgress?.(50);

    let result: string;
    let mimeType: string;

    // Конвертация в зависимости от формата
    switch (format) {
      case 'json':
        result = await this.toJSON(text, sourceFormat);
        mimeType = 'application/json';
        break;
      case 'csv':
        result = await this.toCSV(text, sourceFormat);
        mimeType = 'text/csv';
        break;
      case 'md':
        result = this.toMarkdown(text, sourceFormat);
        mimeType = 'text/markdown';
        break;
      case 'html':
        result = this.toHTML(text, sourceFormat);
        mimeType = 'text/html';
        break;
      case 'xml':
        result = this.toXML(text, sourceFormat);
        mimeType = 'application/xml';
        break;
      case 'txt':
      default:
        result = this.toPlainText(text, sourceFormat);
        mimeType = 'text/plain';
        break;
    }

    onProgress?.(90);

    const blob = new Blob([result], { type: `${mimeType};charset=utf-8` });
    onProgress?.(100);

    return blob;
  }

  /**
   * CSV → JSON
   */
  private static async toJSON(text: string, sourceFormat: string): Promise<string> {
    if (sourceFormat === 'csv') {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '[]';

      const headers = this.parseCSVLine(lines[0]);
      const data = lines.slice(1).map(line => {
        const values = this.parseCSVLine(line);
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      return JSON.stringify(data, null, 2);
    }

    // TXT/MD → JSON (простое преобразование в массив строк)
    const lines = text.split('\n');
    return JSON.stringify({ content: lines }, null, 2);
  }

  /**
   * JSON → CSV
   */
  private static async toCSV(text: string, sourceFormat: string): Promise<string> {
    if (sourceFormat === 'json') {
      try {
        const data = JSON.parse(text);

        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0]);
          const headerLine = headers.map(h => this.escapeCSV(h)).join(',');

          const dataLines = data.map((row: Record<string, unknown>) =>
            headers.map(h => this.escapeCSV(String(row[h] ?? ''))).join(',')
          );

          return [headerLine, ...dataLines].join('\n');
        }

        // Если не массив, конвертируем в key-value
        const entries = Object.entries(data);
        return entries.map(([key, value]) =>
          `${this.escapeCSV(key)},${this.escapeCSV(String(value))}`
        ).join('\n');
      } catch {
        throw new Error('Невалидный JSON');
      }
    }

    // TXT/MD → CSV (каждая строка как ячейка)
    const lines = text.split('\n');
    return lines.map(line => this.escapeCSV(line)).join('\n');
  }

  /**
   * → Markdown
   */
  private static toMarkdown(text: string, sourceFormat: string): string {
    if (sourceFormat === 'csv') {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return '';

      const headers = this.parseCSVLine(lines[0]);
      const headerRow = '| ' + headers.join(' | ') + ' |';
      const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |';

      const dataRows = lines.slice(1).map(line => {
        const values = this.parseCSVLine(line);
        return '| ' + values.join(' | ') + ' |';
      });

      return [headerRow, separatorRow, ...dataRows].join('\n');
    }

    if (sourceFormat === 'json') {
      try {
        const data = JSON.parse(text);
        return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
      } catch {
        return text;
      }
    }

    return text;
  }

  /**
   * → HTML
   */
  private static toHTML(text: string, sourceFormat: string): string {
    let body: string;

    if (sourceFormat === 'csv') {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        body = '<p>Empty file</p>';
      } else {
        const headers = this.parseCSVLine(lines[0]);
        const headerCells = headers.map(h => `<th>${this.escapeHTML(h)}</th>`).join('');

        const dataRows = lines.slice(1).map(line => {
          const values = this.parseCSVLine(line);
          const cells = values.map(v => `<td>${this.escapeHTML(v)}</td>`).join('');
          return `<tr>${cells}</tr>`;
        });

        body = `<table border="1">
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${dataRows.join('\n    ')}</tbody>
</table>`;
      }
    } else if (sourceFormat === 'md') {
      // Простая конвертация Markdown → HTML
      body = this.markdownToHTML(text);
    } else {
      // Plain text → HTML
      body = `<pre>${this.escapeHTML(text)}</pre>`;
    }

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Converted Document</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
    th { background: #f5f5f5; }
    pre { background: #f5f5f5; padding: 16px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 4px; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
  }

  /**
   * → XML
   */
  private static toXML(text: string, sourceFormat: string): string {
    let xmlContent: string;

    if (sourceFormat === 'json') {
      try {
        const data = JSON.parse(text);
        xmlContent = this.jsonToXML(data, 'root');
      } catch {
        xmlContent = `<root><content>${this.escapeXML(text)}</content></root>`;
      }
    } else if (sourceFormat === 'csv') {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        xmlContent = '<root></root>';
      } else {
        const headers = this.parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => {
          const values = this.parseCSVLine(line);
          const cells = headers.map((h, i) =>
            `    <${this.toXMLTag(h)}>${this.escapeXML(values[i] || '')}</${this.toXMLTag(h)}>`
          ).join('\n');
          return `  <row>\n${cells}\n  </row>`;
        });
        xmlContent = `<root>\n${rows.join('\n')}\n</root>`;
      }
    } else {
      // TXT/MD → XML
      const lines = text.split('\n');
      const lineElements = lines.map((line, i) =>
        `  <line index="${i + 1}">${this.escapeXML(line)}</line>`
      ).join('\n');
      xmlContent = `<root>\n${lineElements}\n</root>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
  }

  /**
   * Конвертирует JSON объект в XML строку
   */
  private static jsonToXML(obj: unknown, tagName: string): string {
    if (obj === null || obj === undefined) {
      return `<${tagName}/>`;
    }

    if (Array.isArray(obj)) {
      const items = obj.map((item, i) => this.jsonToXML(item, 'item')).join('\n');
      return `<${tagName}>\n${items}\n</${tagName}>`;
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj as Record<string, unknown>);
      const content = entries.map(([key, value]) =>
        this.jsonToXML(value, this.toXMLTag(key))
      ).join('\n');
      return `<${tagName}>\n${content}\n</${tagName}>`;
    }

    return `<${tagName}>${this.escapeXML(String(obj))}</${tagName}>`;
  }

  /**
   * Преобразует строку в валидное имя XML тега
   */
  private static toXMLTag(str: string): string {
    // Удаляем недопустимые символы, заменяем пробелы на _
    let tag = str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[0-9-]/, '_');
    return tag || 'field';
  }

  /**
   * Экранирует XML
   */
  private static escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * → Plain Text
   */
  private static toPlainText(text: string, sourceFormat: string): string {
    if (sourceFormat === 'json') {
      try {
        const data = JSON.parse(text);
        return JSON.stringify(data, null, 2);
      } catch {
        return text;
      }
    }

    if (sourceFormat === 'csv') {
      const lines = text.split('\n').filter(line => line.trim());
      return lines.map(line => this.parseCSVLine(line).join('\t')).join('\n');
    }

    // Удаляем markdown синтаксис
    if (sourceFormat === 'md') {
      return text
        .replace(/^#{1,6}\s+/gm, '') // заголовки
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1') // italic
        .replace(/`([^`]+)`/g, '$1') // code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
    }

    return text;
  }

  /**
   * Парсит строку CSV с учётом кавычек
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Экранирует строку для CSV
   */
  private static escapeCSV(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Экранирует HTML
   */
  private static escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Простая конвертация Markdown → HTML
   */
  private static markdownToHTML(md: string): string {
    return md
      // Заголовки
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Получает формат файла по имени
   */
  private static getFormat(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext;
  }

  /**
   * Проверяет, поддерживается ли формат
   */
  static isSupported(mimeType: string): boolean {
    const supportedTypes = [
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json',
      'text/html',
      'application/xml',
      'text/xml',
    ];
    return supportedTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Возвращает доступные форматы для конвертации
   */
  static getAvailableFormats(sourceFormat: string): TextFormat[] {
    const formats: TextFormat[] = ['txt', 'md', 'json', 'csv', 'html', 'xml'];
    const ext = sourceFormat.toLowerCase();
    return formats.filter(f => f !== ext);
  }
}
