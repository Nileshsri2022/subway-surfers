import { expect, test } from '@playwright/test';

test('mounts the character rig without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForFunction(() => Boolean(window.__SUBWAY_RUNNER__?.ready));
  await expect(page.locator('#game-canvas')).toBeVisible();

  const characterParts = await page.evaluate(
    () => window.__SUBWAY_RUNNER__?.characterParts ?? 0
  );
  expect(characterParts).toBeGreaterThanOrEqual(6);

  expect(errors).toEqual([]);
});
