import { expect, test } from '@playwright/test';
import { apiLogin, authHeaders, createMaintenance, createProperty, uiLogin } from './helpers';

test.describe('Audit log', () => {
  test('shows audit entries in the admin UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    await createMaintenance(request, token, property.id);

    await uiLogin(page);
    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { name: 'Admin • Audit' })).toBeVisible();
    await expect(page.locator('li', { hasText: 'Created • MaintenanceRequest' }).first()).toBeVisible();
  });

  test('filters audit entries by entity in the UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    await createMaintenance(request, token, property.id);

    await uiLogin(page);
    await page.goto('/admin/audit');
    await page.getByRole('button', { name: /^Filter/ }).click();
    await page.fill('#audit-entity', 'MaintenanceRequest');
    await page.getByRole('button', { name: 'Apply audit filter' }).click();
    const items = page.locator('ul > li');
    await expect(items.first()).toContainText('MaintenanceRequest');
    await expect(items.filter({ hasText: 'Tenant' })).toHaveCount(0);
  });

  test('returns paginated audit entries through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    await createMaintenance(request, token, property.id);

    const response = await request.get('/api/admin/audit?page=1&pageSize=5&entity=MaintenanceRequest', {
      headers: authHeaders(token),
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
    expect(body.total).toBeGreaterThan(0);
    expect(body.items[0].entityName).toBe('MaintenanceRequest');
  });

  test('returns an empty page for an unknown entity', async ({ request }) => {
    const token = await apiLogin(request);
    const response = await request.get('/api/admin/audit?entity=NoSuchEntity', {
      headers: authHeaders(token),
    });
    expect((await response.json()).total).toBe(0);
  });

  test('blocks non-admin roles from audit data', async ({ request }) => {
    expect((await request.get('/api/admin/audit')).status()).toBe(401);

    const username = `auditviewer-${Date.now()}`;
    const registration = await request.post('/api/auth/register', {
      data: { username, email: `${username}@test.local`, password: 'Viewer@12345' },
    });
    const token = (await registration.json()).accessToken;
    const response = await request.get('/api/admin/audit', { headers: authHeaders(token) });
    expect(response.status()).toBe(403);
  });
});
