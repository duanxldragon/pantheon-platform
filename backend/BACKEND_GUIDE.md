# Pantheon Platform - 后端实现总览

> 本文是后端工程实现总览，只讲代码结构、启动链路、基础设施、开发规范与扩展方式。  
> 认证、租户、系统管理的业务规则，请分别进入专题文档阅读：
>
> - `docs/auth/AUTH_SECURITY.md`
> - `docs/auth/AUTH_SESSION_STRATEGY.md`
> - `docs/tenant/TENANT_INITIALIZATION.md`
> - `docs/system/SYSTEM_MANAGEMENT.md`
> - `backend/docs/BACKEND_DOCS_INDEX.md`
> - `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

## 1. 文档定位

`backend/BACKEND_GUIDE.md` 负责回答以下问题：

- 后端代码目录怎么组织；
- 服务是如何启动的；
- 请求如何经过认证、租户上下文和授权链路；
- 主库与租户库如何协作；
- 模块如何注册、如何扩展；
- 开发时应该遵守哪些工程约束。

本文**不再重复**以下内容：

- 角色、权限、菜单、用户的业务关系；
- 2FA、会话软刷新、强制失效的业务规则；
- 租户初始化的业务分阶段说明；
- 前端菜单挂载、视图渲染、页面交互细节。

---

## 2. 技术栈与运行角色

后端当前核心技术栈：

- `Go 1.23+`
- `Gin`
- `GORM`
- `Casbin`
- `Redis`
- `Swagger`

后端在平台中的职责可以简化为四层：

1. **HTTP 接入层**：接收请求、做参数绑定、返回统一响应；
2. **业务模块层**：`auth`、`tenant`、`system`、`notification`；
3. **共享基础设施层**：数据库管理、缓存、授权、中间件、i18n、存储；
4. **运行时底座**：主库、租户库连接池、Redis、对象存储。

---

## 3. 目录结构

### 3.1 顶层目录

```text
backend/
├─ api/                 # Swagger 产物与 API 相关资源
├─ cmd/                 # 服务入口与开发辅助工具
├─ config/              # Casbin 模型等静态配置
├─ docs/                # 后端人工实现文档
├─ internal/            # 主要业务代码
├─ scripts/             # 初始化脚本与演示数据脚本
├─ Makefile             # 常用开发命令
├─ config.yaml.example  # 配置示例
└─ BACKEND_GUIDE.md     # 当前文档
```

### 3.2 `cmd/` 约定

```text
backend/cmd/
├─ server/              # 正式服务入口
└─ tools/               # 开发辅助脚本
```

约定如下：

- `cmd/server` 只放正式启动入口；
- 一次性脚本或开发辅助脚本统一放在 `cmd/tools/`；
- `cmd/tools/README.md` 负责记录工具用途与环境变量要求。

### 3.3 `internal/` 约定

```text
backend/internal/
├─ app/                 # 服务启动与模块装配
├─ config/              # 配置加载
├─ modules/             # 业务模块
│  ├─ auth/
│  ├─ notification/
│  ├─ system/
│  └─ tenant/
└─ shared/              # 共享基础设施
   ├─ authorization/
   ├─ cache/
   ├─ database/
   ├─ i18n/
   ├─ middleware/
   ├─ response/
   ├─ storage/
   └─ ...
