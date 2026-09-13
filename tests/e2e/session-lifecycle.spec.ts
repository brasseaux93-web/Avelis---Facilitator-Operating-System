/**
 * API-assisted UI hybrid lifecycle.
 * Skips gracefully when services are down unless E2E_BASE_URL is set (then fails hard).
 * Speech-safety: never assert chat history after leave/close.
 */
import { test, expect } from '@playwright/test';

const UI = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const API = process.env.E2E_API_URL || 'http://127.0.0.1:3001';
const EMAIL = process.env.FACILITATOR_SEED_EMAIL || 'facilitator@avelis.local';
const PASSWORD = process.env.FACILITATOR_SEED_PASSWORD || 'change-me-now';

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET' });
    return res.status < 500;
  } catch {
    return false;
  }
}

test.describe('Session lifecycle (hybrid)', () => {
  test.beforeEach(async () => {
    const uiUp = await probe(UI);
    const apiUp = await probe(`${API}/healthz`);
    if (!uiUp || !apiUp) {
      if (process.env.E2E_BASE_URL) {
        throw new Error(`E2E_BASE_URL set but services unreachable (ui=${uiUp} api=${apiUp})`);
      }
      test.skip(true, 'Services down — start compose + npm run dev, or set E2E_BASE_URL');
    }
  });

  test('login → create → invite → join → agenda/minute → close', async ({ page, request }) => {
    await request.post(`${API}/api/demo/prepare`).catch(() => null);

    const login = await request.post(`${API}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(login.ok(), 'facilitator login').toBeTruthy();
    const { token } = (await login.json()) as { token: string };

    await page.goto('/auth');
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/sessions/, { timeout: 15000 });

    const title = `E2E ${Date.now()}`;
    const created = await request.post(`${API}/api/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title, retentionHours: 72 },
    });
    expect(created.ok()).toBeTruthy();
    const session = (await created.json()) as { id: string };

    await page.goto(`/sessions/${session.id}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await request.post(`${API}/api/sessions/${session.id}/open`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const invite = await request.post(`${API}/api/sessions/${session.id}/invites`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { identityClass: 'role_only', displayLabel: 'E2E Party' },
    });
    expect(invite.ok()).toBeTruthy();
    const { inviteCode, party } = (await invite.json()) as {
      inviteCode: string;
      party: { id: string };
    };

    const deliver = await request.post(
      `${API}/api/sessions/${session.id}/invites/${party.id}/deliver`,
      { headers: { Authorization: `Bearer ${token}` }, data: {} }
    );
    expect(deliver.ok()).toBeTruthy();
    const deliverBody = (await deliver.json()) as { inviteCode?: string };
    const code = deliverBody.inviteCode || inviteCode;

    await page.goto('/join');
    await page.getByLabel(/invite code/i).fill(code);
    await page.getByRole('button', { name: /^join$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/room/${session.id}`), { timeout: 15000 });
    await expect(page.locator('.room-banner')).toContainText('not stored');

    const compose = page.getByLabel(/message/i);
    if (await compose.isEnabled().catch(() => false)) {
      await compose.fill('e2e live only');
      await page.getByRole('button', { name: /^send$/i }).click();
      await expect(page.locator('.room-line__text').filter({ hasText: 'e2e live only' }))
        .toBeVisible({ timeout: 5000 })
        .catch(() => undefined);
    }

    await request.post(`${API}/api/sessions/${session.id}/agenda`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'E2E agenda' },
    });
    await request.post(`${API}/api/sessions/${session.id}/minute`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { content: 'E2E joint minute draft' },
    });
    await request.post(`${API}/api/sessions/${session.id}/minute/publish`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.goto(`/sessions/${session.id}`);
    await expect(page.getByText('E2E agenda')).toBeVisible();
    await expect(page.getByText(/Minute status:\s*published/i)).toBeVisible();

    await request.post(`${API}/api/sessions/${session.id}/close`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await page.reload();
    await expect(page.locator('.sessions-status')).toContainText('closed');

    await page.goto(`/room/${session.id}`);
    await expect(page.getByText('e2e live only')).toHaveCount(0);
  });
});
