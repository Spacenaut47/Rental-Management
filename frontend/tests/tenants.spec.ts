import { expect, test } from '@playwright/test';
import {
  acceptDialogs,
  apiLogin,
  authHeaders,
  createLease,
  createProperty,
  createTenant,
  createUnit,
  uiLogin,
  unique,
} from './helpers';

test.describe('Tenants', () => {
  test('creates and lists a tenant in the UI', async ({ page }) => {
    const email = `${unique('ui-tenant')}@test.local`;
    await uiLogin(page);
    await page.goto('/tenants');
    await page.getByRole('button', { name: 'Add Tenant' }).click();
    await page.fill('#tenant-firstname', 'Alice');
    await page.fill('#tenant-lastname', unique('Tester'));
    await page.fill('#tenant-email', email);
    await page.fill('#tenant-phone', '555-0142');
    await page.getByRole('button', { name: 'Create Tenant' }).click();
    await expect(page.locator('li', { hasText: email })).toBeVisible();
  });

  test('searches tenants by email', async ({ page, request }) => {
    const token = await apiLogin(request);
    const tenant = await createTenant(request, token);
    await uiLogin(page);
    await page.goto('/tenants');
    await page.getByRole('button', { name: 'Filter tenants' }).click();
    await page.fill('#tenant-search', tenant.email);
    await page.getByRole('button', { name: 'Search tenants' }).click();
    await expect(page.locator('li', { hasText: tenant.email })).toBeVisible();
  });

  test('deletes a tenant from the UI after confirmation', async ({ page, request }) => {
    const token = await apiLogin(request);
    const tenant = await createTenant(request, token);
    acceptDialogs(page);
    await uiLogin(page);
    await page.goto('/tenants');
    await page.locator('li', { hasText: tenant.email })
      .getByRole('button', { name: `Delete tenant ${tenant.firstName} ${tenant.lastName}` })
      .click();
    await expect(page.locator('li', { hasText: tenant.email })).toHaveCount(0);
  });

  test('performs full tenant CRUD through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const tenant = await createTenant(request, token);

    const detail = await request.get(`/api/tenants/${tenant.id}`, { headers: authHeaders(token) });
    expect(detail.status()).toBe(200);
    expect((await detail.json()).email).toBe(tenant.email);

    const updatedEmail = `${unique('updated')}@test.local`;
    const update = await request.put(`/api/tenants/${tenant.id}`, {
      headers: authHeaders(token),
      data: { firstName: 'Updated', lastName: 'Tenant', email: updatedEmail, phone: '555-0199' },
    });
    expect(update.status(), await responseText(update)).toBe(200);
    expect((await update.json()).email).toBe(updatedEmail);

    const list = await request.get('/api/tenants?search=Updated', { headers: authHeaders(token) });
    expect(await list.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: tenant.id })]));

    expect((await request.delete(`/api/tenants/${tenant.id}`, { headers: authHeaders(token) })).status()).toBe(204);
    expect((await request.get(`/api/tenants/${tenant.id}`, { headers: authHeaders(token) })).status()).toBe(404);
  });

  test('rejects duplicate emails and invalid payloads', async ({ request }) => {
    const token = await apiLogin(request);
    const tenant = await createTenant(request, token);

    const duplicate = await request.post('/api/tenants', {
      headers: authHeaders(token),
      data: { firstName: 'Dup', lastName: 'Tenant', email: tenant.email },
    });
    expect(duplicate.status()).toBe(400);
    expect((await duplicate.json()).detail).toContain('already exists');

    const invalid = await request.post('/api/tenants', {
      headers: authHeaders(token),
      data: { firstName: '', lastName: '', email: 'not-an-email' },
    });
    expect(invalid.status()).toBe(400);
  });

  test('blocks deleting a tenant referenced by a lease', async ({ request }) => {
    const token = await apiLogin(request);
    const tenant = await createTenant(request, token);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const lease = await createLease(request, token, unit.id, tenant.id);

    const blocked = await request.delete(`/api/tenants/${tenant.id}`, { headers: authHeaders(token) });
    expect(blocked.status()).toBe(409);
    expect((await blocked.json()).detail).toContain('leases');

    expect((await request.delete(`/api/leases/${lease.id}`, { headers: authHeaders(token) })).status()).toBe(204);
    expect((await request.delete(`/api/tenants/${tenant.id}`, { headers: authHeaders(token) })).status()).toBe(204);
  });

  test('requires authentication', async ({ request }) => {
    expect((await request.get('/api/tenants')).status()).toBe(401);
    expect((await request.get('/api/tenants/1')).status()).toBe(401);
    expect((await request.post('/api/tenants', { data: {} })).status()).toBe(401);
  });
});

async function responseText(response: { text(): Promise<string> }) {
  return response.text();
}
