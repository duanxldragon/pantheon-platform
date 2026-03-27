# 系统模块后端实现

> 本文提供 `system` 后端模块的中文实现入口。  
> 重点说明模块装配结构、子模块布局、请求流转，以及它与授权刷新和租户隔离之间的关键协作。

业务规则相关文档见：

- `docs/system/SYSTEM_MANAGEMENT.md`
- `docs/auth/AUTH_SESSION_STRATEGY.md`
- `docs/tenant/TENANT_INITIALIZATION.md`

---

## 核心实现入口

- 系统路由入口：`backend/internal/modules/system/system_router.go`
- 容器装配：`backend/internal/modules/system/container/system_container.go`
- 共享系统模型：`backend/internal/modules/system/model/`

## 已注册子模块

- `backend/internal/modules/system/user/`
- `backend/internal/modules/system/dept/`
- `backend/internal/modules/system/position/`
- `backend/internal/modules/system/role/`
- `backend/internal/modules/system/permission/`
- `backend/internal/modules/system/menu/`
- `backend/internal/modules/system/dict/`
- `backend/internal/modules/system/log/`
- `backend/internal/modules/system/setting/`
- `backend/internal/modules/system/monitor/`

---

## 请求流转

系统模块挂载在 `/system` 路由组下。典型请求路径为：

1. 进入 `system_router.go`
2. 通过认证中间件
3. 通过租户中间件
4. 当全局授权服务启用时，再通过授权中间件
5. 分发到目标子模块 Handler
6. 在 Service 层处理业务规则
7. 通过 DAO 访问租户范围内的数据

这意味着系统管理能力默认运行在“已认证、具备租户上下文、并且已授权”的环境中。

---

## 分层结构

多数子模块保持相同后端分层：

- `handler.go`：HTTP 入参与响应处理
- `service.go`：业务规则与跨对象协调
- `dao.go`：数据访问
- `dto.go`：请求和响应结构
- `model.go`：持久化映射
- `router.go`：路由注册

以下目录已经稳定使用这一结构：

- `backend/internal/modules/system/user/`
- `backend/internal/modules/system/dept/`
- `backend/internal/modules/system/position/`
- `backend/internal/modules/system/role/`
- `backend/internal/modules/system/permission/`
- `backend/internal/modules/system/menu/`
- `backend/internal/modules/system/dict/`
- `backend/internal/modules/system/log/`
- `backend/internal/modules/system/setting/`

`monitor/` 子模块刻意保持更轻量，目前只保留：

- `backend/internal/modules/system/monitor/handler.go`
- `backend/internal/modules/system/monitor/service.go`
- `backend/internal/modules/system/monitor/router.go`

---

## 规范化结果

系统模块仍然是后端分层和命名约定的主要参考实现。

当前已经完成的统一包括：

- 子模块统一使用 `handler.go`、`service.go`、`dao.go`、`dto.go`、`model.go`、`router.go`
- `setting/` 子模块已完全对齐固定主分层文件
- `monitor/` 子模块已使用明确类型名，例如 `MonitorHandler`、`MonitorService`
- 容器装配继续集中在 `container/system_container.go`

后续新增系统子模块时，应先保留这套结构，只有当主分层不足时，才新增 `<subject>_<kind>.go` 补充文件。

命名基线见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 关键装配关系

`system_container.go` 负责把系统子模块与共享能力装配起来，主要包括：

- 初始化 DAO
- 初始化 Service
- 初始化 Handler
- 注入事务管理器
- 注入授权适配器
- 注入校验器和目录类依赖
- 提供统一路由出口

与共享授权服务的关键联动点主要包括：

- 用户角色写入
- 角色权限写入
- 角色菜单写入
- 在线用户 `auth_version` 刷新
- 用户级会话撤销

---

## 核心实现路径

### 用户角色分配

关键文件：

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/system/role/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

当用户角色发生变化时，后端必须同时处理：

- 业务数据关系
- 授权关系映射

只更新业务表而不更新授权，会导致当前权限状态不一致。

### 角色权限分配

关键文件：

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/permission/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

角色权限变化后，后端会同时更新关系数据和授权规则，然后刷新在线用户的鉴权结果。

### 角色菜单分配

关键文件：

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/menu/service.go`

角色菜单变化不仅影响表数据，也影响前端登录后的导航树和动态入口，因此属于授权刷新链路的一部分。

### 菜单变更传播

关键文件：

- `backend/internal/modules/system/menu/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

菜单名称、路径、组件、状态、删除等变化都可能影响前端挂载页面，因此后端把它们视为刷新触发事件，而不是简单配置变更。

### 部门和岗位变更传播

关键文件：

- `backend/internal/modules/system/dept/service.go`
- `backend/internal/modules/system/position/service.go`

部门和岗位变化主要影响组织上下文和数据范围，但也会影响用户登录后应看到的内容，因此同样参与刷新逻辑。

### 用户安全状态变更

关键文件：

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/auth/service.go`

以下动作被视为硬失效场景：

- 用户禁用
- 用户删除
- 用户密码修改
- 管理员重置密码

系统模块负责识别业务动作，认证模块负责实际的会话撤销。

---

## 租户上下文

系统管理核心数据全部是租户级数据，因此后端必须保证：

- 每个请求都绑定租户上下文
- 用户、部门、岗位、角色、权限、菜单、日志、配置按租户隔离
- 角色分配、菜单绑定、权限写入都会校验租户归属
- 查询接口不会跨租户读取系统管理数据

---

## 推荐阅读顺序

1. `backend/BACKEND_GUIDE.md`
2. `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
3. `backend/docs/system/SYSTEM_BACKEND.md`
4. 再结合 `docs/system/` 下的业务规则文档继续深入
