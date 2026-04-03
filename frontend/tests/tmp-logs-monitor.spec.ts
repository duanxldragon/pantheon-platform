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

test('logs and monitor query export flows work', async ({ page }) => {
  await login(page);

  await page.locator('main').getByRole('button', { name: /Logs/i }).first().click();
  await expect(page.locator('main').getByRole('heading', { name: /Audit Logs|Logs|Log/i }).first()).toBeVisible({ timeout: 15000 });
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
  await page.getByRole('button', { name: /Clear Operation Logs/i }).click();
  expect((await clearLogsResponsePromise).ok()).toBeTruthy();

  await page.goto('/');
  await expect(page.locator('main').getByRole('heading', { name: /System Overview/i })).toBeVisible({ timeout: 15000 });
  await page.locator('main').getByRole('button', { name: /^Enter$/i }).nth(10).click();
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
