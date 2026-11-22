import type { ConversionOptions, ConversionOutput, FormatInfo } from '../types';

async function imageToPdf(file: File, options?: ConversionOptions, signal?: AbortSignal): Promise<Blob> {
  const { ImageConverter } = await import('./image-converter');
  const image = await ImageConverter.convert(file, { format: 'png', maxDimension: options?.maxDimension });
  signal?.throwIfAborted();

  const { PDFDocument, PageSizes } = await import('pdf-lib');
  const document = await PDFDocument.create();
  const picture = await document.embedPng(await image.arrayBuffer());
  const [short, long] = PageSizes.A4;
  const [width, height] = picture.width > picture.height ? [long, short] : [short, long];
  const page = document.addPage([width, height]);
  const size = picture.scaleToFit(width - 48, height - 48);
  page.drawImage(picture, {
    ...size,
    x: (width - size.width) / 2,
    y: (height - size.height) / 2,
  });
  const bytes = await document.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

export async function convertDocument(
  file: File,
  source: FormatInfo,
  target: string,
  baseName: string,
  options?: ConversionOptions,
  onProgress: (progress: number) => void = () => undefined,
  signal?: AbortSignal,
): Promise<ConversionOutput> {
  onProgress(10);
  let result: ConversionOutput;
  if (source.extension === 'pdf') {
    const { convertPdf } = await import('./pdf-converter');
    result = await convertPdf(file, target as 'png' | 'jpg' | 'txt' | 'docx', baseName, onProgress, options, signal);
  } else if (source.extension === 'docx') {
    const { readDocx } = await import('./docx-preview');
    const preview = await readDocx(file, baseName, signal);
    if (target === 'pdf') {
      result = { kind: 'print', html: preview.html, title: baseName };
    } else {
      const type = target === 'html' ? 'text/html' : 'text/plain';
      const content = target === 'html' ? preview.html : preview.text;
      result = {
        kind: 'download',
        filename: `${baseName}.${target}`,
        blob: new Blob([content], { type: type + ';charset=utf-8' }),
      };
    }
  } else if (target === 'docx') {
    const { writeDocx } = await import('./docx-writer');
    const text = await file.text();
    result = {
      kind: 'download',
      filename: `${baseName}.docx`,
      blob: await writeDocx([text.split(/\r\n|\n|\r/)]),
    };
  } else {
    result = {
      kind: 'download',
      filename: `${baseName}.pdf`,
      blob: await imageToPdf(file, options, signal),
    };
  }
  onProgress(100);
  return result;
}
