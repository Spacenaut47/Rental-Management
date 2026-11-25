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

const futureStart = () => new Date(Date.now() + 2 * 86_400_000).toISOString();
const futureEnd = () => new Date(Date.now() + 40 * 86_400_000).toISOString();

test.describe('Units and leases', () => {
  test('creates a unit from the UI and shows it in the list', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const number = unique('101');

    await uiLogin(page);
    await page.goto('/units');
    await page.getByRole('button', { name: 'Add Unit' }).click();
    await page.selectOption('#unit-prop-select', String(property.id));
    await page.fill('#unit-number', number);
    await page.fill('#unit-bedrooms', '3');
    await page.fill('#unit-bathrooms', '2');
    await page.fill('#unit-rent', '1500');
    await page.fill('#unit-size', '900');
    await page.getByRole('button', { name: 'Create Unit' }).click();
    await expect(page.locator('li', { hasText: `Unit #` }).filter({ hasText: number })).toBeVisible();
  });

  test('filters units by property in the UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);

    await uiLogin(page);
    await page.goto('/units');
    await page.getByRole('button', { name: 'Filter units' }).click();
    await page.fill('#units-filter-propertyId', String(property.id));
    await page.getByRole('button', { name: 'Apply property filter' }).click();
    await expect(page.locator('li', { hasText: unit.unitNumber })).toBeVisible();
  });

  test('deletes a unit from the UI after confirmation', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    acceptDialogs(page);

    await uiLogin(page);
    await page.goto('/units');
    await page.getByRole('button', { name: `Delete unit ${unit.unitNumber}` }).click();
    await expect(page.locator('li', { hasText: unit.unitNumber })).toHaveCount(0);
  });

  test('creates a lease from the UI and lists it', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);

    await uiLogin(page);
    await page.goto('/leases');
    await page.getByRole('button', { name: 'Add Lease' }).click();
    await page.selectOption('#lease-unit-select', String(unit.id));
    await page.selectOption('#lease-tenant-select', String(tenant.id));
    await page.fill('#lease-start', futureStart());
    await page.fill('#lease-end', futureEnd());
    await page.getByRole('button', { name: 'Create Lease' }).click();
    await expect(page.locator('li', { hasText: `Unit #${unit.id}` })).toBeVisible();
  });

  test('deletes a lease from the UI after confirmation', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    const lease = await createLease(request, token, unit.id, tenant.id);
    acceptDialogs(page);

    await uiLogin(page);
    await page.goto('/leases');
    const row = page.locator('li', { hasText: `Unit #${unit.id}` });
    await row.getByRole('button', { name: `Delete lease ${lease.id}` }).click();
    await expect(row).toHaveCount(0);
  });

  test('filters leases by unit and active status through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    const lease = await createLease(request, token, unit.id, tenant.id);

    const response = await request.get(`/api/leases?unitId=${unit.id}&active=true`, {
      headers: authHeaders(token),
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: lease.id })]));
  });

  test('updates and deletes a lease through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    const lease = await createLease(request, token, unit.id, tenant.id);

    const update = await request.put(`/api/leases/${lease.id}`, {
      headers: authHeaders(token),
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        startDateUtc: futureStart(),
        endDateUtc: futureEnd(),
        monthlyRent: 2222,
        securityDeposit: 700,
      },
    });
    expect(update.status(), await update.text()).toBe(200);
    expect((await update.json()).monthlyRent).toBe(2222);

    expect((await request.delete(`/api/leases/${lease.id}`, { headers: authHeaders(token) })).status()).toBe(204);
    expect((await request.get(`/api/leases/${lease.id}`, { headers: authHeaders(token) })).status()).toBe(404);
  });

  test('rejects overlapping active leases', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    await createLease(request, token, unit.id, tenant.id);

    const overlap = await request.post('/api/leases', {
      headers: authHeaders(token),
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        startDateUtc: futureStart(),
        endDateUtc: futureEnd(),
        monthlyRent: 1000,
        securityDeposit: 0,
      },
    });
    expect(overlap.status()).toBe(409);
    expect((await overlap.json()).detail).toContain('overlapping');
  });

  test('rejects invalid lease references and date order', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);

    const missingUnit = await request.post('/api/leases', {
      headers: authHeaders(token),
      data: {
        unitId: 999999,
        tenantId: tenant.id,
        startDateUtc: futureStart(),
        endDateUtc: futureEnd(),
        monthlyRent: 1,
        securityDeposit: 0,
      },
    });
    expect(missingUnit.status()).toBe(400);
    expect((await missingUnit.json()).detail).toBe('Unit does not exist.');

    const badDates = await request.post('/api/leases', {
      headers: authHeaders(token),
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        startDateUtc: futureEnd(),
        endDateUtc: futureStart(),
        monthlyRent: 1,
        securityDeposit: 0,
      },
    });
    expect(badDates.status()).toBe(400);
  });

  test('performs unit CRUD through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);

    const detail = await request.get(`/api/units/${unit.id}`, { headers: authHeaders(token) });
    expect(detail.status()).toBe(200);
    expect((await detail.json()).unitNumber).toBe(unit.unitNumber);

    const update = await request.put(`/api/units/${unit.id}`, {
      headers: authHeaders(token),
      data: {
        propertyId: property.id,
        unitNumber: `${unit.unitNumber}-renamed`,
        bedrooms: 4,
        bathrooms: 3,
        rent: 2000,
        sizeSqFt: 1200,
        isOccupied: false,
      },
    });
    expect(update.status(), await update.text()).toBe(200);
    expect((await update.json()).bedrooms).toBe(4);

    expect((await request.delete(`/api/units/${unit.id}`, { headers: authHeaders(token) })).status()).toBe(204);
    expect((await request.get(`/api/units/${unit.id}`, { headers: authHeaders(token) })).status()).toBe(404);
  });

  test('treats expired leases as inactive regardless of the stored flag', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    const lease = await createLease(request, token, unit.id, tenant.id, {
      startDateUtc: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      endDateUtc: new Date(Date.now() - 86_400_000).toISOString(),
    });

    const active = await request.get(`/api/leases?unitId=${unit.id}&active=true`, { headers: authHeaders(token) });
    expect(await active.json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: lease.id })]));

    const inactive = await request.get(`/api/leases?unitId=${unit.id}&active=false`, { headers: authHeaders(token) });
    expect(await inactive.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: lease.id })]));
  });

  test('requires staff access for units and leases', async ({ request }) => {
    expect((await request.get('/api/units')).status()).toBe(401);
    expect((await request.get('/api/leases')).status()).toBe(401);
  });
});
