import { expect, test } from '@playwright/test';

test('language switching translates navigation, search and existing queue messages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Язык' }).selectOption('en');
  await expect(page.getByRole('heading', { name: 'Convert files locally in your browser' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.locator('#file-input').setInputFiles({
    name: 'sample.bin', mimeType: 'application/octet-stream', buffer: Buffer.from('unsupported format'),
  });
  await expect(page.getByText('sample.bin — File format is unsupported')).toBeVisible();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('zh-Hans');
  await expect(page.getByText('sample.bin — 不支持此文件格式')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');

  await page.getByRole('navigation').getByRole('link', { name: '格式', exact: true }).click();
  await expect(page.getByRole('heading', { name: '支持的格式' })).toBeVisible();
  await page.getByRole('textbox', { name: '搜索格式…' }).fill('可移植文档格式');
  await expect(page.getByText('可移植文档格式', { exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: '常见问题' }).click();
  await page.getByRole('textbox', { name: '搜索问题…' }).fill('扫描件');
  await expect(page.getByRole('button', { name: /将 DOCX 保存为 PDF/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: '常见问题' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '语言' })).toHaveValue('zh-Hans');
  await page.getByRole('navigation').getByRole('link', { name: '关于' }).click();
  await expect(page.getByRole('heading', { name: /保护隐私的文件转换器/ })).toBeVisible();
});

test('language switching works offline in the mobile header', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Язык' }).selectOption('en');
  await page.getByText('Offline mode', { exact: true }).click();
  await page.getByRole('button', { name: 'Prepare offline mode' }).click();
  await expect(page.getByText(/Ready to use offline/)).toBeVisible({ timeout: 45_000 });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Language' })).toHaveValue('en');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('zh-Hans');
  await expect(page.getByRole('heading', { name: '直接在浏览器中本地转换文件' })).toBeVisible();
  await page.getByRole('button', { name: '打开菜单' }).click();
  await expect(page.getByRole('link', { name: '格式', exact: true }).first()).toBeVisible();
  await page.getByRole('combobox', { name: '语言' }).selectOption('ru');
  await expect(page.getByRole('heading', { name: 'Конвертируйте файлы локально в браузере' })).toBeVisible();
});
