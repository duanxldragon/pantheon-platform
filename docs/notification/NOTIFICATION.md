# 通知模块设计

## 1. 模块定位

通知模块是平台的统一消息分发底座，负责解决以下问题：

- 平台内事件如何通知到目标用户；
- 通知如何可靠送达（避免因服务抖动丢消息）；
- 如何支持多种通知渠道（站内、邮件、短信）；
- 如何支持模板化通知内容，避免业务模块硬编码消息文案；
- 如何与业务模块解耦，让业务模块不直接依赖具体发送实现。

### 1.1 本文负责什么

本文说明通知模块的业务边界、核心对象模型、发送链路、模板规范与扩展方式。

### 1.2 本文不重复什么

- 认证与会话：见 `docs/auth/AUTH_SECURITY.md`
- 系统设置中的邮件/短信配置：见 `docs/system/SYSTEM_MANAGEMENT.md`
- 后端代码入口：见 `backend/internal/modules/notification/`

---

## 2. 通知模块的能力边界

### 2.1 负责

- 站内通知发送与查询（`channel=inbox`）；
- 邮件发送（`channel=email`）；
- 短信发送（`channel=sms`）；
- 通知模板管理（创建、编辑、停用）；
- 基于模板的参数化通知发送；
- 异步任务队列，支持失败重试；
- 收件箱管理（已读/未读、删除）；
- 通知统计（总数、未读数、今日发送量）。

### 2.2 不直接负责

- 邮件/短信服务商配置（属于系统设置范畴）；
- 何时触发通知（属于具体业务模块的领域逻辑）；
- 通知与用户角色权限的关联（属于系统管理 RBAC 范畴）；
- 推送 WebSocket 实时通知（当前尚未实现，收件箱为轮询/刷新模式）。

---

## 3. 核心对象模型

### 3.1 Notification（通知主体）

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | UUID | 主键 |
| `tenant_id` | string | 租户 ID，所有通知在租户内隔离 |
| `title` | string | 通知标题 |
| `content` | text | 通知正文 |
| `channel` | enum | 渠道：`system` / `email` / `sms` / `inbox` |
| `status` | enum | 状态：`draft` / `queued` / `processing` / `sent` / `failed` |
| `priority` | enum | 优先级：`low` / `medium` / `high` / `urgent` |
| `sender_id` | UUID | 发送者用户 ID（可为空，表示系统发送） |
| `receiver_ids` | text | 接收者用户 ID 列表（JSON 数组） |
| `template_id` | UUID | 若使用模板，指向模板 ID |
| `extra_data` | json | 扩展数据（可存业务上下文） |
| `fail_reason` | string | 失败原因 |
| `sent_at` | timestamp | 实际发送时间 |
| `expire_at` | timestamp | 通知过期时间 |

### 3.2 NotificationInbox（收件箱）

每条 Notification 发送给多个接收者时，为每个接收者创建一条 `NotificationInbox` 记录。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `notification_id` | UUID | 关联的通知 ID |
| `receiver_id` | UUID | 接收用户 ID |
| `is_read` | bool | 是否已读 |
| `read_at` | timestamp | 阅读时间 |
| `is_deleted` | bool | 软删除标记 |

### 3.3 NotificationTemplate（通知模板）

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `name` | string | 模板名称 |
| `code` | string | 模板唯一编码，用于程序化引用（租户内唯一） |
| `channel` | enum | 适用渠道 |
| `subject` | string | 邮件主题（email 渠道专用） |
| `content` | text | 模板正文，使用 Go `text/template` 语法 |
| `variables` | text | 变量说明（JSON，用于文档提示） |
| `is_active` | bool | 是否启用 |

### 3.4 NotificationJob（异步任务）

负责持久化异步发送任务的状态与重试元数据。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `notification_id` | UUID | 关联通知 |
| `status` | enum | `pending` / `processing` / `succeeded` / `failed` |
| `attempts` | int | 已尝试次数 |
| `max_attempts` | int | 最大重试次数（默认 3） |
| `last_error` | text | 最近一次失败原因 |
| `next_retry_at` | timestamp | 下次重试时间（指数退避） |

---

## 4. 渠道说明

