# Pantheon Platform 测试策略

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-07
- **适用范围**: 全栈应用测试
- **测试团队**: 全栈开发团队
- **文档状态**: 正式发布

## 🎯 测试目标

### 总体目标
建立完善的测试体系，确保Pantheon Platform的质量、稳定性和可靠性，达到企业级应用标准。

### 质量目标
- **代码覆盖率**: ≥ 80% (单元测试)
- **功能覆盖率**: 100% (核心功能)
- **缺陷检出率**: ≥ 95% (上线前)
- **回归测试通过率**: 100% (每次发布)
- **性能达标率**: 100% (性能指标)
- **安全合规率**: 100% (安全检查)

## 🏗️ 测试架构

### 测试金字塔

```
        /\
       /  \        E2E Tests (10%)
      /____\       - 关键业务流程
     /      \      - 用户场景验证
    /________\     
   /          \    Integration Tests (30%)
  /            \   - API集成测试
 /              \  - 数据库集成
/________________\ - 第三方服务集成

   Unit Tests (60%)
   - 单元测试
   - 函数级测试
   - 组件级测试
```

### 测试分层策略

#### 1. 单元测试 (60%)
**目标**: 确保代码最小单元的正确性
**覆盖范围**:
- 工具函数和辅助类
- 数据模型和验证器
- 业务逻辑组件
- 独立的服务方法

**技术栈**:
- **后端**: Go testing, testify
- **前端**: Jest, React Testing Library
- **覆盖率**: istanbul (Go), jest --coverage (React)

#### 2. 集成测试 (30%)
**目标**: 验证模块间的正确集成
**覆盖范围**:
- API接口测试
- 数据库集成测试
- 第三方服务集成
- 状态管理测试

**技术栈**:
- **后端**: Go testing + testcontainers
- **前端**: MSW (Mock Service Worker)
- **数据库**: SQLite内存数据库
- **API**: Supertest, axios-mock-adapter

#### 3. 端到端测试 (10%)
**目标**: 验证关键用户流程
**覆盖范围**:
- 用户登录流程
- 租户管理流程
- 权限分配流程
- 数据导出流程

**技术栈**:
- **前端**: Playwright
- **后端**: 集成测试环境
- **CI/CD**: GitHub Actions集成

## 📝 测试类型

### 1. 功能测试

#### 用户认证测试
```gherkin
Feature: 用户认证
  作为系统用户
  我想要安全地登录系统
  以便访问我的工作空间

  Scenario: 用户名密码登录成功
    Given 用户访问登录页面
    And 输入有效的用户名和密码
    When 点击登录按钮
    Then 应该跳转到工作台页面
    And 显示用户信息

  Scenario: 密码错误登录失败
    Given 用户访问登录页面
    And 输入有效的用户名和错误的密码
    When 点击登录按钮
    Then 应该显示错误提示
    And 保持在登录页面

  Scenario: 密码强度验证
    Given 用户在注册页面
    When 输入弱密码 "123456"
    Then 应该显示密码强度提示
    And 提示密码不符合要求
```

#### 多租户测试
```gherkin
Feature: 多租户管理
  作为SaaS提供商
  我想要管理多个租户
  以便为不同客户提供隔离的服务

  Scenario: 创建新租户
    Given 管理员登录系统
    When 创建新租户 "ACME公司"
    Then 租户应该创建成功
    And 租户获得独立的数据库
    And 租户获得默认的管理员账户

  Scenario: 租户数据隔离验证
    Given 租户A的用户登录系统
    And 创建了私有数据
    When 租户B的用户登录系统
    Then 不能访问租户A的数据
    And 只能看到自己的数据
```

#### 权限控制测试
```gherkin
Feature: 权限控制
  作为系统管理员
  我想要控制用户的访问权限
  以便保护系统安全

  Scenario: 角色权限验证
    Given 用户具有 "普通用户" 角色
    When 访问管理员功能
    Then 应该拒绝访问
    And 显示权限不足提示

  Scenario: 权限动态变更
    Given 用户具有 "编辑" 权限
    When 管理员撤销了 "编辑" 权限
    Then 用户不能进行编辑操作
    And 编辑按钮应该隐藏
```

### 2. 性能测试

