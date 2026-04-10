# 系统管理模块冒烟测试指南

## 测试概述

这是一个全面的系统管理模块冒烟测试，覆盖以下功能：
- ✅ 用户登录和退出
- ✅ 中文国际化测试
- ✅ 中文乱码检查
- ✅ 所有系统管理模块的功能测试
- ✅ CRUD 操作验证
- ✅ 多语言切换测试
- ✅ API 连通性测试

## 系统管理模块列表

1. 用户管理 (User Management)
2. 角色管理 (Role Management)
3. 菜单管理 (Menu Management)
4. 权限管理 (Permission Management)
5. 部门管理 (Department Management)
6. 岗位管理 (Position Management)
7. 数据字典 (Data Dictionary)
8. 日志管理 (Log Management)
9. 系统设置 (System Settings)
10. 系统监控 (System Monitor)

## 配置说明

不要把真实数据库密码、JWT 密钥、默认管理员密码直接写进文档或仓库。

建议通过环境变量为冒烟测试注入凭据：

```powershell
$env:E2E_ADMIN_PASSWORD = "<admin-password>"
$env:E2E_MYSQL_PASSWORD = "<mysql-password>"
$env:E2E_MYSQL_HOST = "127.0.0.1"
$env:E2E_MYSQL_PORT = "3306"
$env:E2E_MYSQL_USER = "root"
```

如需指定 MySQL 客户端路径，可额外设置：

```powershell
$env:MYSQL_BIN = "C:\\path\\to\\mysql.exe"
```

## 前置条件

### 1. 启动后端服务
```bash
cd backend
go run ./cmd/server
```

### 2. 启动前端服务
```bash
cd frontend
npm run dev
```

### 3. 配置测试环境变量
```powershell
$env:E2E_ADMIN_PASSWORD = "<admin-password>"
$env:E2E_MYSQL_PASSWORD = "<mysql-password>"
```

### 4. 确保 Playwright 已安装
```bash
cd frontend
npx playwright install
```

## 运行测试

### Windows PowerShell
```powershell
# 在项目根目录运行
.\frontend\tests\run-smoke-test.ps1
```

### Git Bash / Linux / macOS
```bash
# 在项目根目录运行
bash frontend/tests/run-smoke-test.sh
```

### 手动运行
```bash
cd frontend
npx playwright test tests/system-management-functional.spec.ts --project=chromium
```

## 测试结果

测试运行后，将生成以下文件：

1. **截图**：`frontend/test-results/smoke/`
   - 登录页面截图
   - 各模块页面截图
   - CRUD 操作截图
   - 多语言切换截图

2. **测试报告**：`frontend/playwright-report/`
   - 详细的测试执行报告
   - 失败用例的错误信息

3. **日志**：控制台输出

## 测试检查项

### 1. 登录/退出测试
- ✓ 登录表单填写
- ✓ 登录按钮点击
- ✓ 登录后跳转验证
- ✓ 退出功能验证

### 2. 中文国际化测试
- ✓ 检查页面中文字符显示
- ✓ 验证中文文本无乱码
- ✓ 检查常见中文 UI 元素

### 3. 系统模块测试
对每个模块进行验证：
- ✓ 页面正常加载
- ✓ 表格/列表显示
- ✓ 按钮可用性
- ✓ 中英文文本正确显示

### 4. CRUD 操作测试
- ✓ 新建按钮存在
- ✓ 表单对话框打开
- ✓ 表单字段显示

### 5. 多语言切换测试
- ✓ 语言切换器存在
- ✓ 切换到英文
- ✓ 切换回中文

### 6. API 连通性测试
- ✓ API 请求正常发出
- ✓ 端点响应正常

## 故障排除

### 问题 1：后端连接失败
**错误**：`Backend is not running`
**解决**：
```bash
cd backend
go run ./cmd/server
```

### 问题 2：前端连接失败
**错误**：`Frontend is not running`
**解决**：
```bash
cd frontend
npm run dev
```

### 问题 3：登录失败
**错误**：`Login failed or took too long`
**解决**：
1. 检查后端日志
2. 验证数据库连接
3. 确认已设置 `E2E_ADMIN_PASSWORD`

### 问题 4：中文乱码
**错误**：中文显示为方框或问号
**解决**：
1. 检查数据库字符集是否为 UTF-8
2. 检查前端字符编码设置
3. 验证 i18n 翻译文件编码

### 问题 5：模块加载失败
**错误**：某些模块无法访问
**解决**：
1. 检查路由配置
2. 验证 API 端点
3. 查看浏览器控制台错误

## 自动化测试命令

### 运行所有测试
```bash
cd frontend
npx playwright test
```

### 运行特定测试
```bash
cd frontend
npx playwright test tests/system-management-functional.spec.ts --project=chromium
```

### 调试模式（打开浏览器）
```bash
cd frontend
npx playwright test tests/system-management-functional.spec.ts --project=chromium --headed
```

### 查看测试报告
```bash
cd frontend
npx playwright show-report
```

## 持续集成

在 CI/CD 流水线中运行测试：

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Go
        uses: actions/setup-go@v2
        with:
          go-version: '1.21'
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend && go mod download
          cd frontend && npm install
      - name: Install Playwright
        run: cd frontend && npx playwright install --with-deps
      - name: Run smoke test
        run: bash frontend/tests/run-smoke-test.sh
```

## 测试覆盖率

当前测试覆盖：
- ✅ 用户认证（登录、退出）
- ✅ 国际化（中英文）
- ✅ 系统管理所有模块
- ✅ 基本 UI 组件
- ⚠️ 高级 CRUD 操作（部分覆盖）
- ⚠️ 表单验证（需要增强）
- ⚠️ 权限控制（需要增强）

## 下一步计划

1. 增加更多边界情况测试
2. 添加表单验证测试
3. 增加权限控制测试
4. 添加性能测试
5. 增加移动端响应式测试

## 贡献指南

如需添加新的测试用例，请参考 `system-management-functional.spec.ts` 的结构，并确保：
1. 使用清晰的测试描述
2. 添加适当的断言
3. 生成截图用于调试
4. 记录测试结果
