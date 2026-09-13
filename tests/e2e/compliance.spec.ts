import { test, expect } from '@playwright/test';

// End-to-end compliance verification tests for Avelis
// These verify that the ephemeral room and process ledger abide by the product laws.

test.describe('Avelis Facilitator UI and Compliance', () => {
  test('Landing page loads and preserves original static content', async ({ page }) => {
    // Assuming Vite runs on 5173
    await page.goto('http://localhost:5173/');
    
    // Verify the hero title is present
    const heading = page.locator('h1', { hasText: 'A process ledger for talks that must not leave a transcript.' });
    await expect(heading).toBeVisible();

    // Verify L1 law is listed
    await expect(page.locator('text=Speech is ephemeral')).toBeVisible();
  });

  test('Room messages do not persist to storage (L1 Compliance)', async ({ page, context }) => {
    // Simulate joining a room
    await page.goto('http://localhost:5173/room?sessionId=test-session&partyClass=named');
    
    // We expect NO localStorage usage
    const storageKeys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(storageKeys).toHaveLength(0);

    // We expect NO indexedDB usage
    const idbExists = await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      return dbs.length > 0;
    });
    expect(idbExists).toBe(false);
  });
});
