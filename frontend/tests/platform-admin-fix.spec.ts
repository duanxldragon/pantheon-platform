import { test, expect } from '@playwright/test';
import { getE2EAdminPassword } from './e2eCredentials';

const frontendOrigin = 'http://localhost:5173';
const backendOrigin = 'http://localhost:8080';

test('verify platform admin bypasses tenant setup', async ({ page }) => {
  // Setup API proxy
  await page.route('**/api/**', async (route) => {
    const requestUrl = route.request().url().replace(frontendOrigin, backendOrigin).replace('http://127.0.0.1:5173', backendOrigin);
    const response = await route.fetch({ url: requestUrl });
    await route.fulfill({ response });
  });

  const adminPassword = getE2EAdminPassword();

  // Add console logging for debugging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', err => console.log('Browser error:', err.message));

  // Navigate to login page
  await page.goto(frontendOrigin, { timeout: 60000 });
  await page.waitForTimeout(2000);

  // Check if login page is loaded
  const usernameLabel = page.getByLabel(/Username/i);
  await expect(usernameLabel).toBeVisible({ timeout: 10000 });

  // Fill in login form
  await usernameLabel.fill('admin');
  await page.getByLabel(/Password/i).fill(adminPassword);

  // Take screenshot before login
  await page.screenshot({ path: 'test-results/platform-admin-before-login.png' });

  // Click login button
  await page.getByRole('button', { name: /Login/i }).click();

  // Wait for navigation after login
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  } catch (e) {
    console.log('Page load state timeout, continuing...');
  }

  // Take screenshot to see what's displayed
  await page.screenshot({ path: 'test-results/platform-admin-after-login.png' });

  // Check that we're NOT on the tenant setup wizard
  const tenantSetupWizard = page.getByText(/tenant.*setup|database.*setup/i);
  const hasTenantSetupWizard = await tenantSetupWizard.count();
  console.log(`Tenant setup wizard visible: ${hasTenantSetupWizard > 0}`);

  // Check if main navigation is visible
  const nav = page.locator('nav');
  const hasNav = await nav.count();
  console.log(`Navigation visible: ${hasNav > 0}`);

  // Check for System or Tenant buttons
  const systemButton = page.getByRole('button', { name: /System/i });
  const tenantButton = page.getByRole('button', { name: /Tenant/i });
  const hasSystemButton = await systemButton.count();
  const hasTenantButton = await tenantButton.count();
  console.log(`System button visible: ${hasSystemButton > 0}`);
  console.log(`Tenant button visible: ${hasTenantButton > 0}`);

  // Platform admin should see navigation buttons, NOT tenant setup wizard
  if (hasTenantSetupWizard > 0) {
    console.error('FAIL: Platform admin is seeing tenant setup wizard!');
    throw new Error('Platform admin should not see tenant setup wizard');
  }

  if (hasSystemButton > 0 || hasTenantButton > 0) {
    console.log('✅ PASS: Platform admin can see main navigation');
  } else {
    console.error('FAIL: Platform admin cannot see main navigation');
    throw new Error('Platform admin should see main navigation');
  }
});
