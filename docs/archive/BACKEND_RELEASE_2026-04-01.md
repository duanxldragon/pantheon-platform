# Backend 发布与迁移执行说明

> 适用范围：`2026-04-01` 当前这轮后端安全、认证、Casbin、多租户、角色 schema 与事务一致性整改后的上线执行。

## 1. 本轮变更重点

- 认证与会话链路收紧：
  `JWT secret`、默认管理员兜底、`access/refresh` 会话配对、`auth_version`、`revoked_after` 已统一接入。
- Casbin 与数据权限补全：
  角色 `data_scope` 已贯通到用户、日志等查询链路，并支持受控语法：
  `dept:`、`dept_and_sub:`、`project:`、`custom:field=value`。
- 多租户隔离补强：
  `tenant middleware`、`dict` 读写租户隔离、`dict` 租户内唯一索引迁移已补齐。
- 角色模型补强：
  `system_roles.data_scope` 长度已扩到 `255`，并把 `name/code` 从全局唯一修正为租户内唯一。
- 事务一致性补强：
  用户、角色、菜单、权限、设置、通知等关键联动写操作已改为事务内执行。
- 租户数据库重载容错：
  对 `Unknown database` 场景不再视为连接故障，而是标记为“等待初始化完成”。

## 2. 发布前检查

- 配置检查：
  确认 `backend/config.yaml` 与 `backend/config.yaml.example` 中，已显式设置 `jwt_secret`、主库/租户库连接、Redis、CORS、`multi_tenant.encryption_key`。
- 数据备份：
  备份主库、全部租户库，以及 Redis 中会影响登录态和授权态的键。
- 权限检查：
  部署账号需要具备建表、改表、索引变更权限。
- 发布窗口：
  本轮包含主库和租户库 schema 修正，建议在低峰窗口执行。

## 3. 推荐执行顺序

### 方案 A：使用 Makefile

```bash
cd backend
make migrate-only
make test
```

### 方案 B：直接执行 Go 命令

```powershell
cd backend
$env:GOCACHE = (Resolve-Path .gocache)
$env:PANTHEON_MIGRATE_ONLY = "true"
go run ./cmd/server
Remove-Item Env:PANTHEON_MIGRATE_ONLY
go test ./...
```

## 4. 迁移会执行什么

应用启动到迁移阶段后，会自动执行以下动作：

- 主库 `AutoMigrate`
- 主库 `dict` schema 修正
  从历史“全局唯一索引”调整为“租户内复合唯一索引”
- 主库 `role` schema 修正
  从历史“全局唯一索引”调整为“租户内复合唯一索引”，并提升 `data_scope` 字段长度
- 已连接租户库 `AutoMigrate`
- `dict_type` 租户迁移版本提升到 `v2`
- `role` 租户迁移版本提升到 `v2`
- 对新增或未迁移租户自动补齐 `dict` / `role` 索引修复

本轮最需要关注的 schema 变化：

- `system_dict_types`
  - 旧行为：`name/code` 全局唯一
  - 新行为：`tenant_id + name`、`tenant_id + code` 唯一
- `system_roles`
  - 旧行为：`name/code` 全局唯一，`data_scope` 长度 `32`
  - 新行为：`tenant_id + name`、`tenant_id + code` 唯一，`data_scope` 长度 `255`

## 5. 发布后验证

至少执行以下验证：

- 认证验证：
  正常登录、刷新 token、退出登录，确认旧会话失效逻辑正常。
- Casbin 验证：
  调整角色权限后，确认在线用户权限能随 `auth_version` 刷新。
- 数据权限验证：
  用 `self`、`dept`、`dept_and_sub`、`custom` 角色分别访问用户与日志列表，确认范围正确。
- 自定义数据范围验证：
  创建 `project:`、`custom:department_id=@department_and_sub_ids` 角色，确认保存、读取和查询过滤都正常。
- 多租户验证：
  在两个租户下创建相同 `dict type code/name` 和相同 `role code/name`，确认互不冲突。
- 通知验证：
  触发发送和失败重试，确认 `notification_jobs` 与 `notifications` 状态一致。
- 租户重载验证：
  对尚未初始化完数据库的租户，确认日志表现为 `waiting for setup`，而不是持续刷 `Unknown database`。

## 6. 回滚注意点