```

原则上：

- 业务模块代码优先放在 `internal/modules/`；
- 跨模块复用的基础能力收敛到 `internal/shared/`；
- 应用装配、依赖注入、启动流程统一在 `internal/app/`；
- 不要把具体业务逻辑直接写进 `app.Start()`。

---

## 4. 模块边界

当前后端核心业务模块：

| 模块 | 作用 |
| :--- | :--- |
| `auth` | 登录、刷新、登出、2FA、API Key、认证安全 |
| `tenant` | 租户主数据、租户接库、租户配额、租户生命周期 |
| `system` | 用户、角色、权限、菜单、日志、设置、监控 |
| `notification` | 站内信、邮件、短信、通知任务 |

共享模块主要负责：

- `authorization`：Casbin 封装、授权版本与会话联动；
- `database`：主库初始化、租户库连接池、迁移器注册；
- `cache`：Redis 封装、分布式锁；
- `middleware`：鉴权、鉴租、日志、安全头等；
- `i18n`：翻译加载与错误消息翻译；
- `response`：统一响应输出；
- `storage`：本地/S3 存储抽象。

---

## 5. 启动链路

### 5.1 服务入口

服务入口位于：

- `backend/cmd/server/main.go`
- `backend/internal/app/app_bootstrap.go`

`main.go` 非常薄，只负责调用 `app.Start()`；所有真正的启动逻辑都在 `app_bootstrap.go` 中完成。

### 5.2 `app.Start()` 启动流程

当前启动主链路大致如下：

1. 加载配置；
2. 初始化主库；
3. 根据配置执行主库 `AutoMigrate`；
4. 初始化监控库（若可用）；
5. 初始化租户数据库管理器；
6. 初始化 Redis；
7. 初始化授权服务 `AuthorizationService`；
8. 设置全局 JWT Secret 与授权服务引用；
9. 执行默认数据引导；
10. 初始化系统容器与通知服务；
11. 注册租户迁移器；
12. 加载已有租户数据库连接；
13. 构建各模块 Service / Handler / Router；
14. 创建 Gin Engine 并注册全局中间件；
15. 注册公共路由、受保护路由、Swagger 与健康检查；
16. 启动 HTTP 服务。

### 5.3 `migrate-only` 模式

后端已支持迁移后退出模式，适合部署初始化场景：

- 配置项：`migrate_only`
- 环境变量：`PANTHEON_MIGRATE_ONLY=true`

该模式会完成：

- 主库迁移；
- 默认数据引导；
- 然后直接退出，不启动 HTTP 服务。

---

## 6. 请求处理链路

一个典型受保护请求会经过如下环节：

```text
HTTP Request
  -> Gin Router
  -> CORS / I18n / 安全头 / 操作日志中间件
  -> Auth Middleware
  -> Tenant Middleware
  -> Authorization Check
  -> Handler
  -> Service
  -> DAO / Repository
  -> Response
