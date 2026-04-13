import { test } from '@playwright/test';

test('debug page load', async ({ page }) => {
  console.log('Navigating to login page...');
  await page.goto('/', { timeout: 60000 });
  
  console.log('Waiting for network idle...');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
    console.log('Network idle timeout, continuing anyway...');
  });
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-page.png' });
  
  // Check page content
  const bodyText = await page.innerText('body');
  console.log('Body text length:', bodyText.length);
  console.log('Body text preview:', bodyText.substring(0, 300));
  
  // Look for any input elements
  const inputs = await page.locator('input').all();
  console.log('Found', inputs.length, 'input elements');
  
  // Look for any labels
  const labels = await page.locator('label').all();
  console.log('Found', labels.length, 'label elements');
  
  for (let i = 0; i < Math.min(labels.length, 5); i++) {
    try {
      const text = await labels[i].textContent();
      const htmlFor = await labels[i].getAttribute('for');
      console.log(`Label ${i + 1}: text="${text?.trim()}", for="${htmlFor}"`);
    } catch (error) {
      console.log(`Label ${i + 1}: error getting attributes`);
    }
  }
});
