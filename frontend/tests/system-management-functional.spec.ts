import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { e2eAdminUsername, getE2EAdminPassword, getE2EMysqlConfig } from './e2eCredentials';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';
const formSubmitButtonName = /^(Save|Submit|Confirm)$/i;

function runMysqlStatement(statement: string) {
  const { mysqlBin, mysqlHost, mysqlPort, mysqlUser, mysqlPassword } = getE2EMysqlConfig();
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
  const adminPassword = getE2EAdminPassword();
  await page.goto('/');
  await page.waitForResponse((response) => response.url().includes('/api/v1/auth/config') && response.ok());

  const tenantCodeField = page.getByLabel(/Tenant Code/i);
  if (await tenantCodeField.count()) {
    await expect(tenantCodeField).toBeHidden({ timeout: 15000 });
  }

  await page.getByLabel(/Username/i).fill(e2eAdminUsername);
  await page.getByLabel(/Password/i).fill(adminPassword);
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page.getByRole('button', { name: /System|Tenant/i }).first()).toBeVisible({
    timeout: 20000,
  });
}

async function ensureLoggedIn(page: Page) {
  if (/\/login(?:$|\?)/i.test(page.url())) {
    await login(page);
    return;
  }

  const loginButton = page.getByRole('button', { name: /^Login$/i });
  if ((await loginButton.count()) > 0) {
    await login(page);
  }
}

