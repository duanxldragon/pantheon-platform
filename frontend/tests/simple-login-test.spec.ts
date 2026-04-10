import { test } from '@playwright/test';
import { getE2EAdminPassword } from './e2eCredentials';

test('simple login test', async ({ page }) => {
  const adminPassword = getE2EAdminPassword();
  
  console.log('Navigating to login page...');
  await page.goto('/', { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  
  // Use direct ID selectors instead of labels
  console.log('Filling in username...');
  await page.locator('#username').fill('admin');
  
  console.log('Filling in password...');
  await page.locator('#password').fill(adminPassword);
  
  // Check if tenant code field exists and fill it
  const tenantCodeField = page.locator('#tenantCode');
  if (await tenantCodeField.count() > 0) {
    console.log('Filling in tenant code...');
    await tenantCodeField.fill('platform');
  }
  
  console.log('Clicking login button...');
  await page.locator('button[type="submit"]').click();
  
  // Wait for navigation or response
  console.log('Waiting for login response...');
  await page.waitForTimeout(3000);
  
  console.log('Current URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/simple-after-login.png' });
  
  // Check if we're still on login page
  if (page.url().includes('/login') || page.url() === '/') {
    console.log('Still on login page - checking for errors...');
    const bodyText = await page.innerText('body');
    console.log('Page content:', bodyText.substring(0, 200));
  } else {
    console.log('✅ Navigation occurred!');
  }
});
