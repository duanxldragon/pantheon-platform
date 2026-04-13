# Pantheon Platform 测试策略

> 本文定义 Pantheon Platform 当前的标准测试体系。
> 目标是让“开发完成”不只等于代码可跑，而是能从白盒、集成、E2E 到发布验收形成闭环。
> 本文以当前仓库代码、脚本和已有自动化资产为基线。

## 1. 测试目标

测试体系要覆盖三件事：

- **正确性**：功能按设计工作；
- **安全性**：认证、授权、租户隔离不被破坏；
- **可演进性**：改动后能够低成本回归。

## 2. 测试分层

### 2.1 L0：静态与构建检查

用于尽早发现低成本问题：

- 前端：`type-check`、`lint`、`build`
- 后端：命名检查、编译、`go test` 基础回归

### 2.2 L1：白盒测试

白盒测试不是只测 API 成功返回，而是基于实现边界验证：

- service 分支；
- 中间件决策；
- 权限/数据范围；
- 租户隔离；
- 会话版本与强制失效；
- 批量操作事务；
- 异步任务重试与失败语义。

详见：`docs/testing/WHITE_BOX_TEST_GUIDE.md`

### 2.3 L2：集成测试

用于验证模块间协作：

- API 与中间件；
- 数据库与 Redis；
- 模块装配；
- 租户初始化；
- 通知模板、任务、收件箱；
- 鉴权和会话刷新链路。

### 2.4 L3：E2E 测试

用于从最终用户角度验证关键业务旅程：

- 登录 / 退出；
- 租户初始化；
- 系统管理主流程；
- 会话与 API Key；
- 权限/菜单变更后的前端刷新；
- 关键运营动作与页面承接。

详见：`docs/testing/E2E_TEST_PLAN.md`

### 2.5 L4：专项测试

按需执行：

- 安全测试：`docs/testing/SECURITY_TEST_PLAN.md`
- 性能测试：`docs/testing/PERFORMANCE_TEST_PLAN.md`
- 兼容性与编码检查；
- 发布前回归。

## 3. 当前仓库的真实测试资产

### 3.1 后端

当前已存在较多白盒/模块测试，重点分布在：

- `backend/internal/modules/auth/`
- `backend/internal/modules/system/user/`
- `backend/internal/modules/system/role/`
- `backend/internal/modules/system/menu/`
- `backend/internal/modules/system/permission/`
- `backend/internal/modules/system/dept/`
- `backend/internal/modules/system/position/`
- `backend/internal/modules/system/dict/`
- `backend/internal/modules/system/log/`
- `backend/internal/modules/system/setting/`
- `backend/internal/modules/tenant/`
- `backend/internal/modules/notification/`
- `backend/internal/shared/authorization/`
- `backend/internal/shared/middleware/`

### 3.2 前端

当前已有的自动化入口已经分层：

- 正式 E2E：`frontend/tests/official/`
- 手工调试：`frontend/tests/manual/`

当前正式 E2E 基线包括：

- `frontend/tests/official/system-management-functional.spec.ts`
- `frontend/tests/official/api-key-security.spec.ts`

当前 CI 对应关系：

- `.github/workflows/frontend-e2e-system.yml`：系统主流程 E2E
- `.github/workflows/frontend-e2e-api-key.yml`：API Key 安全专项 E2E

前端白盒测试已经落地到 `Vitest`，当前基线包括：

- `frontend/src/stores/ui_store.test.ts`
- `frontend/src/shared/components/access_control_utils.test.ts`
- `frontend/src/shared/components/view_manager_utils.test.ts`
- `frontend/src/modules/auth/utils/permission_matcher.test.ts`

因此当前策略不是“以后再补前端白盒”，而是：

- store / hook / util / 权限判定优先补 `Vitest`
- 用户主旅程与跨链路回归优先补 `Playwright`

## 4. 变更触发矩阵

### 4.1 认证相关改动

至少执行：

- 后端白盒；
- 登录/刷新/退出回归；
- 会话失效或 `auth_version` 链路验证；
- 涉及前端时补登录相关 E2E。

### 4.2 租户相关改动

至少执行：

- 初始化/状态检查/连接配置验证；
- 租户生命周期联动；
- 涉及数据库时验证迁移器与连接管理；
- 涉及前端时补租户初始化或租户管理 E2E。

### 4.3 系统管理相关改动

至少执行：

- 对应子模块白盒；
- 权限/菜单/数据范围联动验证；
- 系统管理页面主流程回归；
- 必要时补批量、导入导出或异常态场景。

### 4.4 前端壳层相关改动

至少执行：

- 路由守卫；
- `authStore / systemStore / uiStore` 协作；
- 菜单、标签页、动态视图；
- `Vitest` 白盒；
- 构建与正式 E2E。

## 5. 测试完成定义

一次改动在“测试通过”前，至少满足：

- 与改动相称的 L0 检查已通过；
- 关键分支已被白盒或集成覆盖；
- 主用户链路已做冒烟或 E2E；
- 未覆盖部分有明确说明；
- 没有未评估的租户隔离或认证风险。

## 6. 常用命令

### 前端

```bash
cd frontend
npm run type-check
npm run lint
npm run test
npm run build
npm run test:e2e
npm run test:e2e:system
npm run test:e2e:api-key
```

### 后端

```bash
cd backend
make naming
make test
make verify
make migrate-only
```

## 7. 建议执行顺序

1. 先跑最小范围白盒；
2. 再跑模块级回归；
3. 再跑前端构建或模块 E2E；
4. 发布前做跨链路回归。

## 8. 测试文档地图

- 白盒测试：`docs/testing/WHITE_BOX_TEST_GUIDE.md`
- E2E 计划：`docs/testing/E2E_TEST_PLAN.md`
- 集成测试：`docs/testing/INTEGRATION_TEST_PLAN.md`
- 安全测试：`docs/testing/SECURITY_TEST_PLAN.md`
- 性能测试：`docs/testing/PERFORMANCE_TEST_PLAN.md`
