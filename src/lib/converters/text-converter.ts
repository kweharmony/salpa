import { LocalizedError } from '../i18n';
/**
 * Text/Document Converter Service
 * Конвертация текстовых файлов и документов
 */

import { parse as parseCSV } from 'csv-parse/browser/esm/sync';
import { Marked } from 'marked';
import { parse as parseYAML } from 'yaml';
import { getFileExtension } from '../types';

export type TextFormat = 'txt' | 'md' | 'json' | 'csv' | 'html' | 'xml';

export interface TextConversionOptions {
  format: TextFormat;
  sourceFormat?: string;
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
    const sourceFormat = options.sourceFormat ?? getFileExtension(file.name);

    onProgress?.(20);

    // Чтение файла как текст
    const text = await file.text();
    onProgress?.(50);

    let result: string;
    let mimeType: string;

    // Конвертация в зависимости от формата
    switch (format) {
      case 'json':
        result = this.toJSON(text, sourceFormat);
        mimeType = 'application/json';
        break;
      case 'csv':
        result = this.toCSV(text, sourceFormat);
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
  private static toJSON(text: string, sourceFormat: string): string {
    if (sourceFormat === 'csv') {
      const [headers = [], ...rows] = this.readCSV(text);
      if (new Set(headers).size !== headers.length) {
        throw new LocalizedError('duplicateCsv');
      }
      return JSON.stringify(rows.map((row) =>
        Object.fromEntries(headers.map((header, index) => [header, row[index]])),
      ), null, 2);
    }

    if (sourceFormat === 'yaml' || sourceFormat === 'yml') {
      try {
        return JSON.stringify(parseYAML(text, { maxAliasCount: 50 }), null, 2);
      } catch {
        throw new LocalizedError('malformedYaml');
      }
    }

    return JSON.stringify({ content: text.split('\n') }, null, 2);
  }

  /**
   * JSON → CSV
   */
  private static toCSV(text: string, sourceFormat: string): string {
    if (sourceFormat !== 'json') {
      return text.split(/\r\n|\n|\r/).map((line) => this.escapeCSV(line)).join('\n');
    }

    const data: unknown = this.readJSON(text);
    let rows: string[][];

    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      if (data.every((row): row is Record<string, unknown> => this.isRecord(row))) {
        const headers = [...new Set(data.flatMap((row) => Object.keys(row)))];
        rows = [headers, ...data.map((row) => headers.map((key) =>
          Object.hasOwn(row, key) ? this.csvValue(row[key]) : '',
        ))];
      } else {
        rows = [['value'], ...data.map((value) => [this.csvValue(value)])];
      }
    } else if (this.isRecord(data)) {
      rows = Object.entries(data).map(([key, value]) => [key, this.csvValue(value)]);
    } else {
      rows = [['value'], [this.csvValue(data)]];
    }

    return rows.map((row) => row.map((value) => this.escapeCSV(value)).join(',')).join('\n');
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private static csvValue(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private static readJSON(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      throw new LocalizedError('malformedJson');
    }
  }

  /**
   * → Markdown
   */
  private static toMarkdown(text: string, sourceFormat: string): string {
    if (sourceFormat === 'csv') {
      const [headers, ...rows] = this.readCSV(text);
      if (!headers) return '';
      const toRow = (values: string[]) =>
        '| ' + values.map((value) => value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/\\/g, '\\\\')
          .replace(/\|/g, '\\|')
          .replace(/\r\n|\n|\r/g, '<br>')).join(' | ') + ' |';
      return [toRow(headers), toRow(headers.map(() => '---')), ...rows.map(toRow)].join('\n');
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
      const [headers, ...rows] = this.readCSV(text);
      if (!headers) {
        body = '<p>Пустой файл</p>';
      } else {
        const headerCells = headers.map(h => `<th>${this.escapeHTML(h)}</th>`).join('');

        const dataRows = rows.map(values => {
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
    th, td { padding: 8px; text-align: left; border: 1px solid #ddd; white-space: pre-wrap; }
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
      const [headers, ...data] = this.readCSV(text);
      if (!headers) {
        xmlContent = '<root></root>';
      } else {
        const rows = data.map(values => {
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
      const items = obj.map(item => this.jsonToXML(item, 'item')).join('\n');
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
    const tag = str.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[0-9-]/, '_');
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
      return this.readCSV(text).map(row => row.join('\t')).join('\n');
    }

    if (sourceFormat === 'html') {
      const template = document.createElement('template');
      template.innerHTML = text;
      template.content.querySelectorAll('style,script,title,template').forEach((node) => node.remove());
      template.content.querySelectorAll('br,p,h1,h2,h3,h4,h5,h6,div,li,tr').forEach((node) => node.after('\n'));
      return (template.content.textContent ?? '').trim();
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

  private static readCSV(text: string): string[][] {
    try {
      return parseCSV(text, { bom: true, skip_empty_lines: true });
    } catch {
      throw new LocalizedError('malformedCsv');
    }
  }

  /**
   * Экранирует строку для CSV
   */
  private static escapeCSV(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
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

  private static markdownToHTML(md: string): string {
    const parser = new Marked({
      async: false,
      renderer: {
        html: ({ text }) => this.escapeHTML(text),
        image: ({ text }) => this.escapeHTML(text),
        link({ href, tokens }) {
          const label = this.parser.parseInline(tokens);
          try {
            const url = new URL(href, 'https://local.invalid');
            if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return label;
          } catch {
            return label;
          }
          const escaped = href.replace(/[&"<>]/g, (char) =>
            ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
          );
          return `<a href="${escaped}">${label}</a>`;
        },
      },
    });
    return parser.parse(md, { async: false });
  }
}
