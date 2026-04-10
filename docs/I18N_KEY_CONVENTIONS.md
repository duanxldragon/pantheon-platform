# 国际化键值命名规范

**版本**: 1.0  
**生效日期**: 2026-04-10  
**适用范围**: 前后端所有国际化文本

---

## 1. 键值格式规范

### 1.1 基本格式

```
{module}.{entity}.{action}.{status}
```

### 1.2 格式说明

| 部分 | 说明 | 示例 | 必填 |
|-----|------|------|------|
| `module` | 模块名称 | `system`, `auth`, `tenant` | ✅ |
| `entity` | 实体名称 | `user`, `role`, `menu` | ✅ |
| `action` | 操作类型 | `create`, `update`, `delete`, `list` | ✅ |
| `status` | 状态/类型 | `success`, `error`, `title`, `placeholder` | ✅ |

---

## 2. 命名规则

### 2.1 module（模块）

| 值 | 说明 |
|----|------|
| `system` | 系统管理模块 |
| `auth` | 认证授权模块 |
| `tenant` | 租户管理模块 |
| `notification` | 通知消息模块 |
| `common` | 通用文本（按钮、状态等） |
| `validation` | 验证消息 |
| `error` | 错误消息 |

### 2.2 entity（实体）

| 值 | 说明 |
|----|------|
| `user` | 用户 |
| `role` | 角色 |
| `menu` | 菜单 |
| `permission` | 权限 |
| `dept` | 部门 |
| `position` | 岗位 |
| `dict` | 数据字典 |
| `setting` | 系统设置 |
| `log` | 日志 |
| `tenant` | 租户 |
| `notification` | 通知 |

### 2.3 action（操作）

| 值 | 说明 |
|----|------|
| `create` | 创建操作 |
| `update` | 更新操作 |
| `delete` | 删除操作 |
| `list` | 列表查询 |
| `get` | 获取单个 |
| `batch` | 批量操作 |
| `export` | 导出 |
| `import` | 导入 |
| `login` | 登录 |
| `logout` | 登出 |
| `refresh` | 刷新 |

### 2.4 status（状态/类型）

**操作结果**:
- `success` - 成功
- `error` - 失败
- `confirm` - 确认提示
- `warning` - 警告

**UI元素**:
- `title` - 标题
- `label` - 标签
- `placeholder` - 占位符
- `button` - 按钮文本
- `tooltip` - 提示文本
- `description` - 描述信息

**状态值**:
- `active` - 启用
- `inactive` - 禁用
- `pending` - 待处理
- `locked` - 锁定

---

## 3. 示例对照表

### 3.1 系统管理模块

| 键值 | 中文 | English | 说明 |
|------|------|---------|------|
| `system.user.create.success` | 用户创建成功 | User created successfully | 创建成功提示 |
| `system.user.create.error` | 用户创建失败 | Failed to create user | 创建失败提示 |
| `system.user.update.success` | 用户更新成功 | User updated successfully | 更新成功提示 |
| `system.user.delete.confirm` | 确定要删除该用户吗？ | Are you sure to delete this user? | 删除确认 |
| `system.user.list.title` | 用户列表 | User List | 页面标题 |
| `system.user.username.label` | 用户名 | Username | 字段标签 |
| `system.user.username.placeholder` | 请输入用户名 | Please enter username | 占位符 |

### 3.2 认证授权模块

| 键值 | 中文 | English |
|------|------|---------|
| `auth.login.title` | 登录 | Login |
| `auth.login.username.label` | 用户名 | Username |
| `auth.login.password.label` | 密码 | Password |
| `auth.login.button` | 登录 | Login |
| `auth.login.success` | 登录成功 | Login successful |
| `auth.login.error` | 用户名或密码错误 | Invalid username or password |
| `auth.logout.success` | 已成功退出登录 | Logged out successfully |
| `auth.logout.confirm` | 确定要退出登录吗？ | Are you sure to logout? |

### 3.3 通用文本

| 键值 | 中文 | English |
|------|------|---------|
| `common.button.save` | 保存 | Save |
| `common.button.cancel` | 取消 | Cancel |
| `common.button.confirm` | 确定 | Confirm |
| `common.button.delete` | 删除 | Delete |
| `common.button.edit` | 编辑 | Edit |
| `common.button.add` | 新增 | Add |
| `common.button.search` | 搜索 | Search |
| `common.button.reset` | 重置 | Reset |
| `common.button.export` | 导出 | Export |
| `common.button.import` | 导入 | Import |
| `common.status.active` | 启用 | Active |
| `common.status.inactive` | 禁用 | Inactive |
| `common.status.loading` | 加载中... | Loading... |