- 代码回滚前，先确认是否已经执行过 `dict` 和 `role` 索引迁移。
- 本轮 `dict` / `role` 索引修复是从“错误的全局唯一”改成“正确的租户内唯一”，通常不建议回滚 schema。
- 如必须回滚应用版本，优先保留新的 `dict` / `role` 索引结构，只回滚应用二进制。
- 如 Redis 中已经写入新的 `auth_version` / `revoked_after` 状态，回滚后要重点验证旧版本兼容性。

## 7. 后续建议

- `project:` / `custom:` 数据范围语法已经收敛到可解析白名单表达式，但下游 DAO 仍需持续按字段过滤契约接入。
- 如果后续要把自定义数据范围开放给前端配置，需要同步补上 DTO 校验和界面输入约束。
- 建议把本文档作为本轮上线 checklist 的唯一执行说明，避免口头拆分步骤。

## 8. 生产迁移执行命令清单

以下步骤默认在项目根目录执行，目标环境已准备好 `backend/config.yaml`。

### 8.1 发布前备份

```powershell
cd backend
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Output "backup-start-$timestamp"
```

建议至少执行：

- 备份主库
- 备份全部租户库
- 导出 Redis 中与认证态相关的键

Redis 键重点关注：

- `auth:version:*`
- `auth:revoked_after:*`
- `refresh_token:*`
- `session:*`

### 8.2 发布前最小检查

```powershell
cd backend
$env:GOCACHE = (Resolve-Path .gocache)
go test ./...
```

如果目标环境不适合全量测试，至少执行：

```powershell
cd backend
$env:GOCACHE = (Resolve-Path .gocache)
go test ./internal/modules/auth ./internal/modules/tenant ./internal/modules/system/role ./internal/shared/authorization
```

### 8.3 仅执行迁移

```powershell
cd backend
$env:GOCACHE = (Resolve-Path .gocache)
$env:PANTHEON_MIGRATE_ONLY = "true"
go run ./cmd/server
Remove-Item Env:PANTHEON_MIGRATE_ONLY
```

如果使用 Makefile：

```bash
cd backend
make migrate-only
```

### 8.4 迁移后重点观察日志

重点确认日志中没有以下异常持续出现：

- `Unknown database`
- `failed to migrate`
- `duplicate key`
- `failed to initialize authorization service`

允许出现但应为温和提示的日志：

- `database is not ready during reload; waiting for setup`

### 8.5 启动服务

```powershell
cd backend
$env:GOCACHE = (Resolve-Path .gocache)
go run ./cmd/server
```

### 8.6 发布后烟雾验证

建议按顺序验证：

1. 健康检查

```powershell
curl http://127.0.0.1:8080/health
```

2. 正常登录、刷新 token、退出登录
3. 角色权限变更后检查在线用户权限是否刷新
4. 用 `self` / `dept` / `dept_and_sub` / `custom` 角色验证数据范围
5. 验证两个不同租户下可创建相同 `dict code/name` 与 `role code/name`
6. 验证未初始化租户不会持续刷 `Unknown database`

### 8.7 建议的回滚顺序

如果发布后必须回滚，建议顺序如下：

1. 先停止新版本应用
2. 保留已经完成的 `dict` / `role` 索引修复，不回滚 schema
3. 回滚应用二进制到上一稳定版本
4. 验证旧版本是否兼容：
   - `auth:version:*`
   - `auth:revoked_after:*`
5. 重新执行登录、刷新、权限刷新验证

### 8.8 本轮建议提交拆分

如果要整理提交，建议按下面拆：

1. `fix(auth): harden session and authorization refresh flow`
2. `fix(tenant): tolerate tenant databases that are not initialized yet`
3. `fix(system): enforce tenant-safe dict and role schema rules`
4. `fix(authz): complete casbin custom data scope parsing`
5. `docs(backend): add release and migration runbook`

### 8.9 建议按文件分组提交

为了避免一次提交过大，建议按下面的文件范围整理：

1. `fix(auth): harden session and authorization refresh flow`
   - `backend/internal/modules/auth/`
   - `backend/internal/shared/middleware/auth_middleware.go`
   - `backend/internal/shared/middleware/authorization_middleware.go`
   - `backend/internal/shared/middleware/rate_limiter_middleware.go`
   - `backend/internal/shared/response/http_response.go`
   - `backend/internal/config/app_config.go`

2. `fix(tenant): tolerate tenant databases that are not initialized yet`
   - `backend/internal/modules/tenant/`
   - `backend/internal/shared/database/database_manager.go`
   - `backend/internal/shared/database/factory/database_factory.go`
   - `backend/internal/shared/database/tenant_migration.go`
   - `backend/internal/shared/database/transaction_manager.go`
   - `backend/internal/app/app_bootstrap.go`

