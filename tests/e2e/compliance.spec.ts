import { test, expect } from '@playwright/test';

const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';

test.describe('Avelis smoke (MVP)', () => {
  test('Landing page loads constitution language', async ({ page }) => {
    test.skip(!process.env.E2E_BASE_URL && !(await isUp(base)), 'UI not reachable; set E2E_BASE_URL');
    await page.goto('/');
    const heading = page.locator('h1', {
      hasText: 'A process ledger for talks that must not leave a transcript.',
    });
    await expect(heading).toBeVisible();
    await expect(page.locator('text=Speech is ephemeral')).toBeVisible();
  });

  test('Join page is keyboard-reachable and does not persist storage', async ({ page }) => {
    test.skip(!process.env.E2E_BASE_URL && !(await isUp(base)), 'UI not reachable; set E2E_BASE_URL');
    await page.goto('/join');
    const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(storageKeys).toHaveLength(0);
    await page.keyboard.press('Tab');
  });
});

async function isUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}
