# 后端命名规范

> 本文定义 `backend/` 下统一的命名与文件组织规则。  
> 目标是让业务模块、共享基础设施、工具脚本和启动装配都遵循同一套约定。

## 适用范围

本规范适用于：

- `backend/internal/modules/`
- `backend/internal/shared/`
- `backend/internal/app/`
- `backend/internal/config/`
- `backend/cmd/`
- `backend/scripts/`

以下生成产物可以保留生成器默认命名，例如：

- `backend/api/swagger/docs.go`

## 总体规则

- 文件名统一使用小写 `snake_case`
- 相同职责在不同模块中尽量使用相同文件名
- 主分层文件使用固定命名
- 补充文件统一使用 `<subject>_<kind>.go`
- 导出类型名必须体现具体业务语义，避免只叫 `Service`、`DAO`、`Handler`

## 主分层文件

业务模块统一使用以下固定文件名：

- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

示例：

```text
internal/modules/system/user/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
```

不要再引入这些平行命名：

- `repository.go`
- `controller.go`
- `entity.go`

例外规则：

- 聚合命名空间，例如 `internal/modules/system/`、`internal/modules/system/container/`，不需要强行补齐固定六层文件
- 纯模型命名空间，例如 `internal/modules/system/model/`，可以只保留模型相关文件
- 无持久化职责的运行态模块，例如 `internal/modules/system/monitor/`，可以省略 `dao.go` 或 `model.go`
- 历史兼容的元数据字段名可以保留，例如 `module_registry.go` 中的 `json:"repository"`，但这不代表代码层继续使用 `Repository` 命名

## 补充文件

当模块规模超过主分层文件承载范围时，统一使用：

```text
<subject>_<kind>.go
```

示例：

- `auth_service.go`
- `session_service.go`
- `api_key_service.go`
- `backup_service.go`
- `quota_service.go`
- `user_validation.go`
- `notification_mapper.go`
- `template_renderer.go`
- `tool_env.go`

### `subject` 选择规则

优先使用具体业务主题或技术主题：

- `auth`
- `session`
- `quota`
- `backup`
- `template`
- `notification`
- `tool`

避免使用过于空泛的主题：

- `common`
- `misc`
- `helper`

### `kind` 常用后缀

常见后缀包括：

- `service`
- `handler`
- `router`
- `middleware`
- `validator`
- `validation`
- `mapper`
- `renderer`
- `provider`
- `initializer`
- `manager`
- `factory`
- `record`
- `bootstrap`

## 类型命名

### DAO

统一优先使用 `DAO` 语义，不再混用 `Repository`。

推荐：

- `UserDAO`
- `SettingDAO`
- `TenantDAO`
- `NotificationDAO`

避免：

- `DAO`
- `Repository`

私有实现也要保留具体语义：

- `userDAO`
- `settingDAO`

构造函数与类型名保持一致：

- `NewUserDAO`
- `NewSettingDAO`

### Service

推荐：

- `AuthService`
- `TenantService`
- `MonitorService`

避免：

- `Service`

私有实现：

- `authService`
- `tenantService`
- `monitorService`

构造函数：

- `NewAuthService`
- `NewMonitorService`

### Handler

推荐：

- `AuthHandler`
- `SettingHandler`
- `NotificationHandler`

避免：

- `Handler`

构造函数：

- `NewAuthHandler`
- `NewSettingHandler`
- `NewNotificationHandler`

### Router

顶层路由类型不要泛化为单独 `Router`。

推荐：

- `AuthRouter`
- `SystemRouter`
- `NotificationRouter`

避免：

- `Router`

## 目录级规则

### `internal/modules/`

- 一个业务子域一个目录
- 新模块默认先落齐 `dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 当 `service.go` 过大时，再按子域拆成 `auth_service.go`、`session_service.go` 这类补充文件

### `internal/shared/`

- 继续使用 `snake_case`
- 共享基础设施优先使用“能力 + 类型”的命名，例如：
  - `cache_contract.go`
  - `redis_client.go`
  - `base_dao.go`
  - `database_initializer.go`
  - `platform_constants.go`
  - `application_errors.go`
  - `http_response.go`
  - `request_validator.go`
  - `storage_provider.go`
  - `data_masking.go`

### `internal/app/`

- 应用装配文件优先使用体现启动职责的命名
- 当前统一约定：
  - `app_bootstrap.go`

### `cmd/`

- 可执行入口文件保留 `main.go`
- 目录名必须表达工具用途，例如：
  - `check-admin-permissions`
  - `seed-system-data`
  - `setup-default-tenant`

工具目录内部辅助文件继续使用 `snake_case`，例如：

- `tool_env.go`

### `scripts/`

- SQL、Python、Shell、Batch 脚本统一使用 `snake_case`
- 初始化脚本优先使用 `init_<subject>.sql`
- 修复脚本优先使用 `fix_<subject>.sql`
- 插入或导入脚本优先使用 `insert_<subject>.py`
- 演示数据脚本可以使用 `demo_<subject>.sql`

## 推荐示例

### 小型模块

```text
internal/modules/example/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
```

### 中型模块

```text
internal/modules/auth/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
- auth_service.go
- session_service.go
- api_key_service.go
- two_factor_service.go
```

### 共享基础设施

```text
internal/shared/storage/
- storage_provider.go
- local_storage.go
- s3_storage.go
```

### 工具目录

```text
cmd/tools/
- check-backend-naming/
  - main.go
- import-sql/
  - main.go
- internal/
  - tool_env/
    - tool_env.go
```

## 反模式

避免使用以下文件名：

- `repository.go`
- `controller.go`
- `entity.go`
- `common.go`
- `util.go`
- `helpers.go`

避免使用以下类型名：

- `Repository`
- `Service`
- `Handler`
- `Router`

## 规范执行

推荐在以下场景运行命名检查：

- 大批量重命名后
- 新增模块后
- 合并与规范相关的改动前

命令：

```bash
go run ./cmd/tools/check-backend-naming
```

## 历史规范化结果

当前后端已完成以下典型收敛：

- `auth`、`tenant`、`notification` 已统一主分层文件名
- `system` 相关子模块已统一补齐 `router.go`
- 共享层已从 `shared_*`、`repository` 等历史命名收敛到能力化命名
- `cmd/tools/internal/toolenv/tool_env.go` 已收敛为 `cmd/tools/internal/tool_env/tool_env.go`
- `backend/scripts/demo/` 已统一为 `snake_case`

后续新增代码时，以本文为唯一命名基线。
