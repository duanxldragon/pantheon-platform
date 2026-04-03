import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { e2eAdminUsername, getE2EAdminPassword } from './e2eCredentials';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';
const formSubmitButtonName = /^(Save|Submit|Confirm)$/i;

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
  await page.getByLabel(/Username/i).fill(e2eAdminUsername);
  await page.getByLabel(/Password/i).fill(adminPassword);
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page.getByRole('button', { name: /System|Tenant/i }).first()).toBeVisible({ timeout: 20000 });
}

async function openSystemGroup(page: Page) {
  const navigation = page.locator('nav');
  const systemButton = navigation.getByRole('button', { name: /^(System|System Management|系统管理)$/i }).first();
  const nestedButton = navigation.getByRole('button', { name: /Overview|Users|Departments|Tenants|系统概览|用户管理|部门管理|租户管理/i }).first();

  if (await nestedButton.count()) {
    return;
  }

  if (await systemButton.count()) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await systemButton.click();
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

async function filterTableByKeyword(page: Page, placeholder: RegExp, value: string) {
  const main = page.locator('main');
  const placeholderInput = main.getByPlaceholder(placeholder).first();
  const searchInput = (await placeholderInput.count()) ? placeholderInput : main.getByRole('textbox').first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(value);
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
    // ignore and fallback
  }
  if (id) {
    await input.page().locator(`label[for="${id}"]`).last().click({ force: true });
    return;
  }
  await input.check({ force: true });
}

