import { LocalizedError } from '../i18n';
import { createArchive } from '../download-archive';
import type { ConversionOptions, ConversionOutput } from '../types';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';

function getLines(items: TextItem[]): string[] {
  const lines: string[] = [];
  let line = '';
  let previous: TextItem | undefined;

  function flush() {
    if (line.trim()) lines.push(line.trim());
    line = '';
    previous = undefined;
  }

  for (const item of items) {
    if (previous) {
      const fontSize = Math.max(1, item.height || previous.height);
      const deltaY = Math.abs(item.transform[5] - previous.transform[5]);
      const gap = item.transform[4] - previous.transform[4] - previous.width;
      if (deltaY > fontSize * 0.55) flush();
      else if (gap > fontSize * 0.15 && !/\s$/.test(line) && !/^\s/.test(item.str)) line += ' ';
    }

    line += item.str;
    previous = item;
    if (item.hasEOL) flush();
  }

  flush();
  return lines;
}

async function extractText(
  pdf: PDFDocumentProxy,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
) {
  const pages: string[][] = [];
  for (let index = 1; index <= pdf.numPages; index++) {
    signal?.throwIfAborted();
    const page = await pdf.getPage(index);
    try {
      const { items } = await page.getTextContent();
      pages.push(getLines(items.filter((item): item is TextItem => 'str' in item)));
    } finally {
      page.cleanup();
    }
    onProgress(20 + 70 * index / pdf.numPages);
  }

  if (pages.every((page) => !page.length)) {
    throw new LocalizedError('pdfNoText');
  }

  return pages;
}

async function renderPage(
  pdf: PDFDocumentProxy,
  index: number,
  format: 'png' | 'jpg',
  options?: ConversionOptions,
  signal?: AbortSignal,
): Promise<Blob> {
  const page = await pdf.getPage(index);
  signal?.throwIfAborted();
  const natural = page.getViewport({ scale: 1 });
  const side = Math.min(options?.maxDimension ?? 4096, 4096);
  const scale = Math.min(2, side / Math.max(natural.width, natural.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const task = page.render({ canvas, viewport, background: '#ffffff' });
  const abort = () => task.cancel();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    await task.promise;
    signal?.throwIfAborted();
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob?.type === mime) resolve(blob);
        else reject(new LocalizedError('pdfImageSave'));
      }, mime, options?.quality ?? 0.92);
    });
  } finally {
    signal?.removeEventListener('abort', abort);
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
  }
}

async function* renderPageEntries(
  pdf: PDFDocumentProxy,
  format: 'png' | 'jpg',
  baseName: string,
  onProgress: (progress: number) => void,
  options?: ConversionOptions,
  signal?: AbortSignal,
) {
  const digits = String(pdf.numPages).length;
  for (let index = 1; index <= pdf.numPages; index++) {
    signal?.throwIfAborted();
    const image = await renderPage(pdf, index, format, options, signal);
    const number = String(index).padStart(digits, '0');
    onProgress(20 + 75 * index / pdf.numPages);
    yield { name: `${baseName}-${number}.${format}`, blob: image };
  }
}

export async function convertPdf(
  file: File,
  format: 'png' | 'jpg' | 'txt' | 'docx',
  baseName: string,
  onProgress: (progress: number) => void,
  options?: ConversionOptions,
  signal?: AbortSignal,
): Promise<ConversionOutput> {
  const pdfjs = await import('pdfjs-dist');
  const data = new Uint8Array(await file.arrayBuffer());
  signal?.throwIfAborted();

  const assets = new URL('/engine/pdf/', location.origin).href;
  pdfjs.GlobalWorkerOptions.workerSrc = assets + 'pdf.worker.min.mjs';
  const loading = pdfjs.getDocument({
    data,
    cMapUrl: assets + 'cmaps/',
    cMapPacked: true,
    standardFontDataUrl: assets + 'standard_fonts/',
    wasmUrl: assets + 'wasm/',
    iccUrl: assets + 'iccs/',
    enableXfa: false,
  });
  let released: Promise<void> | undefined;

  function release() {
    return released ??= loading.destroy().catch(() => undefined);
  }

  function abort() {
    void release();
  }

  signal?.addEventListener('abort', abort, { once: true });
  try {
    const pdf = await loading.promise;
    onProgress(20);

    if (format === 'png' || format === 'jpg') {
      if (pdf.numPages === 1) {
        return {
          kind: 'download',
          filename: `${baseName}.${format}`,
          blob: await renderPage(pdf, 1, format, options, signal),
        };
      }
      return {
        kind: 'download',
        filename: `${baseName}-pages.zip`,
        blob: await createArchive(renderPageEntries(pdf, format, baseName, onProgress, options, signal)),
        note: { key: 'pdfPageCount', params: { count: pdf.numPages } },
      };
    }

    const pages = await extractText(pdf, onProgress, signal);
    const empty = pages.filter((page) => !page.length).length;
    const note = empty > 0
      ? { key: 'pdfMissingText' as const, params: { count: empty, total: pages.length } }
      : undefined;
    let blob: Blob;
    if (format === 'docx') {
      const { writeDocx } = await import('./docx-writer');
      blob = await writeDocx(pages);
    } else {
      blob = new Blob([pages.map((page) => page.join('\n')).join('\n\n')], { type: 'text/plain;charset=utf-8' });
    }
    return { kind: 'download', filename: `${baseName}.${format}`, blob, note };
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new LocalizedError('pdfLocked');
    }
    if (error instanceof Error && (error.name === 'InvalidPDFException' || error.name === 'FormatError')) {
      throw new LocalizedError('pdfInvalid');
    }
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    await release();
  }
}
