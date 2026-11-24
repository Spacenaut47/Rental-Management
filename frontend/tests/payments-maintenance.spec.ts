import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Payments and Maintenance', () => {
  test('payments page shows lease dropdown and total', async ({ page }) => {
    await login(page);
    await page.goto('/payments');
    await expect(page.getByLabel(/Lease ID/)).toBeVisible();
    await expect(page.getByText(/Total paid:/)).toBeVisible();
  });

  test('maintenance page loads with default filter', async ({ page }) => {
    await login(page);
    await page.goto('/maintenance');
    await expect(page.getByRole('button', { name: /Create Request/ })).toBeVisible();
  });
});
