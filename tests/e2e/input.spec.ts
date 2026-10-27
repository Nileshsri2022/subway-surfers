import { expect, test } from '@playwright/test';
test('lane changes respond to keyboard', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));
  await page.getByRole('button', { name: 'Play' }).click();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).__game.debugPlayerLane())).toBe(1);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).__game.debugPlayerLane())).toBe(-1);
});