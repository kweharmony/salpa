import DOMPurify from 'dompurify';
import { LocalizedError } from '../i18n';

interface DocxMarkup {
  markup: string;
  css: string;
}

const rendererScripts = ['/engine/docx/jszip.min.js', '/engine/docx/docx-preview.min.js', '/docx-frame.js'];

async function renderInFrame(file: File, signal?: AbortSignal): Promise<DocxMarkup> {
  const sources = await Promise.all(rendererScripts.map(async (path) => {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new LocalizedError('docxLoad');
    return response.text();
  })).catch(() => {
    signal?.throwIfAborted();
    throw new LocalizedError('docxLoad');
  });
  signal?.throwIfAborted();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(18)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const scripts = sources.map((script) =>
    `<script nonce="${nonce}">${script.replace(/<\/script/gi, '<\\/script')}</script>`,
  ).join('');
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    const { port1, port2 } = new MessageChannel();
    frame.hidden = true;
    frame.title = 'DOCX';
    frame.sandbox.add('allow-scripts');
    frame.srcdoc = `<!doctype html><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
${scripts}`;

    const startupTimeout = setTimeout(() => {
      cleanup();
      reject(new LocalizedError('docxLoad'));
    }, 20_000);

    function cleanup() {
      clearTimeout(startupTimeout);
      window.removeEventListener('message', start);
      signal?.removeEventListener('abort', abort);
      port1.close();
      frame.remove();
    }

    function abort() {
      cleanup();
      reject(signal?.reason);
    }

    function start(event: MessageEvent) {
      if (event.source !== frame.contentWindow || event.data !== 'salpa-docx-ready') return;
      clearTimeout(startupTimeout);
      window.removeEventListener('message', start);
      frame.contentWindow?.postMessage({ type: 'render-docx', file }, '*', [port2]);
    }

    port1.onmessage = ({ data }: MessageEvent<DocxMarkup | { error: true }>) => {
      cleanup();
      if ('error' in data) reject(new LocalizedError('docxInvalid'));
      else resolve(data);
    };

    window.addEventListener('message', start);
    signal?.addEventListener('abort', abort, { once: true });
    document.body.appendChild(frame);
  });
}

function plainText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element) && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return '';

  const tag = node instanceof Element ? node.tagName : '';
  if (tag === 'BR') return '\n';
  const children = Array.from(node.childNodes, plainText).join('');
  if (tag === 'TD' || tag === 'TH') return children.trimEnd() + '\t';
  if (/^(P|H[1-6]|LI|TR|SECTION)$/.test(tag)) return children.trimEnd() + '\n';
  return children;
}

function pageStyles(body: DocumentFragment): string {
  const sizes = new Map<string, string>();
  const rules: string[] = [];
  const length = /^\d+(?:\.\d+)?(?:pt|px|cm|mm|in)$/;

  for (const page of body.querySelectorAll<HTMLElement>('section.docx')) {
    const { width, minHeight } = page.style;
    if (!length.test(width) || !length.test(minHeight)) continue;

    const size = `${width} ${minHeight}`;
    let name = sizes.get(size);
    if (!name) {
      name = `salpa-page-${sizes.size + 1}`;
      sizes.set(size, name);
      rules.push(`@page ${name} { size: ${size}; margin: 0 }`);
      rules.push(`@media print { .${name} { page: ${name} } }`);
    }
    page.classList.add(name);
  }

  return rules.join('\n');
}

export async function readDocx(file: File, title: string, signal?: AbortSignal) {
  const { markup, css } = await renderInFrame(file, signal);
  signal?.throwIfAborted();
  const content = document.createElement('template');
  content.innerHTML = DOMPurify.sanitize(markup, {
    FORBID_TAGS: ['style', 'iframe', 'link', 'meta', 'base', 'form', 'object', 'embed'],
    ADD_DATA_URI_TAGS: ['image'],
  });
  const text = plainText(content.content).trim();
  const pages = pageStyles(content.content);
  const titleNode = document.createElement('title');
  titleNode.textContent = title;

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
${titleNode.outerHTML}
<style>
${css.replace(/</g, '\\3c ')}
${pages}
body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact }
@page { size: A4; margin: 0 }
@media print {
  .docx-wrapper > section.docx:not(:last-child) { break-after: page }
}
</style></head><body>${content.innerHTML}</body></html>`;
  return { text, html };
}