3. `fix(system): enforce tenant-safe dict and role schema rules`
   - `backend/internal/modules/system/dict/`
   - `backend/internal/modules/system/role/`
   - `backend/internal/modules/system/container/system_container.go`
   - `backend/internal/shared/database/base_dao.go`
   - `backend/internal/shared/validator/gin_binding.go`
   - `backend/internal/shared/validator/gin_binding_test.go`

4. `fix(authz): complete casbin custom data scope parsing`
   - `backend/internal/shared/authorization/casbin_service.go`
   - `backend/internal/shared/authorization/casbin_service_test.go`
   - `backend/internal/modules/system/permission/`
   - `backend/internal/modules/system/user/`
   - `backend/internal/modules/system/log/`

5. `docs(backend): refresh guides, release runbook, and swagger coverage`
   - `backend/README.md`
   - `backend/BACKEND_GUIDE.md`
   - `backend/BACKEND_GUIDE.en.md`
   - `backend/docs/AGENTS.md`
   - `backend/docs/BACKEND_DOCS_INDEX.md`
   - `backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md`
   - `backend/docs/auth/AUTH_BACKEND.md`
   - `backend/docs/system/SYSTEM_BACKEND.md`
   - `backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md`
   - `backend/docs/tenant/TENANT_BACKEND.md`

如果实际提交时发现某些文件存在强耦合，以“迁移文件 + 对应 service/dao + 对应测试”一起提交为准，不要为了机械拆分破坏可回滚性。

### 8.10 Backend-only 提交命令示例

以下命令只作为整理提交的参考模板，默认在项目根目录执行，不会把 `frontend/` 改动混入后端提交。

#### 提交 1：认证与会话链路

```powershell
git add `
  backend/internal/modules/auth `
  backend/internal/shared/middleware/auth_middleware.go `
  backend/internal/shared/middleware/authorization_middleware.go `
  backend/internal/shared/middleware/rate_limiter_middleware.go `
  backend/internal/shared/response/http_response.go `
  backend/internal/config/app_config.go
git diff --cached --stat
git commit -m "fix(auth): harden session and authorization refresh flow"
```

#### 提交 2：租户数据库未初始化容错与迁移链路

```powershell
git add `
  backend/internal/modules/tenant `
  backend/internal/shared/database/database_manager.go `
  backend/internal/shared/database/factory/database_factory.go `
  backend/internal/shared/database/tenant_migration.go `
  backend/internal/shared/database/transaction_manager.go `
  backend/internal/app/app_bootstrap.go
git diff --cached --stat
git commit -m "fix(tenant): tolerate tenant databases that are not initialized yet"
```

#### 提交 3：系统模块 schema 与校验收口

```powershell
git add `
  backend/internal/modules/system/dict `
  backend/internal/modules/system/role `
  backend/internal/modules/system/container/system_container.go `
  backend/internal/shared/database/base_dao.go `
  backend/internal/shared/validator/gin_binding.go `
  backend/internal/shared/validator/gin_binding_test.go
git diff --cached --stat
git commit -m "fix(system): enforce tenant-safe dict and role schema rules"
```

#### 提交 4：Casbin 数据权限与下游查询接入

```powershell
git add `
  backend/internal/shared/authorization/casbin_service.go `
  backend/internal/shared/authorization/casbin_service_test.go `
  backend/internal/modules/system/permission `
  backend/internal/modules/system/user `
  backend/internal/modules/system/log
git diff --cached --stat
git commit -m "fix(authz): complete casbin custom data scope parsing"
```

#### 提交 5：文档与 Swagger 入口同步

```powershell
git add `
  backend/README.md `
  backend/BACKEND_GUIDE.md `
  backend/BACKEND_GUIDE.en.md `
  backend/docs/AGENTS.md `
  backend/docs/BACKEND_DOCS_INDEX.md `
  backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md `
  backend/docs/auth/AUTH_BACKEND.md `
  backend/docs/system/SYSTEM_BACKEND.md `
  backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md `
  backend/docs/tenant/TENANT_BACKEND.md `
  backend/api/swagger `
  backend/internal/app/swagger.go `
  backend/internal/modules/auth/swagger.go `
  backend/internal/modules/notification/swagger.go `
  backend/internal/modules/system/dept/swagger.go `
  backend/internal/modules/system/dict/swagger.go `
  backend/internal/modules/system/log/swagger.go `
  backend/internal/modules/system/menu/swagger.go `
  backend/internal/modules/system/monitor/swagger.go `
  backend/internal/modules/system/permission/swagger.go `
  backend/internal/modules/system/position/swagger.go `
  backend/internal/modules/system/role/swagger.go `
  backend/internal/modules/system/setting/swagger.go `
  backend/internal/modules/system/user/swagger.go `
  backend/internal/modules/tenant/swagger.go `
  backend/internal/shared/i18n/swagger.go
