import { expect, test } from '@playwright/test';
import { apiLogin, authHeaders, unique } from './helpers';

test.describe('API contract', () => {
  test('serves the OpenAPI document', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:5180/openapi/v1.json');
    expect(response.status()).toBe(200);
    const spec = await response.json();
    expect(spec.info.title).toBe('Rental Management API');
    expect(spec.paths['/api/Auth/login']).toBeTruthy();
    expect(spec.components.securitySchemes.Bearer.scheme).toBe('bearer');
  });

  test('serves the Scalar API reference', async ({ request }) => {
    expect((await request.get('http://127.0.0.1:5180/scalar/v1')).status()).toBe(200);
  });

  test('returns 404 for unknown routes', async ({ request }) => {
    expect((await request.get('/api/does-not-exist')).status()).toBe(404);
  });

  test('admin can read every domain collection', async ({ request }) => {
    const token = await apiLogin(request);
    const headers = authHeaders(token);
    for (const path of ['/api/properties', '/api/tenants', '/api/units', '/api/leases', '/api/maintenance', '/api/admin/audit']) {
      expect(await request.get(path, { headers }), path).toBeOK();
    }
  });

  test('tenant role is denied staff endpoints', async ({ request }) => {
    const username = unique('apiviewer');
    const registration = await request.post('/api/auth/register', {
      data: { username, email: `${username}@test.local`, password: 'Viewer@12345' },
    });
    expect(registration.status(), await registration.text()).toBe(200);
    const token = (await registration.json()).accessToken;
    const headers = authHeaders(token);

    for (const path of ['/api/properties', '/api/tenants', '/api/units', '/api/leases', '/api/maintenance', '/api/admin/audit']) {
      expect((await request.get(path, { headers })).status(), path).toBe(403);
    }
  });

  test('handles CORS preflight for the frontend origin', async ({ request }) => {
    const response = await request.fetch('/api/properties', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
