import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { TextWriter, Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from '@zip.js/zip.js';
import { Document, Header, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const wordMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function row(page: Page, name: string) {
  return page.getByRole('listitem', { name, exact: true });
}

async function selectFormat(page: Page, name: string, format: string) {
  await page.getByRole('combobox', { name: 'Выходной формат: ' + name }).click();
  await page.getByRole('listbox').getByRole('option', { name: format, exact: true }).click();
}

async function download(page: Page, name: string) {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    row(page, name).getByRole('button', { name: 'Скачать' }).click(),
  ]);
  return { name: file.suggestedFilename(), bytes: await readFile(await file.path()) };
}

async function wordExample() {
  const cells = (values: string[]) => values.map((text) => new TableCell({ children: [new Paragraph(text)] }));
  return Packer.toBuffer(new Document({
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 850, right: 850 } } },
      headers: { default: new Header({ children: [new Paragraph('Salpa / контрольный пример')] }) },
      children: [
        new Paragraph({ text: 'Заявка на поставку', heading: HeadingLevel.HEADING_1 }),
        new Paragraph('Кириллица и обычный текст.'),
        new Table({ rows: [
          new TableRow({ children: cells(['Материал', 'Количество']) }),
          new TableRow({ children: cells(['Бумага A4', '12']) }),
        ] }),
        new Paragraph({ text: 'Вторая страница заявки', pageBreakBefore: true }),
      ],
    }],
  }));
}

async function textPdf(withBlankPage = false) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const first = document.addPage([400, 220]);
  first.drawText('Invoice 42', { x: 30, y: 175, size: 16, font });
  first.drawText('Total: 120 units', { x: 30, y: 143, size: 12, font });
  document.addPage([250, 360]).drawText('Second page summary', { x: 30, y: 310, size: 14, font });
  if (withBlankPage) document.addPage([250, 360]);
  return Buffer.from(await document.save());
}

async function picture(page: Page) {
  const url = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 260;
    canvas.height = 110;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 260, 110);
    ctx.fillStyle = '#205378';
    ctx.fillRect(12, 12, 236, 16);
    ctx.font = '22px sans-serif';
    ctx.fillText('Скан документа', 26, 72);
    return canvas.toDataURL('image/png');
  });
  return Buffer.from(url.split(',')[1], 'base64');
}

async function wordXml(bytes: Uint8Array) {
  const zip = new ZipReader(new Uint8ArrayReader(bytes));
  try {
    const xml = (await zip.getEntries()).find((entry) => entry.filename === 'word/document.xml');
    if (!xml || xml.directory) throw new Error('No Word document content');
    return await xml.getData(new TextWriter());
  } finally {
    await zip.close();
  }
}

test('DOCX preview prints both pages with Cyrillic, a table and a header', async ({ page, context }, testInfo) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({
    name: 'заказ.docx', mimeType: wordMime, buffer: await wordExample(),
  });
  await page.getByRole('button', { name: 'Конвертировать' }).click();
  await expect(row(page, 'заказ.docx').getByText('Готово к печати')).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole('button', { name: /Скачать готовое ZIP/ })).toHaveCount(0);

  await row(page, 'заказ.docx').getByRole('button', { name: 'Печать в PDF' }).click();
  const preview = page.frameLocator('iframe[title="Страницы документа"]');
  await expect(preview.getByText('Заявка на поставку', { exact: true })).toBeVisible();
  await expect(preview.getByRole('cell', { name: 'Количество' })).toBeVisible();
  await expect(preview.getByText('Вторая страница заявки')).toBeVisible();
  await expect(preview.getByText('Salpa / контрольный пример').first()).toBeVisible();

  const iframe = page.locator('iframe[title="Страницы документа"]');
  await iframe.evaluate((element) => {
    const frame = element as HTMLIFrameElement;
    frame.contentWindow!.print = () => frame.setAttribute('data-print-called', 'true');
  });
  await page.getByRole('button', { name: 'Печать и сохранение' }).click();
  await expect(iframe).toHaveAttribute('data-print-called', 'true');

  const printable = await context.newPage();
  try {
    await printable.setContent((await iframe.getAttribute('srcdoc'))!);
    const bytes = await printable.pdf({ preferCSSPageSize: true, printBackground: true });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
    await writeFile(testInfo.outputPath('preview.pdf'), bytes);
  } finally {
    await printable.close();
  }
});

test('Word and TXT exports keep their text, table fields and Cyrillic', async ({ page }) => {
  await page.goto('/');
  const word = await wordExample();
  await page.locator('#file-input').setInputFiles([
    { name: 'plain.docx', mimeType: wordMime, buffer: word },
    { name: 'layout.docx', mimeType: wordMime, buffer: word },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Первая строка\r\n\r\nТретья строка') },
  ]);
  await selectFormat(page, 'plain.docx', 'TXT');
  await selectFormat(page, 'layout.docx', 'HTML');
  await selectFormat(page, 'notes.txt', 'DOCX');
  await page.getByRole('button', { name: 'Конвертировать (3)' }).click();
  await expect(page.getByText('Готово 3 из 3')).toBeVisible({ timeout: 25_000 });

  const txt = await download(page, 'plain.docx');
  expect(txt.name).toBe('plain.txt');
  expect(txt.bytes.toString()).toContain('Материал\tКоличество\nБумага A4\t12');
  const html = await download(page, 'layout.docx');
  expect(html.name).toBe('layout.html');
  expect(html.bytes.toString()).toContain('<table');
  expect(html.bytes.toString()).toContain('Кириллица и обычный текст.');

  const docx = await download(page, 'notes.txt');
  expect(docx.name).toBe('notes.docx');
  expect(await wordXml(docx.bytes)).toMatch(/Первая строка.*Третья строка/);
});

