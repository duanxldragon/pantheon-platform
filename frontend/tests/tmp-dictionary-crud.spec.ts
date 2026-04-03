import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { e2eAdminUsername, getE2EAdminPassword } from './e2eCredentials';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';

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

test.beforeEach(async ({ context }) => {
  await attachApiProxy(context);
});

test.afterEach(async ({ context }) => {
  await context.unrouteAll({ behavior: 'ignoreErrors' });
});

test('dictionary type and item CRUD works', async ({ page }) => {
  const seed = `${Date.now()}`.slice(-8);
  const dictTypeName = `PW Dict Type ${seed}`;
  const updatedDictTypeName = `${dictTypeName} Updated`;
  const dictTypeCode = `pwdict${seed}`;
  const dictItemLabel = `PW Dict Item ${seed}`;
  const updatedDictItemLabel = `${dictItemLabel} Updated`;
  const dictItemValue = `pw-value-${seed}`;
  const updatedDictItemValue = `pw-value-updated-${seed}`;

  await login(page);
  await page.locator('main').getByRole('button', { name: /^Enter$/i }).nth(7).click();
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
