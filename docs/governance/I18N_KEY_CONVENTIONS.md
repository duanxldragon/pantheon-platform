# i18n 键名规范

> 本文定义后端错误消息 i18n Key 的命名约定与前端翻译资源的维护规范。  
> 当前系统支持后端返回 i18n Key、前端负责翻译展示；新增接口应优先收敛到 i18n Key，前端需兼容 key 与可读文本两种返回形态。

---

## 1. 后端 i18n Key 命名规范

### 1.1 格式

```
<module>.<subject>.<action_or_state>
```

- 全部小写，`.` 为层级分隔符
- 最多三层（通用错误允许两层）

### 1.2 层级定义

| 层级 | 含义 | 示例 |
| :--- | :--- | :--- |
| `module` | 模块名 | `auth` / `tenant` / `system` / `common` |
| `subject` | 操作对象 | `user` / `role` / `token` / `db` |
| `action_or_state` | 动作或状态描述 | `not_found` / `invalid` / `locked` / `exists` |

### 1.3 标准模块前缀

| 前缀 | 适用范围 |
| :--- | :--- |
| `common.` | 跨模块通用错误（NOT_FOUND、BAD_REQUEST 等） |
| `auth.` | 认证、会话、登录、2FA |
| `tenant.` | 租户操作、数据库初始化 |
| `system.` | 系统管理（用户、角色、部门等） |
| `notification.` | 通知模块 |

### 1.4 已有 Key 示例

```
common.not_found
common.invalid_input
common.conflict
common.rate_limit_exceeded

auth.unauthorized
auth.forbidden
auth.token.invalid
auth.token.expired
auth.login.invalid_credentials
auth.account.locked
auth.account.disabled

tenant.not_found
tenant.inactive
tenant.db.not_configured
tenant.db.connect_failed
tenant.db.migration_failed
```

### 1.5 新增 Key 规则

1. 先在 `backend/internal/shared/errors/application_errors.go` 中定义常量
2. Key 命名遵循上述格式
3. 同时在数据库 `i18n_translations` 表中补充中英文翻译（可通过 seed 脚本或管理界面维护）
4. 新增或改造 HTTP 响应时，`message` 字段优先使用 i18n Key；历史接口返回可读文本时，前端需保持兼容并逐步收敛

---

## 2. 后端翻译存储

### 2.1 数据库模型

翻译存储在主库 `i18n_translations` 表中：

| 字段 | 说明 |
| :--- | :--- |
| `module` | 所属模块（`auth` / `system` 等）|
| `key` | i18n key（格式见上） |
| `language` | 语言代码：`zh` / `en` / `ja` / `ko` |
| `value` | 翻译文本（可含占位符） |
| `tenant_id` | NULL = 平台级；有值 = 租户级覆写 |

### 2.2 翻译加载

- 服务启动时调用 `translator.LoadTranslations(ctx)` 加载到内存
- Redis 用于缓存翻译数据，TTL 由配置决定
- 语言通过请求头 `Accept-Language` 确定
- 翻译中间件（`i18n.TranslationMiddleware`）全局注入

### 2.3 租户级翻译覆写

当 `tenant_id` 有值时，该翻译条目覆盖同 key 的平台级翻译。允许租户自定义部分错误消息或提示文案。

---

## 3. 前端翻译资源维护

### 3.1 当前翻译资源位置

前端翻译资源不再位于 `src/shared/i18n/locales/*.json`（已废弃），而是统一维护在：

- `frontend/src/stores/language_store.ts`：语言状态与翻译数据结构定义
- `frontend/src/shared/i18n/resources.ts`：翻译资源注册

### 3.2 前端 Key 命名约定

前端翻译 key 使用**嵌套对象**风格（camelCase），与后端 `.` 分隔符风格不同：

```typescript
// 后端 key: auth.account.locked
// 前端结构:
{
  auth: {
    account: {
      locked: "账号已被锁定，请稍后再试"
    }
  }
}
```

### 3.3 后端错误消息的前端处理

后端返回的错误结构：

```json
{
  "code": "ACCOUNT_LOCKED",
  "message": "auth.account.locked"
}
```

前端 `api_client.ts` 或 `error_handler.ts` 负责将 `message` 字段中的 i18n key 翻译为当前语言的可读文案；如果 `message` 已经是可读文本，则保持兼容展示。

**不建议**新增接口直接返回中文硬编码消息；历史接口可在迁移期由前端兼容处理。

### 3.4 新增页面文案规范

1. 所有 UI 文案（按钮、标签、提示、错误）都进语言资源，不硬编码
2. 同一语义在中英文两种语言都补全
3. 占位符使用 `{{variable}}` 格式（i18next 规范）
4. 对应中文和英文的 key 保持相同路径结构

---

## 4. 支持的语言

| 语言代码 | 语言 | 状态 |
| :--- | :--- | :--- |
| `zh` | 简体中文 | 完整 |
| `en` | 英文 | 完整 |
| `ja` | 日文 | 部分 |
| `ko` | 韩文 | 部分 |

新增语言只需要在翻译资源中补全对应语言的所有 key，不需要修改代码逻辑。
