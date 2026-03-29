import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';
const adminUsername = 'admin';
const adminPassword = 'admin123';

async function attachApiProxy(context: BrowserContext) {
  await context.route('**/api/**', async (route) => {
    const requestUrl = route.request().url().replace(frontendOrigin, backendOrigin).replace('http://127.0.0.1:5173', backendOrigin);

    if (requestUrl.includes('/api/v1/auth/config')) {
      const response = await route.fetch({ url: requestUrl });
      const payload = await response.json();
      const data = typeof payload?.data === 'object' && payload?.data ? payload.data : {};
      await route.fulfill({
        status: response.status(),
        headers: {
          ...await response.allHeaders(),
          'content-type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          ...payload,
          data: {
            ...data,
            login_requires_tenant_code: false,
          },
        }),
      });
      return;
    }

    const response = await route.fetch({ url: requestUrl });
    await route.fulfill({ response });
  });
}

async function login(page: Page) {
  await page.goto('/');
  await page.waitForResponse((response) => response.url().includes('/api/v1/auth/config') && response.ok());

  const tenantCodeField = page.getByLabel(/Tenant Code|绉熸埛|租户代码/i);
  if (await tenantCodeField.count()) {
    await expect(tenantCodeField).toBeHidden({ timeout: 15000 });
  }

  await page.getByLabel(/Username/i).fill(adminUsername);
  await page.getByLabel(/Password/i).fill(adminPassword);
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page.getByRole('button', { name: /System|绯荤粺绠＄悊|Tenant|绉熸埛/i }).first()).toBeVisible({
    timeout: 20000,
  });
}
async function loginByApi(request: APIRequestContext) {
  const response = await request.post(`${backendOrigin}/api/v1/auth/login`, {
    data: {
      username: adminUsername,
      password: adminPassword,
    },
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return {
    token: payload.data.access_token as string,
    tenantId: payload.data.user.tenant_id as string,
  };
}

async function createTenantViaApi(request: APIRequestContext, seed: string) {
  const auth = await loginByApi(request);
  const response = await request.post(`${backendOrigin}/api/v1/tenants/register`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'X-Tenant-ID': auth.tenantId,
    },
    data: {
      name: `PW Tenant ${seed}`,
      code: `PWE2E${seed}`,
      description: 'Created by Playwright',
      contact_person: 'Playwright',
      expire_at: '2027-12-31',
    },
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return {
    auth,
    id: payload.data.id as string,
    code: payload.data.code as string,
    name: payload.data.name as string,
  };
}

async function deleteTenantViaApi(request: APIRequestContext, tenantId: string, auth: { token: string; tenantId: string }) {
  await request.delete(`${backendOrigin}/api/v1/tenants/${tenantId}`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'X-Tenant-ID': auth.tenantId,
    },
  });
}

async function openSystemGroup(page: Page) {
  const systemButton = page.getByRole('button', { name: /^System$/i });
  if (await systemButton.count()) {
    await systemButton.first().click();
  }
}

async function openSidebarPage(page: Page, label: RegExp) {
  let button = page.getByRole('button', { name: label }).first();
  if (await button.count()) {
    await button.click();
    return;
  }

  await openSystemGroup(page);
  button = page.getByRole('button', { name: label }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
}

async function rowByText(page: Page, text: string) {
  return page.locator('tr', { hasText: text }).first();
}

async function actionButtons(row: Locator) {
  return row.locator('td').last().locator('button');
}

async function fillRadixSelect(trigger: Locator, optionText: RegExp) {
  await trigger.click();
  await trigger.page().getByRole('option', { name: optionText }).click();
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  await attachApiProxy(context);
});