git diff --cached --stat
git commit -m "docs(backend): refresh guides, release runbook, and swagger coverage"
```

#### 提交前最后检查

```powershell
git status --short
git log --oneline -5
```

如果某次 `git add` 误把无关文件加入暂存区，先执行：

```powershell
git restore --staged <path>
```

然后重新按上面的 backend 路径分组暂存。

### 8.11 按当前工作区实际变更的推荐提交顺序

基于当前 `git status --short -- backend` 的结果，当前后端变更已经超过单一主题，实际更适合按下面顺序整理：

1. `fix(auth): harden auth, api-key, and session guards`
   - 主要包含：
     - `backend/internal/modules/auth/`
     - `backend/internal/shared/middleware/auth_middleware.go`
     - `backend/internal/shared/middleware/authorization_middleware.go`
     - `backend/internal/shared/middleware/rate_limiter_middleware.go`
     - `backend/internal/shared/response/http_response.go`
     - `backend/internal/config/app_config.go`
   - 说明：
     这一组优先落认证、安全头、会话刷新和 API Key 链路，便于单独回归登录、刷新、登出和 2FA。

2. `fix(tenant): stabilize tenant database lifecycle and backup flow`
   - 主要包含：
     - `backend/internal/modules/tenant/`
     - `backend/internal/shared/database/database_manager.go`
     - `backend/internal/shared/database/factory/database_factory.go`
     - `backend/internal/shared/database/tenant_migration.go`
     - `backend/internal/shared/database/transaction_manager.go`
     - `backend/internal/shared/middleware/tenant_middleware.go`
     - `backend/internal/app/app_bootstrap.go`
   - 说明：
     这一组单独承载租户数据库 reload、`Unknown database` 容错、迁移注册和备份恢复链路。

3. `fix(notification): enforce notification transaction consistency`
   - 主要包含：
     - `backend/internal/modules/notification/`
     - `backend/internal/modules/notification/service_test.go`
   - 说明：
     如果你希望把通知事务一致性单独回滚或单独回归，这组建议独立提交。

4. `fix(system): align system module dto, handlers, and batch flows`
   - 主要包含：
     - `backend/internal/modules/system/dept/`
     - `backend/internal/modules/system/menu/`
     - `backend/internal/modules/system/position/`
     - `backend/internal/modules/system/setting/`
     - `backend/internal/modules/system/user/`
     - `backend/internal/modules/system/permission/`
     - `backend/internal/modules/system/monitor/`
     - `backend/internal/modules/system/container/system_container.go`
   - 说明：
     这一组主要是系统管理模块的接口、批量操作、查询和路由接入一致性。

5. `fix(system): enforce tenant-safe dict and role schema rules`
   - 主要包含：
     - `backend/internal/modules/system/dict/`
     - `backend/internal/modules/system/role/`
     - `backend/internal/shared/database/base_dao.go`
     - `backend/internal/shared/validator/gin_binding.go`
     - `backend/internal/shared/validator/gin_binding_test.go`
   - 说明：
     这一组承载 `dict` / `role` 迁移、唯一索引修复、`data_scope` 长度扩容和 `codefmt` 校验器。

6. `fix(authz): complete casbin data scope parsing and query integration`
   - 主要包含：
     - `backend/internal/shared/authorization/casbin_service.go`
     - `backend/internal/shared/authorization/casbin_service_test.go`
     - `backend/internal/modules/system/log/`
     - `backend/internal/shared/i18n/`
   - 说明：
     如果你希望让 Casbin 数据范围和下游查询过滤在提交上保持同一主题，这组建议独立。

7. `docs(backend): refresh guides, swagger coverage, and migration runbook`
   - 主要包含：
     - `backend/README.md`
     - `backend/BACKEND_GUIDE.md`
     - `backend/BACKEND_GUIDE.en.md`
     - `backend/docs/`
     - `backend/Makefile`
     - `backend/api/swagger/`
     - `backend/internal/app/swagger.go`
     - 各模块 `swagger.go`
     - `backend/scripts/demo/demo_menus_permissions.sql`
   - 说明：
     这一组最后提交，避免在前面的功能提交里混入大批文档与生成产物。

如果你希望进一步压缩提交数量，也可以把第 3 组并入第 1 组，把第 6 组并入第 5 组，最终收敛为 5 个 backend 提交。

### 8.12 当前 backend 实际文件清单与提交映射

下面基于当前工作区真实变更给出一版更细的提交映射。后续如果有新增改动，按主题追加到对应分组即可。

#### Commit 1 - `fix(auth): harden auth, api-key, and session guards`

- `backend/internal/config/app_config.go`
- `backend/internal/modules/auth/api_key_middleware.go`
- `backend/internal/modules/auth/api_key_service.go`
- `backend/internal/modules/auth/auth_service.go`
- `backend/internal/modules/auth/auth_service_test.go`
- `backend/internal/modules/auth/dto.go`
- `backend/internal/modules/auth/handler.go`
- `backend/internal/modules/auth/service.go`
- `backend/internal/modules/auth/session_service.go`
- `backend/internal/modules/auth/two_factor_service.go`
- `backend/internal/shared/middleware/auth_middleware.go`
- `backend/internal/shared/middleware/authorization_middleware.go`
- `backend/internal/shared/middleware/cors_middleware.go`
- `backend/internal/shared/middleware/rate_limiter_middleware.go`
- `backend/internal/shared/response/http_response.go`

#### Commit 2 - `fix(tenant): stabilize tenant database lifecycle and backup flow`

- `backend/internal/app/app_bootstrap.go`
- `backend/internal/modules/tenant/backup_service.go`
- `backend/internal/modules/tenant/backup_service_test.go`
- `backend/internal/modules/tenant/dto.go`
- `backend/internal/modules/tenant/handler.go`
- `backend/internal/modules/tenant/quota_model.go`
- `backend/internal/modules/tenant/router.go`
- `backend/internal/modules/tenant/service.go`
- `backend/internal/modules/tenant/swagger.go`
- `backend/internal/shared/database/database_manager.go`
- `backend/internal/shared/database/factory/database_factory.go`
- `backend/internal/shared/database/tenant_migration.go`
- `backend/internal/shared/database/transaction_manager.go`
- `backend/internal/shared/middleware/tenant_middleware.go`

#### Commit 3 - `fix(notification): enforce notification transaction consistency`

- `backend/internal/modules/notification/dao.go`
- `backend/internal/modules/notification/dto.go`
- `backend/internal/modules/notification/handler.go`
- `backend/internal/modules/notification/service.go`
- `backend/internal/modules/notification/service_test.go`
- `backend/internal/modules/notification/swagger.go`

#### Commit 4 - `fix(system): align system module dto, handlers, and batch flows`

- `backend/internal/modules/system/container/system_container.go`
- `backend/internal/modules/system/dept/dto.go`
- `backend/internal/modules/system/dept/handler.go`
- `backend/internal/modules/system/dept/router.go`
- `backend/internal/modules/system/dept/service.go`
- `backend/internal/modules/system/dept/service_batch_test.go`
- `backend/internal/modules/system/dept/swagger.go`
- `backend/internal/modules/system/menu/dto.go`
- `backend/internal/modules/system/menu/handler.go`
- `backend/internal/modules/system/menu/router.go`
- `backend/internal/modules/system/menu/service.go`
- `backend/internal/modules/system/menu/service_test.go`
- `backend/internal/modules/system/menu/swagger.go`
- `backend/internal/modules/system/monitor/handler.go`
- `backend/internal/modules/system/monitor/service.go`
- `backend/internal/modules/system/monitor/swagger.go`
- `backend/internal/modules/system/permission/dto.go`
- `backend/internal/modules/system/permission/handler.go`
- `backend/internal/modules/system/permission/router.go`
- `backend/internal/modules/system/permission/service.go`
- `backend/internal/modules/system/permission/service_test.go`
- `backend/internal/modules/system/permission/swagger.go`
- `backend/internal/modules/system/position/dto.go`
- `backend/internal/modules/system/position/handler.go`
- `backend/internal/modules/system/position/router.go`
- `backend/internal/modules/system/position/service.go`
- `backend/internal/modules/system/position/service_batch_test.go`
- `backend/internal/modules/system/position/swagger.go`
- `backend/internal/modules/system/setting/dto.go`
- `backend/internal/modules/system/setting/handler.go`
- `backend/internal/modules/system/setting/service.go`
- `backend/internal/modules/system/setting/service_test.go`
- `backend/internal/modules/system/setting/swagger.go`
- `backend/internal/modules/system/user/dto.go`
- `backend/internal/modules/system/user/handler.go`
- `backend/internal/modules/system/user/handler_test.go`
- `backend/internal/modules/system/user/router.go`
- `backend/internal/modules/system/user/service.go`
- `backend/internal/modules/system/user/service_batch_test.go`
- `backend/internal/modules/system/user/service_test.go`
- `backend/internal/modules/system/user/swagger.go`

#### Commit 5 - `fix(system): enforce tenant-safe dict and role schema rules`

- `backend/internal/modules/system/dict/dao.go`
- `backend/internal/modules/system/dict/dto.go`
- `backend/internal/modules/system/dict/handler.go`
- `backend/internal/modules/system/dict/handler_test.go`
- `backend/internal/modules/system/dict/migration.go`
- `backend/internal/modules/system/dict/migration_test.go`
- `backend/internal/modules/system/dict/model.go`
- `backend/internal/modules/system/dict/service.go`
- `backend/internal/modules/system/dict/service_test.go`
- `backend/internal/modules/system/dict/swagger.go`
- `backend/internal/modules/system/role/dao.go`
- `backend/internal/modules/system/role/dto.go`
- `backend/internal/modules/system/role/handler.go`
- `backend/internal/modules/system/role/migration.go`
- `backend/internal/modules/system/role/model.go`
- `backend/internal/modules/system/role/router.go`
- `backend/internal/modules/system/role/service.go`
- `backend/internal/modules/system/role/service_test.go`
- `backend/internal/modules/system/role/swagger.go`
- `backend/internal/shared/database/base_dao.go`
- `backend/internal/shared/validator/gin_binding.go`
- `backend/internal/shared/validator/gin_binding_test.go`

#### Commit 6 - `fix(authz): complete casbin data scope parsing and query integration`

- `backend/internal/shared/authorization/casbin_service.go`
- `backend/internal/shared/authorization/casbin_service_test.go`
- `backend/internal/modules/system/log/dao.go`
- `backend/internal/modules/system/log/dto.go`
- `backend/internal/modules/system/log/handler.go`
- `backend/internal/modules/system/log/service.go`
- `backend/internal/modules/system/log/service_test.go`
- `backend/internal/modules/system/log/swagger.go`
- `backend/internal/shared/i18n/i18n_handler.go`
- `backend/internal/shared/i18n/i18n_translator.go`
- `backend/internal/shared/i18n/swagger.go`

#### Commit 7 - `docs(backend): refresh guides, swagger coverage, and migration runbook`

- `backend/README.md`
- `backend/BACKEND_GUIDE.md`
- `backend/BACKEND_GUIDE.en.md`
- `backend/Makefile`
- `backend/api/swagger/docs.go`
- `backend/api/swagger/swagger.json`
- `backend/api/swagger/swagger.yaml`
- `backend/docs/AGENTS.md`
- `backend/docs/BACKEND_DOCS_INDEX.md`
- `backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md`
- `backend/docs/auth/AUTH_BACKEND.md`
- `backend/docs/system/SYSTEM_BACKEND.md`
- `backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md`
- `backend/docs/tenant/TENANT_BACKEND.md`
- `backend/internal/app/swagger.go`
- `backend/internal/modules/auth/swagger.go`
- `backend/internal/modules/notification/swagger.go`
- `backend/internal/modules/system/dept/swagger.go`
- `backend/internal/modules/system/dict/swagger.go`
- `backend/internal/modules/system/log/swagger.go`
- `backend/internal/modules/system/menu/swagger.go`
- `backend/internal/modules/system/monitor/swagger.go`
- `backend/internal/modules/system/permission/swagger.go`
- `backend/internal/modules/system/position/swagger.go`
- `backend/internal/modules/system/role/swagger.go`
- `backend/internal/modules/system/setting/swagger.go`
- `backend/internal/modules/system/user/swagger.go`
- `backend/internal/modules/tenant/swagger.go`
- `backend/internal/shared/i18n/swagger.go`
- `backend/scripts/demo/demo_menus_permissions.sql`

说明：

- 如果你不想保留 7 个提交，优先把 Commit 3 并入 Commit 1，把 Commit 6 并入 Commit 5。
- `swagger.go` 与 `api/swagger/` 属于生成产物，建议统一放到最后一个文档/生成产物提交，避免污染功能提交的 diff。
- 当前 `git` 输出里有 CRLF / LF 提示，这属于工作区换行风格提醒，不是本轮代码逻辑错误。

### 8.13 可直接执行的 backend 暂存命令模板

以下命令默认在项目根目录执行，使用 PowerShell 反引号换行。每组执行后，先看 `git diff --cached --stat`，确认无误再提交。

#### Stage Commit 1

```powershell
git add -- `
  backend/internal/config/app_config.go `
  backend/internal/modules/auth/api_key_middleware.go `
  backend/internal/modules/auth/api_key_service.go `
  backend/internal/modules/auth/auth_service.go `
  backend/internal/modules/auth/auth_service_test.go `
  backend/internal/modules/auth/dto.go `
  backend/internal/modules/auth/handler.go `
  backend/internal/modules/auth/service.go `
  backend/internal/modules/auth/session_service.go `
  backend/internal/modules/auth/two_factor_service.go `
  backend/internal/shared/middleware/auth_middleware.go `
  backend/internal/shared/middleware/authorization_middleware.go `
  backend/internal/shared/middleware/cors_middleware.go `
  backend/internal/shared/middleware/rate_limiter_middleware.go `
  backend/internal/shared/response/http_response.go
git diff --cached --stat
git commit -m "fix(auth): harden auth, api-key, and session guards"
```

