# 租户模块后端实现

> 本文提供 `tenant` 后端模块的中文实现入口。  
> 重点说明租户生命周期入口、数据库接入、初始化流程，以及它与认证和系统模块之间的运行时协作。

相关业务规则文档见：

- `docs/tenant/TENANT_INITIALIZATION.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/system/SYSTEM_MANAGEMENT.md`

---

## 1. 核心入口

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

- 数据库管理器与租户连接池：`backend/internal/shared/database/`
- 分布式锁与缓存支持：`backend/internal/shared/cache/`

---

## 2. 路由分组

### 公共接口

主要包括：

- `POST /api/v1/tenants/register`
- `GET /api/v1/tenants/status`
- `POST /api/v1/tenants/test-connection`

### 登录后接口

主要包括：

- `POST /api/v1/tenants/setup`
- `GET /api/v1/tenants/current`
- `GET /api/v1/tenants/list`
- `POST /api/v1/tenants/switch/:id`
- `GET /api/v1/tenants/:id/quotas`
- `PUT /api/v1/tenants/:id/quotas`

---

## 3. 初始化链路

### 创建租户主记录

`TenantService.CreateTenant()` 负责：

- 生成租户 ID
- 写入名称、编码和描述
- 设置租户状态
- 将首次登录标记置为初始值

这一步只是在平台侧创建租户主记录，不代表租户数据库已经可用。

### 查询初始化状态

`TenantService.GetTenantStatus()` 会读取：

- 租户主记录
- 是否已存在租户数据库配置

返回重点包括：

- `databaseConfigured`
- `isFirstLogin`
- `tenantId`
- `tenantCode`
- `tenantName`
- `status`
- `databaseType`

前端据此决定登录后是否进入初始化向导。

### 测试连接

`DatabaseService.TestConnection()` 会先构造 DSN，再委托 `database.Manager` 执行真实连接测试。

### 提交租户数据库初始化

`DatabaseService.SetupDatabase()` 是租户初始化的关键入口，执行路径包括：

1. 解析 `tenantID`
2. 获取分布式锁 `tenant:init:{tenantID}`
3. 读取租户主记录
4. 构造租户 DSN
5. 调用 `dbManager.ConnectTenant()` 建连并执行租户迁移
6. 加密数据库密码
7. 创建或更新 `TenantDatabaseConfig`
8. 更新首次登录标记
9. 返回 `InitializedModules`

`InitializedModules` 来自 `dbManager.GetTenantMigratorNames()`，是后续业务模块加入初始化流程的扩展点。

### 启动恢复

`DatabaseService.LoadAllTenants()` 会在服务启动后重新加载历史租户数据库配置，并恢复到连接池中。

---

## 4. 生命周期协作

### 暂停租户

`TenantService.SuspendTenant()` 会：

- 将租户状态设为禁用
- 撤销该租户用户会话
- 从 `dbManager` 中移除租户连接

### 删除租户

`TenantService.DeleteTenant()` 会：

- 先撤销该租户用户会话
- 删除租户主记录
- 关闭并移除租户数据库连接

租户生命周期变更天然和认证会话控制绑定，而不是单纯修改状态字段。

---

## 5. 运行时数据库管理

`database.Manager` 负责：

- 管理租户数据库连接缓存
- 管理连接池
- 租户数据库建连
- 租户迁移执行
- 周期性健康检查
- 周期性清理空闲连接
- 周期性 reload 租户

本轮还补了一个关键容错：

- 当租户数据库尚未创建时，reload 不再把 `Unknown database` 当成严重连接故障，而是记录为 `waiting for setup`

---

## 6. 与其他模块的协作

### 与 `auth`

- 登录后租户状态会决定用户是否进入主业务界面
- 租户禁用和删除会通过 `SessionRevoker` 撤销会话
- 只有初始化完成后，租户业务上下文才真正可用

### 与 `system`

- 当租户数据库建连并完成迁移后，系统模块及后续业务模块表结构才可用
- `dict`、`role` 等模块的租户级 schema 修复也通过这条迁移链路执行

---

## 7. 配额与上下文能力

当前租户模块同时承担：

- 当前租户信息读取
- 租户切换入口预留
- 租户配额读取与更新

这些能力为后续套餐、功能开关和资源限制提供治理基础。

---

## 8. 推荐阅读顺序

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
3. `backend/docs/tenant/TENANT_BACKEND.md`
4. 再结合 `docs/tenant/` 下的初始化与生命周期规则文档继续深入
