import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  apiLogin,
  authHeaders,
  createLease,
  createProperty,
  createTenant,
  createUnit,
  uiLogin,
} from './helpers';

async function leaseFixture(request: APIRequestContext, token: string) {
  const property = await createProperty(request, token);
  const unit = await createUnit(request, token, property.id);
  const tenant = await createTenant(request, token);
  return createLease(request, token, unit.id, tenant.id);
}

test.describe('Payments', () => {
  test('records a payment and updates the total in the UI', async ({ page, request }) => {
    const token = await apiLogin(request);
    const lease = await leaseFixture(request, token);

    await uiLogin(page);
    await page.goto('/payments');
    await page.selectOption('#payments-leaseId', String(lease.id));
    await page.fill('#payment-amount', '321.50');
    await page.selectOption('#payment-method', '2');
    await page.fill('#payment-ref', 'CARD-TEST');
    await page.getByRole('button', { name: 'Record Payment' }).click();

    await expect(page.locator('li', { hasText: '₹321.5' })).toBeVisible();
    await expect(page.getByText('Total paid: ₹321.5')).toBeVisible();
  });

  test('lists leases in the payment selector', async ({ page, request }) => {
    const token = await apiLogin(request);
    const lease = await leaseFixture(request, token);
    await uiLogin(page);
    await page.goto('/payments');
    await expect(page.locator('#payments-leaseId', { has: page.locator(`option[value="${lease.id}"]`) })).toBeVisible();
  });

  test('creates, lists and totals payments through the API', async ({ request }) => {
    const token = await apiLogin(request);
    const lease = await leaseFixture(request, token);

    const create = await request.post('/api/payments', {
      headers: authHeaders(token),
      data: { leaseId: lease.id, amount: 450.25, method: 3, reference: 'API-1', notes: 'automated' },
    });
    expect(create.status(), await create.text()).toBe(201);
    const payment = await create.json();
    expect(payment.leaseId).toBe(lease.id);

    const list = await request.get(`/api/payments/lease/${lease.id}`, { headers: authHeaders(token) });
    expect(await list.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: payment.id })]));

    const total = await request.get(`/api/payments/lease/${lease.id}/total`, { headers: authHeaders(token) });
    expect(await total.json()).toBe(450.25);
  });

  test('rejects non-positive amounts and missing leases', async ({ request }) => {
    const token = await apiLogin(request);
    const invalidAmount = await request.post('/api/payments', {
      headers: authHeaders(token),
      data: { leaseId: 1, amount: 0, method: 1 },
    });
    expect(invalidAmount.status()).toBe(400);

    const missingLease = await request.post('/api/payments', {
      headers: authHeaders(token),
      data: { leaseId: 999999, amount: 10, method: 1 },
    });
    expect(missingLease.status()).toBe(400);
    expect((await missingLease.json()).detail).toBe('Lease does not exist.');
  });

  test('blocks payments on inactive leases', async ({ request }) => {
    const token = await apiLogin(request);
    const lease = await leaseFixture(request, token);
    const update = await request.put(`/api/leases/${lease.id}`, {
      headers: authHeaders(token),
      data: {
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        startDateUtc: new Date(Date.now() - 30 * 86_400_000).toISOString(),
        endDateUtc: new Date(Date.now() - 86_400_000).toISOString(),
        monthlyRent: lease.monthlyRent,
        securityDeposit: lease.securityDeposit,
      },
    });
    expect(update.status(), await update.text()).toBe(200);

    const payment = await request.post('/api/payments', {
      headers: authHeaders(token),
      data: { leaseId: lease.id, amount: 100, method: 1 },
    });
    expect(payment.status()).toBe(409);
    expect((await payment.json()).detail).toContain('inactive');
  });

  test('returns 404 for payment reads on a missing lease', async ({ request }) => {
    const token = await apiLogin(request);
    expect((await request.get('/api/payments/lease/999999', { headers: authHeaders(token) })).status()).toBe(404);
    expect((await request.get('/api/payments/lease/999999/total', { headers: authHeaders(token) })).status()).toBe(404);
  });

  test('blocks deleting a lease that has payment history', async ({ request }) => {
    const token = await apiLogin(request);
    const lease = await leaseFixture(request, token);
    expect((await request.post('/api/payments', {
      headers: authHeaders(token),
      data: { leaseId: lease.id, amount: 25, method: 1 },
    })).status()).toBe(201);

    const blocked = await request.delete(`/api/leases/${lease.id}`, { headers: authHeaders(token) });
    expect(blocked.status()).toBe(409);
    expect((await blocked.json()).detail).toContain('payment history');
  });

  test('protects payment endpoints', async ({ request }) => {
    expect((await request.get('/api/payments/lease/1')).status()).toBe(401);
    expect((await request.post('/api/payments', { data: {} })).status()).toBe(401);
  });
});
