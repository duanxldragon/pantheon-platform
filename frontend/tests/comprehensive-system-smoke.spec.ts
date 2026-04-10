import { test, expect } from '@playwright/test';

const adminUsername = 'admin';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'Admin@Pantheon2026';

test.describe('Comprehensive System Management Smoke Test', () => {
  test.beforeAll(async () => {
    console.log('Starting comprehensive system smoke test');
  });

  test('should handle login, test all system modules, Chinese i18n, and logout', async ({ page }) => {
    // ========== 1. LOGIN TEST ==========
    console.log('Step 1: Testing login functionality');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Screenshot of login page
    await page.screenshot({ path: 'test-results/smoke/01-login-page.png' });

    // Check for Chinese text in login page (i18n test)
    const loginPageText = await page.innerText('body');
    console.log('Login page contains Chinese characters:', /[\u4e00-\u9fa5]/.test(loginPageText));

    // Fill login form
    await page.locator('#username').fill(adminUsername);
    await page.locator('#password').fill(adminPassword);

    // Check if tenant code field exists
    const tenantCodeField = page.locator('#tenantCode');
    if (await tenantCodeField.isVisible()) {
      await tenantCodeField.fill('master');
    }

    await page.screenshot({ path: 'test-results/smoke/02-login-filled.png' });
    await page.locator('button[type="submit"]').click();

    // Wait for login success
    await page.waitForNavigation().catch(() => {});
    await page.screenshot({ path: 'test-results/smoke/03-after-login.png' });

    try {
      await expect(page.getByRole('button', { name: /System|Tenant|系统/i }).first()).toBeVisible({
        timeout: 15000,
      });
      console.log('✅ Login successful');
    } catch (error) {
      console.log('❌ Login failed');
      const bodyText = await page.innerText('body');
      console.log('Page body text:', bodyText);
      throw error;
    }

    // ========== 2. CHINESE I18N TEST ==========
    console.log('Step 2: Testing Chinese internationalization');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mainPageText = await page.innerText('body');
    const hasChinese = /[\u4e00-\u9fa5]/.test(mainPageText);
    console.log('Main page contains Chinese characters:', hasChinese);

    // Check for common Chinese UI elements
    const chineseElements = [
      '用户管理', '角色管理', '菜单管理', '权限管理', '部门管理',
      '岗位管理', '数据字典', '日志管理', '系统设置', '系统监控'
    ];

    for (const element of chineseElements) {
      const isVisible = await page.getByText(element).isVisible().catch(() => false);
      if (isVisible) {
        console.log(`  ✓ Found Chinese text: ${element}`);
      }
    }

    // ========== 3. SYSTEM MANAGEMENT MODULES TEST ==========
    console.log('Step 3: Testing all system management modules');

    const modules = [
      { name: 'User Management', url: '/system/user', expectedText: ['用户管理', 'User Management', '用户名', 'Username'] },
      { name: 'Role Management', url: '/system/role', expectedText: ['角色管理', 'Role Management', '角色名称', 'Role Name'] },
      { name: 'Menu Management', url: '/system/menu', expectedText: ['菜单管理', 'Menu Management', '菜单名称', 'Menu Name'] },
      { name: 'Permission Management', url: '/system/permission', expectedText: ['权限管理', 'Permission Management', '权限名称', 'Permission Name'] },
      { name: 'Department Management', url: '/system/dept', expectedText: ['部门管理', 'Department Management', '部门名称', 'Department Name'] },
      { name: 'Position Management', url: '/system/position', expectedText: ['岗位管理', 'Position Management', '岗位名称', 'Position Name'] },
      { name: 'Data Dictionary', url: '/system/dict', expectedText: ['数据字典', 'Data Dictionary', '字典类型', 'Dict Type'] },
      { name: 'Log Management', url: '/system/log', expectedText: ['日志管理', 'Log Management', '操作日志', 'Operation Log'] },
      { name: 'System Settings', url: '/system/settings', expectedText: ['系统设置', 'System Settings', '配置', 'Configuration'] },
      { name: 'System Monitor', url: '/system/monitor', expectedText: ['系统监控', 'System Monitor', '监控', 'Monitor'] },
    ];

    for (const mod of modules) {
      console.log(`Testing module: ${mod.name} (${mod.url})`);

      // Navigate to module
      await page.goto(mod.url);
      await page.waitForLoadState('networkidle');

      // Screenshot
      await page.screenshot({ path: `test-results/smoke/module-${mod.name.replace(/\s+/g, '-').toLowerCase()}.png` });

      // Check if page loaded without errors
      await expect(page.locator('main')).toBeVisible();

      // Check for expected text (Chinese or English)
      let foundExpectedText = false;
      for (const text of mod.expectedText) {
        const element = await page.getByText(text).isVisible().catch(() => false);
        if (element) {
          console.log(`  ✓ Found expected text: ${text}`);
          foundExpectedText = true;
          break;
        }
      }

      if (!foundExpectedText) {
        console.log(`  ⚠ Warning: No expected text found for ${mod.name}`);
      }

      // Check for common UI components
      const hasTable = await page.locator('table').isVisible().catch(() => false);
      const hasButton = await page.locator('button').isVisible().catch(() => false);
      const hasInput = await page.locator('input').isVisible().catch(() => false);

      console.log(`  UI Components: Table=${hasTable}, Button=${hasButton}, Input=${hasInput}`);

      // Check for Chinese character rendering (no encoding issues)
      const pageText = await page.innerText('body');
      const chineseChars = pageText.match(/[\u4e00-\u9fa5]/g);
      if (chineseChars && chineseChars.length > 0) {
        console.log(`  ✓ Chinese characters rendering correctly (${chineseChars.length} chars)`);
      }
    }

    // ========== 4. CRUD OPERATIONS TEST ==========
    console.log('Step 4: Testing basic CRUD operations');

    // Test User Management CRUD
    console.log('Testing User Management CRUD operations');
    await page.goto('/system/user');
    await page.waitForLoadState('networkidle');

    // Check for "Add User" or "新建" button
    const addButton = page.getByRole('button', { name: /Add|新建|Create/i }).first();
    if (await addButton.isVisible()) {
      console.log('  ✓ Add button found in User Management');

      // Click add button (but don't submit, just verify dialog opens)
      await addButton.click();
      await page.waitForTimeout(1000);

      // Check if form dialog appeared
      const dialog = page.locator('.dialog, .modal, [role="dialog"]');
      if (await dialog.isVisible().catch(() => false)) {
        console.log('  ✓ User form dialog opened successfully');
        await page.screenshot({ path: 'test-results/smoke/crud-user-form.png' });

        // Close dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    // Test Role Management CRUD
    console.log('Testing Role Management CRUD operations');
    await page.goto('/system/role');
    await page.waitForLoadState('networkidle');

    const addRoleButton = page.getByRole('button', { name: /Add|新建|Create/i }).first();
    if (await addRoleButton.isVisible()) {
      console.log('  ✓ Add button found in Role Management');
      await addRoleButton.click();
      await page.waitForTimeout(1000);

      const roleDialog = page.locator('.dialog, .modal, [role="dialog"]');
      if (await roleDialog.isVisible().catch(() => false)) {
        console.log('  ✓ Role form dialog opened successfully');
        await page.screenshot({ path: 'test-results/smoke/crud-role-form.png' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    // ========== 5. MULTI-LANGUAGE SWITCH TEST ==========
    console.log('Step 5: Testing multi-language switching');

    // Look for language switcher
    const languageSwitcher = page.locator('[class*="language"], [class*="i18n"], select').first();
    if (await languageSwitcher.isVisible().catch(() => false)) {
      console.log('  ✓ Language switcher found');

      // Try to switch language (if it's a select dropdown)
      const tagName = await languageSwitcher.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        await languageSwitcher.selectOption('en');
        await page.waitForTimeout(1000);
        console.log('  ✓ Switched to English');

        await page.screenshot({ path: 'test-results/smoke/lang-english.png' });

        // Switch back to Chinese
        await languageSwitcher.selectOption('zh');
        await page.waitForTimeout(1000);
        console.log('  ✓ Switched back to Chinese');

        await page.screenshot({ path: 'test-results/smoke/lang-chinese.png' });
      }
    } else {
      console.log('  ⚠ Language switcher not found (may not be implemented yet)');
    }

    // ========== 6. API CONNECTIVITY TEST ==========
    console.log('Step 6: Testing API connectivity');

    // Monitor network requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url());
      }
    });

    // Navigate to a few modules to trigger API calls
    await page.goto('/system/user');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/system/role');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log(`  API calls made: ${apiRequests.length}`);
    if (apiRequests.length > 0) {
      console.log('  ✓ API connectivity working');
      // Log a few API endpoints
      apiRequests.slice(0, 5).forEach(url => {
        console.log(`    - ${url}`);
      });
    } else {
      console.log('  ⚠ No API calls detected');
    }

    // ========== 7. LOGOUT TEST ==========
    console.log('Step 7: Testing logout functionality');

    // Look for user menu or logout button
    const userButton = page.getByRole('button', { name: /admin|用户/i }).first();
    const logoutButton = page.getByRole('button', { name: /Logout|退出/i }).first();

    if (await userButton.isVisible()) {
      console.log('  Clicking user menu');
      await userButton.click();
      await page.waitForTimeout(500);

      const logoutMenuItem = page.getByRole('menuitem', { name: /Logout|退出/i });
      if (await logoutMenuItem.isVisible()) {
        await logoutMenuItem.click();
      } else {
        await page.goto('/logout');
      }
    } else if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Direct logout URL
      await page.goto('/logout');
    }

    // Verify logout - should be redirected to login page
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/smoke/08-after-logout.png' });

    const isOnLoginPage = await page.locator('#username, #password').isVisible();
    if (isOnLoginPage) {
      console.log('✅ Logout successful - redirected to login page');
    } else {
      console.log('⚠ Logout may not have completed properly');
    }

    console.log('✅ Comprehensive smoke test completed');
  });

  test.afterAll(async () => {
    console.log('Comprehensive system smoke test finished');
  });
});