| 渠道 | 值 | 说明 |
| :--- | :--- | :--- |
| 系统通知 | `system` | 平台内部事件通知，不经外部服务 |
| 站内信 | `inbox` | 用户收件箱，用户登录后可查看 |
| 邮件 | `email` | 通过 SMTP / SendGrid / 阿里云 DirectMail 发送 |
| 短信 | `sms` | 通过阿里云 / 腾讯云 / Twilio 发送 |

邮件和短信需要在系统设置中配置对应服务商参数。

---

## 5. 通知发送链路

### 5.1 直接发送

```
调用方 -> POST /api/v1/notifications/send
       -> NotificationService.Send()
       -> 创建 Notification 记录
       -> 创建 NotificationJob（status=queued）
       -> 异步处理器执行发送
       -> 更新 status=sent 或 status=failed
```

### 5.2 模板发送

```
调用方 -> POST /api/v1/notifications/send/template
       -> 读取模板 code -> 渲染变量（text/template）
       -> 生成 Notification 正文与标题
       -> 走直接发送链路
```

### 5.3 重试机制

失败后按指数退避策略计算 `next_retry_at`：

```
delay = base * 2^(attempts - 1)
```

达到 `max_attempts` 后不再重试，`status` 保持 `failed`。

---

## 6. API 端点

所有端点均在 `/api/v1/notifications/` 前缀下，需要认证。

| 端点 | 方法 | 说明 |
| :--- | :--- | :--- |
| `/notifications` | GET | 查询通知列表 |
| `/notifications/inbox/list` | GET | 查询当前用户收件箱 |
| `/notifications/inbox/stats` | GET | 当前用户收件箱统计（未读数等） |
| `/notifications/inbox/:id/read` | PATCH | 标记单条已读 |
| `/notifications/inbox/read-all` | PATCH | 全部标记已读 |
| `/notifications/inbox/:id` | DELETE | 删除收件箱条目 |
| `/notifications/templates` | GET/POST | 模板列表 / 创建模板 |
| `/notifications/templates/:id` | GET/PUT/DELETE | 模板详情 / 更新 / 删除 |
| `/notifications/send` | POST | 直接发送通知 |
| `/notifications/send/template` | POST | 通过模板发送通知 |

---

## 7. 模板变量规范

模板内容使用 Go `text/template` 语法，变量以 `{{.VariableName}}` 形式注入。

**示例模板内容**：

```
您好，{{.UserName}}！

您的账号 {{.Username}} 已于 {{.ActionTime}} 被管理员重置密码。
如非本人操作，请立即联系管理员。
```

**命名建议**：

- 变量名使用 `PascalCase`；
- 变量说明写在 `variables` 字段（JSON 格式），例如：
  ```json
  [{"name": "UserName", "desc": "用户显示名"}, {"name": "Username", "desc": "登录账号"}]
  ```
- 模板 `code` 使用小写下划线命名，例如 `password_reset_notification`、`tenant_disabled_alert`。

---

## 8. 多租户隔离要求

- 通知、收件箱、模板、任务记录都带 `tenant_id`，只在租户内可见；
- 发送通知时，接收者 `receiver_ids` 必须是当前租户内的用户；
- 租户初始化时，通知模块会执行租户迁移（`notification` 迁移器），建立对应表结构；
- 跨租户发送不被支持，平台级告警由平台默认租户处理。

---

## 9. 与其他模块的协作

| 依赖 | 协作方式 |
| :--- | :--- |
| 系统设置 | 邮件/短信配置从 `system/setting` 读取 |
| 用户模块 | 通过 `receiver_ids` 引用目标用户，不直接操作用户表 |
| 认证模块 | 通知触发于安全事件（改密、停用等）后发送 |
| 租户初始化 | 注册为租户迁移器，在租户初始化时建表 |

---

## 10. 新业务模块如何接入通知

新业务模块若需要发送通知，建议：

1. 在系统管理-通知模板中预定义业务模板（`code` 遵循 `<module>_<event>` 命名）；
2. 通过 `POST /api/v1/notifications/send/template` 触发发送；
3. 不要在业务 service 中直接调用邮件/短信 SDK，通过通知模块解耦；
4. 对需要追溯的通知事件，在 `extra_data` 中携带业务上下文 ID。

---

## 11. 推荐阅读路径

- 先读 `docs/system/SYSTEM_MANAGEMENT.md`（了解系统设置中的邮件/短信配置）
- 再看 `backend/internal/modules/notification/` 下具体实现
- 前端通知中心：`frontend/src/modules/notification/views/NotificationCenter.tsx`