async function loginByApi(request: APIRequestContext) {
  const adminPassword = getE2EAdminPassword();
  const response = await request.post(`${backendOrigin}/api/v1/auth/login`, {
    data: {
      username: e2eAdminUsername,
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

async function firstVisibleLocator(locator: Locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible()) {
      return candidate;
    }
  }
  return null;
}

async function filterTableByKeyword(page: Page, placeholder: RegExp, value: string) {
  const main = page.locator('main');
  const placeholderInput = await firstVisibleLocator(main.getByPlaceholder(placeholder));
  const dataSlotInput = await firstVisibleLocator(main.locator('input[data-slot="input"]'));
  const textboxInput = await firstVisibleLocator(main.getByRole('textbox'));
  const genericInput = await firstVisibleLocator(main.locator('input:not([type="hidden"]), textarea'));
  const searchInput = placeholderInput ?? dataSlotInput ?? textboxInput ?? genericInput;
  if (!searchInput) {
    throw new Error(`no visible search input found for ${placeholder}`);
  }
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(value);
}

async function filterRoleTableByKeyword(page: Page, value: string) {
  const roleSearchInput = page.locator('main input[data-slot="input"]').first();
  await expect(roleSearchInput).toBeVisible({ timeout: 10000 });
  await roleSearchInput.fill(value);
}

function actionButtons(row: Locator) {
  return row.locator('td').last().locator('button');
}

async function fillRadixSelect(trigger: Locator, optionText: RegExp) {
  await trigger.click();
  await trigger.page().getByRole('option', { name: optionText }).click();
}

async function confirmDeleteDialog(page: Page) {
  const deleteDialog = page
    .getByRole('alertdialog')
    .filter({ has: page.getByRole('button', { name: /^Delete$/i }) })
    .last();
  await expect(deleteDialog).toBeVisible({ timeout: 10000 });
  await deleteDialog.getByRole('button', { name: /^Delete$/i }).click();
  await expect(deleteDialog).toBeHidden({ timeout: 15000 });
}

async function confirmActionDialog(page: Page, confirmButtonName: RegExp) {
  const actionDialog = page.getByRole('alertdialog').last();
  await expect(actionDialog).toBeVisible({ timeout: 10000 });
  await actionDialog.getByRole('button', { name: confirmButtonName }).click();
  await expect(actionDialog).toBeHidden({ timeout: 15000 });
}

async function clickCheckboxLabel(input: Locator) {
  const id = await input.getAttribute('id');
  try {
    await input.evaluate((node) => (node as HTMLInputElement).click());
    return;
  } catch {
    // fall through to label/input actionability fallback
  }
  if (id) {
    await input.page().locator(`label[for="${id}"]`).last().click({ force: true });
    return;
  }
  await input.check({ force: true });
}

async function selectFirstUncheckedCheckbox(
  container: Locator,
  options?: { skipIds?: string[] },
) {
  const checkboxes = container.locator('input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let index = 0; index < count; index += 1) {
    const checkbox = checkboxes.nth(index);
    const checkboxId = await checkbox.getAttribute('id');
    if (checkboxId && options?.skipIds?.includes(checkboxId)) {
      continue;
    }
    if (!(await checkbox.isChecked())) {
      await clickCheckboxLabel(checkbox);
      await expect(checkbox).toBeChecked({ timeout: 5000 });
      return true;
    }
  }
  return false;
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  await attachApiProxy(context);
});

test('checks tenant setup and admin CRUD pages', async ({ page, request }) => {
  test.setTimeout(25 * 60_000);
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
  const menuName = `PW Menu ${seed}`;
  const updatedMenuName = `${menuName} Updated`;
  const menuCode = `PWMENU${seed}`;
  const permissionCode = `system:pwe2e:${seed}`;
  const permissionName = `PW Permission ${seed}`;
  const updatedPermissionName = `${permissionName} Updated`;
  const dictTypeName = `PW Dict Type ${seed}`;
  const updatedDictTypeName = `${dictTypeName} Updated`;
  const dictTypeCode = `pwdict${seed}`;
  const dictItemLabel = `PW Dict Item ${seed}`;
  const updatedDictItemLabel = `${dictItemLabel} Updated`;
  const dictItemValue = `pw-value-${seed}`;
  const updatedDictItemValue = `pw-value-updated-${seed}`;
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

      await page.getByRole('button', { name: /Start Setup/i }).click();
      await page.getByRole('button', { name: /MySQL/i }).click();

      const setupDialog = page.getByRole('dialog', { name: /Tenant Database Setup/i });
      await setupDialog.getByPlaceholder('127.0.0.1').fill('127.0.0.1');
      await setupDialog.getByRole('spinbutton').fill('3306');
      await setupDialog.getByPlaceholder('pantheon_tenant_db').fill(tenantDatabase);
      await setupDialog.getByPlaceholder('root').fill('root');
      await setupDialog.getByPlaceholder('Enter database password').fill(getE2EMysqlConfig().mysqlPassword);
      await setupDialog.getByRole('button', { name: /^Next$/i }).click();

      await expect(page.getByText(/Connection Succeeded/i)).toBeVisible({ timeout: 30000 });
      const finishSetupResponsePromise = page.waitForResponse(
        (response) => response.url().includes(`/api/v1/tenants/${tenant.id}/setup`) && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: /Finish Setup/i }).click();
      const finishSetupResponse = await finishSetupResponsePromise;
      if (!finishSetupResponse.ok()) {
        throw new Error(`finish tenant setup failed: ${finishSetupResponse.status()} ${await finishSetupResponse.text()}`);
      }
      const backToTenantManagement = page.getByRole('button', { name: /Back to Tenant Management/i });
      await expect(backToTenantManagement).toBeVisible({ timeout: 60000 });
      await backToTenantManagement.scrollIntoViewIfNeeded();
      await backToTenantManagement.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(page.locator('main').getByText(/Tenant Management/i)).toBeVisible({ timeout: 15000 });
    });

    await test.step('department create update delete works', async () => {
      await openSidebarPage(page, /Departments/i);
      await page.getByRole('button', { name: /Add/i }).last().click();
      const departmentDialog = page.getByRole('dialog', { name: /Add Department|Edit Department/i });
      await departmentDialog.getByPlaceholder('Enter department name').fill(departmentName);
      await departmentDialog.getByPlaceholder('Enter department code').fill(departmentCode);
      const createDepartmentResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/depts') && response.request().method() === 'POST',
      );
      await departmentDialog.getByRole('button', { name: formSubmitButtonName }).evaluate((node) => (node as HTMLButtonElement).click());
      expect((await createDepartmentResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, departmentCode)).toBeVisible({ timeout: 15000 });

      const departmentRow = await rowByText(page, departmentCode);
      await actionButtons(departmentRow).nth(2).click();
      const editDepartmentDialog = page.getByRole('dialog', { name: /Add Department|Edit Department/i });
      await editDepartmentDialog.getByPlaceholder('Enter department name').fill(`${departmentName} Updated`);
      const updateDepartmentResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/depts/') && response.request().method() === 'PUT',
      );
      await editDepartmentDialog.getByRole('button', { name: formSubmitButtonName }).evaluate((node) => (node as HTMLButtonElement).click());
      expect((await updateDepartmentResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, `${departmentName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('role create update delete works', async () => {
      await openSidebarPage(page, /Roles/i);
      await page.getByRole('button', { name: /Add/i }).last().click();
      const roleDialog = page.getByRole('dialog', { name: /Add Role|Edit Role/i });
      await roleDialog.getByPlaceholder('Enter role name').fill(roleName);
      await roleDialog.getByPlaceholder('Enter role code').fill(roleCode);
      await roleDialog.getByText(/^System$/).last().click();
      const createRoleResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/roles') && response.request().method() === 'POST',
      );
      await roleDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const createRoleResponse = await createRoleResponsePromise;
      if (!createRoleResponse.ok()) {
        throw new Error(`create role failed: ${createRoleResponse.status()} ${await createRoleResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search roles|闂佺懓鍚嬬划搴ㄥ磼閵娧勫枂闁圭儤娲栭ˉ蹇涙煕濮橆剛肖鐞氥劑鏌曢崱鏇″厡缂侀硸浜幆宥嗘媴閻熸壆浠愰梺纭咁嚙缁绘宕奸悰鍡涙煙閸忚偐鐭岄柛灞诲妿閹叉挳骞掗弴鐑嗘/i, roleCode);
      await expect(await rowByText(page, roleCode)).toBeVisible({ timeout: 15000 });

      const roleRow = await rowByText(page, roleCode);
      await actionButtons(roleRow).nth(1).click();
      const editRoleDialog = page.getByRole('dialog', { name: /Add Role|Edit Role/i });
      await editRoleDialog.getByPlaceholder('Enter role name').fill(`${roleName} Updated`);
      const updateRoleResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/roles/') && response.request().method() === 'PUT',
      );
      await editRoleDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const updateRoleResponse = await updateRoleResponsePromise;
      if (!updateRoleResponse.ok()) {
        throw new Error(`update role failed: ${updateRoleResponse.status()} ${await updateRoleResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search roles|闂佺懓鍚嬬划搴ㄥ磼閵娧勫枂闁圭儤娲栭ˉ蹇涙煕濮橆剛肖鐞氥劑鏌曢崱鏇″厡缂侀硸浜幆宥嗘媴閻熸壆浠愰梺纭咁嚙缁绘宕奸悰鍡涙煙閸忚偐鐭岄柛灞诲妿閹叉挳骞掗弴鐑嗘/i, roleCode);
      await expect(await rowByText(page, `${roleName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('position create update delete works', async () => {
      await openSidebarPage(page, /Positions/i);
      await page.getByRole('button', { name: /Add/i }).last().click();
      const positionDialog = page.getByRole('dialog', { name: /Add Positions|Edit Positions|Add Position|Edit Position/i });
      await positionDialog.getByPlaceholder('Enter position name').fill(positionName);
      await positionDialog.getByPlaceholder('Enter position code').fill(positionCode);
      await fillRadixSelect(
        positionDialog.getByRole('combobox').nth(0),
        new RegExp(`^${escapeRegExp(`${departmentName} Updated`)}$`),
      );
      const createPositionResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/positions') && response.request().method() === 'POST',
      );
      await positionDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const createPositionResponse = await createPositionResponsePromise;
      if (!createPositionResponse.ok()) {
        throw new Error(`create position failed: ${createPositionResponse.status()} ${await createPositionResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search/i, positionCode);
      await expect(await rowByText(page, positionCode)).toBeVisible({ timeout: 15000 });

      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /Edit/i }).click();
      const editPositionDialog = page.getByRole('dialog', { name: /Add Positions|Edit Positions|Add Position|Edit Position/i });
      await editPositionDialog.getByPlaceholder('Enter position name').fill(`${positionName} Updated`);
      const updatePositionResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/positions/') && response.request().method() === 'PUT',
      );
      await editPositionDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const updatePositionResponse = await updatePositionResponsePromise;
      if (!updatePositionResponse.ok()) {
        throw new Error(`update position failed: ${updatePositionResponse.status()} ${await updatePositionResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search/i, positionCode);
      await expect(await rowByText(page, `${positionName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('user create update delete works', async () => {
      await openSidebarPage(page, /Users/i);
      await page.getByRole('button', { name: /Add/i }).last().click();
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
      await userDialog.getByRole('button', { name: formSubmitButtonName }).click();
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
      await editUserDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const updateUserResponse = await updateUserResponsePromise;
      if (!updateUserResponse.ok()) {
        throw new Error(`update user failed: ${updateUserResponse.status()} ${await updateUserResponse.text()}`);
      }
      await expect(await rowByText(page, userName)).toBeVisible({ timeout: 15000 });
    });

    await test.step('role menu config and batch status works', async () => {
      await openSidebarPage(page, /Roles/i);
      await filterRoleTableByKeyword(page, roleCode);
      let roleRow = await rowByText(page, roleCode);
      await expect(roleRow).toBeVisible({ timeout: 15000 });

      let roleStatusCheckbox = roleRow.getByRole('checkbox').last();
      await roleRow.locator('td').first().locator('label').click();

      const disableRoleResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/roles/status') && response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: /^Disable \(\d+\)$/i }).click();
      await confirmActionDialog(page, /^Disable$/i);
      const disableRoleResponse = await disableRoleResponsePromise;
      if (!disableRoleResponse.ok()) {
        throw new Error(`batch disable role failed: ${disableRoleResponse.status()} ${await disableRoleResponse.text()}`);
      }
      roleRow = await rowByText(page, roleCode);
      roleStatusCheckbox = roleRow.getByRole('checkbox').last();
      await expect(roleStatusCheckbox).not.toBeChecked({ timeout: 15000 });

      await roleRow.locator('td').first().locator('label').click();
      const enableRoleResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/roles/status') && response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: /^Enable \(\d+\)$/i }).click();
      await confirmActionDialog(page, /^Enable$/i);
      const enableRoleResponse = await enableRoleResponsePromise;
      if (!enableRoleResponse.ok()) {
        throw new Error(`batch enable role failed: ${enableRoleResponse.status()} ${await enableRoleResponse.text()}`);
      }
      roleRow = await rowByText(page, roleCode);
      roleStatusCheckbox = roleRow.getByRole('checkbox').last();
      await expect(roleStatusCheckbox).toBeChecked({ timeout: 15000 });

      await actionButtons(roleRow).nth(0).click();
      const rolePermissionDialog = page.getByRole('dialog', { name: /Configure Menu Permissions/i });
      await expect(rolePermissionDialog).toBeVisible({ timeout: 15000 });
      const selectedMenu = await selectFirstUncheckedCheckbox(rolePermissionDialog);
      if (!selectedMenu) {
        throw new Error('no selectable menu found for role permission dialog');
      }
      const assignMenusResponsePromise = page.waitForResponse(
        (response) => /\/api\/v1\/system\/roles\/[^/]+\/menus$/.test(response.url()) && response.request().method() === 'POST',
      );
      await rolePermissionDialog.getByRole('button', { name: /^Save$/i }).click();
      const assignMenusResponse = await assignMenusResponsePromise;
      if (!assignMenusResponse.ok()) {
        throw new Error(`assign role menus failed: ${assignMenusResponse.status()} ${await assignMenusResponse.text()}`);
      }
      await expect(rolePermissionDialog).toBeHidden({ timeout: 15000 });
    });

    await test.step('menu create update status delete works', async () => {
      await openSidebarPage(page, /Menus/i);
      await page.getByRole('button', { name: /Add/i }).last().click();

      const menuDialog = page.getByRole('dialog', { name: /Add .*Menus|Edit .*Menus/i });
      await menuDialog.getByPlaceholder('Enter menu name').fill(menuName);
      await menuDialog.getByPlaceholder('Enter menu code').fill(menuCode);
      await menuDialog.getByPlaceholder('/system/user').fill(`/system/pw-${seed}`);
      await menuDialog.getByPlaceholder('system/UserManagement').fill(`system/PWMenu${seed}`);
      await menuDialog.getByRole('button', { name: formSubmitButtonName }).click();
      await expect(await rowByText(page, menuCode)).toBeVisible({ timeout: 15000 });

      const menuRow = await rowByText(page, menuCode);
      await actionButtons(menuRow).nth(1).click();
      const editMenuDialog = page.getByRole('dialog', { name: /Add .*Menus|Edit .*Menus/i });
      await editMenuDialog.getByPlaceholder('Enter menu name').fill(updatedMenuName);
      await editMenuDialog.getByPlaceholder('/system/user').fill(`/system/pw-${seed}-updated`);
      await editMenuDialog.getByRole('button', { name: formSubmitButtonName }).click();
      await expect(await rowByText(page, updatedMenuName)).toBeVisible({ timeout: 15000 });

      const updatedMenuRow = await rowByText(page, updatedMenuName);
      const menuStatusToggle = updatedMenuRow.locator('td').nth(4).locator('label[data-slot="switch"]');
      const menuStatusCheckbox = updatedMenuRow.locator('td').nth(4).getByRole('checkbox');
      const disableMenuResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/menus/status') && response.request().method() === 'PATCH',
      );
      await menuStatusToggle.click();
      await confirmActionDialog(page, /Disable/i);
      expect((await disableMenuResponsePromise).ok()).toBeTruthy();
      await expect(menuStatusCheckbox).not.toBeChecked({ timeout: 15000 });

      await updatedMenuRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, menuCode)).toHaveCount(0, { timeout: 15000 });
    });

    await test.step('permission create update status delete works', async () => {
      await openSidebarPage(page, /Permissions/i);
      await page.getByRole('button', { name: /Add/i }).last().click();

      const permissionDialog = page.getByRole('dialog', { name: /Add Permission|Edit Permission/i });
      await permissionDialog.getByPlaceholder('Enter permission code, e.g. system:user:view').fill(permissionCode);
      await permissionDialog.getByPlaceholder('Enter permission name').fill(permissionName);
      await fillRadixSelect(permissionDialog.getByRole('combobox').nth(1), /System Management/i);
      await permissionDialog.getByPlaceholder('Enter permission description').fill('Created by Playwright');
      const createPermissionResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/permissions') && response.request().method() === 'POST',
      );
      await permissionDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const createPermissionResponse = await createPermissionResponsePromise;
      if (!createPermissionResponse.ok()) {
        throw new Error(`create permission failed: ${createPermissionResponse.status()} ${await createPermissionResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search name, code, or description/i, permissionCode);
      await expect(await rowByText(page, permissionCode)).toBeVisible({ timeout: 15000 });

      const permissionRow = await rowByText(page, permissionCode);
      await actionButtons(permissionRow).nth(0).click();
      const editPermissionDialog = page.getByRole('dialog', { name: /Add Permission|Edit Permission/i });
      await editPermissionDialog.getByPlaceholder('Enter permission name').fill(updatedPermissionName);
      const updatePermissionResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/permissions/') && response.request().method() === 'PUT',
      );
      await editPermissionDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const updatePermissionResponse = await updatePermissionResponsePromise;
      if (!updatePermissionResponse.ok()) {
        throw new Error(`update permission failed: ${updatePermissionResponse.status()} ${await updatePermissionResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search name, code, or description/i, permissionCode);
      await expect(await rowByText(page, updatedPermissionName)).toBeVisible({ timeout: 15000 });

      const updatedPermissionRow = await rowByText(page, permissionCode);
      const permissionStatusToggle = updatedPermissionRow.locator('td').nth(5).locator('label[data-slot="switch"]');
      const permissionStatusCheckbox = updatedPermissionRow.locator('td').nth(5).getByRole('checkbox');
      const disablePermissionResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/permissions/') && response.request().method() === 'PUT',
      );
      await permissionStatusToggle.click();
      await confirmActionDialog(page, /Disable/i);
      const disablePermissionResponse = await disablePermissionResponsePromise;
      if (!disablePermissionResponse.ok()) {
        throw new Error(`disable permission failed: ${disablePermissionResponse.status()} ${await disablePermissionResponse.text()}`);
      }
      await expect(permissionStatusCheckbox).not.toBeChecked({ timeout: 15000 });

      await actionButtons(updatedPermissionRow).nth(1).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, permissionCode)).toHaveCount(0, { timeout: 15000 });
    });

    await test.step('dictionary type and item CRUD works', async () => {
      await openSidebarPage(page, /Dictionary/i);
      await expect(page.locator('main').getByRole('heading', { name: /Dictionary|Data Dictionary/i })).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: /Add Type/i }).click();
      const addTypeDialog = page.getByRole('dialog', { name: /Add Type|Edit Type/i });
      await addTypeDialog.getByPlaceholder(/e\.g\. User Status/i).fill(dictTypeName);
      await addTypeDialog.getByPlaceholder(/e\.g\. user_status/i).fill(dictTypeCode);
      await addTypeDialog.getByPlaceholder(/Enter type description/i).fill('Created by Playwright');
      const createDictTypeResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/dict/types') && response.request().method() === 'POST',
      );
      await addTypeDialog.getByRole('button', { name: /^Save$/i }).click();
      expect((await createDictTypeResponsePromise).ok()).toBeTruthy();

      const dictTypeButton = page.locator('button', { hasText: dictTypeName }).first();
      await expect(dictTypeButton).toBeVisible({ timeout: 15000 });
      await dictTypeButton.click();

      await page.getByRole('button', { name: /Add Item/i }).click();
      const addItemDialog = page.getByRole('dialog', { name: /Add Dictionary Item|Edit Dictionary Item|Add Item|Edit Item/i });
      await addItemDialog.locator('input[placeholder="e.g. Active"]').fill(dictItemLabel);
      await addItemDialog.locator('input[placeholder="e.g. active"]').fill(dictItemValue);
      await addItemDialog.locator('textarea[placeholder="Enter remark"]').fill('Created by Playwright');
      const createDictItemResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/dict/data') && response.request().method() === 'POST',
      );
      await addItemDialog.getByRole('button', { name: /^Save$/i }).click();
      expect((await createDictItemResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, dictItemValue)).toBeVisible({ timeout: 15000 });

      const dictItemRow = await rowByText(page, dictItemValue);
      await actionButtons(dictItemRow).nth(0).click();
      const editItemDialog = page.getByRole('dialog', { name: /Add Dictionary Item|Edit Dictionary Item|Add Item|Edit Item/i });
      await editItemDialog.locator('input[placeholder="e.g. Active"]').fill(updatedDictItemLabel);
      await editItemDialog.locator('input[placeholder="e.g. active"]').fill(updatedDictItemValue);
      const updateDictItemResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/dict/data/') && response.request().method() === 'PUT',
      );
      await editItemDialog.getByRole('button', { name: /^Save$/i }).click();
      expect((await updateDictItemResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, updatedDictItemValue)).toBeVisible({ timeout: 15000 });

      const updatedDictItemRow = await rowByText(page, updatedDictItemValue);
      const dictStatusToggle = updatedDictItemRow.locator('td').nth(4).locator('label[data-slot="switch"]');
      const dictStatusCheckbox = updatedDictItemRow.locator('td').nth(4).getByRole('checkbox');
      const dictStatusResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/dict/data/') && response.request().method() === 'PUT',
      );
      await dictStatusToggle.click();
      expect((await dictStatusResponsePromise).ok()).toBeTruthy();
      await expect(dictStatusCheckbox).not.toBeChecked({ timeout: 15000 });

      await updatedDictItemRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, updatedDictItemValue)).toHaveCount(0, { timeout: 15000 });

      await page.getByRole('button', { name: /Edit Type/i }).click();
      const editTypeDialog = page.getByRole('dialog', { name: /Add Type|Edit Type/i });
      await editTypeDialog.getByPlaceholder(/e\.g\. User Status/i).fill(updatedDictTypeName);
      const updateDictTypeResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/dict/types/') && response.request().method() === 'PUT',
      );
      await editTypeDialog.getByRole('button', { name: /^Save$/i }).click();
      expect((await updateDictTypeResponsePromise).ok()).toBeTruthy();
      await expect(page.locator('button', { hasText: updatedDictTypeName }).first()).toBeVisible({ timeout: 15000 });

      await page.getByRole('button', { name: /Delete Type/i }).click();
      await confirmDeleteDialog(page);
      await expect(page.locator('button', { hasText: updatedDictTypeName })).toHaveCount(0, { timeout: 15000 });
    });

    await test.step('system settings query update works', async () => {
      await openSidebarPage(page, /Settings/i);
      await expect(page.locator('main').getByRole('heading', { name: /Settings|System Settings/i }).first()).toBeVisible({ timeout: 15000 });

      const mainTextboxes = page.locator('main').getByRole('textbox');
      const nextSystemName = `${await mainTextboxes.nth(0).inputValue()} ${seed}`;
      const nextSystemSubtitle = `${await mainTextboxes.nth(1).inputValue()} ${seed}`;
      await mainTextboxes.nth(0).fill(nextSystemName);
      await mainTextboxes.nth(1).fill(nextSystemSubtitle);
      await mainTextboxes.nth(1).press('Tab');
      const syncNowButton = page.getByRole('button', { name: /Sync Now/i }).last();
      await expect(syncNowButton).toBeVisible({ timeout: 10000 });
      await expect(syncNowButton).toBeEnabled({ timeout: 10000 });

      const updateSettingResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/settings/') && response.request().method() === 'PUT',
      );
      await syncNowButton.evaluate((node) => (node as HTMLButtonElement).click());
      expect((await updateSettingResponsePromise).ok()).toBeTruthy();
      await expect(mainTextboxes.nth(0)).toHaveValue(nextSystemName, { timeout: 15000 });
      await expect(mainTextboxes.nth(1)).toHaveValue(nextSystemSubtitle, { timeout: 15000 });

      const exportSettingsPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /^Export$/i }).click();
      await exportSettingsPromise;

      const importedSystemSubtitle = `Imported Subtitle ${seed}`;
      const importSettingsResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/settings/batch') && response.request().method() === 'POST',
      );
      await page.locator('input[type="file"]').setInputFiles({
        name: `settings-${seed}.json`,
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            settings: [{ key: 'system.subtitle', value: importedSystemSubtitle }],
          }),
        ),
      });
      const importSettingsResponse = await importSettingsResponsePromise;
      if (!importSettingsResponse.ok()) {
        throw new Error(`import settings failed: ${importSettingsResponse.status()} ${await importSettingsResponse.text()}`);
      }
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main').getByRole('heading', { name: /System Overview/i })).toBeVisible({ timeout: 15000 });
      await page
        .locator('main')
        .getByRole('button', { name: /^(Open Settings|Settings)$/i })
        .first()
        .click();
      await expect(page.locator('main').getByRole('heading', { name: /Settings|System Settings/i }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main').getByRole('textbox').nth(1)).toHaveValue(importedSystemSubtitle, { timeout: 15000 });
    });

    await test.step('user detail permissions role assignment and reset password works', async () => {
      await openSidebarPage(page, /Users/i);
      await filterTableByKeyword(page, /Search/i, userName);
      let userRow = await rowByText(page, userName);
      await expect(userRow).toBeVisible({ timeout: 15000 });

      await actionButtons(userRow).nth(0).click();
      const detailDialog = page.getByRole('dialog').filter({ has: page.getByText(new RegExp(`@${escapeRegExp(userName)}`)) }).last();
      await expect(detailDialog).toBeVisible({ timeout: 15000 });
      const getUserPermissionsResponsePromise = page.waitForResponse(
        (response) => /\/api\/v1\/system\/users\/[^/]+\/permissions$/.test(response.url()) && response.request().method() === 'GET',
      );
      await detailDialog.getByRole('tab', { name: /Permissions/i }).click();
      const getUserPermissionsResponse = await getUserPermissionsResponsePromise;
      if (!getUserPermissionsResponse.ok()) {
        throw new Error(`get user permissions failed: ${getUserPermissionsResponse.status()} ${await getUserPermissionsResponse.text()}`);
      }
      await expect(detailDialog).toContainText(/Total:/i, { timeout: 15000 });
      await detailDialog.getByRole('tab', { name: /Activity/i }).click();
      await expect(detailDialog).toContainText(/Last login time|No record/i, { timeout: 15000 });
      await detailDialog.press('Escape');
      await expect(detailDialog).toBeHidden({ timeout: 15000 });

      await userRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /Assign Roles/i }).click();
      const roleAssignDialog = page.getByRole('dialog', { name: /Assign Roles/i });
      await expect(roleAssignDialog).toBeVisible({ timeout: 15000 });
      const roleChanged = await selectFirstUncheckedCheckbox(roleAssignDialog, {
        skipIds: ['has-expiry'],
      });
      if (!roleChanged) {
        throw new Error('no additional role available for assignment');
      }
      const assignRoleResponsePromise = page.waitForResponse(
        (response) => /\/api\/v1\/system\/users\/[^/]+$/.test(response.url()) && response.request().method() === 'PUT',
      );
      const confirmAssignRoleButton = roleAssignDialog.getByRole('button', { name: /^Confirm$/i });
      await expect(confirmAssignRoleButton).toBeEnabled({ timeout: 10000 });
      await confirmAssignRoleButton.evaluate((node) => (node as HTMLButtonElement).click());
      const assignRoleResponse = await assignRoleResponsePromise;
      if (!assignRoleResponse.ok()) {
        throw new Error(`assign user roles failed: ${assignRoleResponse.status()} ${await assignRoleResponse.text()}`);
      }
      await expect(roleAssignDialog).toBeHidden({ timeout: 15000 });

      userRow = await rowByText(page, userName);
      await userRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /Reset Password/i }).click();
      const resetPasswordDialog = page.getByRole('dialog', { name: /Reset Password/i });
      await expect(resetPasswordDialog).toBeVisible({ timeout: 15000 });
      await resetPasswordDialog.getByPlaceholder(/Enter new password/i).fill(`Reset!${seed}`);
      await resetPasswordDialog.getByPlaceholder(/Enter the new password again/i).fill(`Reset!${seed}`);
      const resetPasswordResponsePromise = page.waitForResponse(
        (response) => /\/api\/v1\/system\/users\/[^/]+\/password$/.test(response.url()) && response.request().method() === 'PATCH',
      );
      await resetPasswordDialog.getByRole('button', { name: /Confirm Reset/i }).click();
      const resetPasswordResponse = await resetPasswordResponsePromise;
      if (!resetPasswordResponse.ok()) {
        throw new Error(`reset user password failed: ${resetPasswordResponse.status()} ${await resetPasswordResponse.text()}`);
      }
      await expect(resetPasswordDialog).toBeHidden({ timeout: 15000 });

      userRow = await rowByText(page, userName);
      await userRow.locator('td').first().locator('label').click();
      const disableUserResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/users/status') && response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: /^Disable \(\d+\)$/i }).click();
      await confirmActionDialog(page, /^Disable$/i);
      const disableUserResponse = await disableUserResponsePromise;
      if (!disableUserResponse.ok()) {
        throw new Error(`batch disable user failed: ${disableUserResponse.status()} ${await disableUserResponse.text()}`);
      }
      userRow = await rowByText(page, userName);
      await expect(userRow.getByRole('checkbox').last()).not.toBeChecked({ timeout: 15000 });

      await userRow.locator('td').first().locator('label').click();
      const enableUserResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/users/status') && response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: /^Enable \(\d+\)$/i }).click();
      await confirmActionDialog(page, /^Enable$/i);
      const enableUserResponse = await enableUserResponsePromise;
      if (!enableUserResponse.ok()) {
        throw new Error(`batch enable user failed: ${enableUserResponse.status()} ${await enableUserResponse.text()}`);
      }
      userRow = await rowByText(page, userName);
      await expect(userRow.getByRole('checkbox').last()).toBeChecked({ timeout: 15000 });
    });

    await test.step('unified logs query export and clear works', async () => {
      await openSidebarPage(page, /Logs/i);
      await expect(page.locator('main').getByRole('heading', { name: /Audit Logs|Logs|Log/i }).first()).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator('main').getByRole('textbox').first()).toBeVisible({ timeout: 15000 });

      const logSearchInput = page.getByPlaceholder(/Search/i).last();
      await logSearchInput.fill(e2eAdminUsername);
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

      const loginExportPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /^Export$/i }).click();
      await loginExportPromise;

      await page.getByRole('button', { name: /Operation/i }).click();
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

      const clearLogsResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/logs/operation') && response.request().method() === 'DELETE',
      );
      await page.getByRole('button', { name: /Clear Operation Logs|Delete Selected/i }).click();
      expect((await clearLogsResponsePromise).ok()).toBeTruthy();
    });

    await test.step('system monitor query refresh export works', async () => {
      await openSidebarPage(page, /Monitor/i);
      await expect(
        page.locator('main').getByRole('heading', { name: /System Monitor|Monitor|Monitoring/i }).first(),
      ).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main')).toContainText(/Online Users|Redis/i, { timeout: 15000 });

      const refreshMonitorResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/monitor/overview') && response.request().method() === 'GET',
      );
      await page.getByRole('button', { name: /^Refresh$/i }).click();
      expect((await refreshMonitorResponsePromise).ok()).toBeTruthy();

      const exportMonitorPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Export Snapshot/i }).click();
      await exportMonitorPromise;
    });

    await test.step('role, position, and department cleanup via page works', async () => {
      await ensureLoggedIn(page);
      await openSidebarPage(page, /Users/i);
      await filterTableByKeyword(page, /Search/i, userName);
      const userRow = await rowByText(page, userName);
      await userRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, userName)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Positions/i);
      await filterTableByKeyword(page, /Search/i, positionCode);
      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, positionCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Roles/i);
      await filterRoleTableByKeyword(page, roleCode);
      const roleRow = await rowByText(page, roleCode);
      await roleRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, roleCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, /Departments/i);
      await filterTableByKeyword(page, /Search/i, departmentCode);
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