#### Stage Commit 2

```powershell
git add -- `
  backend/internal/app/app_bootstrap.go `
  backend/internal/modules/tenant/backup_service.go `
  backend/internal/modules/tenant/backup_service_test.go `
  backend/internal/modules/tenant/dto.go `
  backend/internal/modules/tenant/handler.go `
  backend/internal/modules/tenant/quota_model.go `
  backend/internal/modules/tenant/router.go `
  backend/internal/modules/tenant/service.go `
  backend/internal/modules/tenant/swagger.go `
  backend/internal/shared/database/database_manager.go `
  backend/internal/shared/database/factory/database_factory.go `
  backend/internal/shared/database/tenant_migration.go `
  backend/internal/shared/database/transaction_manager.go `
  backend/internal/shared/middleware/tenant_middleware.go
git diff --cached --stat
git commit -m "fix(tenant): stabilize tenant database lifecycle and backup flow"
```

#### Stage Commit 3

```powershell
git add -- `
  backend/internal/modules/notification/dao.go `
  backend/internal/modules/notification/dto.go `
  backend/internal/modules/notification/handler.go `
  backend/internal/modules/notification/service.go `
  backend/internal/modules/notification/service_test.go `
  backend/internal/modules/notification/swagger.go
git diff --cached --stat
git commit -m "fix(notification): enforce notification transaction consistency"
```