```

### 6.1 `Auth Middleware`

负责：

- 解析 Bearer Token；
- 校验 JWT；
- 校验 Redis 会话态；
- 校验 `auth:revoked_after:*`；
- 校验 `auth:version:*`；
- 注入 `user_id`、`tenant_id`、`jti`。

### 6.2 `Tenant Middleware`

负责：

- 根据上下文识别当前租户；
- 从 `database.Manager` 中获取租户连接；
- 把租户 DB 注入请求上下文；
- 为后续系统模块和业务模块提供租户隔离基础。

### 6.3 授权检查

授权能力由 `shared/authorization` 承担，核心上依赖 Casbin，但已经封装了：

- 用户权限查询；
- 角色权限管理；
- 授权版本刷新；
- 数据范围过滤；
- 会话撤销联动。

---

## 7. 数据库设计原则

### 7.1 主库与租户库分工

- **主库**：保存租户主数据、连接配置、平台公共元数据；
- **租户库**：保存租户内系统管理数据与后续业务数据；
- **数据库管理器**：维护租户连接池和迁移器注册表。

### 7.2 当前实现特点

- 主库通过 `database.InitMasterDB()` 初始化；
- 租户库通过 `database.Manager` 动态接入；
- 租户初始化、重启恢复、停用/删除都依赖同一套连接管理器；
- 新模块若要进入租户初始化链路，需要注册租户迁移器。

### 7.3 为什么不在总览里展开表结构

表结构细节变化频繁，而且不同专题有不同关注重点：

- 租户主数据：看 `backend/docs/tenant/TENANT_BACKEND.md`
- 系统管理对象：看 `backend/docs/system/SYSTEM_BACKEND.md`
- 认证相关状态：看 `backend/docs/auth/AUTH_BACKEND.md`

因此本文件只保留数据库边界，不再维护完整字段字典。

---

## 8. 授权与会话协作

### 8.1 授权服务

授权服务位于：

- `backend/internal/shared/authorization/`

它在工程层的职责是：

- 管理 Casbin Enforcer；
- 提供权限校验与权限查询；
- 处理角色/权限/菜单变更后的授权刷新；
- 与 Redis 会话态协作，区分软刷新和强制失效。

### 8.2 与认证模块的关系

这里要区分清楚：

- 认证模块负责“会话怎么建立、怎么校验”；
- 授权服务负责“授权结果如何计算、何时需要重算”；
- 系统管理模块负责“哪些业务变更会影响授权结果”。

具体策略矩阵统一看：

- `docs/auth/AUTH_SESSION_STRATEGY.md`

---

## 9. 国际化与统一响应

### 9.1 响应输出

统一响应工具位于：

- `backend/internal/shared/response/`

建议所有 Handler 都通过统一响应工具返回结果，保持：

- 响应结构一致；
- 错误码与消息语义稳定；
- 前端更容易做统一错误处理。

### 9.2 i18n 错误消息

国际化相关能力位于：

- `backend/internal/shared/i18n/`

建议：

- 错误消息优先返回稳定的 i18n key；
- 前端按语言资源做最终翻译；
- 不要在 Handler 内写大量硬编码中文错误文案。

---

## 10. 存储与外部依赖

### 10.1 Redis

Redis 当前承担以下职责：

- 登录会话态；
- Refresh Token 校验；
- 2FA 临时态；
- 登录失败计数；
- 用户级撤销时间；
- 用户级授权版本；
- 租户初始化锁。

### 10.2 Storage Provider

存储抽象位于：

- `backend/internal/shared/storage/`

当前装配逻辑支持：

- 本地文件存储；
- S3 风格对象存储。

这部分主要被头像、附件、后续业务上传能力复用。

---

## 11. 开发规范

### 11.1 Handler / Service / DAO 分层

建议保持以下分工：

- `Handler`：参数绑定、权限入口、响应输出；
- `Service`：业务规则、事务边界、模块协作；
- `DAO/Repository`：数据库读写；
- `DTO`：请求响应模型；
- `Model`：持久化模型。

### 11.2 不要把这些逻辑放错层

- 不要在 `Handler` 中写大量业务判断；
- 不要在 `DAO` 中写跨模块流程编排；
- 不要把 HTTP 语义泄漏进底层 Repository；
- 不要把租户隔离校验完全依赖前端。

### 11.3 命名与组织建议

- 一个业务子域一个目录；
- 分层主文件统一使用 `dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`；
- 补充文件统一使用 `<subject>_<kind>.go` 命名，例如 `user_validation.go`、`template_renderer.go`；
- 共享常量进入 `shared/constants` 或模块内常量文件；
- 不要把一次性脚本混进正式服务入口目录。

完整规则见：

- `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

---

## 12. 新增业务模块接入方式

新增模块时，建议按以下顺序落地：

1. 在 `internal/modules/` 下创建新模块目录；
2. 定义 `model.go`、`dto.go`、`dao.go`、`service.go`、`handler.go`、`router.go`；
3. 若是租户级数据，注册租户迁移器；
4. 在 `app.Start()` 或容器层装配 Service / Handler / Router；
5. 补权限点与授权联动；
6. 补日志、监控、i18n 与必要的存储接入；
7. 在平台专题文档中增加业务接入说明。

### 12.1 什么时候需要租户迁移器

满足以下条件时，通常需要注册租户迁移器：

- 模块数据保存在租户库；
- 新租户初始化时必须自动建表；
- 模块有默认种子数据；
- 模块希望和系统管理一起成为租户最小可用能力的一部分。

---

## 13. 开发命令

### 13.1 常用命令

