import { test } from '@playwright/test';
import { getE2EAdminPassword } from './e2eCredentials';

test('fresh login with context cleared', async ({ context, page }) => {
  const adminPassword = getE2EAdminPassword();
  
  // Clear all cookies and storage
  await context.clearCookies();
  await page.goto('/', { timeout: 60000 });
  
  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Reload page
  await page.reload();
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  
  // Monitor API responses
  page.on('response', async (response) => {
    if (response.url().includes('/api/v1/auth/config')) {
      const data = await response.json().catch(() => ({}));
      console.log('Auth config response:', JSON.stringify(data).substring(0, 300));
    }
    if (response.url().includes('/api/v1/auth/login')) {
      console.log(`Login response status: ${response.status()}`);
      const data = await response.json().catch(() => ({}));
      console.log('Login response data:', JSON.stringify(data).substring(0, 300));
    }
  });
  
  console.log('Checking if tenant code field is visible...');
  const tenantField = page.locator('#tenantCode');
  const requiresTenant = await tenantField.count() > 0;
  console.log('Tenant field visible:', requiresTenant);
  
  // Fill form
  console.log('Filling login form...');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill(adminPassword);
  
  if (requiresTenant) {
    console.log('Filling tenant code as required by UI...');
    await tenantField.fill('platform');
  }
  
  console.log('Submitting login...');
  await page.locator('button[type="submit"]').click();
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check for success indicators
  const systemButton = page.getByRole('button', { name: /系统管理|System Management/i });
  const success = await systemButton.count() > 0;
  
  if (success) {
    console.log('✅ Login successful! Found system management button.');
  } else {
    console.log('❌ Login may have failed. Checking page content...');
    const bodyText = await page.innerText('body');
    console.log('Page preview:', bodyText.substring(0, 200));
  }
  
  await page.screenshot({ path: 'test-results/fresh-login-result.png' });
});
