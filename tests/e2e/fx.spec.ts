import { expect, test } from '@playwright/test';

test('fx renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});