#### 接口性能测试
```yaml
# performance_test_config.yaml
api_performance_tests:
  - endpoint: "/api/v1/auth/login"
    method: POST
    concurrent_users: 100
    duration: 60s
    success_rate: ≥ 99%
    avg_response_time: ≤ 500ms
    p95_response_time: ≤ 1000ms
    p99_response_time: ≤ 2000ms

  - endpoint: "/api/v1/system/users"
    method: GET
    concurrent_users: 50
    duration: 30s
    success_rate: ≥ 99%
    avg_response_time: ≤ 300ms
    p95_response_time: ≤ 800ms
```

#### 数据库性能测试
```go
func BenchmarkUserListQuery(b *testing.B) {
    // Setup test database
    db := setupTestDB()
    defer cleanupTestDB(db)

    // Insert test data
    insertTestUsers(db, 1000)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        var users []User
        db.Where("status = ?", "active").Find(&users)
    }
}
```

#### 并发压力测试
```yaml
load_tests:
  scenarios:
    - name: "用户登录压力测试"
      steps:
        - ramp_up: 10 users/s
        - hold: 100 users for 60s
        - ramp_down: 10 users/s
      targets:
        - error_rate: < 1%
        - avg_response_time: < 1000ms

    - name: "租户并发访问测试"
      steps:
        - 10 tenants, 50 users each
        - duration: 300s
      targets:
        - tenant_isolation: 100%
        - data_consistency: 100%
```

### 3. 安全测试

#### 认证安全测试
```yaml
security_tests:
  authentication:
    - test: "SQL注入攻击防护"
      payload: "' OR '1'='1"
      expected: "登录失败"

    - test: "暴力破解防护"
      attempts: 5
      expected: "账户锁定"

    - test: "会话劫持防护"
      scenario: "修改session token"
      expected: "访问拒绝"

    - test: "CSRF防护"
      scenario: "跨站请求伪造"
      expected: "请求被拒绝"
```

#### 权限安全测试
```yaml
authorization_tests:
  - test: "水平越权防护"
    scenario: "用户A访问用户B的数据"
    expected: "访问拒绝"

  - test: "垂直越权防护"
    scenario: "普通用户访问管理员功能"
    expected: "访问拒绝"

  - test: "API权限验证"
    scenario: "无token访问受保护API"
    expected: "401 Unauthorized"
```

#### 数据安全测试
```yaml
data_security_tests:
  - test: "租户数据隔离"
    scenario: "租户A访问租户B数据"
    expected: "数据不可见"

  - test: "敏感数据加密"
    data: ["password", "id_card", "phone"]
    expected: "加密存储"

  - test: "数据备份安全"
    scenario: "备份数据访问"
    expected: "需要授权"
```

### 4. 兼容性测试

#### 浏览器兼容性测试
```yaml
browser_tests:
  browsers:
    - name: "Chrome"
      versions: ["latest", "latest-1"]
      priority: "high"

    - name: "Firefox"
      versions: ["latest", "latest-1"]
      priority: "high"

    - name: "Safari"
      versions: ["latest"]
      priority: "medium"

    - name: "Edge"
      versions: ["latest"]
      priority: "medium"

  test_scenarios:
    - "用户登录"
    - "数据表格操作"
    - "表单提交"
    - "文件上传下载"
```

#### 移动端兼容性测试
```yaml
mobile_tests:
  devices:
    - iPhone 13 Pro (iOS 15+)
    - Samsung Galaxy S21 (Android 12+)
    - iPad Pro (iOS 15+)

  test_scenarios:
    - "触摸操作响应"
    - "屏幕适配"
    - "横竖屏切换"
    - "手势操作"
```

### 5. 国际化测试

```yaml
i18n_tests:
  languages:
    - "zh-CN" # 简体中文
    - "en-US" # 英语
    - "ja-JP" # 日语
    - "ko-KR" # 韩语
    - "fr-FR" # 法语

  test_areas:
    - "界面文本翻译"
    - "日期时间格式"
    - "数字货币格式"
    - "文本方向(LTR/RTL)"
    - "字符编码"
```

## 🛠️ 测试工具和框架

### 后端测试工具

