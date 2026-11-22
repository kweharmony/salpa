import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { Uint8ArrayReader, ZipReader } from '@zip.js/zip.js';

const fixture = (name: string) => join(process.cwd(), 'tests/e2e/fixtures', name);

function entry(page: Page, name: string) {
  return page.getByRole('listitem', { name, exact: true });
}

async function download(page: Page, button: Locator) {
  const [file] = await Promise.all([page.waitForEvent('download'), button.click()]);
  return { name: file.suggestedFilename(), data: await readFile(await file.path()) };
}

function sineWave() {
  const rate = 44100;
  const samples = 11025;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * index / rate) * 6000), 44 + index * 2);
  }
  return wav;
}

test('a partial batch downloads successful files and retries only failed jobs', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles([
    { name: 'note.yaml', mimeType: 'application/yaml', buffer: Buffer.from('hello: world') },
    { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') },
    { name: 'unsupported.bin', mimeType: 'application/octet-stream', buffer: Buffer.from('unsupported') },
  ]);

  await expect(page.getByText(/unsupported.bin — Формат файла не поддерживается/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Выходной формат: broken.json' }).click();
  await page.getByRole('option', { name: 'CSV' }).click();
  await page.getByRole('button', { name: 'Конвертировать (2)' }).click();
  await expect(page.getByText('Готово 1 из 2')).toBeVisible();
  await expect(entry(page, 'broken.json').getByText('Невалидный JSON')).toBeVisible();

  const zip = await download(page, page.getByRole('button', { name: 'Скачать готовое ZIP-архивом' }));
  expect(zip.name).toBe('Salpa.zip');
  const reader = new ZipReader(new Uint8ArrayReader(zip.data));
  expect((await reader.getEntries()).map((item) => item.filename)).toEqual(['note.json']);
  await reader.close();

  await page.getByRole('combobox', { name: 'Выходной формат: broken.json' }).click();
  await page.getByRole('option', { name: 'TXT' }).click();
  await page.getByRole('button', { name: 'Повторить ошибки (1)' }).click();
  await expect(page.getByText('Готово 2 из 2')).toBeVisible();
  await expect(entry(page, 'note.yaml').getByRole('button', { name: 'Скачать' })).toBeVisible();
});

test('photo preset and advanced settings resize a HEIC image and export JPEG', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles(fixture('photo.heic'));

  await expect(page.getByLabel('Качество результата')).toHaveValue('balanced');
  await page.getByLabel('Качество результата').selectOption('high');
  await expect(page.getByLabel('Качество JPG / WebP, %')).toBeHidden();
  await page.getByText('Расширенные настройки', { exact: true }).click();
  await expect(page.getByLabel('Качество JPG / WebP, %')).toHaveValue('97');
  await page.getByRole('button', { name: 'Сжать фото для отправки' }).click();
  await expect(page.getByLabel('Качество JPG / WebP, %')).toHaveValue('80');
  await expect(page.getByLabel('Максимальная сторона, пикс.')).toHaveValue('1920');

  await page.getByLabel('Максимальная сторона, пикс.').fill('32');
  await page.getByRole('button', { name: 'Применить к списку' }).click();
  await page.getByRole('button', { name: 'Конвертировать' }).click();
  await expect(page.getByText('Готово 1 из 1')).toBeVisible();
  const jpg = await download(page, entry(page, 'photo.heic').getByRole('button', { name: 'Скачать' }));
  expect(jpg.name).toBe('photo.jpg');
  expect(jpg.data.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));

  const dimensions = await page.evaluate(async (bytes) => {
    const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' }));
    return [image.width, image.height];
  }, Array.from(jpg.data));
  expect(dimensions).toEqual([32, 20]);
});

