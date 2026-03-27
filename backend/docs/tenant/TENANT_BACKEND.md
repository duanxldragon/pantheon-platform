# 租户模块后端实现

> 本文提供 `tenant` 后端模块的中文实现入口。  
> 重点说明租户生命周期入口、数据库接入、初始化流程，以及它与认证和系统模块之间的运行时协作。

业务规则相关文档见：

- `docs/tenant/TENANT_INITIALIZATION.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/system/SYSTEM_MANAGEMENT.md`

---

## 核心实现入口

### 租户主数据

- 服务入口：`backend/internal/modules/tenant/service.go`
- 备份服务：`backend/internal/modules/tenant/backup_service.go`
- 配额服务：`backend/internal/modules/tenant/quota_service.go`
- HTTP 处理器：`backend/internal/modules/tenant/handler.go`
- 路由注册：`backend/internal/modules/tenant/router.go`
- DAO：`backend/internal/modules/tenant/dao.go`
- 模型：`backend/internal/modules/tenant/model.go`
- 配额模型：`backend/internal/modules/tenant/quota_model.go`
- DTO：`backend/internal/modules/tenant/dto.go`

### 租户数据库接入

- 数据库管理器和租户连接池：`backend/internal/shared/database/`
- 分布式锁和缓存支持：`backend/internal/shared/cache/`

---

## 规范化结果

租户模块已经对齐统一后端分层：

- 主分层文件：`dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 补充服务文件：`backup_service.go`、`quota_service.go`
- 补充模型文件：`quota_model.go`

这样租户主数据、数据库接入和生命周期逻辑保留在主分层内，而备份和配额职责拆到独立文件中。

命名基线见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 路由分组

### 公共路由

公共租户接口主要包括：

- `POST /api/v1/tenants/register`
- `GET /api/v1/tenants/status`
- `POST /api/v1/tenants/test-connection`

### 受保护路由

登录后可访问的租户接口主要包括：

- `POST /api/v1/tenants/setup`
- `GET /api/v1/tenants/current`
- `GET /api/v1/tenants/list`
- `POST /api/v1/tenants/switch/:id`
- `GET /api/v1/tenants/:id/quotas`
- `PUT /api/v1/tenants/:id/quotas`

---

## 初始化流程

### 1. 创建租户主记录

`TenantService.CreateTenant()` 当前负责：

- 生成租户 ID
- 写入名称、编码和描述
- 将状态设为 `active`
- 将 `IsFirstLogin` 设为 `true`

这一步只是在平台侧打开租户记录，不代表租户数据库已经可以使用。

### 2. 查询初始化状态

`TenantService.GetTenantStatus()` 会读取：

- 租户主记录
- 是否已经存在租户数据库配置

返回结果包含：

- `databaseConfigured`
- `isFirstLogin`
- `tenantId`
- `tenantCode`
- `tenantName`
- `status`
- `databaseType`

前端据此判断登录后是否应进入初始化向导。

### 3. 测试连接

`DatabaseService.TestConnection()` 会先构造 DSN，再委托给 `database.Manager` 执行真实连接测试。

这样测试连接和正式接入就共享同一套数据库构造规则。

### 4. 提交租户数据库初始化

`DatabaseService.SetupDatabase()` 是租户初始化最关键的后端入口，执行路径包括：

1. 解析 `tenantID`
2. 获取分布式锁 `tenant:init:{tenantID}`
3. 读取租户主记录
4. 构造租户 DSN
5. 调用 `dbManager.ConnectTenant()` 建连并运行租户迁移
6. 加密数据库密码
7. 创建或更新 `TenantDatabaseConfig`
8. 将 `IsFirstLogin` 设为 `false`
9. 返回 `InitializedModules`

`InitializedModules` 来自 `dbManager.GetTenantMigratorNames()`，是后续业务模块加入初始化流程的扩展挂点。

### 5. 启动恢复

`DatabaseService.LoadAllTenants()` 会在服务启动后重新加载历史租户数据库配置，并把它们重新接入连接池。

这样已经完成初始化的租户在后端重启后不需要手动重新接入。

---

## 生命周期与运行时协作

### 暂停租户

`TenantService.SuspendTenant()` 会：

- 将租户状态设为 `disabled`
- 撤销该租户用户会话
- 从 `dbManager` 中移除租户连接

### 删除租户

`TenantService.DeleteTenant()` 会：

- 先撤销该租户用户会话
- 删除租户主记录
- 关闭并移除租户数据库连接

这意味着租户生命周期变更天然和认证会话控制绑定，而不只是简单修改状态字段。

---

## 配额与上下文能力

### 当前租户信息

`GetCurrentTenantInfo()` 返回当前租户摘要，供前端展示租户标识、初始化完成状态和上下文切换信息。

### 租户切换

后端已经预留 `switch/:id` 作为未来多租户切换场景的边界。

### 配额管理

Handler 层已经接好租户配额读取和更新接口。这是未来套餐、功能开关和资源限制的自然治理点。

---

## 与其他模块的协作

### 与 `auth/`

- 登录后租户状态会决定用户是否能进入主业务界面
- 租户禁用和删除会通过 `SessionRevoker` 触发会话撤销
- 只有初始化完成后，租户业务上下文才算真正可用

### 与 `system/`

当租户数据库连通并完成迁移后，系统管理表和未来业务模块表都会加入同一条初始化链路。

---

## 推荐阅读顺序

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
3. `backend/docs/tenant/TENANT_BACKEND.md`
4. 再结合 `docs/tenant/` 下的初始化和生命周期规则文档继续深入
