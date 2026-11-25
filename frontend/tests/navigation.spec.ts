import { expect, test } from '@playwright/test';
import { uiLogin, unique } from './helpers';

const protectedRoutes = [
  '/',
  '/properties',
  '/tenants',
  '/units',
  '/leases',
  '/payments',
  '/maintenance',
  '/admin/audit',
];

test.describe('Navigation and shell', () => {
  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated users to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('shows every section link after login', async ({ page }) => {
    await uiLogin(page);
    for (const label of ['Properties', 'Tenants', 'Units', 'Leases', 'Payments', 'Maintenance', 'Audit']) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
  });

  test('marks the current sidebar route as active', async ({ page }) => {
    await uiLogin(page);
    await page.goto('/units');
    const link = page.getByRole('link', { name: 'Units', exact: true });
    await expect(link).toHaveClass(/font-semibold/);
  });

  test('hides the sidebar on public auth pages', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('aside')).toHaveCount(0);
  });

  test('dashboard renders the welcome panel', async ({ page }) => {
    await uiLogin(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome! Use the sidebar to navigate.')).toBeVisible();
  });

  test('login page links to registration', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('main').getByRole('link', { name: 'Register' }).click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
  });

  test('tenant accounts cannot see manager-only forms', async ({ page, request }) => {
    const username = unique('viewer');
    const response = await request.post('/api/auth/register', {
      data: { username, email: `${username}@test.local`, password: 'Viewer@12345' },
    });
    expect(response.status(), await response.text()).toBe(200);

    await uiLogin(page, { usernameOrEmail: username, password: 'Viewer@12345' });
    await page.goto('/properties');
    await expect(page.getByRole('heading', { name: 'Properties', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create Property' })).toHaveCount(0);
    await page.goto('/maintenance');
    await expect(page.getByRole('button', { name: 'Create maintenance request' })).toHaveCount(0);
  });
});