test('prepared audio and video work offline, with copy and transcode paths', async ({ page, context }) => {
  await page.goto('/');
  await page.getByText('Офлайн-режим', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Аудио' }).check();
  await page.getByRole('checkbox', { name: /Видео/ }).check();
  await page.getByRole('button', { name: 'Подготовить офлайн-режим' }).click();
  await expect(page.getByText(/Готово к работе без интернета.*аудио, видео/)).toBeVisible({ timeout: 45_000 });

  await context.setOffline(true);
  await page.goto('/formats');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('Офлайн-режим · готов', { exact: true })).toBeVisible();
  await page.locator('#file-input').setInputFiles([
    { name: 'tone.wav', mimeType: 'audio/wav', buffer: sineWave() },
    { name: 'h264.mkv', mimeType: 'video/x-matroska', buffer: await readFile(fixture('h264.mkv')) },
    { name: 'vp8.webm', mimeType: 'video/webm', buffer: await readFile(fixture('vp8.webm')) },
  ]);

  await page.getByLabel('Формат для совместимых файлов').selectOption('mp4');
  await page.getByText('Расширенные настройки', { exact: true }).click();
  await page.getByRole('checkbox', { name: /Попробовать без перекодирования/ }).check();
  await page.getByRole('button', { name: 'Применить к списку' }).click();
  await page.getByRole('button', { name: 'Конвертировать (3)' }).click();

  await expect(page.getByText('Готово 3 из 3')).toBeVisible({ timeout: 55_000 });
  await expect(entry(page, 'h264.mkv').getByText(/Без перекодирования/)).toBeVisible();
  await expect(entry(page, 'vp8.webm').getByText(/Без перекодирования/)).toHaveCount(0);
  const mp3 = await download(page, entry(page, 'tone.wav').getByRole('button', { name: 'Скачать' }));
  expect(mp3.name).toBe('tone.mp3');
  expect(mp3.data[0]).toBe(0xff);
  for (const name of ['h264.mkv', 'vp8.webm']) {
    const mp4 = await download(page, entry(page, name).getByRole('button', { name: 'Скачать' }));
    expect(mp4.data.subarray(4, 8).toString()).toBe('ftyp');
  }
});

test.describe('video recovery', () => {
  test.use({ serviceWorkers: 'block' });

  test('a temporary engine error can be retried in the same tab', async ({ page, context }) => {
    const pattern = '**/engine/**/ffmpeg-core.wasm';
    await context.route(pattern, (route) => route.abort());
    await page.goto('/');
    await page.locator('#file-input').setInputFiles(fixture('h264.mkv'));
    await page.getByRole('button', { name: 'Конвертировать' }).click();
    await expect(entry(page, 'h264.mkv').getByText(/Не удалось загрузить видеоконвертер/)).toBeVisible();
    await context.unroute(pattern);
    await page.getByRole('button', { name: 'Повторить ошибки (1)' }).click();
    await expect(page.getByText('Готово 1 из 1')).toBeVisible({ timeout: 35_000 });
  });

  test('stopping the active job leaves the rest of the queue available', async ({ page, context }) => {
    let release: () => void = () => {};
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const pattern = '**/engine/**/ffmpeg-core.wasm';
    const request = page.waitForRequest(pattern);
    await context.route(pattern, async (route) => {
      await waiting;
      await route.continue().catch(() => undefined);
    });
    await page.goto('/');
    await page.locator('#file-input').setInputFiles([fixture('h264.mkv'), fixture('vp8.webm')]);
    await page.getByRole('button', { name: 'Конвертировать (2)' }).click();
    try {
      await request;
      await page.getByRole('button', { name: 'Остановить очередь' }).click();
      await expect(entry(page, 'h264.mkv').getByText('Отменено')).toBeVisible();
      await expect(entry(page, 'vp8.webm').getByText('Ожидание')).toBeVisible();
    } finally {
      release();
      await context.unroute(pattern);
    }
    await page.getByRole('button', { name: 'Конвертировать (2)' }).click();
    await expect(page.getByText('Готово 2 из 2')).toBeVisible({ timeout: 35_000 });
  });
});
