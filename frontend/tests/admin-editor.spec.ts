import { expect, test } from '@playwright/test';
import {
  apiLogin,
  authHeaders,
  createLease,
  createProperty,
  createTenant,
  createUnit,
  uiLogin,
  unique,
} from './helpers';

test.describe('Admin list editor', () => {
  test('every admin list exposes its own filter, and editable lists expose add', async ({ page }) => {
    await uiLogin(page);

    const pages: Array<[string, string?]> = [
      ['/properties', 'Property'],
      ['/tenants', 'Tenant'],
      ['/units', 'Unit'],
      ['/leases', 'Lease'],
      ['/payments', 'Payment'],
      ['/maintenance', 'Request'],
      ['/admin/audit'],
    ];

    for (const [path, addLabel] of pages) {
      await page.goto(path);
      await expect(page.getByRole('button', { name: /^Filter/ })).toBeVisible();
      if (addLabel) {
        await expect(page.getByRole('button', { name: `Add ${addLabel}` })).toBeVisible();
      }
    }
  });

  test('opens a prefilled edit dialog and saves changes from a row click', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token, unique('Editable'));

    await uiLogin(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: `Edit property ${property.name}` }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#prop-name')).toHaveValue(property.name);
    await dialog.locator('#prop-name').fill(`${property.name}-updated`);
    await dialog.getByRole('button', { name: 'Save Property' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.locator('li', { hasText: `${property.name}-updated` })).toBeVisible();
  });

  test('edits a tenant from the list without leaving the page', async ({ page, request }) => {
    const token = await apiLogin(request);
    const tenant = await createTenant(request, token);

    await uiLogin(page);
    await page.goto('/tenants');
    await page.locator('li', { hasText: tenant.email })
      .getByRole('button', { name: `Edit tenant ${tenant.firstName} ${tenant.lastName}` })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#tenant-email')).toHaveValue(tenant.email);
    const updatedEmail = `${unique('edited')}@test.local`;
    await dialog.locator('#tenant-email').fill(updatedEmail);
    await dialog.getByRole('button', { name: 'Save Tenant' }).click();

    await expect(page.locator('li', { hasText: updatedEmail })).toBeVisible();
  });

  test('edits a lease amount from the list', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    const lease = await createLease(request, token, unit.id, tenant.id);

    await uiLogin(page);
    await page.goto('/leases');
    await page.getByRole('button', { name: `Edit lease ${lease.id}` }).click();

    const dialog = page.getByRole('dialog');
    await dialog.locator('#lease-rent').fill('4321');
    await dialog.getByRole('button', { name: 'Save Lease' }).click();

    const row = page.locator('li', { hasText: `Lease #${lease.id}` });
    await expect(row).toContainText('₹4321');
  });

  test('edits a payment and updates the total', async ({ page, request }) => {
    const token = await apiLogin(request);
    const property = await createProperty(request, token);
    const unit = await createUnit(request, token, property.id);
    const tenant = await createTenant(request, token);
    const lease = await createLease(request, token, unit.id, tenant.id);
    const created = await request.post('/api/payments', {
      headers: authHeaders(token),
      data: { leaseId: lease.id, amount: 100, method: 1 },
    });
    const payment = await created.json();

    await uiLogin(page);
    await page.goto('/payments');
    await page.getByRole('button', { name: 'Filter payments' }).click();
    await page.selectOption('#payments-leaseId', String(lease.id));
    await page.getByRole('button', { name: 'Load payments' }).click();

    await page.getByRole('button', { name: `Edit payment ${payment.id}` }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#payment-amount').fill('275.50');
    await dialog.getByRole('button', { name: 'Save Payment' }).click();

    await expect(page.getByText(/Total paid:/)).toContainText('275.5');
  });

  test('lists newest properties first by default', async ({ page, request }) => {
    const token = await apiLogin(request);
    const tag = unique('OrderCheck');
    const older = await createProperty(request, token, `${tag}-Older`);
    const newer = await createProperty(request, token, `${tag}-Newer`);

    await uiLogin(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: 'Filter properties' }).click();
    await page.fill('#property-filter-search', tag);
    await page.getByRole('button', { name: 'Apply property filters' }).click();

    const rows = page.locator('ul > li');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText(newer.name);
    await expect(rows.nth(1)).toContainText(older.name);
  });

  test('closes an editor with Escape without saving', async ({ page }) => {
    await uiLogin(page);
    await page.goto('/properties');
    await page.getByRole('button', { name: 'Add Property' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