```bash
# 启动服务
make run

# 仅迁移后退出
make migrate-only

# 运行全部测试
make test

# 生成覆盖率报告
make test-coverage

# 代码检查
make lint

# 格式化
make format

# 生成 Swagger
make swagger

# 构建二进制
make build
```

### 13.2 Swagger 位置

Swagger 生成产物已迁移到：

- `backend/api/swagger/`

人工编写的后端文档保持在：

- `backend/docs/`

---

## 14. 推荐阅读顺序

1. 先读 `README.md`
2. 再读 `docs/DOCS_INDEX.md`
3. 再读 `backend/docs/BACKEND_DOCS_INDEX.md`
4. 再按专题进入：
   - `backend/docs/system/SYSTEM_BACKEND.md`
   - `backend/docs/auth/AUTH_BACKEND.md`
   - `backend/docs/tenant/TENANT_BACKEND.md`
5. 工具链与脚本再看 `backend/cmd/tools/README.md`

---

## 15. 当前文档的边界总结

后续如果再补后端文档，建议继续遵守以下分工：

- `README.md`：平台入口
- `docs/`：平台级业务设计
- `backend/BACKEND_GUIDE.md`：后端工程实现总览
- `backend/docs/*`：后端专题实现细节
- `backend/api/swagger/`：API 生成产物
- `backend/cmd/tools/README.md`：开发辅助工具说明

---

## 16. 本次后端规范化改造结果

这一轮整理的目标，是把 `backend/` 的文件命名、分层职责和共享基础设施命名统一到一套可复用规则上，并尽量向 `system` 模块的成熟组织方式看齐。

### 16.1 已统一的主规则

- 模块主分层统一为：`dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 模块补充文件统一为：`<subject>_<kind>.go`
- 工具入口统一保留：`main.go`
- 共享基础设施统一优先使用“能力 + 类型”命名
- 导出类型名必须带业务语义，不再保留泛化的 `Service`、`Handler`、`Repository`

### 16.2 已完成整理的模块

已完成主要规范化的模块包括：

- `internal/modules/auth/`
- `internal/modules/tenant/`
- `internal/modules/notification/`
- `internal/modules/system/` 的部分子模块

其中：

- `auth` 已拆分出 `auth_service.go`、`session_service.go`、`api_key_service.go`、`login_attempt_service.go`、`two_factor_service.go`
- `tenant` 已统一 `dao/dto/handler/model/router/service` 主分层和若干 `*_service.go`
- `notification` 已将旧 `repository.go` 收敛为 `dao.go`
- `system` 中 `setting`、`monitor` 等子模块已统一导出类型与构造函数命名

### 16.3 已完成整理的共享层

已完成统一命名和职责整理的共享能力包括：

- `internal/shared/database/`
- `internal/shared/i18n/`
- `internal/shared/middleware/`
- `internal/shared/storage/`
- `internal/shared/constants/`
- `internal/shared/docs/`

代表性命名收敛示例：

- `internal/app/app.go` → `internal/app/app_bootstrap.go`
- `internal/shared/database/base_repository.go` → `internal/shared/database/base_dao.go`
- `internal/shared/database/database.go` → `internal/shared/database/database_initializer.go`
- `internal/shared/storage/storage.go` → `internal/shared/storage/storage_provider.go`
- `internal/shared/utils/masking.go` → `internal/shared/utils/data_masking.go`

### 16.4 后续新增代码必须遵守

后续无论新增业务模块、共享基础设施还是工具脚本，都建议先检查：

1. 是否已经存在固定主分层文件可承载该职责；
2. 是否应该拆成 `<subject>_<kind>.go`；
3. 是否沿用了共享层现有命名风格；
4. 是否同步更新 `backend/docs/BACKEND_NAMING_CONVENTIONS.md`

如果后续命名规则需要调整，以 `backend/docs/BACKEND_NAMING_CONVENTIONS.md` 为唯一基准文档。