test('checks tenant setup and admin CRUD pages', async ({ page, request }) => {
  test.setTimeout(5 * 60_000);
  const seed = `${Date.now()}`.slice(-8);
  const tenantDatabase = `pantheon_e2e_${seed}`;
  const departmentName = `PW Dept ${seed}`;
  const departmentCode = `PW_DEPT_${seed}`;
  const roleName = `PW Role ${seed}`;
  const roleCode = `pw_role_${seed}`;
  const positionName = `PW Position ${seed}`;
  const positionCode = `PW_POS_${seed}`;
  const userName = `pwuser${seed}`;
  const userRealName = `PW User ${seed}`;
  const userEmail = `pwuser${seed}@example.com`;
  const userPhone = `138${seed.slice(-8)}`;

  const tenant = await createTenantViaApi(request, seed);

  try {
    await login(page);

    await test.step('tenant setup wizard works', async () => {
      await openSidebarPage(page, /Tenants|Tenant/i);
      await expect(page.getByText(/Tenant Management|Tenants/i)).toBeVisible({ timeout: 15000 });

      const searchBox = page.locator('input').first();
      await searchBox.fill(tenant.code);
      const tenantRow = await rowByText(page, tenant.code);
      await expect(tenantRow).toBeVisible({ timeout: 15000 });

      await actionButtons(tenantRow).last().click();
      await page.getByRole('menuitem', { name: /Database Setup/i }).click();

      await page.getByRole('button', { name: /Start Setup|寮€濮嬪垵濮嬪寲/i }).click();
      await page.getByRole('button', { name: /MySQL/i }).click();

      await page.getByLabel(/Host|涓绘満/i).fill('localhost');
      await page.getByLabel(/Port|绔彛/i).fill('3306');
      await page.getByLabel(/Database Name|鏁版嵁搴撳悕/i).fill(tenantDatabase);
      await page.getByLabel(/Username/i).fill('root');
      await page.getByLabel(/Password/i).fill('DHCCroot@2025');
      await page.getByRole('button', { name: /^Next$/i }).click();

      await expect(page.getByText(/Connection Succeeded|杩炴帴鎴愬姛/i)).toBeVisible({ timeout: 30000 });
      await page.getByRole('button', { name: /Finish Setup/i }).click();
      await expect(page.getByText(/Initialization Complete|鍒濆鍖栭厤缃凡瀹屾垚/i)).toBeVisible({ timeout: 30000 });
      await page.getByRole('button', { name: /Back to Tenant Management|杩斿洖绉熸埛绠＄悊/i }).click();
      await expect(page.getByText(/Tenant Management|Tenants/i)).toBeVisible({ timeout: 15000 });
    });

    await test.step('department create update delete works', async () => {
      await openSidebarPage(page, /Departments/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      await page.getByLabel(/Department Name|閮ㄩ棬鍚嶇О/i).fill(departmentName);
      await page.getByLabel(/Department Code|閮ㄩ棬缂栫爜/i).fill(departmentCode);
      await page.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, departmentCode)).toBeVisible({ timeout: 15000 });

      const departmentRow = await rowByText(page, departmentCode);
      await actionButtons(departmentRow).nth(2).click();
      await page.getByLabel(/Department Name|閮ㄩ棬鍚嶇О/i).fill(`${departmentName} Updated`);
      await page.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, `${departmentName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('role create update delete works', async () => {
      await openSidebarPage(page, /Roles/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      await page.getByLabel(/Role Name|瑙掕壊鍚嶇О/i).fill(roleName);
      await page.getByLabel(/Role Code|瑙掕壊缂栫爜/i).fill(roleCode);
      await page.getByRole('button', { name: /Confirm|纭/i }).click();
      await expect(await rowByText(page, roleCode)).toBeVisible({ timeout: 15000 });

      const roleRow = await rowByText(page, roleCode);
      await actionButtons(roleRow).nth(1).click();
      await page.getByLabel(/Role Name|瑙掕壊鍚嶇О/i).fill(`${roleName} Updated`);
      await page.getByRole('button', { name: /Confirm|纭/i }).click();
      await expect(await rowByText(page, `${roleName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('position create update delete works', async () => {
      await openSidebarPage(page, /Positions/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      await page.getByLabel(/Position Name|宀椾綅鍚嶇О/i).fill(positionName);
      await page.getByLabel(/Position Code|宀椾綅缂栫爜/i).fill(positionCode);
      await fillRadixSelect(page.getByRole('combobox').nth(0), /Updated|PW Dept/i);
      await page.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, positionCode)).toBeVisible({ timeout: 15000 });

      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /Edit|缂栬緫/i }).click();
      await page.getByLabel(/Position Name|宀椾綅鍚嶇О/i).fill(`${positionName} Updated`);
      await page.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, `${positionName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('user create update delete works', async () => {
      await openSidebarPage(page, /Users/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      await page.getByLabel(/Username/i).fill(userName);
      await page.getByLabel(/Real Name|鐪熷疄濮撳悕|濮撳悕/i).fill(userRealName);
      await page.getByLabel(/Email|閭/i).fill(userEmail);
      await page.getByLabel(/Phone|鐢佃瘽/i).fill(userPhone);
      await page.getByLabel(/Password/i).fill('Admin12345!');
      await fillRadixSelect(page.getByRole('combobox').nth(0), /Updated|PW Dept/i);
      await page.locator('label', { hasText: /PW Role/i }).click();
      await page.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, userName)).toBeVisible({ timeout: 15000 });

      const userRow = await rowByText(page, userName);
      await actionButtons(userRow).nth(1).click();
      await page.getByLabel(/Real Name|鐪熷疄濮撳悕|濮撳悕/i).fill(`${userRealName} Updated`);
      await page.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, `${userRealName} Updated`)).toBeVisible({ timeout: 15000 });

      const updatedUserRow = await rowByText(page, userName);
      await updatedUserRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await page.getByRole('button', { name: /^Delete$/i }).click();
      await expect(await rowByText(page, userName)).toHaveCount(0, { timeout: 15000 });
    });

    await test.step('role, position, and department cleanup via page works', async () => {
      await openSidebarPage(page, /Positions/i);
      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await page.getByRole('button', { name: /^Delete$/i }).click();
      await expect(await rowByText(page, positionCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Roles/i);
      const roleRow = await rowByText(page, roleCode);
      await roleRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await page.getByRole('button', { name: /^Delete$/i }).click();
      await expect(await rowByText(page, roleCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Departments/i);
      const departmentRow = await rowByText(page, departmentCode);
      await actionButtons(departmentRow).nth(3).click();
      await page.getByRole('button', { name: /^Delete$/i }).click();
      await expect(await rowByText(page, departmentCode)).toHaveCount(0, { timeout: 15000 });
    });
  } finally {
    await deleteTenantViaApi(request, tenant.id, tenant.auth);
  }
});