#### Stage Commit 4

```powershell
git add -- `
  backend/internal/modules/system/container/system_container.go `
  backend/internal/modules/system/dept/dto.go `
  backend/internal/modules/system/dept/handler.go `
  backend/internal/modules/system/dept/router.go `
  backend/internal/modules/system/dept/service.go `
  backend/internal/modules/system/dept/service_batch_test.go `
  backend/internal/modules/system/dept/swagger.go `
  backend/internal/modules/system/menu/dto.go `
  backend/internal/modules/system/menu/handler.go `
  backend/internal/modules/system/menu/router.go `
  backend/internal/modules/system/menu/service.go `
  backend/internal/modules/system/menu/service_test.go `
  backend/internal/modules/system/menu/swagger.go `
  backend/internal/modules/system/monitor/handler.go `
  backend/internal/modules/system/monitor/service.go `
  backend/internal/modules/system/monitor/swagger.go `
  backend/internal/modules/system/permission/dto.go `
  backend/internal/modules/system/permission/handler.go `
  backend/internal/modules/system/permission/router.go `
  backend/internal/modules/system/permission/service.go `
  backend/internal/modules/system/permission/service_test.go `
  backend/internal/modules/system/permission/swagger.go `
  backend/internal/modules/system/position/dto.go `
  backend/internal/modules/system/position/handler.go `
  backend/internal/modules/system/position/router.go `
  backend/internal/modules/system/position/service.go `
  backend/internal/modules/system/position/service_batch_test.go `
  backend/internal/modules/system/position/swagger.go `
  backend/internal/modules/system/setting/dto.go `
  backend/internal/modules/system/setting/handler.go `
  backend/internal/modules/system/setting/service.go `
  backend/internal/modules/system/setting/service_test.go `
  backend/internal/modules/system/setting/swagger.go `
  backend/internal/modules/system/user/dto.go `
  backend/internal/modules/system/user/handler.go `
  backend/internal/modules/system/user/handler_test.go `
  backend/internal/modules/system/user/router.go `
  backend/internal/modules/system/user/service.go `
  backend/internal/modules/system/user/service_batch_test.go `
  backend/internal/modules/system/user/service_test.go `
  backend/internal/modules/system/user/swagger.go
