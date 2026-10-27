import { expect, test } from '@playwright/test';

test('updates the HUD for coins and power-ups', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));
  await page.getByRole('button', { name: 'Play' }).click();
  await page.evaluate(() => (window as any).__game.debugAddCoins(5));
  await expect(page.getByTestId('coin-count')).toHaveText('5');
  await page.evaluate(() => (window as any).__game.debugActivatePowerUp('magnet'));
  await expect(page.getByTestId('powerup-magnet')).toBeVisible();
});