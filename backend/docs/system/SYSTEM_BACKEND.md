# 系统管理模块后端实现

## 定位

本文件只说明系统管理模块在后端的实现落点、装配关系和关键链路，不重复业务规则。

- 业务边界与对象关系：看 `docs/system/SYSTEM_MANAGEMENT.md`
- 会话刷新与强制失效：看 `docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户初始化与生命周期：看 `docs/tenant/TENANT_INITIALIZATION.md`

---

## 1. 后端总装配

系统管理模块以后端聚合路由方式统一挂载。

### 核心入口

- 路由总入口：`backend/internal/modules/system/system_router.go`
- 容器装配：`backend/internal/modules/system/container/system_container.go`
- 公共模型：`backend/internal/modules/system/model/`

### 注册的子模块

- 用户：`backend/internal/modules/system/user/`
- 部门：`backend/internal/modules/system/dept/`
- 岗位：`backend/internal/modules/system/position/`
- 角色：`backend/internal/modules/system/role/`
- 权限：`backend/internal/modules/system/permission/`
- 菜单：`backend/internal/modules/system/menu/`
- 字典：`backend/internal/modules/system/dict/`
- 日志：`backend/internal/modules/system/log/`
- 设置：`backend/internal/modules/system/setting/`
- 监控：`backend/internal/modules/system/monitor/`

---

## 2. 请求链路

系统管理模块统一挂在 `/system` 路由组下，请求链路如下：

1. 进入 `system_router.go`；
2. 经过认证中间件；
3. 经过租户中间件；
4. 如已启用全局授权服务，再经过权限校验中间件；
5. 分发到对应子模块 Handler；
6. 由 Service 处理业务规则；
7. 由 DAO / Repository 访问租户库数据。

这意味着系统管理模块的所有核心能力默认都运行在“已认证 + 已识别租户 + 已授权”的上下文内。

---

## 3. 分层结构

大部分子模块都采用一致的后端分层：

- `handler.go`：HTTP 入参与响应；
- `service.go`：业务规则与跨对象协同；
- `dao.go`：数据访问；
- `dto.go`：请求响应结构；
- `model.go`：领域模型映射。

这种结构在以下目录中保持一致：

- `backend/internal/modules/system/user/`
- `backend/internal/modules/system/dept/`
- `backend/internal/modules/system/position/`
- `backend/internal/modules/system/role/`
- `backend/internal/modules/system/permission/`
- `backend/internal/modules/system/menu/`
- `backend/internal/modules/system/dict/`
- `backend/internal/modules/system/log/`
- `backend/internal/modules/system/setting/`

监控模块当前以轻量方式落在：

- `backend/internal/modules/system/monitor/handler.go`
- `backend/internal/modules/system/monitor/service.go`

---

## 3.1 规范化说明

系统管理模块仍然是当前后端分层和命名规范的主要参考实现。

目前已经统一的方向包括：

- 子模块主分层统一使用 `handler.go`、`service.go`、`dao.go`、`dto.go`、`model.go`
- `setting/` 子模块已经统一为固定主分层文件
- `monitor/` 子模块已统一为 `MonitorHandler`、`MonitorService` 这类明确语义命名
- 容器装配继续集中在 `container/system_container.go`，保持模块装配入口稳定

后续新增系统管理子模块时，仍建议优先复用这一组织方式，再按需要补充 `<subject>_<kind>.go` 文件。

完整规则见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 4. 关键装配关系

`system_container.go` 负责把系统管理各子模块与共享能力拼起来，重点包括：

- 初始化各子模块 Repository / DAO；
- 初始化各子模块 Service；
- 初始化各子模块 Handler；
- 注入事务管理器；
- 注入授权适配器；
- 注入校验器与目录类依赖；
- 统一对外暴露路由注册入口。

系统管理模块与共享授权服务的结合点主要在：

- 用户角色写入；
- 角色权限写入；
- 角色菜单写入；
- 在线用户授权版本刷新；
- 用户级会话撤销。

---

## 5. 核心实现链路

### 5.1 用户与角色关系写入

关键目录：

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/system/role/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

后端在用户角色调整时，需要同时处理两件事：

- 业务数据层面的用户-角色关系；
- 授权层面的用户-角色映射。

如果只是改了业务表，但没有同步授权服务，用户当前权限就会不一致。

### 5.2 角色与权限关系写入

关键目录：

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/permission/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

角色变更权限后，后端不仅要更新角色和权限的关系数据，还要同步授权规则，并触发拥有该角色的在线用户刷新授权结果。

### 5.3 角色与菜单关系写入

关键目录：

- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/menu/service.go`

角色分配菜单后，影响的不只是菜单表本身，还会直接影响用户登录后看到的导航树和动态页面入口，因此属于授权初始化链路的一部分。

### 5.4 菜单变更传播

关键目录：

- `backend/internal/modules/system/menu/service.go`
- `backend/internal/shared/authorization/casbin_service.go`

菜单名称、路径、组件、状态、删除等变化，都会影响前端页面挂载结果。后端需要把这类变化纳入在线用户刷新策略，而不是只当成普通配置项处理。

### 5.5 部门与岗位变更传播

关键目录：

- `backend/internal/modules/system/dept/service.go`
- `backend/internal/modules/system/position/service.go`

部门和岗位主要影响组织上下文与数据范围，但同样会影响当前登录用户看到的数据与身份信息，因此也要触发在线态刷新。

### 5.6 用户安全状态变更

关键目录：

- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/auth/service.go`

以下场景属于强制失效范畴：

- 用户停用；
- 用户删除；
- 用户修改密码；
- 管理员重置密码。

系统管理模块负责识别这些业务动作，认证模块负责真正撤销旧会话。

---

## 6. 与租户上下文的结合

系统管理模块的所有核心数据默认都在租户数据库中维护，因此后端必须确保：

- 当前请求已经绑定租户上下文；
- 用户、部门、岗位、角色、权限、菜单、日志、设置等数据按租户隔离；
- 角色授权、菜单绑定、用户分配角色时都校验租户归属；
- 查询接口不会跨租户读取系统管理数据。

相关租户生命周期逻辑见 `docs/tenant/TENANT_INITIALIZATION.md`。

---

## 7. 子模块实现入口

下面这些路径是继续补全后端系统管理时最常用的落点：

- 用户：`backend/internal/modules/system/user/service.go`
- 部门：`backend/internal/modules/system/dept/service.go`
- 岗位：`backend/internal/modules/system/position/service.go`
- 角色：`backend/internal/modules/system/role/service.go`
- 权限：`backend/internal/modules/system/permission/service.go`
- 菜单：`backend/internal/modules/system/menu/service.go`
- 字典：`backend/internal/modules/system/dict/service.go`
- 日志：`backend/internal/modules/system/log/service.go`
- 设置：`backend/internal/modules/system/setting/service.go`
- 监控：`backend/internal/modules/system/monitor/service.go`

如果要排查系统管理模块的注入关系、授权联动或依赖装配，优先看：

- `backend/internal/modules/system/container/system_container.go`
- `backend/internal/shared/authorization/casbin_service.go`

---

## 8. 后续扩展建议

新增业务模块时，后端最好沿用系统管理模块当前的组织方式：

- 独立模块目录；
- 清晰的 `handler + service + dao + dto + model` 分层；
- 显式租户上下文；
- 显式权限点；
- 显式日志审计；
- 明确与授权刷新链路的结合点。

这样后续像“主机管理”这类业务模块就能以同样方式平滑接入平台。

