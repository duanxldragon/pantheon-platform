# Backend Guide

这是进入 `backend/` 工作的首读文档。它回答"后端是怎么组织的、每个目录做什么、怎么起来的、怎么验证"。

阅读完本文后，再按需进入各专题文档：

- 认证与会话：`backend/docs/auth/AUTH_BACKEND.md`
- 租户初始化：`backend/docs/tenant/TENANT_BACKEND.md`
- 系统管理：`backend/docs/system/SYSTEM_BACKEND.md`
- 命名规范：`backend/docs/BACKEND_NAMING_CONVENTIONS.md`
- 文档索引：`backend/docs/BACKEND_DOCS_INDEX.md`

---

## 1. 目录职责

```
backend/
├── api/swagger/            # 生成的 Swagger 输出，不要手动编辑
├── cmd/
│   ├── server/main.go      # 生产服务入口，只做 app.Start() 调用
│   └── tools/              # 开发与运维工具（hash-password, seed-system-data 等）
├── config/
│   └── rbac_model.conf     # Casbin RBAC 策略模型文件
├── internal/
│   ├── app/                # 服务启动与依赖组装
│   ├── config/             # 配置结构与加载逻辑
│   ├── modules/            # 业务模块
│   └── shared/             # 共享基础设施
├── scripts/                # 数据库脚本、工具脚本
├── AGENTS.md               # AI Agent 行为约束
├── BACKEND_GUIDE.md        # 本文件
├── Makefile                # 开发命令集
└── go.mod                  # Go 模块，版本 1.24
```

---

## 2. 业务模块

所有业务模块位于 `internal/modules/`，共四个：

| 模块 | 路径 | 职责 |
| :--- | :--- | :--- |
| `auth` | `modules/auth/` | 登录、JWT、Refresh Token、2FA、API Key、会话管理 |
| `system` | `modules/system/` | 用户、角色、权限、菜单、部门、岗位、日志、设置、监控、数据字典 |
| `tenant` | `modules/tenant/` | 租户创建、数据库初始化、配额、生命周期 |
| `notification` | `modules/notification/` | 站内通知、邮件/短信发送、模板渲染、异步任务队列 |

`system` 模块是最复杂的，内部按子域拆分目录：

```
system/
├── container/      # 依赖组装（SystemContainer）
├── dept/           # 部门管理
├── dict/           # 数据字典
├── log/            # 操作日志 + 登录日志
├── menu/           # 菜单管理
├── model/          # 跨子模块共享模型（User、Role、RoleMenu 等）
├── monitor/        # 系统监控（运行时 + DB + Redis + 在线用户）
├── permission/     # 权限管理
├── position/       # 岗位管理
├── role/           # 角色管理（含 Casbin 策略迁移）
├── setting/        # 系统设置（KV 存储）
└── user/           # 用户管理
```

---

## 3. 分层规范

每个业务模块内部按固定职责分层，当前主分层文件统一采用 `<module>_<kind>.go` 命名：

| 文件 | 职责 |
| :--- | :--- |
| `auth_handler.go` | HTTP 请求绑定、权限入口、统一响应 |
| `auth_service.go` | 业务规则、事务边界、跨对象编排 |
| `auth_dao.go` | 数据库访问，只做 SQL / ORM 操作 |
| `auth_model.go` | 持久化模型（GORM 结构体） |
| `auth_dto.go` | 请求与响应载体 |
| `auth_router.go` | 路由注册 |

**统一命名规范**：所有模块文件使用 `<module>_<kind>.go` 格式，例如：
- 认证模块: `auth_handler.go`, `auth_service.go`, `auth_dao.go`
- 用户模块: `user_handler.go`, `user_service.go`, `user_dao.go`
- 通知模块: `notification_handler.go`, `notification_service.go`, `notification_dao.go`

当某层文件过大时，拆分为 `<subject>_<kind>.go` 或 `<module>_<feature>_<kind>.go`，例如 `session_service.go`、`api_key_service.go`、`auth_two_factor_service.go`。

---

## 4. 共享基础设施

`internal/shared/` 提供所有模块共用的横切能力：

| 子目录 | 能力 |
| :--- | :--- |
| `database/` | 主库初始化、租户库连接池管理、迁移器注册、事务管理 |
| `cache/` | Redis 客户端封装（支持 standalone / cluster / sentinel） |
| `authorization/` | Casbin RBAC 服务，含软刷新（auth version bump）与硬失效（session revoke） |
| `middleware/` | 认证、租户、Casbin 鉴权、操作日志、CORS、限流、安全头 |
| `i18n/` | 翻译服务（GORM 存储 + Redis 缓存）、翻译中间件、翻译 Handler |
| `storage/` | 存储适配器（本地 / S3）|
| `masking/` | DTO 层数据脱敏（邮箱、手机、姓名） |
| `errors/` | 统一应用错误类型 |
| `response/` | HTTP 响应统一格式工具 |
| `validator/` | Gin 请求校验注册 |
| `audit/` | 操作上下文（被操作日志中间件使用） |
| `constants/` | 平台级常量（默认租户 ID 等） |

---

## 5. 启动流程

启动入口是 `internal/app/app_bootstrap.go` 的 `Start()` 函数，依赖组装顺序如下：

