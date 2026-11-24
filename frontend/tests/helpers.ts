import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('#usernameOrEmail', 'admin');
  await page.fill('#password', 'Admin@12345');
  await page.getByRole('button', { name: /Login/ }).click();
  await expectProtected(page);
}

export async function expectProtected(page: Page) {
  await expect(page.getByRole('main')).toBeVisible();
}
