# 租户模块前端实现

## 定位

本文件只说明租户模块在前端的状态流转、初始化向导和应用入口联动，不重复平台级业务设计。

- 业务边界：看 `docs/tenant/TENANT_INITIALIZATION.md`
- 会话联动：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 系统管理初始化：看 `docs/system/SYSTEM_MANAGEMENT.md`

---

## 核心代码入口

### 初始化向导

- 向导容器：`frontend/src/modules/tenant/components/TenantSetupWizard.tsx`
- 欢迎步骤：`frontend/src/modules/tenant/components/WelcomeStep.tsx`
- 数据库类型步骤：`frontend/src/modules/tenant/components/DatabaseTypeStep.tsx`
- 连接配置步骤：`frontend/src/modules/tenant/components/ConnectionConfigStep.tsx`
- 连接测试步骤：`frontend/src/modules/tenant/components/TestConnectionStep.tsx`
- 完成步骤：`frontend/src/modules/tenant/components/CompleteStep.tsx`

### 状态与 API

- 租户 API：`frontend/src/modules/tenant/api/tenantDatabaseApi.ts`
- 认证状态联动：`frontend/src/modules/auth/store/authStore.ts`
- 应用入口：`frontend/src/App.tsx`
- 顶部租户切换：`frontend/src/components/TenantSwitcher.tsx`

---

## 前端状态入口

租户前端没有单独再造一套“登录态”，而是复用 `authStore` 中的租户相关字段：

- `isFirstLogin`
- `tenantSetupRequired`
- `tenantInfo`
- `completeTenantSetup()`
- `setTenantInfo()`
- `checkTenantStatus()`

这样做的好处是：登录、2FA、租户初始化、正式进入系统都收敛在同一条应用入口链路上。

---

## 登录后的租户判定

`authStore.checkTenantStatus()` 是租户前端最关键的入口。

它会根据当前登录用户状态执行：

1. 若未启用多租户，直接视为已就绪；
2. 若没有 `tenantCode`，直接返回兜底结果；
3. 调用 `tenantDatabaseApi.getStatus()` 读取租户状态；
4. 根据返回结果写入 `isFirstLogin` 与 `tenantSetupRequired`；
5. 若数据库已配置，再调用 `getCurrentTenant()` 补齐 `tenantInfo`。

这一步把“登录成功”和“租户已可进入业务”明确区分开了。

---

## 初始化向导如何落地

### 1. 向导步骤

`TenantSetupWizard.tsx` 当前采用五步式向导：

1. `welcome`
2. `database-type`
3. `connection-config`
4. `test-connection`
5. `complete`

页面内维护：

- 当前步骤；
- 数据库连接配置；
- 测试结果；
- 提交状态；
- 已完成配置的租户 ID。

### 2. 配置校验

向导会根据数据库类型做差异化校验：

- `sqlite` 只要求文件路径；
- 其他数据库要求 `host / port / database / username / password`。

### 3. 测试与提交

在 `test-connection` 步骤中：

- 先通过 `tenantApi.testConnection()` 验证连接；
- 通过后再调用 `tenantApi.setupDatabase()` 正式提交初始化；
- 成功后记录 `configuredTenantId` 并进入完成页。

### 4. 完成收口

点击完成后会：

- 调用 `completeTenantSetup()` 清理首次初始化状态；
- 再调用 `tenantApi.getCurrentTenant()`；
- 通过 `setTenantInfo()` 回填当前租户摘要；
- 提示“租户数据库初始化完成”。

---

## 应用入口联动

`App.tsx` 负责在三个界面之间切换：

- 未登录：登录页；
- 已登录但租户未初始化：`TenantSetupWizard`；
- 已登录且租户已初始化：正式业务主界面。

因此租户初始化不是孤立页面，而是应用启动流程中的一个分支节点。

---

## 与认证和系统模块的联动

### 与认证模块的联动

- 登录成功后立即检查租户状态；
- 2FA 成功后也会重复执行租户检查；
- refresh 成功后，认证与系统状态会一起重建。

### 与系统模块的联动

当 `tenantSetupRequired=false` 时，应用才继续进入：

- 用户权限初始化；
- 菜单树构建；
- `SidebarNew` 渲染；
- `ViewManager` 动态页面挂载。

所以租户前端的职责不是渲染很多业务页面，而是保证平台在正确的租户上下文里启动。

---

## 多租户体验入口

`TenantSwitcher.tsx` 已作为前端体验层入口之一，用于展示和切换当前租户上下文，也会展示当前租户是否还需要完成初始化。

这部分是后续扩展 PaaS / SaaS 多租户体验时的重要前端锚点。

---

## 阅读建议

1. 先读 `docs/tenant/TENANT_INITIALIZATION.md`
2. 再读 `docs/auth/AUTH_SECURITY.md` 与 `docs/auth/AUTH_SESSION_STRATEGY.md`
3. 最后结合本文件进入 `frontend/src/modules/tenant/`、`frontend/src/modules/auth/store/authStore.ts` 与 `frontend/src/App.tsx`
