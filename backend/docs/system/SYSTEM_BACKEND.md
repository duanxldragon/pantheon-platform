# 系统模块后端实现

> 本文提供 `system` 后端模块的中文实现入口。  
> 重点说明模块装配结构、子模块布局、请求流转，以及它与授权刷新和租户隔离之间的关键协作。

相关业务规则文档见：

- `docs/system/SYSTEM_MANAGEMENT.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`
- `backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md`

---

## 1. 核心入口

- 系统路由入口：`backend/internal/modules/system/system_router.go`
- 容器装配：`backend/internal/modules/system/container/system_container.go`
- 共享系统模型：`backend/internal/modules/system/model/`

已注册子模块：

- `user/`
- `dept/`
- `position/`
- `role/`
- `permission/`
- `menu/`
- `dict/`
- `log/`
- `setting/`
- `monitor/`

---

## 2. 请求流转

系统模块统一挂载在 `/api/v1/system/*` 下，典型链路如下：

1. 进入 `system_router.go`
2. 通过认证中间件
3. 通过租户中间件
4. 进入授权中间件
5. 分发到对应子模块 `handler`
6. 在 `service` 中执行业务规则和事务
7. 通过 `dao` 访问当前租户范围内的数据

这意味着系统管理功能默认运行在“已认证、已绑定租户、已授权”的上下文中。

---

## 3. 分层结构

大多数系统子模块统一采用：

- `handler.go`：HTTP 入参和响应
- `service.go`：业务规则、事务、跨对象协作
- `dao.go`：数据库访问
- `dto.go`：请求和响应结构
- `model.go`：持久化模型
- `router.go`：路由注册

当前已稳定对齐这一结构的目录包括：

- `user/`
- `dept/`
- `position/`
- `role/`
- `permission/`
- `menu/`
- `dict/`
- `log/`
- `setting/`

`monitor/` 保持轻量，仅保留必要的 `handler/service/router`。

---

## 4. 容器装配关系

`system_container.go` 负责把系统子模块和共享能力装配起来，核心职责包括：

- 初始化 DAO
- 初始化 Service
- 初始化 Handler
- 注入事务管理器
- 注入授权适配器
- 注入目录型校验依赖
- 暴露统一路由入口

与共享授权服务的关键联动点包括：

- 用户角色写入
- 角色权限写入
- 角色菜单写入
- 在线用户 `auth_version` 刷新
- 用户级会话撤销

---

## 5. 关键协作链路

### 用户与角色

关键文件：

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/system/role/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

当用户角色发生变化时，后端需要同时处理：

- 业务表关系
- Casbin 角色映射
- 在线会话刷新或撤销

### 角色、权限、菜单

关键文件：

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/permission/service.go`
- `backend/internal/modules/system/menu/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

角色权限和菜单变更不仅影响配置表，还会影响：

- 路由级授权
- 登录后菜单树
- 数据权限范围
- 在线用户授权态

### 部门与岗位

关键文件：

- `backend/internal/modules/system/dept/service.go`
- `backend/internal/modules/system/position/service.go`

部门和岗位变更主要影响：

- 组织关系
- 用户归属
- 数据范围判断
- 在线用户可见内容

---

## 6. 租户边界

系统管理核心数据全部是租户级数据，因此必须保证：

- 每个请求都绑定租户上下文
- 用户、角色、菜单、权限、日志、字典、设置按租户隔离
- 角色分配、菜单绑定、权限写入都校验租户归属
- 列表和详情接口不能跨租户读取系统数据

---

## 7. 批量接口

为避免前端逐条请求造成部分成功、部分失败和状态不一致，系统模块已补齐原子化批量接口。

当前已覆盖：

- 角色
  - `POST /api/v1/system/roles/batch-delete`
  - `PATCH /api/v1/system/roles/status`
- 岗位
  - `POST /api/v1/system/positions/batch-delete`
  - `PATCH /api/v1/system/positions/status`
- 权限
  - `POST /api/v1/system/permissions/batch-delete`
  - `PATCH /api/v1/system/permissions/status`
- 部门
  - `POST /api/v1/system/depts/batch-delete`
  - `PATCH /api/v1/system/depts/status`
- 菜单
  - `POST /api/v1/system/menus/batch-delete`
  - `PATCH /api/v1/system/menus/status`

统一约束：

- 继续受租户上下文限制
- 先做整体验证，再执行批量事务
- 批量状态变更继续复用授权刷新链路
- 审计日志按一次批量动作聚合记录

---

## 8. 推荐阅读顺序

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
3. `backend/docs/system/SYSTEM_BACKEND.md`
4. 再进入 `docs/system/` 下的业务规则文档