### 3.4 验证消息

| 键值 | 中文 | English |
|------|------|---------|
| `validation.required` | {{field}}是必填项 | {{field}} is required |
| `validation.invalid` | {{field}}格式不正确 | {{field}} is invalid |
| `validation.minLength` | {{field}}至少需要{{min}}个字符 | {{field}} must be at least {{min}} characters |
| `validation.maxLength` | {{field}}最多{{max}}个字符 | {{field}} must be no more than {{max}} characters |
| `validation.email.invalid` | 请输入有效的邮箱地址 | Please enter a valid email address |
| `validation.phone.invalid` | 请输入有效的手机号码 | Please enter a valid phone number |

### 3.5 错误消息

| 键值 | 中文 | English |
|------|------|---------|
| `error.network` | 网络错误，请检查网络连接 | Network error, please check your connection |
| `error.server` | 服务器错误，请稍后重试 | Server error, please try again later |
| `error.unauthorized` | 未授权访问，请重新登录 | Unauthorized access, please login again |
| `error.forbidden` | 权限不足，无法访问此资源 | Permission denied, insufficient access |
| `error.notFound` | 请求的资源不存在 | The requested resource was not found |
| `error.timeout` | 请求超时，请重试 | Request timeout, please try again |

---

## 4. 参数化翻译

### 4.1 使用占位符

格式：`{{参数名}}`

**示例**:
```json
{
  "system.user.create.success": "用户 {{username}} 创建成功",
  "validation.minLength": "{{field}}至少需要{{min}}个字符"
}
```

**使用**:
```typescript
// 前端
t('system.user.create.success', { username: '张三' })
// 输出: "用户 张三 创建成功"

// 后端
translator.Translate(ctx, "system.user.create.success", map[string]interface{}{"username": "张三"})
// 输出: "用户 张三 创建成功"
```

---

## 5. 命名注意事项

### 5.1 ✅ 推荐做法

1. **保持一致性**: 相同功能使用相同的键值结构
   ```
   ✅ system.user.create.success
   ✅ system.role.create.success
   ✅ system.menu.create.success
   ```

2. **使用完整的单词**: 避免缩写
   ```
   ✅ system.user.list.title
   ❌ sys.usr.lst.ttl
   ```

3. **分层清晰**: 按模块、实体、操作、状态分层
   ```
   ✅ auth.login.error
   ✅ auth.logout.success
   ✅ system.user.update.success
   ```

4. **语义化**: 键值要能表达明确的含义
   ```
   ✅ system.user.delete.confirm
   ❌ system.user.del.cnf
   ```

### 5.2 ❌ 避免的做法

1. **不要使用中文拼音**
   ```
   ❌ system.user.yonghuming
   ✅ system.user.username
   ```

2. **不要混用命名风格**
   ```
   ❌ system.User_Create_Success
   ❌ system.user-create-success
   ✅ system.user.create.success
   ```

3. **不要过深的嵌套**
   ```
   ❌ system.user.profile.avatar.upload.success.error.message
   ✅ system.user.avatar.upload.error
   ```

4. **不要使用特殊字符**
   ```
   ❌ system.user@create#success
   ❌ system.user create-success
   ✅ system.user.create.success
   ```

---

## 6. 迁移指南

### 6.1 现有键值映射

| 旧键值（前端） | 新键值（统一） |
|---------------|--------------|
| `modules.system.user.title` | `system.user.list.title` |
| `modules.system.user.username` | `system.user.username.label` |
| `common.actions.save` | `common.button.save` |
| `messages.operationSuccess` | `common.operation.success` |
| `validation.username.required` | `system.user.username.required` |

### 6.2 迁移步骤

1. **第一步**: 在后端数据库中创建新键值的翻译
2. **第二步**: 更新前端代码使用新键值
3. **第三步**: 保留旧键值作为别名（向后兼容）
4. **第四步**: 逐步移除旧键值

---

## 7. 工具支持

### 7.1 键值验证工具

```bash
# 检查键值是否符合规范
npm run validate:i18n-keys

# 自动转换旧键值到新规范
npm run migrate:i18n-keys
```

### 7.2 键值生成工具

```bash
# 从代码中自动提取需要翻译的键值
npm run extract:i18n-keys

# 生成翻译模板
npm run generate:i18n-template
```

---

## 8. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0 | 2026-04-10 | 初始版本，定义统一的键值规范 |

---

**维护者**: Backend Team & Frontend Team  
**反馈渠道**: GitHub Issues / Project Documentation
