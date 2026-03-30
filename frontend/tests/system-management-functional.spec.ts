import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';
const adminUsername = 'admin';
const adminPassword = 'admin123';
const mysqlBin = process.env.MYSQL_BIN || 'mysql';
const mysqlHost = process.env.E2E_MYSQL_HOST || '127.0.0.1';
const mysqlPort = Number(process.env.E2E_MYSQL_PORT || 3306);
const mysqlUser = process.env.E2E_MYSQL_USER || 'root';
const mysqlPassword = process.env.E2E_MYSQL_PASSWORD || 'DHCCroot@2025';

function runMysqlStatement(statement: string) {
  execFileSync(
    mysqlBin,
    ['-h', mysqlHost, '-P', String(mysqlPort), '-u', mysqlUser, `--password=${mysqlPassword}`, '-e', statement],
    { stdio: 'pipe' },
  );
}

function ensureTenantDatabaseExists(databaseName: string) {
  runMysqlStatement(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
}

function dropTenantDatabase(databaseName: string) {
  runMysqlStatement(`DROP DATABASE IF EXISTS \`${databaseName}\`;`);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function attachApiProxy(context: BrowserContext) {
  await context.route('**/api/**', async (route) => {
    const requestUrl = route.request().url().replace(frontendOrigin, backendOrigin).replace('http://127.0.0.1:5173', backendOrigin);

    if (requestUrl.includes('/api/v1/auth/config')) {
      const response = await route.fetch({ url: requestUrl });
      const payload = await response.json();
      const data = typeof payload?.data === 'object' && payload?.data ? payload.data : {};
      const headers = typeof response.allHeaders === 'function' ? await response.allHeaders() : response.headers();
      await route.fulfill({
        status: response.status(),
        headers: {
          ...headers,
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
  const navigation = page.locator('nav');
  const systemButton = navigation.getByRole('button', { name: /^System$/i });
  const nestedButton = navigation.getByRole('button', { name: /Overview|Users|Departments|Tenants/i }).first();

  if (await nestedButton.count()) {
    return;
  }

  if (await systemButton.count()) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await systemButton.first().click();

      try {
        await expect(nestedButton).toBeVisible({ timeout: 4000 });
        return;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
  }
}

async function openSidebarPage(page: Page, label: RegExp) {
  const navigation = page.locator('nav');
  let button = navigation.getByRole('button', { name: label }).first();
  if (await button.count()) {
    await button.click();
    return;
  }

  await openSystemGroup(page);
  button = navigation.getByRole('button', { name: label }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
}

async function rowByText(page: Page, text: string) {
  return page.locator('tr', { hasText: text }).first();
}

function actionButtons(row: Locator) {
  return row.locator('td').last().locator('button');
}

async function fillRadixSelect(trigger: Locator, optionText: RegExp) {
  await trigger.click();
  await trigger.page().getByRole('option', { name: optionText }).click();
}

async function confirmDeleteDialog(page: Page) {
  const deleteDialog = page.getByRole('alertdialog', { name: /^Delete$/i });
  await expect(deleteDialog).toBeVisible({ timeout: 10000 });
  await deleteDialog.getByRole('button', { name: /^Delete$/i }).click();
  await expect(deleteDialog).toBeHidden({ timeout: 15000 });
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
  const departmentCode = `PWDEPT${seed}`;
  const roleName = `PW Role ${seed}`;
  const roleCode = `pwrole${seed}`;
  const positionName = `PW Position ${seed}`;
  const positionCode = `PWPOS${seed}`;
  const userName = `pwuser${seed}`;
  const userRealName = `PW User ${seed}`;
  const userEmail = `pwuser${seed}@example.com`;
  const userPhone = `138${seed.slice(-8)}`;

  const tenant = await createTenantViaApi(request, seed);
  ensureTenantDatabaseExists(tenantDatabase);

  try {
    await login(page);

    await test.step('tenant setup wizard works', async () => {
      await openSidebarPage(page, /Tenants|Tenant/i);
      await expect(page.locator('main').getByText(/Tenant Management/i)).toBeVisible({ timeout: 15000 });

      const searchBox = page.locator('main').getByRole('textbox').first();
      await searchBox.fill(tenant.code);
      const tenantRow = await rowByText(page, tenant.code);
      await expect(tenantRow).toBeVisible({ timeout: 15000 });

      await actionButtons(tenantRow).last().click();
      await page.getByRole('menuitem', { name: /Database Setup/i }).click();

      await page.getByRole('button', { name: /Start Setup|寮€濮嬪垵濮嬪寲/i }).click();
      await page.getByRole('button', { name: /MySQL/i }).click();

      const setupDialog = page.getByRole('dialog', { name: /Tenant Database Setup/i });
      await setupDialog.getByPlaceholder('127.0.0.1').fill('127.0.0.1');
      await setupDialog.getByRole('spinbutton').fill('3306');
      await setupDialog.getByPlaceholder('pantheon_tenant_db').fill(tenantDatabase);
      await setupDialog.getByPlaceholder('root').fill('root');
      await setupDialog.getByPlaceholder('Enter database password').fill('DHCCroot@2025');
      await setupDialog.getByRole('button', { name: /^Next$/i }).click();

      await expect(page.getByText(/Connection Succeeded|杩炴帴鎴愬姛/i)).toBeVisible({ timeout: 30000 });
      await page.getByRole('button', { name: /Finish Setup/i }).click();
      await expect(page.getByText(/Initialization Complete|鍒濆鍖栭厤缃凡瀹屾垚/i)).toBeVisible({ timeout: 30000 });
      const backToTenantManagement = page.getByRole('button', { name: /Back to Tenant Management|杩斿洖绉熸埛绠＄悊/i });
      await backToTenantManagement.scrollIntoViewIfNeeded();
      await backToTenantManagement.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(page.locator('main').getByText(/Tenant Management/i)).toBeVisible({ timeout: 15000 });
    });

    await test.step('department create update delete works', async () => {
      await openSidebarPage(page, /Departments/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      const departmentDialog = page.getByRole('dialog', { name: /Add Department|Edit Department/i });
      await departmentDialog.getByPlaceholder('Enter department name').fill(departmentName);
      await departmentDialog.getByPlaceholder('Enter department code').fill(departmentCode);
      const createDepartmentResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/depts') && response.request().method() === 'POST',
      );
      await departmentDialog.getByRole('button', { name: /^Submit$/i }).evaluate((node) => (node as HTMLButtonElement).click());
      expect((await createDepartmentResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, departmentCode)).toBeVisible({ timeout: 15000 });

      const departmentRow = await rowByText(page, departmentCode);
      await actionButtons(departmentRow).nth(2).click();
      const editDepartmentDialog = page.getByRole('dialog', { name: /Add Department|Edit Department/i });
      await editDepartmentDialog.getByPlaceholder('Enter department name').fill(`${departmentName} Updated`);
      const updateDepartmentResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/depts/') && response.request().method() === 'PUT',
      );
      await editDepartmentDialog.getByRole('button', { name: /^Submit$/i }).evaluate((node) => (node as HTMLButtonElement).click());
      expect((await updateDepartmentResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, `${departmentName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('role create update delete works', async () => {
      await openSidebarPage(page, /Roles/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      const roleDialog = page.getByRole('dialog', { name: /Add Role|Edit Role/i });
      await roleDialog.getByPlaceholder('Enter role name').fill(roleName);
      await roleDialog.getByPlaceholder('Enter role code').fill(roleCode);
      await roleDialog.getByText(/^System$/).last().click();
      await roleDialog.getByRole('button', { name: /Confirm|纭/i }).click();
      await expect(await rowByText(page, roleCode)).toBeVisible({ timeout: 15000 });

      const roleRow = await rowByText(page, roleCode);
      await actionButtons(roleRow).nth(1).click();
      const editRoleDialog = page.getByRole('dialog', { name: /Add Role|Edit Role/i });
      await editRoleDialog.getByPlaceholder('Enter role name').fill(`${roleName} Updated`);
      await editRoleDialog.getByRole('button', { name: /Confirm|纭/i }).click();
      await expect(await rowByText(page, `${roleName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('position create update delete works', async () => {
      await openSidebarPage(page, /Positions/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      const positionDialog = page.getByRole('dialog', { name: /Add Positions|Edit Positions|Add Position|Edit Position/i });
      await positionDialog.getByPlaceholder('Enter position name').fill(positionName);
      await positionDialog.getByPlaceholder('Enter position code').fill(positionCode);
      await fillRadixSelect(
        positionDialog.getByRole('combobox').nth(0),
        new RegExp(`^${escapeRegExp(`${departmentName} Updated`)}$`),
      );
      await positionDialog.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, positionCode)).toBeVisible({ timeout: 15000 });

      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /Edit|缂栬緫/i }).click();
      const editPositionDialog = page.getByRole('dialog', { name: /Add Positions|Edit Positions|Add Position|Edit Position/i });
      await editPositionDialog.getByPlaceholder('Enter position name').fill(`${positionName} Updated`);
      await editPositionDialog.getByRole('button', { name: /^Submit$/i }).click();
      await expect(await rowByText(page, `${positionName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('user create update delete works', async () => {
      await openSidebarPage(page, /Users/i);
      await page.getByRole('button', { name: /Add|鏂板/i }).last().click();
      const userDialog = page.getByRole('dialog', { name: /Add Users|Edit Users|Add User|Edit User/i });
      await userDialog.getByPlaceholder('Enter username').fill(userName);
      await userDialog.getByPlaceholder('Enter name').fill(userRealName);
      await userDialog.getByPlaceholder('Enter email').fill(userEmail);
      await userDialog.getByPlaceholder('Enter phone').fill(userPhone);
      await userDialog.getByPlaceholder('Enter password').fill('Admin12345!');
      await fillRadixSelect(
        userDialog.getByRole('combobox').nth(0),
        new RegExp(`^${escapeRegExp(`${departmentName} Updated`)}$`),
      );
      await userDialog.getByText(new RegExp(`^${escapeRegExp(`${roleName} Updated`)}$`)).click();
      const createUserResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/users') && response.request().method() === 'POST',
      );
      await userDialog.getByRole('button', { name: /^Submit$/i }).click();
      const createUserResponse = await createUserResponsePromise;
      if (!createUserResponse.ok()) {
        throw new Error(`create user failed: ${createUserResponse.status()} ${await createUserResponse.text()}`);
      }
      await expect(await rowByText(page, userName)).toBeVisible({ timeout: 15000 });

      const userRow = await rowByText(page, userName);
      await actionButtons(userRow).nth(1).click();
      const editUserDialog = page.getByRole('dialog', { name: /Add Users|Edit Users|Add User|Edit User/i });
      await editUserDialog.getByPlaceholder('Enter name').fill(`${userRealName} Updated`);
      const updateUserResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/users/') && response.request().method() === 'PUT',
      );
      await editUserDialog.getByRole('button', { name: /^Submit$/i }).click();
      const updateUserResponse = await updateUserResponsePromise;
      if (!updateUserResponse.ok()) {
        throw new Error(`update user failed: ${updateUserResponse.status()} ${await updateUserResponse.text()}`);
      }
      await expect(await rowByText(page, userName)).toBeVisible({ timeout: 15000 });

      const updatedUserRow = await rowByText(page, userName);
      await updatedUserRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, userName)).toHaveCount(0, { timeout: 15000 });
    });

    await test.step('role, position, and department cleanup via page works', async () => {
      await openSidebarPage(page, /Positions/i);
      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, positionCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Roles/i);
      const roleRow = await rowByText(page, roleCode);
      await roleRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, roleCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Departments/i);
      const departmentRow = await rowByText(page, departmentCode);
      await actionButtons(departmentRow).nth(3).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, departmentCode)).toHaveCount(0, { timeout: 15000 });
    });
  } finally {
    try {
      await deleteTenantViaApi(request, tenant.id, tenant.auth);
    } catch (error) {
      console.warn('Playwright cleanup skipped:', error);
    }
    try {
      dropTenantDatabase(tenantDatabase);
    } catch (error) {
      console.warn('Playwright database cleanup skipped:', error);
    }
  }
});