#### 单元测试框架
```go
// 推荐工具
import (
    "testing"              // Go标准测试框架
    "github.com/stretchr/testify"  // 断言和模拟
    "github.com/golang/mock"       // Mock生成
)

// 示例测试
func TestPasswordValidator(t *testing.T) {
    validator := security.DefaultPasswordPolicy()

    tests := []struct {
        name     string
        password string
        wantValid bool
    }{
        {"弱密码", "123456", false},
        {"强密码", "SecureP@ss2026", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := security.ValidatePassword(tt.password, validator)
            if result.Valid != tt.wantValid {
                t.Errorf("验证结果不正确")
            }
        })
    }
}
```

#### 集成测试工具
```go
// 使用testcontainers进行真实环境测试
import (
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/wait"
)

func TestDatabaseIntegration(t *testing.T) {
    // 启动MySQL容器
    ctx := context.Background()
    mysqlContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
        ContainerRequest: testcontainers.ContainerRequest{
            Image:        "mysql:8.0",
            ExposedPorts: []string{"3306/tcp"},
            Env: map[string]string{
                "MYSQL_ROOT_PASSWORD": "test",
                "MYSQL_DATABASE":      "test_db",
            },
            WaitingFor: wait.ForLog("ready for connections"),
        },
        Started: true,
    })
    require.NoError(t, err)
    defer mysqlContainer.Terminate(ctx)

    // 执行集成测试
    db := setupTestDB(mysqlContainer)
    userService := NewUserService(db)

    user, err := userService.CreateUser(ctx, &User{
        Username: "testuser",
        Password: "password123",
    })

    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)
}
```

### 前端测试工具

#### 组件测试
```typescript
// React组件测试
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

describe('Login Component', () => {
    const mockLogin = jest.fn();

    beforeEach(() => {
        mockLogin.mockClear();
    });

    test('renders login form', () => {
        render(
            <BrowserRouter>
                <Login onLogin={mockLogin} />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('shows validation error for empty fields', async () => {
        render(<Login onLogin={mockLogin} />);

        const submitButton = screen.getByRole('button', { name: /login/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/请输入用户名/i)).toBeInTheDocument();
        });
    });

    test('calls login function with correct credentials', async () => {
        const mockUser = { username: 'testuser', password: 'password123' };
        mockLogin.mockResolvedValueOnce({ token: 'fake-token' });

        render(<Login onLogin={mockLogin} />);

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: mockUser.username }
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: mockUser.password }
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith(mockUser);
        });
    });
});
```

#### E2E测试
```typescript
// Playwright E2E测试
import { test, expect } from '@playwright/test';

test.describe('用户登录流程', () => {
    test('成功登录', async ({ page }) => {
        await page.goto('/login');

        // 填写登录表单
        await page.fill('[name="username"]', 'testuser');
        await page.fill('[name="password"]', 'password123');

        // 点击登录按钮
        await page.click('button[type="submit"]');

        // 验证跳转到工作台
        await expect(page).toHaveURL('/workspace');
        await expect(page.locator('text=欢迎, testuser')).toBeVisible();
    });

    test('登录失败显示错误信息', async ({ page }) => {
        await page.goto('/login');

        await page.fill('[name="username"]', 'wronguser');
        await page.fill('[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // 验证错误信息
        await expect(page.locator('.error-message')).toBeVisible();
        await expect(page.locator('.error-message')).toContainText('用户名或密码错误');
    });
});
```

### 性能测试工具

```yaml
# k6 性能测试配置
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },   // 1分钟爬升到50用户
    { duration: '3m', target: 50 },   // 维持50用户3分钟
    { duration: '1m', target: 100 },  // 1分钟爬升到100用户
    { duration: '3m', target: 100 },  // 维持100用户3分钟
    { duration: '1m', target: 0 },    // 1分钟降到0用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%的请求响应时间<500ms
    http_req_failed: ['rate<0.01'],    // 错误率<1%
  },
};

export default function () {
  // 登录测试
  let loginRes = http.post('http://localhost:8080/api/v1/auth/login', JSON.stringify({
    username: 'testuser',
    password: 'password123',
  }));

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'received token': (r) => r.json('token') !== '',
  });

  // API调用测试
  let apiRes = http.get('http://localhost:8080/api/v1/system/users', {
    headers: { 'Authorization': `Bearer ${loginRes.json('token')}` },
  });

  check(apiRes, {
    'API status 200': (r) => r.status === 200,
    'API response time <500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

## 🔄 CI/CD集成

### GitHub Actions配置

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
    - uses: actions/checkout@v3

    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: '1.21'

    - name: Install dependencies
      working-directory: ./backend
      run: go mod download

    - name: Run unit tests
      working-directory: ./backend
      run: go test -v -race -coverprofile=coverage.out ./...

    - name: Run integration tests
      working-directory: ./backend
      run: go test -v -tags=integration ./...

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage.out

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Run unit tests
      working-directory: ./frontend
      run: npm test -- --coverage --watchAll=false

    - name: Run E2E tests
      working-directory: ./frontend
      run: npm run test:e2e

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./frontend/coverage/coverage-final.json

  security-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Run security scan
      run: |
        npm install -g snyk
        snyk test

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Run performance tests
      run: |
        npm install -g k6
        k6 run performance-tests/load-test.js
```

