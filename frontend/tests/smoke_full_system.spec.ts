import { test, expect } from '@playwright/test';

const adminUsername = 'admin';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Admin@Pantheon2026';

test.describe('Full System Management Smoke Test', () => {
  test('login, explore all system modules, and logout', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/login-page.png' });

    console.log('Filling username...');
    await page.locator('#username').fill(adminUsername);
    console.log('Filling password...');
    await page.locator('#password').fill(adminPassword);
    
    // Check if Tenant Code field is present
    const tenantCodeField = page.locator('#tenantCode');
    if (await tenantCodeField.isVisible()) {
        console.log('Filling tenant code...');
        await tenantCodeField.fill('platform'); // Correct tenant code for platform admin
    }

    await page.screenshot({ path: 'test-results/login-form-filled.png' });
    console.log('Clicking login button...');
    await page.locator('button[type="submit"]').click();

    // Wait for response or navigation
    await page.waitForNavigation().catch(() => {
        console.log('Navigation after login timed out or did not occur.');
    });
    
    await page.screenshot({ path: 'test-results/after-login-click.png' });

    // Wait for login success
    try {
        await expect(page.getByRole('button', { name: /系统管理|System Management|System|Tenant/i }).first()).toBeVisible({
          timeout: 15000,
        });
    } catch (error) {
        console.log('Login failed or took too long.');
        const bodyText = await page.innerText('body');
        console.log('Page body text:', bodyText);
        
        // Check for specific error messages in the UI
        const errorMsg = await page.locator('.text-red-500').allInnerTexts();
        if (errorMsg.length > 0) {
            console.log('Detected error messages:', errorMsg);
        }
        
        throw error;
    }
    console.log('✅ Login successful');

    // 2. Open System Management Menu
    const systemMenu = page.getByRole('button', { name: /系统管理|System Management|System/i });
    if (await systemMenu.isVisible()) {
        await systemMenu.click();
    } else {
        // Might be already open or under a different name
        console.log('System menu button not found or already open');
    }

    // 3. List of modules to check (approximate names in English/Chinese)
    const modules = [
      { name: /User|用户/i, url: '/system/user' },
      { name: /Role|角色/i, url: '/system/role' },
      { name: /Menu|菜单/i, url: '/system/menu' },
      { name: /Dept|部门/i, url: '/system/dept' },
      { name: /Post|岗位/i, url: '/system/post' },
      { name: /Dict|字典/i, url: '/system/dict' },
      { name: /Log|日志/i, url: '/system/log' },
      { name: /Setting|设置/i, url: '/system/setting' },
      { name: /Monitor|监控/i, url: '/system/monitor' },
    ];

    for (const mod of modules) {
      console.log(`Checking module: ${mod.url}`);
      // Navigate via URL for reliability in smoke test
      await page.goto(mod.url);
      await page.waitForLoadState('networkidle');
      
      // Verify something is rendered (e.g., a table or a specific heading)
      // Since we don't know the exact UI yet, we just check if it doesn't crash
      await expect(page.locator('main')).toBeVisible();
      
      // Look for common table or list indicators
      const table = page.locator('table');
      const list = page.locator('ul, div[role="list"]');
      await expect(table.first().or(list.first())).toBeVisible({ timeout: 10000 }).catch(() => {
          console.log(`  Module ${mod.url} might not have a table yet, but page is visible.`);
      });

      await page.screenshot({ path: `test-results/smoke-${mod.url.replace(/\//g, '-')}.png` });
    }

    // 4. Logout
    console.log('Attempting logout...');
    // Look for user profile button or logout button
    const userButton = page.getByRole('button', { name: /admin/i }).first();
    if (await userButton.isVisible()) {
        await userButton.click();
        await page.getByRole('menuitem', { name: /Logout|退出/i }).click();
    } else {
        // Direct logout URL if available
        await page.goto('/logout');
    }

    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible({ timeout: 15000 });
    console.log('✅ Logout successful');
  });
});
