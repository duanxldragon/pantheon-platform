# 前端 E2E 测试指南

## 目录约定

- `tests/official/`：正式纳入回归与 CI 的 E2E 套件
- `tests/manual/`：手工诊断、问题复现、临时调试脚本
- `tests/e2eCredentials.ts`：统一测试凭据与环境变量读取
- `tests/static-server.cjs`：Playwright 构建后静态服务

默认 `playwright test` 与 `npm run test:e2e` 只会执行 `tests/official/`。
已失效或被替代的试验脚本在确认无引用后直接删除，不再长期维护归档目录。

## 当前正式套件

- `tests/official/system-management-functional.spec.ts`
  - 覆盖租户初始化与系统管理主流程
  - 适合作为系统级功能回归基线
- `tests/official/api-key-security.spec.ts`
  - 覆盖 API Key 的作用域、IP 白名单、速率限制
  - 适合作为认证安全专项回归

## 运行方式

### 正式套件

```bash
cd frontend
npm run test:e2e
```

### 系统管理主回归

```bash
cd frontend
npm run test:e2e:system
```

### API Key 安全专项

```bash
cd frontend
npm run test:e2e:api-key
```

### 手工调试套件

```bash
cd frontend
npm run test:e2e:manual
```

当前保留的手工诊断用例：

- `tests/manual/debug-test.spec.ts`：排查登录页加载与基础 DOM
- `tests/manual/detailed-login-test.spec.ts`：排查登录请求、控制台与错误提示
- `tests/manual/platform-admin-fix.spec.ts`：排查平台管理员是否误入租户初始化

如需只跑某个调试脚本：

```bash
cd frontend
npx playwright test --config=playwright.manual.config.ts tests/manual/<file>.spec.ts --project=chromium
```

## 前置条件

### 本地联调

1. 启动后端

```bash
cd backend
go run ./cmd/server
```

2. 启动前端开发环境，或让 Playwright 自动构建静态站点

```bash
cd frontend
npm run dev
```

3. 按需设置测试凭据

```powershell
$env:E2E_ADMIN_PASSWORD = "<admin-password>"
$env:E2E_MYSQL_PASSWORD = "<mysql-password>"
$env:E2E_MYSQL_HOST = "127.0.0.1"
$env:E2E_MYSQL_PORT = "3306"
$env:E2E_MYSQL_USER = "root"
```

4. 首次使用安装 Playwright 浏览器

```bash
cd frontend
npx playwright install
```

## 辅助脚本

### Windows

```powershell
.\frontend\tests\run-smoke-test.ps1
```

### Linux / macOS / Git Bash

```bash
bash frontend/tests/run-smoke-test.sh
```

### 全链路重置式系统回归

```powershell
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\frontend\tests\run-full-system-smoke.ps1
```

## 报告与产物

- Playwright 报告：`frontend/playwright-report/`
- 失败截图与追踪：`frontend/test-results/`
- 全链路回归日志：`.tmp-dev/`

## CI 对应关系

- 默认前端 CI：`frontend-ci.yml`
  - 负责 `lint`、`type-check`、`vitest`、`build`
- 系统主流程专项：`.github/workflows/frontend-e2e-system.yml`
  - 只跑 `tests/official/system-management-functional.spec.ts`
  - 使用 MySQL 服务完成租户初始化与系统管理主回归
- API Key 安全专项：`.github/workflows/frontend-e2e-api-key.yml`
  - 只跑 `tests/official/api-key-security.spec.ts`
  - 会上传 Playwright 报告与后端日志

## 维护规则

- 新增正式 E2E 用例时，优先放入 `tests/official/`
- 临时排障脚本只放入 `tests/manual/`，不要直接进入默认回归
- 已失效或被替代的试验脚本在确认无引用后直接删除
- 变更正式套件路径时，同步更新 `package.json`、CI workflow、运行脚本与专题文档
