# Pantheon Platform 系统架构设计

> 本文定义 Pantheon Platform 当前的平台级系统架构。
> 它回答“系统按什么边界组织、主链路如何协作、模块如何接入”，不重复前后端逐目录实现细节。
> 代码实现入口分别见 `backend/BACKEND_GUIDE.md` 与 `frontend/FRONTEND_GUIDE.md`。

## 1. 架构目标

Pantheon Platform 不是单纯的后台页面集合，而是面向：

- 私有化单租户交付；
- 平台化 PaaS 底座；
- SaaS 多租户产品化运营；
- 后续业务模块标准化扩展。

因此架构必须同时满足：

- **多租户原生**：平台级数据与租户级数据边界明确；
- **认证与授权闭环**：登录、刷新、会话失效、权限刷新可联动；
- **工作台式前端运行时**：菜单、标签页、动态视图、URL 路由共同工作；
- **模块化扩展**：新模块通过权限码、菜单、迁移器、视图注册标准接入；
- **治理可持续**：编码、Review、测试、文档有统一流程。

## 2. 系统分层

```text
Frontend Runtime
  |- React Router
  |- authStore / systemStore / uiStore
  |- Sidebar / Tabs / View Renderer
  |- API Client / i18n / Theme
        |
        v
HTTP API / Middleware
  |- Auth
  |- Tenant Context
  |- Authorization
  |- I18n
  |- Audit / Security Headers / Rate Limit
        |
        v
Backend Modules
  |- auth
  |- tenant
  |- system
  |- notification
        |
        v
Infrastructure
  |- Master DB
  |- Tenant DB Manager
  |- Redis
  |- Casbin
  |- Storage Provider
  |- Monitor DB
  |- Tenant Migrators
```

## 3. 主业务边界

### 3.1 `auth`

负责：

- 登录、退出、刷新；
- `JWT + Refresh Token + Redis` 会话态；
- `2FA / TOTP / 备份码`；
- API Key；
- 登录锁定、会话踢出、授权版本刷新。

不负责：

- 用户/角色/菜单的业务维护；
- 租户开通与数据库初始化；
- 具体业务模块本身的领域逻辑。

### 3.2 `tenant`

负责：

- 租户主数据与生命周期；
- 租户数据库接入与初始化；
- 租户状态检查；
- 租户连接池与迁移器装配；
- 租户级会话撤销协作。

不负责：

- 登录凭证签发；
- 系统管理对象维护；
- 某个业务模块自身的对象规则。

### 3.3 `system`

负责：

- 用户、部门、岗位；
- 角色、权限、菜单；
- 日志、设置、监控、字典；
- 进入租户业务空间后的系统治理底座。

不负责：

- 租户开通；
- 认证安全策略本身；
- 第三方通知发送实现细节。

### 3.4 `notification`

负责：

- 站内信、邮件、短信通知；
- 模板化通知；
- 异步任务与重试；
- 收件箱统计与查询。

## 4. 核心数据边界

### 4.1 Master DB

用于存储：

- 租户主档与租户配置；
- 平台级元数据；
- 与租户生命周期相关的控制信息。

### 4.2 Tenant DB

用于存储：

- 用户、角色、权限、菜单；
- 字典、日志、设置、通知；
- 各租户自己的业务数据。

### 4.3 Redis

用于存储：

- Access / Refresh 会话存在性；
- `revoked_after`；
- `auth_version`；
- 2FA 待验证态；
- 锁、临时态、缓存。

## 5. 关键运行时链路

### 5.1 登录与进入系统

```text
登录页 -> auth/login
      -> 2FA（如需要）
      -> access + refresh + Redis session
      -> 当前用户 / 权限加载
      -> 租户状态检查
      -> 租户未初始化则进入向导
      -> 租户就绪则重建 systemStore
      -> 菜单、标签页、视图挂载
```

### 5.2 软刷新与强制失效

```text
角色/权限/菜单/部门/岗位变化
  -> bump auth_version
  -> 请求命中旧 token
  -> 401
  -> refresh
  -> reloadAuthorization + checkTenantStatus + systemStore.initialize

用户停用/删号/改密/租户停用
  -> set revoked_after
  -> access/refresh 均失效
  -> 前端清理本地态并回登录页
```

### 5.3 租户初始化

```text
创建租户主记录
  -> 登录后读取当前租户状态
  -> 测试连接
  -> setup database
  -> 执行 tenant migrators
  -> 初始化默认系统数据
  -> 正式进入业务工作台
```

## 6. 前端运行时架构

前端不是纯静态路由后台，而是“URL 路由 + 工作台运行时”的混合模型：

- `React Router` 负责顶层 URL 与路由守卫；
- `authStore` 协调认证态、权限与租户检查；
- `systemStore` 承接系统快照；
- `uiStore` 承接标签页与工作台状态；
- `Sidebar`、`TopBar`、`useViewManager`、动态视图配置共同完成页面挂载。

前端接入新模块时，优先走：

`权限码 -> 菜单 -> 视图注册 -> 页面组件 -> API 接入`

## 7. 后端实现架构

后端坚持“模块 + 分层”：

- `handler`：参数、权限入口、统一响应；
- `service`：业务规则、事务、跨对象协作；
- `dao`：数据库读写；
- `model`：持久化模型；
- `dto`：请求响应结构；
- `router`：路由注册。

共享能力统一进入：

- `internal/shared/database/`
- `internal/shared/cache/`
- `internal/shared/authorization/`
- `internal/shared/middleware/`
- `internal/shared/i18n/`

## 8. 扩展原则

新增模块时必须同时回答：

1. 数据在主库还是租户库；
2. 是否需要注册租户迁移器；
3. 是否需要权限码、菜单和前端视图；
4. 是否需要接入审计、通知、会话刷新；
5. 是否需要加入标准测试矩阵。

## 9. 明确禁止

- 不绕开租户上下文直接访问租户数据；
- 不新增第二套认证、权限、状态、菜单或主题体系；
- 不把业务编排堆进前端壳层或后端入口；
- 不把阶段性建议写成已落地事实；
- 不让文档与代码长期分叉。

## 10. 相关文档

- 平台总览：`README.md`
- 平台文档索引：`docs/DOCS_INDEX.md`
- 认证设计：`docs/auth/AUTH_SECURITY.md`
- 会话策略：`docs/auth/AUTH_SESSION_STRATEGY.md`
- 租户设计：`docs/tenant/TENANT_INITIALIZATION.md`
- 系统管理设计：`docs/system/SYSTEM_MANAGEMENT.md`
- UI 设计：`docs/system/UI_DESIGN.md`
- 开发流程：`docs/development/DEVELOPER_GUIDE.md`
