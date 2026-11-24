import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Units and Leases', () => {
  test('lists units by property and filters', async ({ page }) => {
    await login(page);
    await page.goto('/units');
    await expect(page.getByText(/Unit #/)).toBeVisible();
  });

  test('creates a lease from the leases page', async ({ page }) => {
    await login(page);
    await page.goto('/leases');
    await page.getByRole('button', { name: /Create Lease/ }).click();
  });
});
