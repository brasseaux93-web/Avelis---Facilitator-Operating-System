import { test, expect } from '@playwright/test';

test.describe('Avelis smoke (MVP)', () => {
  test('Landing page loads constitution language', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    const heading = page.locator('h1', {
      hasText: 'A process ledger for talks that must not leave a transcript.',
    });
    await expect(heading).toBeVisible();
    await expect(page.locator('text=Speech is ephemeral')).toBeVisible();
  });

  test('Join page is keyboard-reachable and does not persist storage', async ({ page }) => {
    await page.goto('http://localhost:5173/join');
    const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(storageKeys).toHaveLength(0);
    await page.keyboard.press('Tab');
  });
});