git diff --cached --stat
git commit -m "fix(system): align system module dto, handlers, and batch flows"
```

#### Stage Commit 5

```powershell
git add -- `
  backend/internal/modules/system/dict/dao.go `
  backend/internal/modules/system/dict/dto.go `
  backend/internal/modules/system/dict/handler.go `
  backend/internal/modules/system/dict/handler_test.go `
  backend/internal/modules/system/dict/migration.go `
  backend/internal/modules/system/dict/migration_test.go `
  backend/internal/modules/system/dict/model.go `
  backend/internal/modules/system/dict/service.go `
  backend/internal/modules/system/dict/service_test.go `
  backend/internal/modules/system/dict/swagger.go `
  backend/internal/modules/system/role/dao.go `
  backend/internal/modules/system/role/dto.go `
  backend/internal/modules/system/role/handler.go `
  backend/internal/modules/system/role/migration.go `
  backend/internal/modules/system/role/model.go `
  backend/internal/modules/system/role/router.go `
  backend/internal/modules/system/role/service.go `
  backend/internal/modules/system/role/service_test.go `
  backend/internal/modules/system/role/swagger.go `
  backend/internal/shared/database/base_dao.go `
  backend/internal/shared/validator/gin_binding.go `
  backend/internal/shared/validator/gin_binding_test.go