```
1. 加载配置 config.Load()
2. 初始化主库 database.InitMasterDB()
3. 执行主库迁移（auto_migrate=true 或 migrate_only=true）
4. 初始化 database.Manager（管理租户库连接池）
5. 初始化 Redis
6. 初始化 Casbin AuthorizationService
7. bootstrapDefaultData()  ← 确保默认租户、super_admin 角色、admin 用户存在
8. 若 migrate_only=true，退出
9. 初始化 Monitor DB（若启用）
10. 初始化 Storage Provider（本地 / S3）
11. 初始化 SystemContainer（依赖注入所有 System 子模块）
12. 注册租户迁移器（13 个：auth/user/dept/.../notification）
13. 初始化各模块 Handler + Router
14. 注册 Gin 中间件（限流、CORS、i18n 翻译、操作日志、安全头）
15. 注册路由并启动 HTTP 服务
```

`bootstrapDefaultData` 会在首次启动时幂等创建：

- 默认平台租户（`code=platform`，ID 为全零 UUID）
- `super_admin` 角色（`type=system`，`data_scope=all`，`is_system=true`）
- 默认管理员用户（由 `default_admin.enabled` 控制，**生产环境必须关闭**）

---

## 6. 配置系统

配置文件路径（按优先级）：

1. `./config.yaml`
2. `./config/config.yaml`
3. `/etc/pantheon-platform/config.yaml`

环境变量前缀为 `PANTHEON_`，`.` 替换为 `_`，例如：

| 配置键 | 环境变量 |
| :--- | :--- |
| `master_db.password` | `PANTHEON_MASTER_DB_PASSWORD` |
| `jwt_secret` | `PANTHEON_JWT_SECRET` |
| `encryption_key` | `PANTHEON_ENCRYPTION_KEY` |
| `redis.password` | `PANTHEON_REDIS_PASSWORD` |
| `default_admin.password` | `PANTHEON_DEFAULT_ADMIN_PASSWORD` |

关键配置约束：

- `encryption_key` **必须恰好 32 字节**，用于租户 DSN 加密（AES-256）
- 生产环境 `jwt_secret` 不能为空
- 生产环境 `default_admin.enabled` 必须为 `false`
- 开发环境若不配置密钥，系统自动生成临时值（每次重启失效）

完整配置字段定义见 `internal/config/app_config.go`。完整环境变量清单见 `docs/deploy/DEPLOYMENT.md`。

---

## 7. 中间件链路

每条请求经过的中间件顺序：

```
Rate Limiter → CORS → i18n 翻译 → 操作日志 → 安全头
    ↓（需要认证的路由）
Auth（JWT 验证 + Redis session 校验 + auth_version 校验）
    ↓
Tenant（注入 tenant_db 到 Context）
    ↓
Authz（Casbin 路径级鉴权，仅 /system/* 和 /notifications/*）
```

认证中间件在以下情况返回 `401`：

- Token 不存在或格式错误
- Redis session 已不存在（被踢出或过期）
- `claims.auth_version < redis:auth:version:{userID}`（软刷新触发点）
- Token 签发时间早于 `auth:revoked_after:{userID}`（强制失效）

详细规则见 `docs/auth/AUTH_SESSION_STRATEGY.md`。

---

## 8. 多数据库支持

支持的数据库类型：`mysql` / `postgresql` / `sqlite` / `mssql`

- **主库**：由 `master_db.*` 配置，存储平台级数据（租户主档、Auth、系统管理数据）
- **租户库**：每租户独立连接，由 `database.Manager` 动态管理，支持热重载
- **监控库**：可选，由 `monitor_db.*` 配置，用于存储历史监控快照

租户库接入必须经过初始化向导（`POST /api/v1/tenants/setup`），初始化时执行所有已注册的 13 个租户迁移器。

---

## 8.1 支撑模块与运行时装配

除了 `auth / tenant / system` 三条主线，当前后端还包含几类关键支撑能力：

- `notification`：通知发送、模板、异步任务与租户迁移接入；
- `monitorDB`：监控快照的独立存储；
- `storage`：本地与 `S3` 存储适配；
- `tenant migrators`：把新模块标准化接入租户初始化流程。

这些能力虽然不是平台三条主线之一，但都参与启动装配和运行时协作，因此阅读架构时不应忽略。

---

## 9. 开发验证命令

```bash
# 在 backend/ 目录下执行

make build           # 构建二进制
make test            # 运行全量测试
make verify          # 命名检查 + 测试
make naming          # 仅运行命名规范检查
make swagger         # 重新生成 Swagger 文档
make migrate-only    # 仅执行迁移后退出（用于生产初始化）
make format          # gofmt + go vet
make lint            # 代码检查
```

在 Windows PowerShell 环境中若 `make` 不可用：

```powershell
$env:GOCACHE = (Resolve-Path .).Path + '\.gocache'
cd backend
go test ./...
gofmt -w ./internal/...
```

---

## 10. 工具集（`cmd/tools/`）

| 工具目录 | 用途 |
| :--- | :--- |
| `hash-password` | 生成 bcrypt 哈希密码（初始化用） |
| `seed-system-data` | 注入系统基础数据（角色、菜单、权限） |
| `setup-default-tenant` | 初始化默认租户和管理员 |
| `verify-conn` | 验证数据库连接 |
| `import-sql` | 导入 SQL 文件到指定库 |
| `check-admin-permissions` | 检查 admin 的 Casbin 策略是否正确 |
| `check-backend-naming` | 检查后端文件命名规范 |

工具配置从 `cmd/tools/tools.env` 读取，参考 `cmd/tools/tools.env.example`。
