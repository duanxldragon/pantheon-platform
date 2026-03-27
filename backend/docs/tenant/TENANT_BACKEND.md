# 租户模块后端实现

## 定位

本文件只说明租户模块在后端的实现落点、初始化链路和运行期联动，不重复平台级业务设计。

- 业务边界：看 `docs/tenant/TENANT_INITIALIZATION.md`
- 会话联动：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 系统管理最小可用集合：看 `docs/system/SYSTEM_MANAGEMENT.md`

---

## 核心代码入口

### 租户主数据

- 服务实现：`backend/internal/modules/tenant/service.go`
- 备份服务：`backend/internal/modules/tenant/backup_service.go`
- 配额服务：`backend/internal/modules/tenant/quota_service.go`
- HTTP 处理器：`backend/internal/modules/tenant/handler.go`
- 路由注册：`backend/internal/modules/tenant/router.go`
- 数据访问：`backend/internal/modules/tenant/dao.go`
- 数据模型：`backend/internal/modules/tenant/model.go`
- 配额模型：`backend/internal/modules/tenant/quota_model.go`
- 请求响应模型：`backend/internal/modules/tenant/dto.go`

### 租户数据库接入

- 连接管理：`backend/internal/shared/database/`
- 分布式锁：`backend/internal/shared/cache/`

---

## 规范化说明

租户模块已经按统一后端分层收敛：

- 主分层文件：`dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 主题补充文件：`backup_service.go`、`quota_service.go`
- 模型补充文件：`quota_model.go`

当前拆分的目的主要是：

- 租户主数据、数据库接入、生命周期流程仍由主分层维持清晰边界；
- 备份、配额等横向能力从主服务中拆出，避免 `service.go` 持续膨胀；
- 后续新增租户扩展能力时，继续优先使用 `<subject>_<kind>.go` 命名。

完整规则见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 路由分组

### 公共路由

租户公共接口主要包括：

- `POST /api/v1/tenants/register`：创建租户主记录；
- `GET /api/v1/tenants/status`：按租户编码查询初始化状态；
- `POST /api/v1/tenants/test-connection`：测试数据库连接。

### 受保护路由

登录后可访问的租户接口主要包括：

- `POST /api/v1/tenants/setup`：提交数据库初始化；
- `GET /api/v1/tenants/current`：读取当前租户信息；
- `GET /api/v1/tenants/list`：读取租户列表；
- `POST /api/v1/tenants/switch/:id`：切换当前租户；
- `GET /api/v1/tenants/:id/quotas`：读取配额；
- `PUT /api/v1/tenants/:id/quotas`：更新配额。

---

## 后端初始化链路

### 1. 创建租户主记录

`TenantService.CreateTenant()` 当前会完成：

- 生成租户 ID；
- 写入名称、编码、描述；
- 将状态置为 `active`；
- 将 `IsFirstLogin` 置为 `true`。

这一步只完成平台侧开通，不代表租户数据库已经可用。

### 2. 查询初始化状态

`TenantService.GetTenantStatus()` 会同时读取：

- 租户主记录；
- 租户数据库配置是否存在。

最终返回给前端的重点信息包括：

- `databaseConfigured`
- `isFirstLogin`
- `tenantId`
- `tenantCode`
- `tenantName`
- `status`
- `databaseType`

前端登录后是否进入初始化向导，就依赖这里的结果。

### 3. 测试连接

`DatabaseService.TestConnection()` 会先构造 DSN，再交给 `database.Manager` 做实际连接测试。

因此“测试连接”和“正式初始化”共用同一套数据库构造规则，能减少环境差异。

### 4. 提交数据库初始化

`DatabaseService.SetupDatabase()` 是租户后端最关键的落点，链路包括：

1. 解析 `tenantID`；
2. 获取分布式锁 `tenant:init:{tenantID}`，防止重复初始化；
3. 查询租户主记录；
4. 构造租户 DSN；
5. 调用 `dbManager.ConnectTenant()` 建立租户连接并执行租户迁移；
6. 加密数据库密码；
7. 创建或更新 `TenantDatabaseConfig`；
8. 将租户 `IsFirstLogin` 更新为 `false`；
9. 返回已初始化模块列表 `InitializedModules`。

这里的 `InitializedModules` 来自 `dbManager.GetTenantMigratorNames()`，也是后续模块扩展接入初始化链路的后端锚点。

### 5. 启动期恢复

`DatabaseService.LoadAllTenants()` 会在服务启动后加载历史租户数据库配置，并重新接入连接池。

这样可以保证系统重启后，已初始化租户不需要再次手工接库。

---

## 生命周期与运行期联动

### 1. 停用租户

`TenantService.SuspendTenant()` 会：

- 把租户状态改为 `disabled`；
- 撤销该租户下用户会话；
- 从 `dbManager` 中移除该租户连接。

### 2. 删除租户

`TenantService.DeleteTenant()` 会：

- 先撤销租户下用户会话；
- 删除租户主记录；
- 关闭并移除租户数据库连接。

这意味着租户生命周期动作天然和认证会话联动，而不是只改一条状态字段。

---

## 配额与上下文能力

### 1. 当前租户信息

`GetCurrentTenantInfo()` 会返回当前租户的基础摘要，供前端顶部租户信息、初始化完成态和上下文切换使用。

### 2. 租户切换

当前后端已经预留 `switch/:id` 路径，为多租户切换场景保留接口边界。

### 3. 配额管理

处理器层已经接入租户配额的读取与更新，适合作为后续套餐、能力开关、资源限制的治理落点。

---

## 与其他模块的协作

### 与 `auth/` 的协作

- 登录后通过租户状态接口决定是否允许进入业务界面；
- 租户停用、删除时，通过 `SessionRevoker` 撤销会话；
- 初始化完成后，认证模块才能继续建立完整租户业务上下文。

### 与 `system/` 的协作

租户数据库连通并完成迁移后，系统管理相关表、默认结构和后续业务模块表才能在同一条初始化链路中逐步接入。

---

## 阅读建议

1. 先读 `docs/tenant/TENANT_INITIALIZATION.md`
2. 再读 `docs/auth/AUTH_SESSION_STRATEGY.md`
3. 最后结合本文件进入 `backend/internal/modules/tenant/` 与 `backend/internal/shared/database/`
