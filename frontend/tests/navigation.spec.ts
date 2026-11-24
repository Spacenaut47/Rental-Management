import { test, expect } from '@playwright/test';
import { login, expectProtected } from './helpers';

test.describe('Navigation and shell', () => {
  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/properties');
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated users reach main shell and sidebar', async ({ page }) => {
    await login(page);
    await expectProtected(page);
    for (const label of ['Properties', 'Tenants', 'Units', 'Leases', 'Payments', 'Maintenance']) {
      await expect(page.getByRole('link', { name: label }).first()).toBeVisible();
    }
  });

  test('dashboard is reachable by authenticated user', async ({ page }) => {
    await login(page);
    await page.goto('/');
    await expectProtected(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
