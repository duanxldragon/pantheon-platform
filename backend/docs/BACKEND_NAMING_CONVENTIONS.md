# 后端命名规范

> 本文定义 `backend/` 下的统一命名规则，保证业务模块、共享基础设施、工具脚本与启动装配都遵循同一套约定。

## 适用范围

本规范适用于：

- `backend/internal/modules/`
- `backend/internal/shared/`
- `backend/internal/app/`
- `backend/internal/config/`
- `backend/cmd/`
- `backend/scripts/`

以下生成产物可以保留生成器默认名称：

- `backend/api/swagger/docs.go`

## 总体原则

- 文件名统一使用小写 `snake_case`。
- 相同职责在不同模块中尽量使用相同文件名。
- 主分层文件使用固定名称，不随模块偏好变化。
- 补充文件统一使用 `<subject>_<kind>.go`。
- 导出类型名必须体现模块语义，避免只叫 `Service`、`Repository`、`Handler`。

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

统一优先使用 `DAO` 语义，而不是继续混用 `Repository`。

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

## 目录级规则

### `internal/modules/`

- 一个业务子域一个目录。
- 新模块默认先落齐 `dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`。
- 当 `service.go` 过大时，再按子域拆成 `auth_service.go`、`session_service.go` 这类补充文件。

### `internal/shared/`

- 继续使用 `snake_case`。
- 共享基础设施优先使用“能力 + 类型”命名：
  - `base_dao.go`
  - `database_initializer.go`
  - `storage_provider.go`
  - `data_masking.go`

### `internal/app/`

- 应用装配文件优先使用体现启动职责的名称。
- 当前统一约定：
  - `app_bootstrap.go`

### `cmd/`

- 可执行入口文件保留 `main.go`。
- 目录名必须表达工具用途，例如：
  - `check-admin-permissions`
  - `seed-system-data`
  - `setup-default-tenant`

工具目录内部的辅助文件仍使用 `snake_case`，例如：

- `tool_env.go`

### `scripts/`

- SQL、Python、Shell 脚本统一使用 `snake_case`。
- 初始化脚本优先使用 `init_<subject>.sql`。
- 修复脚本优先使用 `fix_<subject>.sql`。
- 插入或导入脚本优先使用 `insert_<subject>.py`。

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

## 反模式

避免使用以下文件名：

- `repository.go`
- `controller.go`
- `entity.go`
- `common.go`
- `util.go`
- `helpers.go`
- `misc.go`
- `temp.go`

这些名称的问题是：

- 语义过宽，无法体现职责；
- 不利于跨模块统一搜索；
- 容易让单文件继续堆积多种职责。

## 新增文件决策顺序

新增文件前，按以下顺序判断：

1. 是否可以继续放在现有 `dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go` 中？
2. 如果不能，是否可以按子域拆为 `<subject>_service.go` 或其他明确补充文件？
3. 如果是技术支撑代码，是否可以命名为 `<subject>_<kind>.go`？
4. 如果你想到的最佳名字仍然是 `common`、`util`、`helper`，说明职责还没拆清楚。

## 本次规范化改造结果

本轮后端规范化已经按本规范完成以下收敛：

- `auth` 模块统一为固定主分层文件，并拆分 `auth_service.go`、`session_service.go`、`api_key_service.go`、`login_attempt_service.go`、`two_factor_service.go`。
- `tenant` 模块统一为 `dao/dto/handler/model/router/service` 主分层，并补充按主题拆分的 `*_service.go`。
- `notification` 模块将 `repository.go` 收敛为 `dao.go`，并统一 `NotificationHandler` 命名。
- `system` 部分子模块统一导出类型和构造器命名，继续作为其他模块的参考实现。
- `internal/app/app.go` 统一为 `app_bootstrap.go`。
- 共享层统一为能力化命名，例如：
  - `base_repository.go` → `base_dao.go`
  - `database.go` → `database_initializer.go`
  - `storage.go` → `storage_provider.go`
  - `masking.go` → `data_masking.go`

## 规范摘要

后端当前统一规则如下：

- 主分层文件固定为：`dao.go`、`dto.go`、`handler.go`、`model.go`、`router.go`、`service.go`
- 补充文件固定为：`<subject>_<kind>.go`
- 工具入口保留：`main.go`
- 共享基础设施优先使用“能力 + 类型”语义命名
- 新增模块、新增共享能力、新增脚本，都必须先对齐本规范
