import { expect, test } from '@playwright/test';
import {
  acceptDialogs,
  apiLogin,
  authHeaders,
  createMaintenance,
  createProperty,
  createUnit,
  uiLogin,
  unique,
} from './helpers';

test.describe('Maintenance', () => {
  test('creates a maintenance request in the UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const title = unique('Broken heater');

    await uiLogin(page);
    await page.goto('/maintenance');
    await page.getByRole('button', { name: 'Add Request' }).click();
    await page.selectOption('#mnt-prop-select', String(property.id));
    await page.fill('#mnt-title', title);
    await page.fill('#mnt-desc', 'No heat in the living room.');
    await page.selectOption('#mnt-priority', '4');
    await page.getByRole('button', { name: 'Create maintenance request' }).click();
    await expect(page.locator('li', { hasText: title })).toBeVisible();
  });

  test('marks a request resolved in the UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const requestItem = await createMaintenance(request, token, property.id);

    await uiLogin(page);
    await page.goto('/maintenance');
    const row = page.locator('li', { hasText: requestItem.title });
    await row.getByRole('button', { name: `Mark request ${requestItem.id} resolved` }).click();
    await expect(page.locator('li', { hasText: requestItem.title })).toContainText('Status 4');
  });

  test('filters requests by property and unit in the UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const requestItem = await createMaintenance(request, token, property.id, unit.id);

    await uiLogin(page);
    await page.goto('/maintenance');
    await page.getByRole('button', { name: 'Filter maintenance' }).click();
    await page.fill('#mnt-filter-prop', String(property.id));
    await page.fill('#mnt-filter-unit', String(unit.id));
    await page.getByRole('button', { name: 'Apply maintenance filters' }).click();
    await expect(page.locator('li', { hasText: requestItem.title })).toBeVisible();
  });

  test('deletes a request from the UI after confirmation', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const requestItem = await createMaintenance(request, token, property.id);
    acceptDialogs(page);

    await uiLogin(page);
    await page.goto('/maintenance');
    await page.getByRole('button', { name: `Delete request ${requestItem.id}` }).click();
    await expect(page.locator('li', { hasText: requestItem.title })).toHaveCount(0);
  });

  test('performs maintenance CRUD through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const requestItem = await createMaintenance(request, token, property.id, unit.id);

    const detail = await request.get(`/api/maintenance/${requestItem.id}`, { headers: authHeaders(token) });
    expect(detail.status()).toBe(200);
    expect((await detail.json()).title).toBe(requestItem.title);

    const update = await request.put(`/api/maintenance/${requestItem.id}`, {
      headers: authHeaders(token),
      data: { title: `${requestItem.title}-updated`, description: 'Fixed by test', priority: 4, status: 4 },
    });
    expect(update.status(), await update.text()).toBe(200);
    expect((await update.json()).status).toBe(4);

    const filtered = await request.get(`/api/maintenance?unitId=${unit.id}`, { headers: authHeaders(token) });
    expect(await filtered.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: requestItem.id })]));

    expect((await request.delete(`/api/maintenance/${requestItem.id}`, { headers: authHeaders(token) })).status()).toBe(204);
    expect((await request.get(`/api/maintenance/${requestItem.id}`, { headers: authHeaders(token) })).status()).toBe(404);
  });

  test('rejects invalid maintenance payloads and references', async ({ request }) => {
    const token = await apiLogin(request);
    const invalid = await request.post('/api/maintenance', {
      headers: authHeaders(token),
      data: { propertyId: 1, title: '', priority: 2 },
    });
    expect(invalid.status()).toBe(400);

    const missingProperty = await request.post('/api/maintenance', {
      headers: authHeaders(token),
      data: { propertyId: 999999, title: 'Broken', priority: 2 },
    });
    expect(missingProperty.status()).toBe(400);
    expect((await missingProperty.json()).detail).toBe('Property does not exist.');

    const property = await createProperty(request, token);
    const otherProperty = await createProperty(request, token);
    const unit = await createUnit(request, token, otherProperty.id);
    const wrongUnit = await request.post('/api/maintenance', {
      headers: authHeaders(token),
      data: { propertyId: property.id, unitId: unit.id, title: 'Broken', priority: 2 },
    });
    expect(wrongUnit.status()).toBe(400);
    expect((await wrongUnit.json()).detail).toContain('does not belong');
  });

  test('rejects invalid maintenance updates', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const item = await createMaintenance(request, token, property.id);

    const response = await request.put(`/api/maintenance/${item.id}`, {
      headers: authHeaders(token),
      data: { title: '', priority: 99, status: 99 },
    });
    expect(response.status()).toBe(400);
  });

  test('requires staff access for maintenance', async ({ request }) => {
    expect((await request.get('/api/maintenance')).status()).toBe(401);
    expect((await request.post('/api/maintenance', { data: {} })).status()).toBe(401);
  });
});
