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

test('menu create update status delete works', async ({ page }) => {
  const seed = `${Date.now()}`.slice(-8);
  const menuName = `PW Menu ${seed}`;
  const updatedMenuName = `${menuName} Updated`;
  const menuCode = `PWMENU${seed}`;

  await login(page);
  await page.locator('main').getByRole('button', { name: /Menus/i }).first().click();
  await expect(page.locator('main').getByRole('heading', { name: /Menus/i })).toBeVisible({ timeout: 15000 });

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
