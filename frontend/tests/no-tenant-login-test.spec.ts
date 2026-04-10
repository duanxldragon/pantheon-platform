import { test } from '@playwright/test';
import { getE2EAdminPassword } from './e2eCredentials';

test('login without tenant code', async ({ page }) => {
  const adminPassword = getE2EAdminPassword();
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/auth/login')) {
      console.log(`Login request: ${request.method()} ${request.url()}`);
      // Log request body
      request.postData().then(data => console.log('Request body:', data));
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/auth/login')) {
      console.log(`Login response: ${response.status()}`);
      response.json().then(data => console.log('Response data:', JSON.stringify(data).substring(0, 200)));
    }
  });
  
  console.log('Navigating to login page...');
  await page.goto('/', { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  
  // Fill form WITHOUT tenant code
  console.log('Filling login form (no tenant code)...');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill(adminPassword);
  
  // Don't fill tenant code - leave it empty
  
  console.log('Submitting login...');
  await page.locator('button[type="submit"]').click();
  
  // Wait for response
  console.log('Waiting for login response...');
  await page.waitForTimeout(5000);
  
  console.log('Final URL:', page.url());
  console.log('Current page title:', await page.title());
  
  // Look for navigation buttons
  const systemButton = page.getByRole('button', { name: /系统管理|System Management|System/i });
  const count = await systemButton.count();
  console.log(`System button count: ${count}`);
  
  if (count > 0) {
    console.log('✅ Login successful! System button found.');
  } else {
    console.log('❌ System button not found. Checking for errors...');
    const bodyText = await page.innerText('body');
    console.log('Page content preview:', bodyText.substring(0, 300));
  }
  
  await page.screenshot({ path: 'test-results/no-tenant-login-result.png' });
});
