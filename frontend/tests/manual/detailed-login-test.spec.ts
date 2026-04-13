import { test } from '@playwright/test';
import { getE2EAdminPassword } from '../e2eCredentials';

test('detailed login test with console monitoring', async ({ page }) => {
  const adminPassword = getE2EAdminPassword();
  
  // Monitor console messages
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`API Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
    }
  });
  
  console.log('Navigating to login page...');
  await page.goto('/', { timeout: 60000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
  
  // Fill and submit form
  console.log('Filling login form...');
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill(adminPassword);
  await page.locator('#tenantCode').fill('platform');
  
  console.log('Submitting login...');
  await page.locator('button[type="submit"]').click();
  
  // Wait and check result
  console.log('Waiting for post-login navigation...');
  await page.waitForTimeout(5000);
  
  console.log('Final URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Look for any error messages
  const errorElements = await page.locator('.text-red-500, [role="alert"]').all();
  if (errorElements.length > 0) {
    console.log('Found error elements:');
    for (const elem of errorElements) {
      const text = await elem.textContent();
      console.log(`  - ${text}`);
    }
  }
  
  await page.screenshot({ path: 'test-results/detailed-final-state.png' });
});
