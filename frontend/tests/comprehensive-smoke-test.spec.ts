import { test, expect } from '@playwright/test';

/**
 * 全系统冒烟测试
 * 测试登录、退出、系统管理模块所有功能
 * 验证菜单动态加载逻辑
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE || 'http://localhost:8080/api/v1';

// 测试数据
const ADMIN_CREDENTIALS = {
  username: process.env.E2E_ADMIN_USERNAME || 'admin',
  password: process.env.E2E_ADMIN_PASSWORD || 'Admin@Pantheon2026',
};

test.describe('冒烟测试 - 认证流程', () => {
  test('应该能够成功登录', async ({ page }) => {
    await page.goto(BASE_URL);

    // 等待登录页面加载
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input#username')).toBeVisible();

    // 填写登录信息
    await page.fill('#username', ADMIN_CREDENTIALS.username);
    await page.fill('#password', ADMIN_CREDENTIALS.password);

    // 提交登录
    await Promise.all([
      page.waitForURL(/\/(dashboard|system)/),
      page.click('button[type="submit"]'),
    ]);

    // 验证登录成功
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/admin/i')).toBeVisible();
  });

  test('应该能够成功退出', async ({ page }) => {
    // 先登录
    await login(page);

    // 点击用户菜单
    await page.click('[data-testid="user-menu-button"], .user-menu-button');

    // 等待退出按钮出现并点击
    await page.click('text=退出, text=Logout');

    // 验证退出成功 - 应该回到登录页
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#username')).toBeVisible();
  });
});

test.describe('冒烟测试 - 菜单动态加载', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应该从后端成功加载菜单', async ({ page }) => {
    // 拦截菜单 API 请求
    const menuResponse = await page.request.get(`${API_BASE}/user/menus`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken(page)}`,
      },
    });

    expect(menuResponse.ok()).toBeTruthy();

    const menus = await menuResponse.json();
    expect(menus).toBeDefined();
    expect(menus.code).toBe(0);
    expect(menus.data).toBeInstanceOf(Array);
    expect(menus.data.length).toBeGreaterThan(0);

    console.log('✅ 后端返回菜单数量:', menus.data.length);

    // 验证菜单数据结构
    const firstMenu = menus.data[0];
    expect(firstMenu).toHaveProperty('id');
    expect(firstMenu).toHaveProperty('name');
    expect(firstMenu).toHaveProperty('path');
    expect(firstMenu).toHaveProperty('component');
    expect(firstMenu).toHaveProperty('sort');
  });

  test('侧边栏应该正确显示后端菜单', async ({ page }) => {
    // 等待侧边栏加载
    await page.waitForSelector('nav', { timeout: 5000 });

    // 检查侧边栏菜单项
    const menuItems = await page.locator('nav button').all();
    expect(menuItems.length).toBeGreaterThan(0);

    console.log('✅ 侧边栏显示菜单数量:', menuItems.length);

    // 验证系统管理菜单存在
    const systemMenu = page.locator('nav button:has-text("系统管理"), nav button:has-text("System")');
    await expect(systemMenu).toBeVisible();
  });

  test('点击菜单项应该正确导航', async ({ page }) => {
    // 等待侧边栏加载
    await page.waitForSelector('nav', { timeout: 5000 });

    // 点击用户管理菜单
    const userMenuLink = page.locator('nav button:has-text("用户"), nav button:has-text("User")');
    if (await userMenuLink.isVisible()) {
      await userMenuLink.click();

      // 验证导航成功
      await expect(page).toHaveURL(/\/system\/users/);

      // 验证标签页已创建
      const tabs = page.locator('[role="tablist"] button');
      await expect(tabs).toContainText(['用户', 'Users']);
    }
  });

  test('当前路由对应的菜单项应该高亮', async ({ page }) => {
    // 导航到用户管理页面
    await page.goto(`${BASE_URL}/system/users`);

    // 等待页面加载
    await page.waitForSelector('.user-management', { timeout: 5000 });

    // 检查用户管理菜单是否高亮
    const activeMenu = page.locator('nav button[style*="rgba(255,255,255,0.24)"]');
    const isActive = await activeMenu.count();

    console.log('✅ 高亮菜单数量:', isActive);

    // 至少应该有一个高亮的菜单项（当前页面）
    expect(isActive).toBeGreaterThan(0);
  });
});

test.describe('冒烟测试 - 系统管理模块', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('用户管理 - 应该能够加载用户列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/users`);

    // 等待表格加载
    await page.waitForSelector('table', { timeout: 5000 });

    // 验证页面标题
    await expect(page.locator('h1, h2').filter({ hasText: /用户|User/i })).toBeVisible();

    // 验证表格存在
    await expect(page.locator('table')).toBeVisible();

    console.log('✅ 用户管理页面加载成功');
  });

  test('角色管理 - 应该能够加载角色列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/roles`);

    await page.waitForSelector('table', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /角色|Role/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    console.log('✅ 角色管理页面加载成功');
  });

  test('部门管理 - 应该能够加载部门树', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/departments`);

    await page.waitForSelector('.department-management, table, .tree', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /部门|Department/i })).toBeVisible();

    console.log('✅ 部门管理页面加载成功');
  });

  test('岗位管理 - 应该能够加载岗位列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/positions`);

    await page.waitForSelector('table', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /岗位|Position/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    console.log('✅ 岗位管理页面加载成功');
  });

  test('菜单管理 - 应该能够加载菜单列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/menus`);

    await page.waitForSelector('table', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /菜单|Menu/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    console.log('✅ 菜单管理页面加载成功');
  });

  test('权限管理 - 应该能够加载权限列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/permissions`);

    await page.waitForSelector('table', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /权限|Permission/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    console.log('✅ 权限管理页面加载成功');
  });

  test('数据字典 - 应该能够加载字典列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/dictionaries`);

    await page.waitForSelector('.data-dictionary, table', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /字典|Dictionary/i })).toBeVisible();

    console.log('✅ 数据字典页面加载成功');
  });

  test('日志管理 - 应该能够加载日志列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/logs`);

    await page.waitForSelector('table', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /日志|Log/i })).toBeVisible();

    console.log('✅ 日志管理页面加载成功');
  });

  test('系统设置 - 应该能够加载设置页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/settings`);

    await page.waitForSelector('.system-settings, form', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /设置|Settings/i })).toBeVisible();

    console.log('✅ 系统设置页面加载成功');
  });

  test('系统监控 - 应该能够加载监控数据', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/monitor`);

    await page.waitForSelector('.system-monitor', { timeout: 5000 });
    await expect(page.locator('h1, h2').filter({ hasText: /监控|Monitor/i })).toBeVisible();

    console.log('✅ 系统监控页面加载成功');
  });
});

test.describe('冒烟测试 - CRUD 操作', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('用户管理 - 应该能够打开创建用户对话框', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/users`);

    // 等待页面加载
    await page.waitForSelector('table', { timeout: 5000 });

    // 点击创建按钮
    const createButton = page.locator('button:has-text("创建"), button:has-text("新增"), button:has-text("Create"), button:has-text("Plus")').first();
    await createButton.click();

    // 验证对话框打开
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    console.log('✅ 创建用户对话框打开成功');
  });

  test('角色管理 - 应该能够打开创建角色对话框', async ({ page }) => {
    await page.goto(`${BASE_URL}/system/roles`);

    await page.waitForSelector('table', { timeout: 5000 });

    const createButton = page.locator('button:has-text("创建"), button:has-text("新增"), button:has-text("Create"), button:has-text("Plus")').first();
    await createButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    console.log('✅ 创建角色对话框打开成功');
  });
});

// 辅助函数
async function login(page) {
  await page.goto(BASE_URL);
  await page.fill('#username', ADMIN_CREDENTIALS.username);
  await page.fill('#password', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  // 等待导航完成
  await page.waitForURL(/\/(dashboard|system)/, { timeout: 10000 });
}

async function getAuthToken(page): Promise<string> {
  // 从 localStorage 或 cookie 中获取 token
  const storage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });

  if (storage) {
    const auth = JSON.parse(storage);
    return auth?.state?.accessToken || auth?.accessToken;
  }

  // 从 cookies 获取
  const cookies = await page.context().cookies();
  return cookies.find(c => c.name.includes('token'))?.value || '';
}