test('PDF text becomes editable Word and TXT, with a note for a blank page', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles([
    { name: 'invoice.pdf', mimeType: 'application/pdf', buffer: await textPdf(true) },
    { name: 'summary.pdf', mimeType: 'application/pdf', buffer: await textPdf() },
  ]);
  await selectFormat(page, 'summary.pdf', 'TXT');
  await page.getByRole('button', { name: 'Конвертировать (2)' }).click();
  await expect(page.getByText('Готово 2 из 2')).toBeVisible();
  await expect(row(page, 'invoice.pdf').getByText('Без извлечённого текста — 1 из 3 стр.')).toBeVisible();
  const docx = await download(page, 'invoice.pdf');
  expect(docx.name).toBe('invoice.docx');
  const xml = await wordXml(docx.bytes);
  expect(xml).toMatch(/Invoice 42.*Total: 120 units.*Second page summary/);
  expect(xml.match(/<w:pageBreakBefore\/>/g)).toHaveLength(2);
  await writeFile(testInfo.outputPath('reconstructed.docx'), docx.bytes);

  const txt = await download(page, 'summary.pdf');
  expect(txt.name).toBe('summary.txt');
  expect(txt.bytes.toString()).toBe('Invoice 42\nTotal: 120 units\n\nSecond page summary');
});

test('a scan can be exported to PNG and an image becomes an A4 PDF', async ({ page }, testInfo) => {
  await page.goto('/');
  const png = await picture(page);
  const scan = await PDFDocument.create();
  const image = await scan.embedPng(png);
  scan.addPage([260, 110]).drawImage(image, { x: 0, y: 0, width: 260, height: 110 });
  await page.locator('#file-input').setInputFiles([
    { name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await scan.save()) },
    { name: 'picture.png', mimeType: 'image/png', buffer: png },
  ]);
  await selectFormat(page, 'picture.png', 'PDF');
  await page.getByRole('button', { name: 'Конвертировать (2)' }).click();
  await expect(row(page, 'scan.pdf').getByText(/нет извлекаемого текста/)).toBeVisible();

  const pdf = await download(page, 'picture.png');
  expect(pdf.name).toBe('picture.pdf');
  const pageSize = (await PDFDocument.load(pdf.bytes)).getPage(0).getSize();
  expect(pageSize.width).toBeCloseTo(841.89, 1);
  expect(pageSize.height).toBeCloseTo(595.28, 1);
  await writeFile(testInfo.outputPath('picture.pdf'), pdf.bytes);

  await selectFormat(page, 'scan.pdf', 'PNG');
  await page.getByRole('button', { name: 'Повторить ошибки (1)' }).click();
  await expect(page.getByText('Готово 2 из 2')).toBeVisible();
  const pageImage = await download(page, 'scan.pdf');
  expect(pageImage.name).toBe('scan.png');
  expect(pageImage.bytes.readUInt32BE(16)).toBe(520);
  expect(pageImage.bytes.readUInt32BE(20)).toBe(220);
  await writeFile(testInfo.outputPath('scan.png'), pageImage.bytes);
});

test('offline DOCX renders and PDF pages become a JPG archive', async ({ page, context }) => {
  await page.goto('/');
  await page.getByText('Офлайн-режим', { exact: true }).click();
  await page.getByRole('button', { name: 'Подготовить офлайн-режим' }).click();
  await expect(page.getByText(/Готово к работе без интернета/)).toBeVisible({ timeout: 45_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Офлайн-режим · готов', { exact: true })).toBeVisible();
  await page.locator('#file-input').setInputFiles([
    { name: 'pages.pdf', mimeType: 'application/pdf', buffer: await textPdf() },
    { name: 'офлайн.docx', mimeType: wordMime, buffer: await wordExample() },
  ]);
  await selectFormat(page, 'pages.pdf', 'JPG');
  await page.getByRole('button', { name: 'Конвертировать (2)' }).click();
  await expect(page.getByText('Готово 2 из 2')).toBeVisible({ timeout: 25_000 });
  await expect(row(page, 'офлайн.docx').getByRole('button', { name: 'Печать в PDF' })).toBeVisible();

  const downloaded = await download(page, 'pages.pdf');
  expect(downloaded.name).toBe('pages-pages.zip');
  const zip = new ZipReader(new Uint8ArrayReader(downloaded.bytes));
  try {
    const files = (await zip.getEntries()).filter((file) => !file.directory);
    expect(files.map((file) => file.filename)).toEqual(['pages-1.jpg', 'pages-2.jpg']);
    for (const file of files) {
      const jpg = await file.getData(new Uint8ArrayWriter());
      expect(Array.from(jpg.subarray(0, 2))).toEqual([255, 216]);
    }
  } finally {
    await zip.close();
  }
});

test('the tab favicon uses the existing blue monogram', async ({ page }) => {
  await page.goto('/');
  const icons = await page.locator('link[rel="icon"]').evaluateAll((links) =>
    links.map((link) => (link as HTMLLinkElement).href));
  expect(icons.some((href) => new URL(href).pathname === '/favicon.ico')).toBe(true);
  const pixels = await page.evaluate(async () => {
    async function decode(url: string) {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, 32, 32);
      return Array.from(context.getImageData(0, 0, 32, 32).data);
    }
    const [favicon, original] = await Promise.all([decode('/favicon.ico'), decode('/icon')]);
    const bluePixels = favicon.filter((red, index) =>
      index % 4 === 0 && favicon[index + 3] > 240 && red < 30 && favicon[index + 2] > 150).length;
    return { bluePixels, same: favicon.every((value, index) => value === original[index]) };
  });
  expect(pixels.bluePixels).toBeGreaterThan(100);
  expect(pixels.same).toBe(true);
});
