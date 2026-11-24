import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Properties page', () => {
  test('creates a property and lists it', async ({ page }) => {
    await login(page);
    await page.goto('/properties');
    await page.fill('#prop-name', 'Test Property');
    await page.fill('#prop-addr1', '123 Test St');
    await page.fill('#prop-city', 'Springfield');
    await page.fill('#prop-state', 'IL');
    await page.fill('#prop-zip', '62701');
    await page.fill('#prop-country', 'USA');
    await page.getByRole('button', { name: /Create Property/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Test Property')).toBeVisible();
  });

  test('shows error when fields are invalid', async ({ page }) => {
    await login(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: /Create Property/ }).click();
    await expect(page.locator('div[role="alert"]', { hasText: /Name/ })).toBeVisible();
  });
});
