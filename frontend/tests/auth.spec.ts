import { test, expect } from '@playwright/test';
import { login, expectProtected } from './helpers';

test.describe('Auth flows', () => {
  test('login redirects to dashboard and sets credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#usernameOrEmail', 'admin');
    await page.fill('#password', 'Admin@12345');
    await page.getByRole('button', { name: /Login/ }).click();
    await expectProtected(page);
    expect(await page.textContent('header')).toContain('Hi, admin');
  });

  test('login shows server error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#usernameOrEmail', 'bad');
    await page.fill('#password', 'wrong');
    await page.getByRole('button', { name: /Login/ }).click();
    await expect(page.getByRole('button', { name: /Login/ })).toBeVisible();
  });

  test('logout returns to login page', async ({ page }) => {
    await login(page);
    await expectProtected(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login**');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });
});