git diff --cached --stat
git commit -m "fix(system): enforce tenant-safe dict and role schema rules"
```

#### Stage Commit 6

```powershell
git add -- `
  backend/internal/shared/authorization/casbin_service.go `
  backend/internal/shared/authorization/casbin_service_test.go `
  backend/internal/modules/system/log/dao.go `
  backend/internal/modules/system/log/dto.go `
  backend/internal/modules/system/log/handler.go `
  backend/internal/modules/system/log/service.go `
  backend/internal/modules/system/log/service_test.go `
  backend/internal/modules/system/log/swagger.go `
  backend/internal/shared/i18n/i18n_handler.go `
  backend/internal/shared/i18n/i18n_translator.go `
  backend/internal/shared/i18n/swagger.go
git diff --cached --stat
git commit -m "fix(authz): complete casbin data scope parsing and query integration"
```

#### Stage Commit 7

```powershell
git add -- `
  backend/README.md `
  backend/BACKEND_GUIDE.md `
  backend/BACKEND_GUIDE.en.md `
  backend/Makefile `
  backend/api/swagger/docs.go `
  backend/api/swagger/swagger.json `
  backend/api/swagger/swagger.yaml `
  backend/docs/AGENTS.md `
  backend/docs/BACKEND_DOCS_INDEX.md `
  backend/docs/BACKEND_RELEASE_MIGRATION_RUNBOOK.md `
  backend/docs/auth/AUTH_BACKEND.md `
  backend/docs/system/SYSTEM_BACKEND.md `
  backend/docs/system/SYSTEM_SWAGGER_COVERAGE.md `
  backend/docs/tenant/TENANT_BACKEND.md `
  backend/internal/app/swagger.go `
  backend/internal/modules/auth/swagger.go `
  backend/internal/modules/notification/swagger.go `
  backend/internal/modules/system/dept/swagger.go `
  backend/internal/modules/system/dict/swagger.go `
  backend/internal/modules/system/log/swagger.go `
  backend/internal/modules/system/menu/swagger.go `
  backend/internal/modules/system/monitor/swagger.go `
  backend/internal/modules/system/permission/swagger.go `
  backend/internal/modules/system/position/swagger.go `
  backend/internal/modules/system/role/swagger.go `
  backend/internal/modules/system/setting/swagger.go `
  backend/internal/modules/system/user/swagger.go `
  backend/internal/modules/tenant/swagger.go `
  backend/scripts/demo/demo_menus_permissions.sql
git diff --cached --stat
git commit -m "docs(backend): refresh guides, swagger coverage, and migration runbook"
```

#### 如需撤销本组暂存

```powershell
git restore --staged -- .
```

如果你只想撤销个别文件，把 `.` 改成具体路径即可。
