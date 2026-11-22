import { expect, test } from '@playwright/test';

test('offline packs can be prepared, changed and removed without clearing other caches', async ({ page, context }) => {
  await page.goto('/');
  await page.getByText('Офлайн-режим', { exact: true }).click();
  await expect(page.getByText('Не подготовлен', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Подготовить офлайн-режим' }).click();
  await expect(page.getByText('Готов к работе', { exact: true })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText('Готово к работе без интернета: изображения и документы.', { exact: true })).toBeVisible();

  const audio = page.getByRole('checkbox', { name: 'Аудио', exact: true });
  await audio.check();
  await page.getByRole('button', { name: 'Сохранить настройки' }).click();
  await expect(page.getByText('Готово к работе без интернета: изображения и документы, аудио.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Сохранить настройки' })).toHaveCount(0);

  await page.evaluate(() => caches.open('unrelated-test-cache'));
  await context.setOffline(true);
  await expect(page.getByText(/Сейчас нет сети/)).toBeVisible();
  await expect(audio).toBeDisabled();
  await page.getByRole('button', { name: 'Удалить офлайн-ресурсы' }).click();
  await expect(page.getByText('Удалить все офлайн-ресурсы?')).toBeVisible();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByText('Готов к работе', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Удалить офлайн-ресурсы' }).click();
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByText('Офлайн-ресурсы удалены')).toBeVisible();
  await expect(page.getByText('Не подготовлен', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подготовить офлайн-режим' })).toBeDisabled();
  expect(await page.evaluate(() => caches.keys())).toEqual(['unrelated-test-cache']);
});

test('a new build is offered as an explicit offline update', async ({ page, context }) => {
  await page.goto('/');
  await page.getByText('Офлайн-режим', { exact: true }).click();
  await page.getByRole('button', { name: 'Подготовить офлайн-режим' }).click();
  await expect(page.getByText('Готов к работе', { exact: true })).toBeVisible({ timeout: 45_000 });

  const pattern = '**/offline-assets.json';
  await context.route(pattern, async (route) => {
    const original = await route.fetch();
    const manifest = await original.json();
    await route.fulfill({ response: original, json: { ...manifest, buildId: 'offline-update-test' } });
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText('Есть обновление', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Обновить ресурсы' }).click();
  await expect(page.getByText('Готов к работе', { exact: true })).toBeVisible({ timeout: 45_000 });
  expect(await page.evaluate(() => caches.keys())).toContain('salpa-offline-offline-update-test-shell');
});
