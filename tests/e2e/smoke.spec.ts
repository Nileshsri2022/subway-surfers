import { expect, test } from '@playwright/test';

test('loads the scene without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__SUBWAY_RUNNER__?.ready));
  await expect(page.locator('#game-canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
