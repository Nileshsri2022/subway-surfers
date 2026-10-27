import { expect, test } from '@playwright/test';

test('loads offline after first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__game));

  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveCount(1);

  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => Boolean((window as any).__game));
  await expect(page.locator('#game-canvas')).toBeVisible();
});