import { expect, test, type BrowserContext, type Page } from '@playwright/test';
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

test.beforeEach(async ({ context }) => {
  await attachApiProxy(context);
});

test.afterEach(async ({ context }) => {
  await context.unrouteAll({ behavior: 'ignoreErrors' });
});

test('system settings query update import export works', async ({ page }) => {
  const seed = `${Date.now()}`.slice(-8);
  const importedSystemSubtitle = `Imported Subtitle ${seed}`;

  await login(page);
  await page.locator('main').getByRole('button', { name: /Settings/i }).first().click();
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
  expect(importSettingsResponse.ok()).toBeTruthy();

  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('main').getByRole('heading', { name: /System Overview/i })).toBeVisible({ timeout: 15000 });
  await page.locator('main').getByRole('button', { name: /Open Settings/i }).first().click();
  await expect(page.locator('main').getByRole('heading', { name: /Settings|System Settings/i }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('main').getByRole('textbox').nth(1)).toHaveValue(importedSystemSubtitle, { timeout: 15000 });
});
