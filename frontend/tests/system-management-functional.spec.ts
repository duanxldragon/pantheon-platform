import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { e2eAdminUsername, e2eTenantCode, getE2EAdminPassword, getE2EMysqlConfig } from './e2eCredentials';

const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8080';
const formSubmitButtonName = /^(Save|Submit|Confirm)$/i;
const tenantNavName = /Tenants|Tenant|租户/i;
const departmentNavName = /Departments|Department|部门/i;
const roleNavName = /Roles|Role|角色/i;
const positionNavName = /Positions|Position|岗位/i;
const userNavName = /Users|User|用户/i;
const menuNavName = /Menus|Menu|菜单/i;
const permissionNavName = /Permissions|Permission|权限/i;
const dictionaryNavName = /Dictionary|Data Dictionary|字典/i;
const settingsNavName = /Settings|System Settings|设置/i;
const logsNavName = /Logs|Audit Logs|日志/i;
const monitorNavName = /Monitor|System Monitor|Monitoring|监控/i;
const createButtonName = /Add|Create|新增|创建|create/i;
const roleDialogName = /Add Role|Edit Role|Create Role/i;
const positionDialogName = /Add Positions|Edit Positions|Add Position|Edit Position|Create Positions|Create Position/i;
const userDialogName = /Add Users|Edit Users|Add User|Edit User|Create Users|Create User/i;
const menuDialogName = /Add .*Menus|Edit .*Menus|Create .*Menus|Create .*Menu/i;
const departmentDialogName = /Add Department|Edit Department|Create Department/i;

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

