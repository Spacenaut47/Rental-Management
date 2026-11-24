import { expect, test } from '@playwright/test';
import { adminCredentials, apiLogin, authHeaders, unique, uiLogin } from './helpers';

test.describe('Authentication', () => {
  test('logs in through the UI and shows the signed-in user', async ({ page }) => {
    await uiLogin(page);
    await expect(page.locator('header')).toContainText('Hi, admin');
  });

  test('logs in with an email address', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Username or Email').fill('admin@local.test');
    await page.getByPlaceholder('Password').fill(adminCredentials.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('shows a clear error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Username or Email').fill('admin');
    await page.getByPlaceholder('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid credentials.')).toBeVisible();
  });

  test('logs out and returns to the login page', async ({ page }) => {
    await uiLogin(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('main').getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('registration form blocks weak passwords', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('e.g., manager1').fill('newuser');
    await page.getByPlaceholder('you@example.com').fill('newuser@example.com');
    await page.getByPlaceholder('Strong password').fill('pass');
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
    await expect(page.getByText('Password needs an uppercase letter.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled();
  });

  test('API login returns a usable bearer token', async ({ request }) => {
    const token = await apiLogin(request);
    const response = await request.get('/api/auth/me', { headers: authHeaders(token) });
    expect(response.status()).toBe(200);
    const user = await response.json();
    expect(user.username).toBe('admin');
    expect(user.role).toBe(1);
  });

  test('API login rejects bad credentials with 401', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { usernameOrEmail: 'admin', password: 'nope' },
    });
    expect(response.status()).toBe(401);
    expect((await response.json()).message).toBe('Invalid credentials.');
  });

  test('API registration creates a tenant account', async ({ request }) => {
    const username = unique('tenantuser');
    const password = 'Tenant@12345';
    const response = await request.post('/api/auth/register', {
      data: { username, email: `${username}@test.local`, password },
    });
    expect(response.status(), await response.text()).toBe(200);
    const body = await response.json();
    expect(body.username).toBe(username);
    expect(body.role).toBe(4);
    expect(body.accessToken).toBeTruthy();

    const login = await request.post('/api/auth/login', {
      data: { usernameOrEmail: username, password },
    });
    expect(login.status()).toBe(200);
  });

  test('API registration rejects duplicate username and email', async ({ request }) => {
    const username = unique('duplicate');
    const email = `${username}@test.local`;
    const data = { username, email, password: 'Strong@12345' };
    expect((await request.post('/api/auth/register', { data })).status()).toBe(200);

    const sameUsername = await request.post('/api/auth/register', {
      data: { ...data, email: `${unique('other')}@test.local` },
    });
    expect(sameUsername.status()).toBe(409);
    expect((await sameUsername.json()).message).toBe('Username already exists.');

    const sameEmail = await request.post('/api/auth/register', {
      data: { ...data, username: unique('other') },
    });
    expect(sameEmail.status()).toBe(409);
    expect((await sameEmail.json()).message).toBe('Email already exists.');
  });

  test('API protects auth/me with bearer authentication', async ({ request }) => {
    expect((await request.get('/api/auth/me')).status()).toBe(401);
    const response = await request.get('/api/auth/me', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(response.status()).toBe(401);
  });

  test('API login is case-insensitive', async ({ request }) => {
    const username = unique('CaseUser');
    expect((await request.post('/api/auth/register', {
      data: { username, email: `${username}@test.local`, password: 'Strong@12345' },
    })).status()).toBe(200);

    expect((await request.post('/api/auth/login', {
      data: { usernameOrEmail: username.toUpperCase(), password: 'Strong@12345' },
    })).status()).toBe(200);
  });

  test('API rejects duplicate usernames regardless of case', async ({ request }) => {
    const username = unique('DupCase');
    const data = { username, email: `${username}@test.local`, password: 'Strong@12345' };
    expect((await request.post('/api/auth/register', { data })).status()).toBe(200);

    const duplicate = await request.post('/api/auth/register', {
      data: { ...data, username: username.toUpperCase(), email: `${unique('other')}@test.local` },
    });
    expect(duplicate.status()).toBe(409);
    expect((await duplicate.json()).message).toBe('Username already exists.');
  });
});