async function selectFirstUncheckedCheckbox(container: Locator, options?: { skipIds?: string[] }) {
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

test.beforeEach(async ({ context }) => {
  await attachApiProxy(context);
});

test.afterEach(async ({ context }) => {
  await context.unrouteAll({ behavior: 'ignoreErrors' });
});

test('user detail assign roles reset password and batch status works', async ({ page }) => {
  test.setTimeout(12 * 60_000);

  const seed = `${Date.now()}`.slice(-8);
  const departmentName = `PW Dept ${seed}`;
  const departmentCode = `PWDEPT${seed}`;
  const roleName = `PW Role ${seed}`;
  const roleCode = `pwrole${seed}`;
  const extraRoleName = `PW Extra Role ${seed}`;
  const extraRoleCode = `pwroleextra${seed}`;
  const userName = `pwuser${seed}`;
  const userRealName = `PW User ${seed}`;
  const userEmail = `pwuser${seed}@example.com`;
  const userPhone = `138${seed.slice(-8)}`;

  await login(page);

  await test.step('create department roles and user', async () => {
    await openSidebarPage(page, /Users|用户管理/i);
    await expect(page.locator('main').getByRole('heading', { name: /Users|User Management|用户管理/i }).first()).toBeVisible({
      timeout: 15000,
    });

    await openSidebarPage(page, /Departments|部门管理/i);
    await page.getByRole('button', { name: /Add|新增/i }).last().click();
    const departmentDialog = page.getByRole('dialog', { name: /Add Department|Edit Department|新增部门|编辑部门/i });
    await departmentDialog.getByPlaceholder(/Enter department name|请输入部门名称/i).fill(departmentName);
    await departmentDialog.getByPlaceholder(/Enter department code|请输入部门编码/i).fill(departmentCode);
    const createDepartmentResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/system/depts') && response.request().method() === 'POST',
    );
    await departmentDialog.getByRole('button', { name: formSubmitButtonName }).evaluate((node) => (node as HTMLButtonElement).click());
    expect((await createDepartmentResponsePromise).ok()).toBeTruthy();
    await expect(await rowByText(page, departmentCode)).toBeVisible({ timeout: 15000 });

    await openSidebarPage(page, /Roles|角色管理/i);
    for (const [name, code] of [
      [roleName, roleCode],
      [extraRoleName, extraRoleCode],
    ]) {
      await page.getByRole('button', { name: /Add|新增/i }).last().click();
      const roleDialog = page.getByRole('dialog', { name: /Add Role|Edit Role|新增角色|编辑角色/i });
      await roleDialog.getByPlaceholder(/Enter role name|请输入角色名称/i).fill(name);
      await roleDialog.getByPlaceholder(/Enter role code|请输入角色编码/i).fill(code);
      await roleDialog.getByText(/^System$|^系统管理$/).last().click();
      const createRoleResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/v1/system/roles') && response.request().method() === 'POST',
      );
      await roleDialog.getByRole('button', { name: formSubmitButtonName }).click();
      const createRoleResponse = await createRoleResponsePromise;
      if (!createRoleResponse.ok()) {
        throw new Error(`create role failed: ${createRoleResponse.status()} ${await createRoleResponse.text()}`);
      }
      await filterTableByKeyword(page, /Search roles|搜索角色/i, code);
      await expect(await rowByText(page, code)).toBeVisible({ timeout: 15000 });
    }

    await openSidebarPage(page, /Users|用户管理/i);
    await page.getByRole('button', { name: /Add|新增/i }).last().click();
    const userDialog = page.getByRole('dialog', { name: /Add Users|Edit Users|Add User|Edit User|新增用户|编辑用户/i });
    await userDialog.getByPlaceholder(/Enter username|请输入用户名/i).fill(userName);
    await userDialog.getByPlaceholder(/Enter name|请输入姓名/i).fill(userRealName);
    await userDialog.getByPlaceholder(/Enter email|请输入邮箱/i).fill(userEmail);
    await userDialog.getByPlaceholder(/Enter phone|请输入手机号/i).fill(userPhone);
    await userDialog.getByPlaceholder(/Enter password|请输入密码/i).fill('Admin12345!');
    await fillRadixSelect(userDialog.getByRole('combobox').nth(0), new RegExp(`^${escapeRegExp(departmentName)}$`));
    await userDialog.getByText(new RegExp(`^${escapeRegExp(roleName)}$`)).click();
    const createUserResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/system/users') && response.request().method() === 'POST',
    );
    await userDialog.getByRole('button', { name: formSubmitButtonName }).click();
    const createUserResponse = await createUserResponsePromise;
    if (!createUserResponse.ok()) {
      throw new Error(`create user failed: ${createUserResponse.status()} ${await createUserResponse.text()}`);
    }
    await expect(await rowByText(page, userName)).toBeVisible({ timeout: 15000 });
  });

  await test.step('user detail permissions activity role assignment reset and batch status work', async () => {
    await openSidebarPage(page, /Users|用户管理/i);
    await filterTableByKeyword(page, /Search|搜索/i, userName);
    let userRow = await rowByText(page, userName);
    await expect(userRow).toBeVisible({ timeout: 15000 });

    await actionButtons(userRow).nth(0).click();
    const detailDialog = page
      .getByRole('dialog')
      .filter({ has: page.getByText(new RegExp(`@${escapeRegExp(userName)}`)) })
      .last();
    await expect(detailDialog).toBeVisible({ timeout: 15000 });

    const getUserPermissionsResponsePromise = page.waitForResponse(
      (response) => /\/api\/v1\/system\/users\/[^/]+\/permissions$/.test(response.url()) && response.request().method() === 'GET',
    );
    await detailDialog.getByRole('tab', { name: /Permissions|权限/i }).click();
    const getUserPermissionsResponse = await getUserPermissionsResponsePromise;
    if (!getUserPermissionsResponse.ok()) {
      throw new Error(`get user permissions failed: ${getUserPermissionsResponse.status()} ${await getUserPermissionsResponse.text()}`);
    }
    await expect(detailDialog).toContainText(/Total:|总数：/i, { timeout: 15000 });

    await detailDialog.getByRole('tab', { name: /Activity|活动/i }).click();
    await expect(detailDialog).toContainText(/Last login time|No record|最近登录时间|暂无记录/i, { timeout: 15000 });
    await detailDialog.press('Escape');
    await expect(detailDialog).toBeHidden({ timeout: 15000 });

    await userRow.locator('td').last().getByRole('button').last().click();
    await page.getByRole('menuitem', { name: /Assign Roles|分配角色/i }).click();
    const roleAssignDialog = page.getByRole('dialog', { name: /Assign Roles|分配角色/i });
    await expect(roleAssignDialog).toBeVisible({ timeout: 15000 });
    const roleChanged = await selectFirstUncheckedCheckbox(roleAssignDialog, { skipIds: ['has-expiry'] });
    if (!roleChanged) {
      throw new Error('no additional role available for assignment');
    }
    const assignRoleResponsePromise = page.waitForResponse(
      (response) => /\/api\/v1\/system\/users\/[^/]+$/.test(response.url()) && response.request().method() === 'PUT',
    );
    const confirmAssignRoleButton = roleAssignDialog.getByRole('button', { name: /^Confirm$|^确定$/i });
    await expect(confirmAssignRoleButton).toBeEnabled({ timeout: 10000 });
    await confirmAssignRoleButton.evaluate((node) => (node as HTMLButtonElement).click());
    const assignRoleResponse = await assignRoleResponsePromise;
    if (!assignRoleResponse.ok()) {
      throw new Error(`assign user roles failed: ${assignRoleResponse.status()} ${await assignRoleResponse.text()}`);
    }
    await expect(roleAssignDialog).toBeHidden({ timeout: 15000 });

    userRow = await rowByText(page, userName);
    await userRow.locator('td').last().getByRole('button').last().click();
    await page.getByRole('menuitem', { name: /Reset Password|重置密码/i }).click();
    const resetPasswordDialog = page.getByRole('dialog', { name: /Reset Password|重置密码/i });
    await expect(resetPasswordDialog).toBeVisible({ timeout: 15000 });
    await resetPasswordDialog.getByPlaceholder(/Enter new password|请输入新密码/i).fill(`Reset!${seed}`);
    await resetPasswordDialog.getByPlaceholder(/Enter the new password again|请再次输入新密码/i).fill(`Reset!${seed}`);
    const resetPasswordResponsePromise = page.waitForResponse(
      (response) => /\/api\/v1\/system\/users\/[^/]+\/password$/.test(response.url()) && response.request().method() === 'PATCH',
    );
    await resetPasswordDialog.getByRole('button', { name: /Confirm Reset|确认重置/i }).click();
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
    await page.getByRole('button', { name: /^Disable \(\d+\)$|^禁用 \(\d+\)$/i }).click();
    await confirmActionDialog(page, /^Disable$|^禁用$/i);
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
    await page.getByRole('button', { name: /^Enable \(\d+\)$|^启用 \(\d+\)$/i }).click();
    await confirmActionDialog(page, /^Enable$|^启用$/i);
    const enableUserResponse = await enableUserResponsePromise;
    if (!enableUserResponse.ok()) {
      throw new Error(`batch enable user failed: ${enableUserResponse.status()} ${await enableUserResponse.text()}`);
    }
    userRow = await rowByText(page, userName);
    await expect(userRow.getByRole('checkbox').last()).toBeChecked({ timeout: 15000 });
  });

  await test.step('cleanup created user roles and department', async () => {
    await openSidebarPage(page, /Users|用户管理/i);
    await filterTableByKeyword(page, /Search|搜索/i, userName);
    const userRow = await rowByText(page, userName);
    await userRow.locator('td').last().getByRole('button').last().click();
    await page.getByRole('menuitem', { name: /^Delete$|^删除$/i }).click();
    await confirmDeleteDialog(page);
    await expect(await rowByText(page, userName)).toHaveCount(0, { timeout: 15000 });

    await openSidebarPage(page, /Roles|角色管理/i);
    for (const code of [roleCode, extraRoleCode]) {
      await filterTableByKeyword(page, /Search roles|搜索角色/i, code);
      const roleRow = await rowByText(page, code);
      await expect(roleRow).toBeVisible({ timeout: 15000 });
      await roleRow.locator('td').last().getByRole('button').last().click();
      await page.getByRole('menuitem', { name: /^Delete$|^删除$/i }).click();
      await confirmDeleteDialog(page);
      await expect(await rowByText(page, code)).toHaveCount(0, { timeout: 15000 });
    }

    await openSidebarPage(page, /Departments|部门管理/i);
    await filterTableByKeyword(page, /Search|搜索/i, departmentCode);
    const departmentRow = await rowByText(page, departmentCode);
    await expect(departmentRow).toBeVisible({ timeout: 15000 });
    await actionButtons(departmentRow).nth(3).click();
    await confirmDeleteDialog(page);
    await expect(await rowByText(page, departmentCode)).toHaveCount(0, { timeout: 15000 });
  });
});
