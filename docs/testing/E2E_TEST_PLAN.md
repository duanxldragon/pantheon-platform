# 端到端测试计划

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **测试类型**: 端到端测试 (E2E Testing)
- **测试环境**: Staging
- **测试工具**: Playwright

## 🎯 测试目标

### 总体目标
从最终用户的角度验证完整业务流程，确保系统从前端到后端的所有组件协同工作正常。

### 具体目标
- 核心业务流程E2E测试覆盖率 = 100%
- 关键用户旅程测试通过率 ≥ 95%
- E2E测试执行稳定性 ≥ 98%
- 测试执行时间 < 45分钟
- 自动化E2E测试场景数 ≥ 50个

## 🛠️ 测试环境与工具

### 测试环境配置
```yaml
E2E测试环境: Staging
浏览器支持:
  - Chrome (主要测试浏览器)
  - Firefox
  - Safari
  - Edge

视口尺寸:
  - Desktop: 1920x1080
  - Laptop: 1366x768
  - Tablet: 768x1024
  - Mobile: 375x667

测试数据: 
  - 专用E2E测试数据库
  - 每次执行前重置数据
  - 使用确定性测试数据
```

### 技术栈
```json
{
  "framework": "Playwright",
  "language": "TypeScript",
  "version": "1.40+",
  "reporter": ["html", "json"],
  "test_runner": "@playwright/test"
}
```

### 项目结构
```
frontend/tests/e2e/
├── fixtures/           # 测试数据
│   ├── users.ts
│   ├── tenants.ts
│   └── common.ts
├── pages/              # 页面对象模型
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── UserManagementPage.ts
│   └── TenantManagementPage.ts
├── tests/              # 测试用例
│   ├── auth/
│   ├── user-management/
│   ├── tenant-management/
│   └── system/
├── utils/              # 工具函数
│   ├── api-helpers.ts
│   ├── data-helpers.ts
│   └── assertion-helpers.ts
└── playwright.config.ts
```

## 🧪 核心业务流程测试

### 1. 用户认证流程

#### 1.1 新用户注册到首次登录
```typescript
// tests/auth/registration-login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('用户注册到登录流程', () => {
  test('应该成功完成新用户注册并自动登录', async ({ page }) => {
    // 1. 访问注册页面
    await page.goto('/register');
    
    // 2. 填写注册表单
    await page.fill('[data-testid="email"]', 'e2e-test@example.com');
    await page.fill('[data-testid="username"]', 'e2euser');
    await page.fill('[data-testid="password"]', 'Secure@123');
    await page.fill('[data-testid="confirmPassword"]', 'Secure@123');
    await page.fill('[data-testid="realName"]', 'E2E测试用户');
    
    // 3. 同意服务条款
    await page.check('[data-testid="agreeTerms"]');
    
    // 4. 提交注册
    await page.click('[data-testid="registerButton"]');
    
    // 5. 验证跳转到欢迎页面
    await expect(page).toHaveURL(/.*welcome/);
    await expect(page.locator('[data-testid="welcomeMessage"]')).toBeVisible();
    
    // 6. 验证用户状态
    await expect(page.locator('[data-testid="userStatus"]')).toHaveText('待激活');
    
    // 7. 模拟邮箱验证
    const token = await getVerificationToken('e2e-test@example.com');
    await page.goto(`/verify-email?token=${token}`);
    
    // 8. 验证激活成功
    await expect(page.locator('[data-testid="activationSuccess"]')).toBeVisible();
    
    // 9. 自动登录到系统
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="userInfo"]')).toContainText('E2E测试用户');
  });
});
```

