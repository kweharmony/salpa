import { expect, test } from '@playwright/test';

test('upload and archive actions fit the queue at a narrow mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  const upload = page.getByRole('button', { name: 'Зона для загрузки файлов' });
  expect(await upload.evaluate((element) => element.tagName)).toBe('BUTTON');
  await upload.focus();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.keyboard.press('Enter')]);

  const name = 'длинное_название_'.repeat(12) + '.txt';
  await chooser.setFiles({ name, mimeType: 'text/plain', buffer: Buffer.from('sample file') });
  const row = page.getByRole('listitem', { name, exact: true });
  await expect(row.getByText(name, { exact: true })).toHaveAttribute('title', name);
  await page.getByRole('button', { name: 'Конвертировать', exact: true }).click();
  await expect(page.getByText('Готово 1 из 1')).toBeVisible();
  const zip = page.getByRole('button', { name: 'Скачать ZIP', exact: true });
  expect(await zip.evaluate((button) => {
    const inner = button.getBoundingClientRect();
    const outer = button.parentElement!.getBoundingClientRect();
    return inner.left >= outer.left - 1 && inner.right <= outer.right + 1;
  })).toBe(true);
});

test('the mobile catalog fits the viewport and its format labels work with the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        async writeText() {
          return undefined;
        },
      },
    });
  });
  await page.goto('/formats');
  await page.getByRole('textbox', { name: 'Поиск формата…' }).fill(' PDF ');
  const copy = page.getByRole('button', { name: 'Скопировать PDF', exact: true });
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('PDF скопирован')).toBeVisible();
  await expect(page.getByText('Конвертируется в', { exact: true }).last()).toBeVisible();
  expect(await page.locator('[data-slot="table-container"]').evaluate((element) =>
    element.scrollWidth <= element.clientWidth + 1)).toBe(true);

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        async writeText() {
          throw new Error('Clipboard unavailable');
        },
      },
    });
  });
  await copy.press('Space');
  await expect(page.getByText('Не удалось скопировать формат в буфер обмена')).toBeVisible();
});


test('all pages fit phone, tablet and desktop widths', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 840 });
    for (const path of ['/', '/formats', '/faq', '/about']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const layout = await page.evaluate(async () => {
        await document.fonts.ready;
        const root = document.documentElement;
        return { width: root.clientWidth, content: root.scrollWidth };
      });
      expect(layout.content, `Page ${path} at ${width}px`).toBeLessThanOrEqual(layout.width + 1);
    }
  }
});
