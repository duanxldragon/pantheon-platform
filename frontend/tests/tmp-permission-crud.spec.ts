import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { e2eAdminUsername, getE2EAdminPassword } from './e2eCredentials';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';
const formSubmitButtonName = /^(Save|Submit|Confirm)$/i;

async function attachApiProxy(context: BrowserContext) {
  await context.route('**/api/**', async (route) => {
    const requestUrl = route.request().url().replace(frontendOrigin, backendOrigin).replace('http://127.0.0.1:5173', backendOrigin);
    const response = await route.fetch({ url: requestUrl });
    await route.fulfill({ response });
  });
}

async function login(page: Page) {
  const adminPassword = getE2EAdminPassword();
  await page.goto('/');
  await page.getByLabel(/Username/i).fill(e2eAdminUsername);
  await page.getByLabel(/Password/i).fill(adminPassword);
  await page.getByRole('button', { name: /Login/i }).click();
  await expect(page.getByRole('button', { name: /System|Tenant/i }).first()).toBeVisible({ timeout: 20000 });
}

async function rowByText(page: Page, text: string) {
  return page.locator('tr', { hasText: text }).first();
}

function actionButtons(row: Locator) {
  return row.locator('td').last().locator('button');
}

async function filterTableByKeyword(page: Page, placeholder: RegExp, value: string) {
  const main = page.locator('main');
  const placeholderInput = main.getByPlaceholder(placeholder).first();
  const searchInput = (await placeholderInput.count()) ? placeholderInput : main.getByRole('textbox').first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(value);
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

test.beforeEach(async ({ context }) => {
  await attachApiProxy(context);
});

test.afterEach(async ({ context }) => {
  await context.unrouteAll({ behavior: 'ignoreErrors' });
});

test('permission create update status delete works', async ({ page }) => {
  const seed = `${Date.now()}`.slice(-8);
  const permissionCode = `system:pwe2e:${seed}`;
  const permissionName = `PW Permission ${seed}`;
  const updatedPermissionName = `${permissionName} Updated`;

  await login(page);
  await page.locator('main').getByRole('button', { name: /Permissions/i }).first().click();
  await expect(page.locator('main').getByRole('heading', { name: /Permissions/i })).toBeVisible({ timeout: 15000 });

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
  expect(createPermissionResponse.ok()).toBeTruthy();

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
  expect(updatePermissionResponse.ok()).toBeTruthy();

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
  expect(disablePermissionResponse.ok()).toBeTruthy();
  await expect(permissionStatusCheckbox).not.toBeChecked({ timeout: 15000 });

  await actionButtons(updatedPermissionRow).nth(1).click();
  await confirmDeleteDialog(page);
  await expect(await rowByText(page, permissionCode)).toHaveCount(0, { timeout: 15000 });
});
