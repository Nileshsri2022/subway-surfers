import { expect, test } from '@playwright/test';
test('starts, ends, and restarts a run', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByTestId('hud')).toBeVisible();
  await page.evaluate(() => (window as any).__game.debugEndRun());
  await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByTestId('hud')).toBeVisible();
});