## 📊 测试报告

### 测试报告模板

```markdown
# 测试执行报告

## 测试概要
- 测试周期: 2026-04-01 ~ 2026-04-07
- 测试版本: v1.2.0
- 测试人员: 全栈开发团队
- 测试环境: Staging

## 测试结果统计
| 测试类型 | 用例数 | 通过 | 失败 | 阻塞 | 通过率 |
|---------|-------|------|------|------|--------|
| 单元测试 | 1,245 | 1,238 | 7 | 0 | 99.4% |
| 集成测试 | 356 | 345 | 11 | 0 | 96.9% |
| E2E测试 | 45 | 42 | 3 | 0 | 93.3% |
| 性能测试 | 28 | 28 | 0 | 0 | 100% |
| 安全测试 | 67 | 65 | 2 | 0 | 97.0% |
| **总计** | **1,741** | **1,718** | **23** | **0** | **98.7%** |

## 缺陷分析
### 严重程度分布
- Critical: 2个
- High: 5个
- Medium: 12个
- Low: 4个

### 模块分布
- 认证模块: 6个缺陷
- 租户管理: 4个缺陷
- 权限管理: 5个缺陷
- 系统监控: 3个缺陷
- 其他模块: 5个缺陷

## 风险评估
- 技术风险: 中等
- 进度风险: 低
- 质量风险: 低

## 建议
1. 优先修复Critical和High级别缺陷
2. 加强认证模块的测试覆盖
3. 增加边界条件测试用例
```

## 🎯 测试最佳实践

### 1. 测试驱动开发 (TDD)
```go
// 先写测试
func TestUserCreation(t *testing.T) {
    service := NewUserService(db)

    user, err := service.CreateUser(context.Background(), &User{
        Username: "testuser",
        Email:    "test@example.com",
    })

    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)
    assert.Equal(t, "testuser", user.Username)
}

// 再实现功能
func (s *userService) CreateUser(ctx context.Context, user *User) (*User, error) {
    // 实现创建用户逻辑
}
```

### 2. 测试数据管理
```go
// 使用测试数据工厂
func createTestUser(overrides ...func(*User)) *User {
    user := &User{
        Username: "testuser",
        Email:    "test@example.com",
        Status:   "active",
    }

    for _, override := range overrides {
        override(user)
    }

    return user
}

// 使用示例
user := createTestUser(func(u *User) {
    u.Username = "customuser"
    u.Status = "inactive"
})
```

### 3. 测试隔离
```go
func TestWithSetup(t *testing.T) {
    // Setup
    db := setupTestDB()
    defer cleanupTestDB(db)

    // Test
    userService := NewUserService(db)
    user, _ := userService.CreateUser(context.Background(), createTestUser())

    // Assert
    assert.NotEmpty(t, user.ID)
}
```

### 4. Mock和Stub
```go
func TestWithMock(t *testing.T) {
    mockDB := new(MockDatabase)
    mockDB.On("Create", mock.Anything).Return(nil)

    service := NewUserService(mockDB)
    user, _ := service.CreateUser(context.Background(), &User{})

    mockDB.AssertExpectations(t)
}
```

## 📈 持续改进

### 测试指标监控
- 代码覆盖率趋势
- 缺陷密度趋势
- 测试执行时间趋势
- 自动化测试比例

### 定期回顾
- 每月测试策略回顾
- 每季度测试流程优化
- 每半年测试工具升级

---

**文档维护**: 本测试策略将根据项目发展持续更新，确保测试体系的有效性和适用性。