#### 1.2 正常登录流程
```typescript
test.describe('用户登录流程', () => {
  test.beforeEach(async ({ page }) => {
    // 准备测试用户
    await createTestUser({
      username: 'logintest',
      password: 'Login@123',
      status: 'active'
    });
  });

  test('应该成功登录并跳转到工作台', async ({ page }) => {
    // 1. 访问登录页面
    await page.goto('/login');
    
    // 2. 输入登录凭据
    await page.fill('[data-testid="username"]', 'logintest');
    await page.fill('[data-testid="password"]', 'Login@123');
    
    // 3. 点击登录按钮
    await page.click('[data-testid="loginButton"]');
    
    // 4. 验证跳转到工作台
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
    
    // 5. 验证用户信息显示
    await expect(page.locator('[data-testid="currentUser"]')).toBeVisible();
    await expect(page.locator('[data-testid="currentUser"]')).toContainText('logintest');
    
    // 6. 验证主菜单显示
    await expect(page.locator('[data-testid="mainMenu"]')).toBeVisible();
    
    // 7. 验证侧边栏导航
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('应该在登录失败时显示错误提示', async ({ page }) => {
    // 1. 访问登录页面
    await page.goto('/login');
    
    // 2. 输入错误的密码
    await page.fill('[data-testid="username"]', 'logintest');
    await page.fill('[data-testid="password"]', 'WrongPassword');
    
    // 3. 点击登录按钮
    await page.click('[data-testid="loginButton"]');
    
    // 4. 验证错误提示
    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]'))
      .toContainText('用户名或密码错误');
    
    // 5. 验证仍停留在登录页面
    await expect(page).toHaveURL(/.*login/);
  });
});
```

### 2. 用户管理流程

