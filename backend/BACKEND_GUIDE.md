# Pantheon Platform 后端实现总览

> **基于 Go 1.23+ 的模块化后端工程**  
> Gin、GORM、Casbin、JWT、Redis、多租户隔离
>
> 命名规则见 `backend/docs/BACKEND_NAMING_CONVENTIONS.md`。  
> 文档入口见 `backend/docs/BACKEND_DOCS_INDEX.md`。

---

## 目录

1. [架构总览](#架构总览)
2. [模块组织](#模块组织)
3. [接口设计约定](#接口设计约定)
4. [数据库设计](#数据库设计)
5. [Casbin RBAC 设计](#casbin-rbac-设计)
6. [数据库初始化逻辑](#数据库初始化逻辑)
7. [认证与授权链路](#认证与授权链路)
8. [多租户架构](#多租户架构)
9. [i18n 错误处理](#i18n-错误处理)
10. [代码标准](#代码标准)
11. [新增业务模块流程](#新增业务模块流程)
12. [安全设计](#安全设计)
13. [性能与工程实践](#性能与工程实践)
14. [开发与验证](#开发与验证)
15. [本轮规范化总结](#本轮规范化总结)

---

## 架构总览

### 分层架构

```text
HTTP Request
  -> Middleware Chain
  -> Handler Layer
  -> Service Layer
  -> DAO Layer
  -> Model Layer
```

### 分层职责

- `Middleware`：恢复、日志、CORS、安全头、认证、租户绑定、授权
- `Handler`：解析参数、校验输入、调用服务、组装响应
- `Service`：业务规则、跨对象协作、事务边界
- `DAO`：所有数据库读写与查询封装
- `Model`：持久化结构、表映射、索引与标签

---

## 模块组织

每个业务模块统一采用固定主分层文件：

| 文件 | 职责 |
|:---|:---|
| `model.go` | GORM 模型与持久化映射 |
| `dto.go` | 请求和响应 DTO |
| `dao.go` | 数据访问封装 |
| `service.go` | 业务逻辑、校验、编排 |
| `handler.go` | HTTP 处理入口 |
| `router.go` | 路由注册 |

固定主分层文件名：

- `dao.go`
- `dto.go`
- `handler.go`
- `model.go`
- `router.go`
- `service.go`

当模块规模变大时，补充文件统一使用 `<subject>_<kind>.go`，例如：

- `session_service.go`
- `auth_service.go`
- `user_validation.go`
- `template_renderer.go`
- `database_initializer.go`

### 命令入口布局

- `cmd/server/`：正式服务入口
- `cmd/tools/`：初始化、诊断、修复、辅助工具
- 每个工具可执行入口继续保留 `main.go`
- 工具内部辅助文件继续使用 `snake_case`

---

## 接口设计约定

### REST 风格

资源命名使用复数名词和模块前缀：

```text
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/api-keys
POST   /api/v1/auth/api-keys
DELETE /api/v1/auth/api-keys/:id
POST   /api/v1/auth/2fa/enable
POST   /api/v1/auth/2fa/verify

# Tenants
GET    /api/v1/tenants/list
POST   /api/v1/tenants/register

# System - Users
GET    /api/v1/system/users
POST   /api/v1/system/users
GET    /api/v1/system/users/:id
PUT    /api/v1/system/users/:id
DELETE /api/v1/system/users/:id
PATCH  /api/v1/system/users/status
PATCH  /api/v1/system/users/:id/password

# Notifications
GET    /api/v1/notifications
POST   /api/v1/notifications/send
GET    /api/v1/notifications/inbox
GET    /api/v1/notifications/templates
```

### 统一响应格式

成功：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

分页成功：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 100,
      "total_pages": 10
    }
  }
}
```

错误：

```json
{
  "code": 40001,
  "message": "auth.login.invalid_credentials",
  "data": null
}
```

其中 `message` 字段约定为 i18n key，由前端按 `t(message)` 进行翻译。

---

## 数据库设计

### 主库 `pantheon_master`

| 表 | 用途 |
|:---|:---|
| `tenants` | 租户元数据 |
| `tenant_database_configs` | 租户数据库连接配置 |
| `tenant_quotas` | 租户配额 |
| `translations` | 国际化翻译数据 |
| `notifications` | 通知内容 |
| `notification_inboxes` | 用户收件箱状态 |
| `notification_templates` | 通知模板 |
| `notification_jobs` | 异步通知任务 |

### 租户库 `pantheon_{tenant_code}`

| 表 | 用途 |
|:---|:---|
| `users` | 用户 |
| `sys_roles` | 角色 |
| `sys_permissions` | 权限树 |
| `sys_user_roles` | 用户角色关系 |
| `sys_role_permissions` | 角色权限关系 |
| `sys_role_menus` | 角色菜单关系 |
| `sys_departments` | 部门树 |
| `sys_positions` | 岗位 |
| `sys_menus` | 菜单 |
| `sys_operation_logs` | 操作日志 |
| `sys_login_logs` | 登录日志 |
| `sys_configs` | 配置 |
| `sys_dict_types` | 字典类型 |
| `sys_dict_data` | 字典项 |
| `casbin_rule` | Casbin 策略存储 |

---

## Casbin RBAC 设计

### 模型配置 `config/rbac_model.conf`

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (keyMatch(r.obj, p.obj) || keyMatch2(r.obj, p.obj)) && (r.act == p.act || p.act == "*")
```

- `sub`：主体，通常是用户 ID 或角色 ID
- `obj`：对象，通常是 API 路径
- `act`：动作，通常是 HTTP Method

### 策略示例

```text
p, {role_id}, /api/v1/users, GET
p, {role_id}, /api/v1/users, POST
p, {super_admin_id}, /api/v1/*, *
g, {user_id}, {role_id}
```

### 多租户 Casbin 隔离

授权服务按租户维护独立 enforcer，并通过上下文里的 `tenant_id` 选择当前租户实例。

---

## 数据库初始化逻辑

数据库初始化分两层：

- 平台层：初始化主库连接、共享基础设施和平台级数据
- 租户层：根据租户配置动态创建或接入租户数据库连接

初始化流程通常包括：

1. 读取配置
2. 初始化数据库管理器
3. 初始化 Redis、国际化、授权、缓存等共享设施
4. 装配业务模块容器
5. 注册中间件和路由
6. 启动 HTTP 服务

`internal/app/` 负责启动装配，避免把业务逻辑塞进 `main.go`。

---

## 认证与授权链路

### 认证

当前认证模型围绕以下组件展开：

- JWT Access Token
- Refresh Token
- Redis 会话状态
- Token version / revoked 控制
- 2FA 能力
- API Key 能力

基本流程：

1. 用户登录
2. 校验账号和密码
3. 按需校验二次认证
4. 生成 Access Token 和 Refresh Token
5. 将会话状态写入 Redis
6. 请求进入时由中间件恢复用户上下文

### 授权

授权由以下几部分协作完成：

- 认证中间件
- 租户上下文绑定
- Casbin 权限校验
- 菜单、角色、权限配置同步

---

## 多租户架构

### 隔离原则

- 平台级数据保存在主库
- 租户业务数据保存在租户独立库
- 请求上下文中显式绑定 `tenant_id`
- 数据访问层不得绕过租户上下文直接操作租户数据

### 关键点

- 租户数据库连接按租户配置动态获取
- 授权服务按租户隔离
- 菜单、角色、用户、日志等系统模块能力在租户库内独立存在

---

## i18n 错误处理

错误处理遵循以下约定：

- 后端优先返回稳定的错误 key
- 前端根据错误 key 做翻译
- 平台和租户场景共用统一错误响应结构

共享层相关职责包括：

- 统一错误定义
- 统一 HTTP 响应封装
- 请求参数校验
- 国际化翻译读取

---

## 代码标准

### 命名和文件组织

- 文件名统一小写 `snake_case`
- 主分层文件使用固定命名
- 补充文件统一使用 `<subject>_<kind>.go`
- 导出类型名必须体现具体业务语义
- 代码侧统一使用 `DAO`，不再混用 `Repository`

### 分层约束

- `handler` 只做入口协调，不堆大段业务逻辑
- `service` 负责业务规则和跨对象编排
- `dao` 只负责数据读写
- `router` 负责路由注册，不再混入处理逻辑

### 工程约束

- 不新增 `repository.go`、`controller.go`、`entity.go`
- 避免 `common.go`、`util.go`、`helpers.go` 这类泛化命名
- 新增模块前先对照命名规范

---

## 新增业务模块流程

新增模块建议按以下顺序：

1. 创建模块目录
2. 落固定主分层文件
3. 定义模型和 DTO
4. 实现 DAO
5. 实现 Service
6. 实现 Handler 和 Router
7. 注入容器或装配入口
8. 增加必要的文档和验证

默认模板应优先贴近以下结构：

```text
internal/modules/example/
- dao.go
- dto.go
- handler.go
- model.go
- router.go
- service.go
```

---

## 安全设计

重点关注以下边界：

- 认证链路不得绕过 Redis 会话控制
- 授权变更必须考虑 Casbin 同步和会话影响
- 多租户操作必须带租户上下文
- 敏感数据输出必须考虑脱敏
- 工具脚本和初始化入口不得默认写死生产敏感配置

---

## 性能与工程实践

推荐实践：

- 将复杂查询收敛到 DAO 层
- 将跨模块编排收敛到 Service 层
- 避免在 Handler 中做重复数据库查询
- 使用缓存或 Redis 保存会话态和热点状态
- 对高频模块保持明确边界，避免耦合扩散

---

## 开发与验证

常用验证方式：

```bash
go run ./cmd/tools/check-backend-naming
go test ./...
```

如果使用 Makefile：

```bash
make -f backend/Makefile naming
make -f backend/Makefile test
make -f backend/Makefile verify
```

在当前 Windows 环境中，如果 `make` 受宿主工具限制不可用，优先直接运行 Go 命令。

---

## 本轮规范化总结

本轮后端规范化已完成以下收口：

- `auth`、`tenant`、`notification` 主分层文件统一为 `dao / dto / handler / model / router / service`
- `system` 相关子模块统一补齐 `router.go`，并按 `DAO / Service / Handler` 收敛导出类型和构造器命名
- 共享层命名统一从 `Repository`、`shared_*`、`utils` 等历史命名收敛到能力化命名
- `cmd/tools/internal/toolenv/tool_env.go` 收敛为 `cmd/tools/internal/tool_env/tool_env.go`
- demo 脚本命名统一为 `snake_case`
- 增加了 `cmd/tools/check-backend-naming` 作为可执行规范检查工具
- CI 已接入命名检查

后续新增后端代码时，优先遵循：

1. 先看 `backend/docs/BACKEND_NAMING_CONVENTIONS.md`
2. 再按固定分层落文件
3. 提交前运行 `go run ./cmd/tools/check-backend-naming`
