import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const adminCredentials = {
  usernameOrEmail: 'admin',
  password: 'Admin@12345',
};

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function uiLogin(page: Page, credentials = adminCredentials) {
  await page.goto('/login');
  await page.getByPlaceholder('Username or Email').fill(credentials.usernameOrEmail);
  await page.getByPlaceholder('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

export async function apiLogin(request: APIRequestContext, credentials = adminCredentials) {
  const response = await request.post('/api/auth/login', { data: credentials });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  return body.accessToken as string;
}

export async function createProperty(request: APIRequestContext, token: string, name = unique('Property')) {
  const response = await request.post('/api/properties', {
    headers: authHeaders(token),
    data: {
      name,
      addressLine1: '1 Test Street',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      country: 'USA',
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export async function createTenant(request: APIRequestContext, token: string, email = `${unique('tenant')}@test.local`) {
  const response = await request.post('/api/tenants', {
    headers: authHeaders(token),
    data: { firstName: 'Test', lastName: 'Tenant', email, phone: '555-0100' },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export async function createUnit(request: APIRequestContext, token: string, propertyId: number, unitNumber = unique('Unit')) {
  const response = await request.post('/api/units', {
    headers: authHeaders(token),
    data: {
      propertyId,
      unitNumber,
      bedrooms: 2,
      bathrooms: 1,
      rent: 1250,
      sizeSqFt: 800,
      isOccupied: false,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export async function createLease(
  request: APIRequestContext,
  token: string,
  unitId: number,
  tenantId: number,
  overrides: { startDateUtc?: string; endDateUtc?: string } = {},
) {
  const startDateUtc = overrides.startDateUtc ?? new Date(Date.now() - 86_400_000).toISOString();
  const endDateUtc = overrides.endDateUtc ?? new Date(Date.now() + 30 * 86_400_000).toISOString();
  const response = await request.post('/api/leases', {
    headers: authHeaders(token),
    data: { unitId, tenantId, startDateUtc, endDateUtc, monthlyRent: 1250, securityDeposit: 500 },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export async function createMaintenance(
  request: APIRequestContext,
  token: string,
  propertyId: number,
  unitId?: number,
  title = unique('Leak'),
) {
  const response = await request.post('/api/maintenance', {
    headers: authHeaders(token),
    data: { propertyId, unitId, title, description: 'Automated test request', priority: 3 },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export function acceptDialogs(page: Page) {
  page.on('dialog', (dialog) => void dialog.accept());
}

export async function expectRow(page: Page, text: string | RegExp) {
  const row = page.locator('li', { hasText: text }).first();
  await expect(row).toBeVisible();
  return row;
}