#### 2.1 用户CRUD完整流程
```typescript
test.describe('用户管理CRUD流程', () => {
  let authToken: string;

  test.beforeEach(async ({ page, context }) => {
    // 管理员登录
    authToken = await loginAsAdmin(page);
    
    // 设置授权令牌
    await context.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authToken}`
    });
  });

  test('应该成功完成用户创建、查询、更新、删除流程', async ({ page }) => {
    // 1. 进入用户管理页面
    await page.goto('/system/users');
    await expect(page.locator('[data-testid="userListPage"]')).toBeVisible();
    
    // 2. 点击"新建用户"按钮
    await page.click('[data-testid="createUserButton"]');
    await expect(page.locator('[data-testid="userFormDialog"]')).toBeVisible();
    
    // 3. 填写用户信息
    await page.fill('[data-testid="username"]', 'cruduser');
    await page.fill('[data-testid="realName"]', 'CRUD测试用户');
    await page.fill('[data-testid="email"]', 'cruduser@example.com');
    await page.fill('[data-testid="phone"]', '13800138000');
    
    // 4. 选择角色
    await page.click('[data-testid="roleSelect"]');
    await page.click('text=普通用户');
    
    // 5. 选择部门
    await page.click('[data-testid="departmentSelect"]');
    await page.click('text=技术部');
    
    // 6. 提交创建
    await page.click('[data-testid="submitButton"]');
    
    // 7. 验证成功提示
    await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="successMessage"]'))
      .toContainText('用户创建成功');
    
    // 8. 验证用户出现在列表中
    await expect(page.locator('text=cruduser')).toBeVisible();
    await expect(page.locator('text=CRUD测试用户')).toBeVisible();
    
    // 9. 搜索新创建的用户
    await page.fill('[data-testid="searchInput"]', 'cruduser');
    await page.click('[data-testid="searchButton"]');
    
    // 10. 验证搜索结果
    const userRow = page.locator('[data-testid="userRow"]').first();
    await expect(userRow).toBeVisible();
    
    // 11. 点击编辑按钮
    await userRow.locator('[data-testid="editButton"]').click();
    await expect(page.locator('[data-testid="userFormDialog"]')).toBeVisible();
    
    // 12. 修改用户信息
    await page.fill('[data-testid="realName"]', 'CRUD测试用户-已修改');
    
    // 13. 提交更新
    await page.click('[data-testid="submitButton"]');
    
    // 14. 验证更新成功
    await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    await expect(page.locator('text=CRUD测试用户-已修改')).toBeVisible();
    
    // 15. 删除用户
    await userRow.locator('[data-testid="deleteButton"]').click();
    
    // 16. 确认删除
    await page.click('[data-testid="confirmDeleteButton"]');
    
    // 17. 验证删除成功
    await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    await expect(page.locator('text=cruduser')).not.toBeVisible();
  });
});
```

#### 2.2 批量用户操作流程
```typescript
test.describe('批量用户操作', () => {
  test('应该成功执行批量启用/禁用操作', async ({ page }) => {
    // 1. 管理员登录
    await loginAsAdmin(page);
    
    // 2. 进入用户管理页面
    await page.goto('/system/users');
    
    // 3. 选择多个用户
    await page.check('[data-testid="userCheckbox"]:nth-of-type(1)');
    await page.check('[data-testid="userCheckbox"]:nth-of-type(2)');
    await page.check('[data-testid="userCheckbox"]:nth-of-type(3)');
    
    // 4. 点击批量操作按钮
    await page.click('[data-testid="batchActionButton"]');
    
    // 5. 选择禁用操作
    await page.click('text=批量禁用');
    
    // 6. 确认操作
    await page.click('[data-testid="confirmBatchButton"]');
    
    // 7. 验证操作结果
    await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="successMessage"]'))
      .toContainText('成功禁用3个用户');
    
    // 8. 验证用户状态已更新
    const disabledCount = await page.locator('[data-testid="userStatusInactive"]').count();
    expect(disabledCount).toBeGreaterThanOrEqual(3);
  });
});
```

### 3. 租户管理流程

#### 3.1 租户创建到初始化流程
```typescript
test.describe('租户创建流程', () => {
  test('应该成功创建新租户并完成初始化', async ({ page }) => {
    // 1. 平台管理员登录
    await loginAsPlatformAdmin(page);
    
    // 2. 进入租户管理页面
    await page.goto('/tenants');
    
    // 3. 点击新建租户
    await page.click('[data-testid="createTenantButton"]');
    
    // 4. 填写租户基本信息
    await page.fill('[data-testid="tenantName"]', 'E2E测试租户');
    await page.fill('[data-testid="tenantCode"]', 'e2e-tenant');
    await page.fill('[data-testid="contactName"]', '测试联系人');
    await page.fill('[data-testid="contactEmail"]', 'admin@e2e-tenant.com');
    await page.fill('[data-testid="contactPhone"]', '13900139000');
    
    // 5. 配置资源配额
    await page.fill('[data-testid="maxUsers"]', '50');
    await page.fill('[data-testid="maxStorage"]', '100');
    await page.fill('[data-testid="maxApiCalls"]', '5000');
    
    // 6. 配置数据库
    await page.selectOption('[data-testid="dbType"]', 'mysql');
    await page.fill('[data-testid="dbHost"]', 'localhost');
    await page.fill('[data-testid="dbPort"]', '3306');
    
    // 7. 提交创建
    await page.click('[data-testid="submitButton"]');
    
    // 8. 验证创建成功
    await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    
    // 9. 查看租户详情
    await page.click('text=E2E测试租户');
    
    // 10. 验证租户状态
    await expect(page.locator('[data-testid="tenantStatus"]')).toHaveText('正常');
    
    // 11. 验证数据库初始化状态
    await expect(page.locator('[data-testid="dbInitStatus"]')).toHaveText('已完成');
    
    // 12. 验证默认管理员创建
    await expect(page.locator('[data-testid="defaultAdmin"]')).toHaveText('admin@e2e-tenant.com');
  });
});
```

#### 3.2 租户数据库隔离验证
```typescript
test.describe('租户数据隔离', () => {
  test('应该确保不同租户数据完全隔离', async ({ browser }) => {
    // 创建两个上下文（模拟两个租户用户）
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // 租户A用户登录
      await loginAs(page1, 'tenantA@example.com', 'password');
      // 租户B用户登录
      await loginAs(page2, 'tenantB@example.com', 'password');
      
      // 租户A查看用户列表
      await page1.goto('/system/users');
      const tenantAUsers = await page1.locator('[data-testid="userRow"]').count();
      
      // 租户B查看用户列表
      await page2.goto('/system/users');
      const tenantBUsers = await page2.locator('[data-testid="userRow"]').count();
      
      // 验证用户数量不同（数据隔离）
      expect(tenantAUsers).toBeGreaterThan(0);
      expect(tenantBUsers).toBeGreaterThan(0);
      expect(tenantAUsers).not.toBe(tenantBUsers);
      
      // 验证租户A无法看到租户B的数据
      await page1.fill('[data-testid="searchInput"]', 'tenantB_user');
      await page1.click('[data-testid="searchButton"]');
      await expect(page1.locator('text=没有找到匹配的数据')).toBeVisible();
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
```

### 4. 权限管理流程

#### 4.1 角色权限配置流程
```typescript
test.describe('角色权限配置', () => {
  test('应该成功配置角色权限并生效', async ({ page }) => {
    // 1. 管理员登录
    await loginAsAdmin(page);
    
    // 2. 进入角色管理页面
    await page.goto('/system/roles');
    
    // 3. 创建新角色
    await page.click('[data-testid="createRoleButton"]');
    await page.fill('[data-testid="roleName"]', '数据分析师');
    await page.fill('[data-testid="roleCode"]', 'data_analyst');
    await page.fill('[data-testid="roleDescription"]', '负责数据分析和报表生成');
    await page.click('[data-testid="submitButton"]');
    
    // 4. 配置菜单权限
    await page.click('[data-testid="configureMenusButton"]');
    
    // 5. 选择可访问的菜单
    await page.check('[data-testid="menuDashboard"]');
    await page.check('[data-testid="menuReports"]');
    await page.uncheck('[data-testid="menuSystemSettings"]');
    
    // 6. 保存权限配置
    await page.click('[data-testid="savePermissionsButton"]');
    
    // 7. 验证成功提示
    await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
    
    // 8. 创建测试用户并分配角色
    await page.goto('/system/users');
    await page.click('[data-testid="createUserButton"]');
    await page.fill('[data-testid="username"]', 'analyst_user');
    await page.fill('[data-testid="realName"]', '数据分析师用户');
    await page.selectOption('[data-testid="roleSelect"]', 'data_analyst');
    await page.click('[data-testid="submitButton"]');
    
    // 9. 用新用户登录验证权限
    await page.goto('/logout');
    await loginAs(page, 'analyst_user', 'Analyst@123');
    
    // 10. 验证只能看到授权的菜单
    await expect(page.locator('[data-testid="menuDashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="menuReports"]')).toBeVisible();
    await expect(page.locator('[data-testid="menuSystemSettings"]')).not.toBeVisible();
    
    // 11. 尝试访问未授权页面
    await page.goto('/system/settings');
    await expect(page.locator('[data-testid="accessDenied"]')).toBeVisible();
  });
});
```

### 5. 系统监控流程

#### 5.1 系统概览监控流程
```typescript
test.describe('系统监控', () => {
  test('应该正确显示系统概览和告警信息', async ({ page }) => {
    // 1. 管理员登录
    await loginAsAdmin(page);
    
    // 2. 进入系统概览页面
    await page.goto('/dashboard');
    
    // 3. 验证关键指标卡片
    await expect(page.locator('[data-testid="totalTenants"]')).toBeVisible();
    await expect(page.locator('[data-testid="healthyTenants"]')).toBeVisible();
    await expect(page.locator('[data-testid="warningTenants"]')).toBeVisible();
    await expect(page.locator('[data-testid="criticalTenants"]')).toBeVisible();
    
    // 4. 验证指标数值有效性
    const totalTenants = await page.locator('[data-testid="totalTenants"]').textContent();
    expect(parseInt(totalTenants || '0')).toBeGreaterThan(0);
    
    // 5. 点击租户监控详情
    await page.click('[data-testid="tenantMonitoringTab"]');
    
    // 6. 验证租户列表和健康状态
    await expect(page.locator('[data-testid="tenantList"]')).toBeVisible();
    
    const tenantRows = page.locator('[data-testid="tenantRow"]');
    const firstTenant = tenantRows.first();
    
    // 7. 验证租户健康分数
    await expect(firstTenant.locator('[data-testid="healthScore"]')).toBeVisible();
    const healthScore = await firstTenant.locator('[data-testid="healthScore"]').textContent();
    expect(parseInt(healthScore || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(healthScore || '0')).toBeLessThanOrEqual(100);
    
    // 8. 验证资源使用情况
    await expect(firstTenant.locator('[data-testid="resourceUsage"]')).toBeVisible();
    await expect(firstTenant.locator('[data-testid="cpuUsage"]')).toBeVisible();
    await expect(firstTenant.locator('[data-testid="memoryUsage"]')).toBeVisible();
    await expect(firstTenant.locator('[data-testid="storageUsage"]')).toBeVisible();
    
    // 9. 查看告警列表
    await page.click('[data-testid="alertsTab"]');
    await expect(page.locator('[data-testid="alertsList"]')).toBeVisible();
    
    // 10. 如果有告警，验证告警详情
    const alertCount = await page.locator('[data-testid="alertItem"]').count();
    if (alertCount > 0) {
      const firstAlert = page.locator('[data-testid="alertItem"]').first();
      await expect(firstAlert.locator('[data-testid="alertSeverity"]')).toBeVisible();
      await expect(firstAlert.locator('[data-testid="alertMessage"]')).toBeVisible();
      await expect(firstAlert.locator('[data-testid="alertTime"]')).toBeVisible();
    }
  });
});
```

## 🔄 页面对象模型

### 基础页面类
```typescript
// pages/BasePage.ts
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForLoading() {
    await this.page.waitForSelector('[data-testid="loadingSpinner"]', {
      state: 'hidden',
      timeout: 5000
    });
  }

  async verifySuccessMessage() {
    await expect(this.page.locator('[data-testid="successMessage"]')).toBeVisible();
    await this.waitForSelectorDisappear('[data-testid="successMessage"]');
  }

  async verifyErrorMessage() {
    await expect(this.page.locator('[data-testid="errorMessage"]')).toBeVisible();
  }

  private async waitForSelectorDisappear(selector: string) {
    await this.page.waitForSelector(selector, { state: 'hidden' });
  }
}
```

### 登录页面
```typescript
// pages/LoginPage.ts
export class LoginPage extends BasePage {
  async goto() {
    await this.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.fill('[data-testid="username"]', username);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="loginButton"]');
    await this.waitForLoading();
  }

  async verifyLoggedIn() {
    await expect(this.page).toHaveURL(/.*dashboard/);
    await expect(this.page.locator('[data-testid="currentUser"]')).toBeVisible();
  }
}
```

### 用户管理页面
```typescript
// pages/UserManagementPage.ts
export class UserManagementPage extends BasePage {
  async goto() {
    await this.goto('/system/users');
  }

  async createUser(userData: UserData) {
    await this.page.click('[data-testid="createUserButton"]');
    
    await this.page.fill('[data-testid="username"]', userData.username);
    await this.page.fill('[data-testid="realName"]', userData.realName);
    await this.page.fill('[data-testid="email"]', userData.email);
    await this.page.fill('[data-testid="phone"]', userData.phone);
    
    if (userData.role) {
      await this.page.selectOption('[data-testid="roleSelect"]', userData.role);
    }
    
    if (userData.department) {
      await this.page.selectOption('[data-testid="departmentSelect"]', userData.department);
    }
    
    await this.page.click('[data-testid="submitButton"]');
    await this.waitForLoading();
  }

  async searchUser(keyword: string) {
    await this.page.fill('[data-testid="searchInput"]', keyword);
    await this.page.click('[data-testid="searchButton"]');
    await this.waitForLoading();
  }

  async editUser(username: string, updates: Partial<UserData>) {
    const userRow = this.findUserRow(username);
    await userRow.locator('[data-testid="editButton"]').click();
    
    if (updates.realName) {
      await this.page.fill('[data-testid="realName"]', updates.realName);
    }
    
    await this.page.click('[data-testid="submitButton"]');
    await this.waitForLoading();
  }

  async deleteUser(username: string) {
    const userRow = this.findUserRow(username);
    await userRow.locator('[data-testid="deleteButton"]').click();
    await this.page.click('[data-testid="confirmDeleteButton"]');
    await this.waitForLoading();
  }

  private findUserRow(username: string) {
    return this.page.locator(`[data-testid="userRow"][data-username="${username}"]`);
  }
}
```

## 📊 测试数据管理

### 测试数据夹具
```typescript
// fixtures/users.ts
import { test as base } from '@playwright/test';

type UserFixtures = {
  adminUser: UserData;
  regularUser: UserData;
  testTenant: TenantData;
};

const test = base.extend<UserFixtures>({
  adminUser: async ({}, use) => {
    const user = {
      username: 'admin',
      password: 'Admin@123',
      email: 'admin@example.com',
      realName: '系统管理员'
    };
    await use(user);
  },
  
  regularUser: async ({}, use) => {
    const user = {
      username: 'testuser',
      password: 'Test@123',
      email: 'testuser@example.com',
      realName: '测试用户'
    };
    await use(user);
  }
});

export { test };
```

### 数据清理工具
```typescript
// utils/data-helpers.ts
export class TestDataCleaner {
  async cleanupTestData() {
    const cleanupEndpoint = '/api/v1/test/cleanup';
    await apiClient.post(cleanupEndpoint);
  }

  async createTestUser(userData: Partial<UserData>): Promise<string> {
    const response = await apiClient.post('/api/v1/test/users', userData);
    return response.data.id;
  }

  async createTestTenant(tenantData: Partial<TenantData>): Promise<string> {
    const response = await apiClient.post('/api/v1/test/tenants', tenantData);
    return response.data.id;
  }
}
```

## ⚙️ Playwright配置

### 配置文件
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // 测试超时配置
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // 失败重试
  retries: process.env.CI ? 2 : 0,
  
  // 并行执行
  workers: process.env.CI ? 2 : 4,
  
  // 报告器
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // 输出目录
  outputDir: 'test-results/',
  
  use: {
    // 基础URL
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    // 追踪（失败时）
    trace: 'retain-on-failure',
    
    // 截图（失败时）
    screenshot: 'only-on-failure',
    
    // 视频
    video: 'retain-on-failure',
    
    // 视口
    viewport: { width: 1920, height: 1080 }
  },
  
  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  
  // 开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## 🚀 CI/CD集成

### GitHub Actions配置
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: pantheon_test
        ports:
          - 3306:3306
          
      redis:
        image: redis:7.0
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps
          
      - name: Install Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
          
      - name: Setup backend
        run: |
          cd backend
          go mod download
          
      - name: Run database migrations
        run: |
          cd backend
          go run cmd/migrate/main.go
        env:
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: pantheon_test
          
      - name: Start backend server
        run: |
          cd backend
          go run cmd/server/main.go &
          echo $! > backend.pid
        env:
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          
      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e
        env:
          BASE_URL: http://localhost:5173
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: frontend/test-results/
          
      - name: Upload HTML report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: html-report
          path: frontend/playwright-report/
```

## 📈 测试执行与报告

### 本地测试执行
```bash
# 安装Playwright浏览器
npm run playwright:install

# 运行所有E2E测试
npm run test:e2e

# 运行特定测试文件
npx playwright test auth/login.spec.ts

# 调试模式
npx playwright test --debug

# 生成HTML报告
npx playwright show-report
```

### 测试报告分析
```typescript
// 生成测试覆盖率报告
const generateCoverageReport = () => {
  const coverageData = {
    totalScenarios: 50,
    passedScenarios: 48,
    failedScenarios: 2,
    skippedScenarios: 0,
    passRate: '96%',
    executionTime: '42分钟'
  };
  
  return coverageData;
};
```

## ✅ 成功标准

### 质量标准
- 所有核心业务流程测试通过
- E2E测试稳定性 ≥ 98%
- 测试覆盖率 ≥ 90%
- 无P0/P1级缺陷

### 性能标准
- E2E测试执行时间 < 45分钟
- 单个测试用例执行时间 < 2分钟
- 页面加载时间 < 3秒

### 维护标准
- 测试代码可读性良好
- 测试数据管理完善
- 失败用例可快速定位

---

**测试负责人**: E2E测试组  
**测试周期**: 每次代码合并前  
**维护周期**: 每两周回顾更新