import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { e2eAdminUsername, e2eTenantCode, getE2EAdminPassword } from '../e2eCredentials';

const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8080';

async function login(page: Page, tenantCodeOverride?: string) {
  const adminPassword = getE2EAdminPassword();
  const tenantCode = tenantCodeOverride ?? e2eTenantCode;

  if (tenantCode) {
    await page.addInitScript((value) => {
      window.localStorage.setItem('rememberedTenantCode', value);
    }, tenantCode);
  }

  await page.goto('/');
  await page.locator('#username').first().waitFor({ state: 'visible', timeout: 15000 });

  if (tenantCode) {
    const tenantCodeInput = page.locator('#tenantCode');
    if (!(await tenantCodeInput.isVisible().catch(() => false))) {
      const tenantToggleButton = page.getByRole('button', { name: /Enter Tenant Code|输入租户代码|填写租户编码/i }).first();
      if (await tenantToggleButton.isVisible().catch(() => false)) {
        await tenantToggleButton.click();
      }
    }
    await tenantCodeInput.fill(tenantCode);
  }

  await page.locator('#username').first().fill(e2eAdminUsername);
  await page.locator('#password').first().fill(adminPassword);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
}

async function loginByApi(request: APIRequestContext) {
  const data: Record<string, string> = {
    username: e2eAdminUsername,
    password: getE2EAdminPassword(),
  };

  if (e2eTenantCode) {
    data.tenant_code = e2eTenantCode;
  }

  const response = await request.post(`${backendOrigin}/api/v1/auth/login`, { data });
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  return {
    token: payload.data.access_token as string,
    tenantId: payload.data.user.tenant_id as string,
  };
}

async function openApiKeySettings(page: Page) {
  await page.goto('/profile/settings');
  await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  await page.getByRole('tab', { name: /API Keys|API 密钥/i }).click();
  await expect(page.getByRole('button', { name: /Create New Key|创建新密钥/i })).toBeVisible({ timeout: 10000 });
}

async function createApiKeyViaUi(
  page: Page,
  options: { name: string; permissions: string; allowedIps: string; rateLimit: number },
) {
  await page.getByRole('button', { name: /Create New Key|创建新密钥/i }).click();
  await page.getByPlaceholder(/production read-only key|生产环境只读密钥/i).fill(options.name);
  await page.getByPlaceholder(/read or \/api\/v1\/system\/users:get|read 或 \/api\/v1\/system\/users:get/i).fill(options.permissions);
  await page.getByPlaceholder(/10\.0\.0\.10,192\.168\.1\.0\/24/i).fill(options.allowedIps);
  await page.locator('input[type="number"]').first().fill(String(options.rateLimit));

  const createResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/v1/auth/api-keys') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /Create Key|创建密钥/i }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.ok()).toBeTruthy();

  const payload = await createResponse.json();
  await expect(page.locator('main')).toContainText(options.name, { timeout: 10000 });

  return {
    id: payload.data.id as string,
    key: payload.data.key as string,
  };
}

async function deleteApiKeyByApi(request: APIRequestContext, token: string, id: string) {
  await request.delete(`${backendOrigin}/api/v1/auth/api-keys/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

test('api key security controls work through UI and auth chain', async ({ page, request }) => {
  const seed = `${Date.now()}`.slice(-8);
  const auth = await loginByApi(request);
  const createdKeyIds: string[] = [];

  await login(page);
  await openApiKeySettings(page);

  try {
    const ipLockedKey = await createApiKeyViaUi(page, {
      name: `PW IP Locked Key ${seed}`,
      permissions: 'read',
      allowedIps: '10.0.0.10',
      rateLimit: 5,
    });
    createdKeyIds.push(ipLockedKey.id);
    await expect(page.locator('main')).toContainText('10.0.0.10');

    const ipDeniedResponse = await request.get(`${backendOrigin}/api/v1/auth/api-keys`, {
      headers: {
        'X-API-Key': ipLockedKey.key,
      },
    });
    expect(ipDeniedResponse.status()).toBe(403);
    const ipDeniedPayload = await ipDeniedResponse.json();
    expect(ipDeniedPayload.code).toBe('API_KEY_IP_NOT_ALLOWED');

    const limitedKey = await createApiKeyViaUi(page, {
      name: `PW Limited Key ${seed}`,
      permissions: 'read',
      allowedIps: '127.0.0.1,::1',
      rateLimit: 1,
    });
    createdKeyIds.push(limitedKey.id);
    await expect(page.locator('main')).toContainText(/Requests \/ min|每分钟限流/);

    const firstAllowedResponse = await request.get(`${backendOrigin}/api/v1/auth/api-keys`, {
      headers: {
        'X-API-Key': limitedKey.key,
      },
    });
    expect(firstAllowedResponse.ok()).toBeTruthy();

    const secondLimitedResponse = await request.get(`${backendOrigin}/api/v1/auth/api-keys`, {
      headers: {
        'X-API-Key': limitedKey.key,
      },
    });
    expect(secondLimitedResponse.status()).toBe(429);
    const secondLimitedPayload = await secondLimitedResponse.json();
    expect(secondLimitedPayload.code).toBe('API_KEY_RATE_LIMITED');

    const scopeDeniedKey = await createApiKeyViaUi(page, {
      name: `PW Scope Key ${seed}`,
      permissions: '/api/v1/system/users:get',
      allowedIps: '127.0.0.1,::1',
      rateLimit: 5,
    });
    createdKeyIds.push(scopeDeniedKey.id);

    const scopeDeniedResponse = await request.post(`${backendOrigin}/api/v1/system/users`, {
      headers: {
        'X-API-Key': scopeDeniedKey.key,
        'X-Tenant-ID': auth.tenantId,
      },
      data: {
        username: `pw-scope-${seed}`,
      },
    });
    expect(scopeDeniedResponse.status()).toBe(403);
    const scopeDeniedPayload = await scopeDeniedResponse.json();
    expect(scopeDeniedPayload.code).toBe('API_KEY_SCOPE_DENIED');
  } finally {
    for (const id of createdKeyIds) {
      await deleteApiKeyByApi(request, auth.token, id);
    }
  }
});
