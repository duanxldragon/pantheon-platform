import { test, expect } from '@playwright/test';
import { getE2EAdminPassword } from './e2eCredentials';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';

test('quick smoke test - login and check pages', async ({ page, request: _request }) => {
  // Setup API proxy
  await page.route('**/api/**', async (route) => {
    const requestUrl = route.request().url().replace(frontendOrigin, backendOrigin).replace('http://127.0.0.1:5173', backendOrigin);
    const response = await route.fetch({ url: requestUrl });
    await route.fulfill({ response });
  });

  // Login
  const adminPassword = getE2EAdminPassword();
  await page.goto('/', { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});

  await page.getByLabel(/Username/i).fill('admin');
  await page.getByLabel(/Password/i).fill(adminPassword);
  await page.getByRole('button', { name: /Login/i }).click();

  // Wait for successful login - look for System or Tenant button
  await expect(page.getByRole('button', { name: /System|Tenant/i }).first()).toBeVisible({
    timeout: 20000,
  });

  console.log('✅ Login successful');

  // Check if navigation menu is visible
  const nav = page.locator('nav');
  await expect(nav).toBeVisible({ timeout: 10000 });
  console.log('✅ Navigation menu is visible');

  // Take a screenshot to see current state
  await page.screenshot({ path: 'test-results/login-success.png' });
  console.log('✅ Screenshot saved');

  // Check what buttons are available in navigation
  const buttons = await nav.getByRole('button').all();
  console.log(`Found ${buttons.length} navigation buttons`);

  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    try {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i + 1}: "${text?.trim()}"`);
    } catch (error) {
      console.log(`  Button ${i + 1}: (error getting text)`);
    }
  }

  // Wait a bit to let the page stabilize
  await page.waitForTimeout(2000);

  // Try to click System button if it exists
  const systemButton = nav.getByRole('button', { name: /System/i }).first();
  if (await systemButton.count() > 0) {
    console.log('Found System button, trying to click...');
    await systemButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/after-system-click.png' });
    console.log('✅ System button clicked');
  }

  // Check main content area
  const main = page.locator('main');
  if (await main.count() > 0) {
    const mainText = await main.textContent();
    console.log(`Main area content preview: ${mainText?.substring(0, 200)}...`);
  }

  console.log('✅ Basic smoke test completed');
});