async function login(page: Page, tenantCodeOverride?: string) {
  const adminPassword = getE2EAdminPassword();
  const tenantCode = tenantCodeOverride ?? e2eTenantCode;
  if (tenantCode) {
    await page.addInitScript((value) => {
      window.localStorage.setItem('rememberedTenantCode', value);
    }, tenantCode);
  }
  await page.goto('/');
  const usernameInput = page.locator('#username').first();
  const passwordInput = page.locator('#password').first();
  await usernameInput.waitFor({ state: 'visible', timeout: 15000 });

  if (tenantCode) {
    const tenantCodeInput = page.locator('#tenantCode');
    if (!(await tenantCodeInput.isVisible().catch(() => false))) {
      const tenantToggleButton = page
        .getByRole('button', { name: /Enter Tenant Code|输入租户代码|填写租户编码/i })
        .first();
      await expect(tenantToggleButton).toBeVisible({ timeout: 10000 });
      await tenantToggleButton.click();
      await tenantCodeInput.waitFor({ state: 'visible', timeout: 10000 });
    }
    await tenantCodeInput.fill(tenantCode);
    await expect(tenantCodeInput).toHaveValue(tenantCode);
  }

  await usernameInput.fill(e2eAdminUsername);
  await passwordInput.fill(adminPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
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

async function logout(page: Page) {
  const accountTrigger = page.getByRole('button').filter({ has: page.getByText(e2eAdminUsername) }).first();
  await expect(accountTrigger).toBeVisible({ timeout: 15000 });
  await accountTrigger.click();

  const logoutItem = page.getByRole('menuitem', { name: /Log ?out|退出/i }).first();
  await expect(logoutItem).toBeVisible({ timeout: 10000 });
  await logoutItem.click();
  const confirmLogoutDialog = page.getByRole('alertdialog', { name: /Confirm Logout|确认退出/i }).last();
  if ((await confirmLogoutDialog.count()) > 0) {
    await expect(confirmLogoutDialog).toBeVisible({ timeout: 10000 });
    await confirmLogoutDialog.getByRole('button', { name: /Sign Out|退出登录|确认退出/i }).click();
  }

  await expect(page.locator('#username').first()).toBeVisible({ timeout: 15000 });
}

async function loginByApi(request: APIRequestContext) {
  return loginByApiForTenant(request);
}

async function loginByApiForTenant(request: APIRequestContext, tenantCodeOverride?: string) {
  const adminPassword = getE2EAdminPassword();
  const data: {
    username: string;
    password: string;
    tenant_code?: string;
  } = {
    username: e2eAdminUsername,
    password: adminPassword,
  };
  const tenantCode = tenantCodeOverride ?? e2eTenantCode;
  if (tenantCode) {
    data.tenant_code = tenantCode;
  }
  const response = await request.post(`${backendOrigin}/api/v1/auth/login`, {
    data,
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return {
    token: payload.data.access_token as string,
    tenantId: payload.data.user.tenant_id as string,
    userId: payload.data.user.id as string,
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

  if (!response.ok()) {
    throw new Error(`create tenant failed: ${response.status()} ${await response.text()}`);
  }
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

function buildAuthHeaders(auth: { token: string; tenantId: string }) {
  return {
    Authorization: `Bearer ${auth.token}`,
    'X-Tenant-ID': auth.tenantId,
  };
}

async function createNotificationTemplateViaApi(
  request: APIRequestContext,
  auth: { token: string; tenantId: string },
  seed: string,
) {
  const response = await request.post(`${backendOrigin}/api/v1/notifications/templates`, {
    headers: buildAuthHeaders(auth),
    data: {
      name: `PW Template ${seed}`,
      code: `pw_template_${seed}`,
      channel: 'inbox',
      subject: `PW Subject ${seed}`,
      content: `PW Notification Body ${seed}`,
      description: 'Created by Playwright smoke test',
      isActive: true,
      variables: '[]',
    },
  });

  if (!response.ok()) {
    throw new Error(`create notification template failed: ${response.status()} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data as { id: string; name: string; code: string };
}

async function createInboxNotificationViaApi(
  request: APIRequestContext,
  auth: { token: string; tenantId: string },
  receiverId: string,
  seed: string,
) {
  const response = await request.post(`${backendOrigin}/api/v1/notifications`, {
    headers: buildAuthHeaders(auth),
    data: {
      title: `PW Notification ${seed}`,
      content: `PW Notification Body ${seed}`,
      channel: 'inbox',
      priority: 'high',
      receiverIds: receiverId,
      extraData: JSON.stringify({ source: 'playwright-smoke', seed }),
    },
  });

  if (!response.ok()) {
    throw new Error(`create inbox notification failed: ${response.status()} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data as { id: string; title: string };
}

async function setupTenantViaApi(
  request: APIRequestContext,
  tenantId: string,
  databaseName: string,
  auth: { token: string; tenantId: string },
) {
  const mysql = getE2EMysqlConfig();
  const response = await request.post(`${backendOrigin}/api/v1/tenants/${tenantId}/setup`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'X-Tenant-ID': auth.tenantId,
    },
    data: {
      database_type: 'mysql',
      host: mysql.mysqlHost,
      port: mysql.mysqlPort,
      database: databaseName,
      username: mysql.mysqlUser,
      password: mysql.mysqlPassword,
      admin_password: getE2EAdminPassword(),
    },
  });

  if (!response.ok()) {
    throw new Error(`setup tenant failed: ${response.status()} ${await response.text()}`);
  }
}

async function openSystemGroup(page: Page) {
  const navigation = page.locator('nav');
  const systemButton = navigation.getByRole('button', { name: /^System$/i });
  const nestedButton = navigation
    .getByRole('button', { name: /Overview|Users|Departments|系统概览|用户管理|部门管理/i })
    .first();

  if (await nestedButton.count()) {
    return true;
  }

  if (await systemButton.count()) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await systemButton.first().click({ force: true });
      await page.waitForTimeout(500);

      try {
        await expect(nestedButton).toBeVisible({ timeout: 4000 });
        return true;
      } catch (error) {
        if (attempt === 2) {
          break;
        }
      }
    }
  }

  return false;
}

function getRouteForSidebarLabel(label: RegExp): string | null {
  const source = label.source;

  if (/Tenants|Tenant|租户/.test(source)) return '/system/tenant-management';
  if (/Departments|Department|部门/.test(source)) return '/system/departments';
  if (/Roles|Role|角色/.test(source)) return '/system/roles';
  if (/Positions|Position|岗位/.test(source)) return '/system/positions';
  if (/Users|User|用户/.test(source)) return '/system/users';
  if (/Menus|Menu|菜单/.test(source)) return '/system/menus';
  if (/Permissions|Permission|权限/.test(source)) return '/system/permissions';
  if (/Dictionary|Data Dictionary|字典/.test(source)) return '/system/dictionaries';
  if (/Settings|System Settings|设置/.test(source)) return '/system/settings';
  if (/Logs|Audit Logs|日志/.test(source)) return '/system/logs';
  if (/Monitor|System Monitor|Monitoring|监控/.test(source)) return '/system/monitor';

  return null;
}

async function openSidebarPage(page: Page, label: RegExp) {
  const navigation = page.locator('nav');
  let button = navigation.getByRole('button', { name: label }).first();
  if (await button.count()) {
    await button.click();
    return;
  }

  const expanded = await openSystemGroup(page);
  button = navigation.getByRole('button', { name: label }).first();
  if ((await button.count()) > 0) {
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    return;
  }

  const route = getRouteForSidebarLabel(label);
  if (!expanded && route) {
    await page.evaluate((nextRoute) => {
      window.history.pushState({}, '', nextRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
    return;
  }

  if (route) {
    await page.evaluate((nextRoute) => {
      window.history.pushState({}, '', nextRoute);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
    return;
  }

  throw new Error(`unable to open sidebar page for label: ${label}`);
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

async function changeLanguageFromAccountSettings(page: Page, targetLanguage: 'zh' | 'en') {
  await page.goto('/profile/settings');
  await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
  await page.getByRole('tab', { name: /Preferences|偏好/i }).click();

  const activePanel = page.locator('[role="tabpanel"][data-state="active"]').last();
  const languageSelect = activePanel.getByRole('combobox').first();
  await expect(languageSelect).toBeVisible({ timeout: 10000 });
  await languageSelect.click();
  await page
    .getByRole('option', {
      name: targetLanguage === 'en' ? /^English$/i : /简体中文|Simplified Chinese/i,
    })
    .click();

  if (targetLanguage === 'en') {
    await expect(page.getByRole('tab', { name: /^Security$/i })).toBeVisible({ timeout: 10000 });
  } else {
    await expect(page.getByRole('tab', { name: /安全|Security/i })).toBeVisible({ timeout: 10000 });
  }
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

test('checks tenant setup and admin CRUD pages', async ({ page, request }) => {
  test.setTimeout(25 * 60_000);
  console.log('smoke:start');
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
  const apiKeyName = `PW API Key ${seed}`;
  const notificationTitle = `PW Notification ${seed}`;
  const notificationBody = `PW Notification Body ${seed}`;
  const notificationTemplateName = `PW Template ${seed}`;
  console.log('smoke:create-tenant:start');
  const tenant = await createTenantViaApi(request, seed);
  let tenantAdminAuth: Awaited<ReturnType<typeof loginByApiForTenant>> | null = null;
  console.log(`smoke:create-tenant:done:${tenant.code}`);
  ensureTenantDatabaseExists(tenantDatabase);
  console.log(`smoke:tenant-db-ready:${tenantDatabase}`);

  try {
    console.log('smoke:login:start');
    await login(page);
    console.log('smoke:login:done');

    await test.step('tenant onboarding via api and tenant admin session works', async () => {
      console.log('smoke:tenant-step:start');
      await setupTenantViaApi(request, tenant.id, tenantDatabase, tenant.auth);
      const tenantStatusResponse = await request.get(`${backendOrigin}/api/v1/tenants/status?code=${tenant.code}`);
      expect(tenantStatusResponse.ok()).toBeTruthy();
      const tenantStatusPayload = await tenantStatusResponse.json();
      expect(tenantStatusPayload.data.database_configured ?? tenantStatusPayload.data.databaseConfigured).toBeTruthy();

      console.log(`smoke:tenant-session-switch:start:${tenant.code}`);
      await logout(page);
      await login(page, tenant.code);
      tenantAdminAuth = await loginByApiForTenant(request, tenant.code);
      console.log(`smoke:tenant-session-switch:done:${tenant.code}`);
    });

    await test.step('department create update delete works', async () => {
      console.log('smoke:department-step:start');
      // Ensure page is stable before starting new step
      await page.waitForTimeout(1000);
      console.log('smoke:department-nav:start');
      await openSidebarPage(page, departmentNavName);
      console.log('smoke:department-nav:done');
      console.log('smoke:department-add:start');
      await page.getByRole('button', { name: createButtonName }).last().click();
      console.log('smoke:department-add:done');
      const departmentDialog = page.getByRole('dialog', { name: departmentDialogName });
      console.log('smoke:department-dialog:open');
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
      const editDepartmentDialog = page.getByRole('dialog', { name: departmentDialogName });
      await editDepartmentDialog.getByPlaceholder('Enter department name').fill(`${departmentName} Updated`);
      const updateDepartmentResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/depts/') && response.request().method() === 'PUT',
      );
      await editDepartmentDialog.getByRole('button', { name: formSubmitButtonName }).evaluate((node) => (node as HTMLButtonElement).click());
      expect((await updateDepartmentResponsePromise).ok()).toBeTruthy();
      await expect(await rowByText(page, `${departmentName} Updated`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('role create update delete works', async () => {
      console.log('smoke:role-step:start');
      await openSidebarPage(page, roleNavName);
      await page.getByRole('button', { name: createButtonName }).last().click();
      const roleDialog = page.getByRole('dialog', { name: roleDialogName });
      await roleDialog.getByPlaceholder('Enter role name').fill(roleName);
      await roleDialog.getByPlaceholder('Enter role code').fill(roleCode);
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
      const editRoleDialog = page.getByRole('dialog', { name: roleDialogName });
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
      console.log('smoke:position-step:start');
      await openSidebarPage(page, positionNavName);
      await page.getByRole('button', { name: createButtonName }).last().click();
      const positionDialog = page.getByRole('dialog', { name: positionDialogName });
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
      const editPositionDialog = page.getByRole('dialog', { name: positionDialogName });
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
      console.log('smoke:user-step:start');
      await openSidebarPage(page, userNavName);
      await page.getByRole('button', { name: createButtonName }).last().click();
      const userDialog = page.getByRole('dialog', { name: userDialogName });
      await userDialog.getByPlaceholder('Enter username').fill(userName);
      await userDialog.getByPlaceholder('Enter name').fill(userRealName);
      await userDialog.getByPlaceholder('Enter email address').fill(userEmail);
      await userDialog.getByPlaceholder('Enter phone number').fill(userPhone);
      await userDialog.getByPlaceholder('Enter initial password').fill('Admin12345!');
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
      const editUserDialog = page.getByRole('dialog', { name: userDialogName });
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
      console.log('smoke:role-menu-step:start');
      await openSidebarPage(page, roleNavName);
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
      console.log('smoke:menu-step:start');
      await openSidebarPage(page, menuNavName);
      await page.getByRole('button', { name: createButtonName }).last().click();

      const menuDialog = page.getByRole('dialog', { name: menuDialogName });
      await menuDialog.getByPlaceholder('Enter menu name').fill(menuName);
      await menuDialog.getByPlaceholder('Enter menu code').fill(menuCode);
      await menuDialog.getByPlaceholder('/system/user').fill(`/system/pw-${seed}`);
      await menuDialog.getByPlaceholder('system/UserManagement').fill(`system/PWMenu${seed}`);
      await menuDialog.getByRole('button', { name: formSubmitButtonName }).click();
      await expect(await rowByText(page, menuCode)).toBeVisible({ timeout: 15000 });

      const menuRow = await rowByText(page, menuCode);
      await actionButtons(menuRow).nth(1).click();
      const editMenuDialog = page.getByRole('dialog', { name: menuDialogName });
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
      console.log('smoke:permission-step:start');
      await openSidebarPage(page, permissionNavName);
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
      console.log('smoke:dictionary-step:start');
      await openSidebarPage(page, dictionaryNavName);
      await expect(page.locator('main').getByRole('heading', { name: /Dictionary|Data Dictionary|字典/i })).toBeVisible({ timeout: 15000 });

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
      console.log('smoke:settings-step:start');
      await openSidebarPage(page, settingsNavName);
      await expect(page.locator('main').getByRole('heading', { name: /Settings|System Settings|设置/i }).first()).toBeVisible({ timeout: 15000 });

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
      await expect(page.locator('main').getByRole('heading', { name: /System Overview|系统概览/i })).toBeVisible({ timeout: 15000 });
      await page
        .locator('main')
        .getByRole('button', { name: /^(Open Settings|Settings)$/i })
        .first()
        .click();
      await expect(page.locator('main').getByRole('heading', { name: /Settings|System Settings|设置/i }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('main').getByRole('textbox').nth(1)).toHaveValue(importedSystemSubtitle, { timeout: 15000 });
    });

    await test.step('user detail permissions role assignment and reset password works', async () => {
      console.log('smoke:user-detail-step:start');
      await openSidebarPage(page, userNavName);
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
      console.log('smoke:logs-step:start');
      await openSidebarPage(page, logsNavName);
      await expect(page.locator('main').getByRole('heading', { name: /Audit Logs|Logs|Log|日志/i }).first()).toBeVisible({
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
      console.log('smoke:monitor-step:start');
      await openSidebarPage(page, monitorNavName);
      await expect(
        page.locator('main').getByRole('heading', { name: /System Monitor|Monitor|Monitoring|监控/i }).first(),
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

    await test.step('profile center and account settings pages work', async () => {
      console.log('smoke:profile-step:start');
      await page.goto('/profile');
      await expect(page.locator('main').getByRole('heading', { name: /Profile|个人中心/i })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByRole('tab', { name: /Personal|个人/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Security|安全/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Preferences|偏好/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Notifications|通知/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Login History|登录历史/i })).toBeVisible({ timeout: 10000 });

      await page.getByRole('tab', { name: /Notifications|通知/i }).click();
      const profileNotificationPanel = page.locator('[role="tabpanel"][data-state="active"]').last();
      const profileNotificationSwitch = profileNotificationPanel.getByRole('switch').first();
      await expect(profileNotificationSwitch).toBeVisible({ timeout: 10000 });
      await profileNotificationSwitch.click();
      const saveNotificationSettingsButton = page.getByRole('button', { name: /Save Settings|保存设置/i }).last();
      await expect(saveNotificationSettingsButton).toBeEnabled({ timeout: 10000 });
      await saveNotificationSettingsButton.click();

      await page.getByRole('tab', { name: /Login History|登录历史/i }).click();
      await expect(
        page.getByPlaceholder(/Search IP, location, browser, or OS|搜索 IP、地点、浏览器或系统/i),
      ).toBeVisible({ timeout: 15000 });

      await page.goto('/profile/settings');
      await expect(page.locator('main').getByRole('heading', { name: /Account Settings|设置/i })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.getByRole('tab', { name: /Security|安全/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Privacy|隐私/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Notifications|通知/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Preferences|偏好/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /API Keys|API 密钥/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('tab', { name: /Sessions|会话/i })).toBeVisible({ timeout: 10000 });

      await page.getByRole('tab', { name: /API Keys|API 密钥/i }).click();
      await page.getByRole('button', { name: /Create New Key|创建新密钥/i }).click();
      await page.getByPlaceholder(/production read-only key|生产环境只读密钥/i).fill(apiKeyName);
      const createApiKeyResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/auth/api-keys') && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: /Create Key|创建密钥/i }).click();
      const createApiKeyResponse = await createApiKeyResponsePromise;
      if (!createApiKeyResponse.ok()) {
        throw new Error(`create api key failed: ${createApiKeyResponse.status()} ${await createApiKeyResponse.text()}`);
      }
      const apiKeyCard = page.locator('main').getByText(apiKeyName).first();
      await expect(apiKeyCard).toBeVisible({ timeout: 15000 });
      const apiKeyContainer = apiKeyCard.locator('xpath=ancestor::*[contains(@class,"rounded")][1]');
      await apiKeyContainer.getByRole('button').last().click();
      const confirmDeleteApiKeyDialog = page.getByRole('alertdialog').last();
      await expect(confirmDeleteApiKeyDialog).toBeVisible({ timeout: 10000 });
      const deleteApiKeyResponsePromise = page.waitForResponse(
        (response) => /\/api\/v1\/auth\/api-keys\/[^/]+$/.test(response.url()) && response.request().method() === 'DELETE',
      );
      await confirmDeleteApiKeyDialog.getByRole('button', { name: /Delete Key|确认删除/i }).click();
      const deleteApiKeyResponse = await deleteApiKeyResponsePromise;
      if (!deleteApiKeyResponse.ok()) {
        throw new Error(`delete api key failed: ${deleteApiKeyResponse.status()} ${await deleteApiKeyResponse.text()}`);
      }
      await expect(page.locator('main').getByText(apiKeyName)).toHaveCount(0, { timeout: 15000 });

      await page.getByRole('tab', { name: /Sessions|会话/i }).click();
      await expect(page.locator('main')).toContainText(/Active Sessions|活动会话/i, { timeout: 15000 });
    });

    await test.step('language switching works across profile and system pages', async () => {
      console.log('smoke:i18n-step:start');
      await changeLanguageFromAccountSettings(page, 'en');
      await page.goto('/system/users');
      await expect(page.locator('main')).toContainText(/User Management|Users/i, { timeout: 15000 });

      await changeLanguageFromAccountSettings(page, 'zh');
      await page.goto('/system/users');
      await expect(page.locator('main')).toContainText(/用户管理|Users/i, { timeout: 15000 });
    });

    await test.step('notification center page, inbox actions, and template page work', async () => {
      console.log('smoke:notification-step:start');
      if (!tenantAdminAuth) {
        throw new Error('tenant admin auth not ready');
      }

      await createNotificationTemplateViaApi(request, tenantAdminAuth, seed);
      await createInboxNotificationViaApi(request, tenantAdminAuth, tenantAdminAuth.userId, seed);

      await page.goto('/notifications');
      await expect(page.locator('main').getByRole('heading', { name: /Notification|消息通知/i })).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator('main')).toContainText(notificationTitle, { timeout: 15000 });

      const notificationRow = page.locator('main').getByText(notificationTitle).first();
      await notificationRow.click();
      await expect(page.getByRole('dialog')).toContainText(notificationBody, { timeout: 15000 });
      await page.getByRole('button', { name: /Mark as Read|标记已读/i }).click();
      await expect(page.getByRole('dialog')).toContainText(/Read|已读/i, { timeout: 15000 });
      await page.getByRole('button', { name: /Close|关闭/i }).click();

      await page.getByRole('button', { name: /Templates|通知模板/i }).click();
      await expect(page.locator('main')).toContainText(notificationTemplateName, { timeout: 15000 });
    });

    await test.step('role, position, and department cleanup via page works', async () => {
      console.log('smoke:cleanup-step:start');
      await ensureLoggedIn(page);
      await openSidebarPage(page, userNavName);
      await filterTableByKeyword(page, /Search/i, userName);
      const userRow = await rowByText(page, userName);
      await userRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, userName)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, positionNavName);
      await filterTableByKeyword(page, /Search/i, positionCode);
      const positionRow = await rowByText(page, positionCode);
      await positionRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, positionCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, roleNavName);
      await filterRoleTableByKeyword(page, roleCode);
      const roleRow = await rowByText(page, roleCode);
      await roleRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, roleCode)).toHaveCount(0, { timeout: 15000 });

      await openSidebarPage(page, departmentNavName);
      await filterTableByKeyword(page, /Search/i, departmentCode);
      const departmentRow = await rowByText(page, departmentCode);
      await actionButtons(departmentRow).nth(3).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, departmentCode)).toHaveCount(0, { timeout: 15000 });
    });

    await test.step('logout works after system management smoke flow', async () => {
      console.log('smoke:logout-step:start');
      await ensureLoggedIn(page);
      await logout(page);
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





