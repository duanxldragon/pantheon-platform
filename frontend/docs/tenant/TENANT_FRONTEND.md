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

- 租户 API：`frontend/src/modules/tenant/api/tenant_database_api.ts`
- 认证状态联动：`frontend/src/modules/auth/store/auth_store.ts`
- 应用入口：`frontend/src/App.tsx`
- 顶部租户切换：`frontend/src/components/TenantSwitcher.tsx`

### 租户管理页

- 租户管理页面：`frontend/src/modules/tenant/views/tenant_management/index.tsx`
- 租户管理组件：`frontend/src/modules/tenant/views/tenant_management/components/`
- 租户管理状态 Hook：`frontend/src/modules/tenant/views/tenant_management/hooks/use_tenant_logic.ts`
- 路由入口：`/system/tenant-management`

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

默认示例命名建议：

- 主库：`pantheon_master`
- 监控库：`pantheon_monitor`
- 租户库：`pantheon_tenant_<tenant_code>`
- SQLite 示例文件：`/data/pantheon_tenant_<tenant_code>.db`

更完整的命名基线见 `docs/tenant/DATABASE_NAMING_STRATEGY.md`。

推荐交互方式：

- 先生成稳定的 `tenant_code`
- 再基于 `tenant_code` 自动给出推荐数据库名
- 租户管理弹窗在名称输入阶段自动建议编码，初始化向导继续复用该编码推荐库名
- 数据库名允许人工覆盖，但默认建议保持平台规则

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
- `ViewRenderer` 动态页面挂载。

所以租户前端的职责不是渲染很多业务页面，而是保证平台在正确的租户上下文里启动。

---

## 多租户体验入口

`TenantSwitcher.tsx` 已作为前端体验层入口之一，用于展示和切换当前租户上下文，也会展示当前租户是否还需要完成初始化。

当前在打开租户状态面板或手动刷新时，前端会优先走 `refreshTenantContext()`，而不是只做轻量状态探测。这样可以同时刷新：

- 当前用户与权限；
- `tenantInfo` 摘要；
- 系统管理初始化快照。

`TenantSwitcher.tsx` 当前把“打开面板时的自动刷新”和“手动点击刷新”统一收敛到同一个刷新入口，避免两套重复逻辑出现不同的 loading / 错误提示表现。

这部分是后续扩展 PaaS / SaaS 多租户体验时的重要前端锚点。

---

## 租户管理页联动

租户管理页属于系统管理工作台下的租户运营入口，不替代首次登录初始化分流。

当前前端落地方式是：

1. 菜单和视图注册表使用 `tenant-management` 作为稳定视图 ID；
2. Router 通过 `/system/tenant-management` 挂载租户管理页面；
3. 页面负责租户资料、授权、配额、停用/启用和资源概览；
4. 对待初始化租户，页面内复用嵌入式 `TenantSetupWizard` 完成数据库接入；
5. 新建租户成功后，会先弹出“继续初始化”确认，再决定是否立即进入向导；
6. 停用等高风险动作使用统一确认弹窗，不再直接使用浏览器原生确认框。
7. 租户管理页导出已接入真实当前筛选结果导出，不再停留在占位提示。
8. 租户列表不再用本地示例租户冒充真实数据；接口为空时展示空列表语义，接口失败时展示后端不可用语义，避免运营视角误判。
9. 对页面内刚完成初始化的租户，前端会立即把其视为“运行中”参与当前筛选、分页和统计，不再出现状态卡片已更新但列表口径仍停留在 `pending` 的割裂情况。
10. 如果租户管理页修改、启停或重新初始化的是“当前登录租户”，前端会同步触发 `refreshTenantContext()`，保持顶部租户摘要、权限和系统初始化快照一致。

因此租户管理页是“平台运营视角”的入口，首次登录租户初始化仍由 `/tenant-setup` 分流承接。

---

## 阅读建议

1. 先读 `docs/tenant/TENANT_INITIALIZATION.md`
2. 再读 `docs/auth/AUTH_SECURITY.md` 与 `docs/auth/AUTH_SESSION_STRATEGY.md`
3. 最后结合本文件进入 `frontend/src/modules/tenant/`、`frontend/src/modules/auth/store/auth_store.ts` 与 `frontend/src/App.tsx`
