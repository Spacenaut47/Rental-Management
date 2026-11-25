import { expect, test } from '@playwright/test';
import {
  acceptDialogs,
  apiLogin,
  authHeaders,
  createProperty,
  uiLogin,
  unique,
} from './helpers';

test.describe('Properties', () => {
  test('creates and lists a property in the UI', async ({ page }) => {
    const name = unique('UI Property');
    await uiLogin(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: 'Add Property' }).click();
    await page.fill('#prop-name', name);
    await page.fill('#prop-addr1', '12 Main Street');
    await page.fill('#prop-city', 'Chicago');
    await page.fill('#prop-state', 'IL');
    await page.fill('#prop-zip', '60601');
    await page.fill('#prop-country', 'USA');
    await page.getByRole('button', { name: 'Create Property' }).click();
    await expect(page.locator('li', { hasText: name })).toBeVisible();
  });

  test('enforces required fields in the create form', async ({ page }) => {
    await uiLogin(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: 'Add Property' }).click();
    await page.fill('#prop-name', 'Incomplete');
    await page.getByRole('button', { name: 'Create Property' }).click();
    expect(await page.locator('#prop-city').evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
  });

  test('deletes a property from the UI after confirmation', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    acceptDialogs(page);
    await uiLogin(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: `Delete property ${property.name}` }).click();
    await expect(page.locator('li', { hasText: property.name })).toHaveCount(0);
  });

  test('lists and fetches a property through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);

    const list = await request.get('/api/properties', { headers: authHeaders(token) });
    expect(list.status()).toBe(200);
    expect(await list.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: property.id })]));

    const detail = await request.get(`/api/properties/${property.id}`, { headers: authHeaders(token) });
    expect(detail.status()).toBe(200);
    expect((await detail.json()).name).toBe(property.name);
  });

  test('updates a property through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const renamed = `${property.name}-updated`;
    const response = await request.put(`/api/properties/${property.id}`, {
      headers: authHeaders(token),
      data: {
        name: renamed,
        addressLine1: '99 Updated Road',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'USA',
      },
    });
    expect(response.status(), await response.text()).toBe(200);
    expect((await response.json()).name).toBe(renamed);
  });

  test('deletes a property through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    expect((await request.delete(`/api/properties/${property.id}`, { headers: authHeaders(token) })).status()).toBe(204);
    expect((await request.get(`/api/properties/${property.id}`, { headers: authHeaders(token) })).status()).toBe(404);
  });

  test('rejects invalid property payloads with 400', async ({ request }) => {
    const token = await apiLogin(request);
    const response = await request.post('/api/properties', {
      headers: authHeaders(token),
      data: { name: '', addressLine1: '', city: '', state: '', zip: '', country: '' },
    });
    expect(response.status()).toBe(400);
  });

  test('requires authentication and manager role', async ({ request }) => {
    expect((await request.get('/api/properties')).status()).toBe(401);

    const username = unique('propertyviewer');
    expect((await request.post('/api/auth/register', {
      data: { username, email: `${username}@test.local`, password: 'Viewer@12345' },
    })).status()).toBe(200);
    const login = await request.post('/api/auth/login', {
      data: { usernameOrEmail: username, password: 'Viewer@12345' },
    });
    const headers = authHeaders((await login.json()).accessToken);
    expect((await request.get('/api/properties', { headers })).status()).toBe(403);
    expect((await request.post('/api/properties', { headers, data: {} })).status()).toBe(403);
  });
});
