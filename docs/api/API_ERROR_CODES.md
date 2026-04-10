# API错误码参考文档

## 📋 文档信息

- **项目名称**: Pantheon Platform
- **文档版本**: v1.0
- **创建日期**: 2026-04-09
- **适用范围**: 所有后端API错误处理

---

## 🎯 错误响应格式

### 标准错误响应

```json
{
  "code": "ERROR_CODE",
  "message": "错误描述信息",
  "messageEn": "Error description in English",
  "errors": [
    {
      "field": "fieldName",
      "message": "具体字段错误信息"
    }
  ],
  "timestamp": "2026-04-09T10:30:00Z",
  "requestId": "req_1234567890"
}
```

### 响应字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | ✅ | 业务错误代码 |
| message | string | ✅ | 错误描述（根据Accept-Language返回） |
| messageEn | string | ❌ | 英文错误描述 |
| errors | array | ❌ | 字段级错误详情 |
| timestamp | string | ✅ | 错误发生时间 |
| requestId | string | ✅ | 请求追踪ID |

---

## 🔐 认证相关错误码

### AUTH系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `AUTH_001` | 401 | 无效的用户名或密码 | 提示用户检查凭据 |
| `AUTH_002` | 401 | 访问令牌已过期 | 自动刷新令牌或重新登录 |
| `AUTH_003` | 401 | 无效的访问令牌 | 强制退出登录 |
| `AUTH_004` | 401 | 刷新令牌已过期 | 强制退出登录 |
| `AUTH_005` | 401 | 刷新令牌无效 | 强制退出登录 |
| `AUTH_006` | 401 | 会话已过期 | 强制退出登录 |
| `AUTH_007` | 401 | 会话已被撤销 | 强制退出登录 |
| `AUTH_008` | 401 | 权限版本不匹配 | 刷新权限信息 |
| `AUTH_009` | 429 | 登录尝试次数过多 | 提示账号已锁定，联系管理员 |
| `AUTH_010` | 403 | 双因素认证验证失败 | 提示重新验证 |
| `AUTH_011` | 400 | 双因素认证未启用 | 提示先启用双因素认证 |
| `AUTH_012` | 400 | 备份码无效或已使用 | 提示使用其他备份码 |
| `AUTH_013` | 401 | 账号已被禁用 | 提示联系管理员 |
| `AUTH_014` | 401 | 账号已过期 | 提示联系管理员 |
| `AUTH_015` | 401 | 账号已锁定 | 提示联系管理员或等待解锁 |

### 错误处理示例

```typescript
// 前端错误处理
function handleAuthError(error: ApiError) {
  switch (error.code) {
    case 'AUTH_002': // Token过期
    case 'AUTH_004': // RefreshToken过期
      // 自动刷新token
      return refreshToken();

    case 'AUTH_006': // 会话过期
    case 'AUTH_007': // 会话被撤销
    case 'AUTH_008': // 权限版本不匹配
      // 强制退出登录
      forceLogout();
      return showError('登录已过期，请重新登录');

    case 'AUTH_009': // 登录尝试过多
      return showError('登录尝试次数过多，账号已被锁定');

    case 'AUTH_010': // 2FA验证失败
      return showError('双因素认证验证失败');

    case 'AUTH_013': // 账号被禁用
    case 'AUTH_014': // 账号过期
    case 'AUTH_015': // 账号锁定
      return showError('账号状态异常，请联系管理员');

    default:
      return showError('认证失败，请重新登录');
  }
}
```

---

## 👥 用户管理错误码

### USER系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `USER_001` | 404 | 用户不存在 | 提示用户不存在 |
| `USER_002` | 409 | 用户已存在 | 提示更换用户名 |
| `USER_003` | 400 | 用户状态异常 | 提示联系管理员 |
| `USER_004` | 403 | 用户被禁用 | 提示联系管理员 |
| `USER_005` | 403 | 用户被锁定 | 提示等待解锁或联系管理员 |
| `USER_006` | 400 | 用户名格式错误 | 提示用户名格式要求 |
| `USER_007` | 400 | 密码强度不足 | 提示密码复杂度要求 |
| `USER_008` | 400 | 密码与用户信息相似 | 提示更换密码 |
| `USER_009` | 400 | 密码属于弱密码 | 提示更换密码 |
| `USER_010` | 400 | 邮箱格式错误 | 提示邮箱格式要求 |
| `USER_011` | 409 | 邮箱已存在 | 提示更换邮箱 |
| `USER_012` | 400 | 手机号格式错误 | 提示手机号格式要求 |
| `USER_013` | 403 | 无法删除系统管理员 | 提示系统管理员不能删除 |
| `USER_014` | 403 | 无法修改系统管理员角色 | 提示系统管理员角色不可修改 |
| `USER_015` | 403 | 用户数量已达上限 | 提示联系管理员增加配额 |

### 错误处理示例

```typescript
function handleUserError(error: ApiError) {
  switch (error.code) {
    case 'USER_001':
      return showError('用户不存在');

    case 'USER_002':
      return showError('用户名已存在，请更换其他用户名');

    case 'USER_007':
      return showError('密码强度不足，请使用更复杂的密码');

    case 'USER_015':
      return showError('用户数量已达上限，请联系管理员');

    default:
      return showError('操作失败，请稍后重试');
  }
}
```

---

## 🔐 角色权限错误码

### ROLE系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `ROLE_001` | 404 | 角色不存在 | 提示角色不存在 |
| `ROLE_002` | 409 | 角色已存在 | 提示更换角色编码 |
| `ROLE_003` | 400 | 角色名称格式错误 | 提示角色名称格式要求 |
| `ROLE_004` | 403 | 系统角色不可删除 | 提示系统角色不能删除 |
| `ROLE_005` | 403 | 系统角色不可修改 | 提示系统角色不能修改关键属性 |
| `ROLE_006` | 400 | 角色编码格式错误 | 提示角色编码格式要求 |

### PERMISSION系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `PERM_001` | 403 | 权限不足 | 提示权限不足 |
| `PERM_002` | 404 | 权限不存在 | 提示权限不存在 |
| `PERM_003` | 409 | 权限已存在 | 提示更换权限编码 |
| `PERM_004` | 400 | 权限编码格式错误 | 提示权限编码格式要求 |

---

## 🏢 租户管理错误码

### TENANT系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `TENANT_001` | 404 | 租户不存在 | 提示租户不存在 |
| `TENANT_002` | 409 | 租户已存在 | 提示更换租户编码 |
| `TENANT_003` | 403 | 租户已被禁用 | 提示租户已被禁用 |
| `TENANT_004` | 403 | 租户已被冻结 | 提示租户已被冻结 |
| `TENANT_005` | 400 | 租户编码格式错误 | 提示租户编码格式要求 |
| `TENANT_006` | 400 | 租户名称格式错误 | 提示租户名称格式要求 |
| `TENANT_007` | 400 | 数据库连接失败 | 提示检查数据库配置 |
| `TENANT_008` | 500 | 数据库初始化失败 | 提示联系系统管理员 |
| `TENANT_009` | 403 | 租户未初始化 | 提示完成租户初始化 |
| `TENANT_010` | 403 | 租户用户数量已达上限 | 提示联系管理员增加配额 |
| `TENANT_011` | 403 | 租户存储空间已达上限 | 提示清理空间或升级套餐 |
| `TENANT_012` | 403 | 租户API调用频率超限 | 提示稍后重试或升级套餐 |

---

## 📁 系统管理错误码

### DEPARTMENT系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `DEPT_001` | 404 | 部门不存在 | 提示部门不存在 |
| `DEPT_002` | 409 | 部门已存在 | 提示更换部门编码 |
| `DEPT_003` | 400 | 部门名称格式错误 | 提示部门名称格式要求 |
| `DEPT_004` | 400 | 存在子部门，无法删除 | 提示先删除子部门 |

### POSITION系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `POSITION_001` | 404 | 岗位不存在 | 提示岗位不存在 |
| `POSITION_002` | 409 | 岗位已存在 | 提示更换岗位编码 |
| `POSITION_003` | 400 | 岗位名称格式错误 | 提示岗位名称格式要求 |

### MENU系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `MENU_001` | 404 | 菜单不存在 | 提示菜单不存在 |
| `MENU_002` | 409 | 菜单已存在 | 提示更换菜单编码 |
| `MENU_003` | 400 | 菜单名称格式错误 | 提示菜单名称格式要求 |
| `MENU_004` | 400 | 存在子菜单，无法删除 | 提示先删除子菜单 |
| `MENU_005` | 400 | 父菜单不存在 | 提示选择有效的父菜单 |

### DICT系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `DICT_001` | 404 | 字典不存在 | 提示字典不存在 |
| `DICT_002` | 409 | 字典已存在 | 提示更换字典编码 |
| `DICT_003` | 400 | 字典类型格式错误 | 提示字典类型格式要求 |

---

## 🔧 通用错误码

### VALID系列错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `VAL_001` | 400 | 参数验证失败 | 提示检查输入参数 |
| `VAL_002` | 400 | 必填参数缺失 | 提示补充必填参数 |
| `VAL_003` | 400 | 参数格式错误 | 提示参数格式要求 |
| `VAL_004` | 400 | 参数长度超限 | 提示参数长度限制 |
| `VAL_005` | 400 | 参数值不在允许范围内 | 提示参数值范围 |

### 系统错误码

| 错误代码 | HTTP状态码 | 说明 | 处理建议 |
|---------|-----------|------|----------|
| `SYS_001` | 500 | 系统内部错误 | 提示稍后重试或联系技术支持 |
| `SYS_002` | 503 | 服务暂时不可用 | 提示稍后重试 |
| `SYS_003` | 500 | 数据库连接失败 | 提示稍后重试或联系技术支持 |
| `SYS_004` | 500 | 缓存服务异常 | 提示稍后重试 |
| `SYS_005` | 500 | 文件系统错误 | 提示联系技术支持 |
| `SYS_006` | 500 | 第三方服务调用失败 | 提示稍后重试或联系技术支持 |
| `SYS_007` | 429 | 请求频率超限 | 提示稍后重试 |
| `SYS_008` | 503 | 系统维护中 | 提示系统维护时间 |

---

## 🌐 国际化错误消息

### 错误消息多语言支持

```typescript
// 错误消息映射
const ERROR_MESSAGES = {
  'AUTH_001': {
    zh: '用户名或密码错误',
    en: 'Invalid username or password',
    ja: 'ユーザー名またはパスワードが間違っています',
    ko: '사용자 이름 또는 비밀번호가 잘못되었습니다'
  },
  'USER_001': {
    zh: '用户不存在',
    en: 'User not found',
    ja: 'ユーザーが存在しません',
    ko: '사용자를 찾을 수 없습니다'
  },
  'TENANT_009': {
    zh: '租户未完成初始化，请联系管理员',
    en: 'Tenant not initialized, please contact administrator',
    ja: 'テナントが初期化されていません。管理者にお問い合わせください',
    ko: '테넌트가 초기화되지 않았습니다. 관리자에게 문의하십시오'
  }
};

// 根据用户语言获取错误消息
function getErrorMessage(errorCode: string, language: string = 'zh-CN'): string {
  const error = ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES];
  if (!error) return '未知错误';

  const lang = language.startsWith('zh') ? 'zh' :
               language.startsWith('ja') ? 'ja' :
               language.startsWith('ko') ? 'ko' : 'en';

  return error[lang as keyof typeof error] || error.en;
}
```

---

## 🔧 前端错误处理最佳实践

### 统一错误处理Hook

```typescript
// frontend/src/hooks/useErrorHandler.ts
export function useErrorHandler() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      // 业务错误
      switch (error.code) {
        case 'AUTH_002': // Token过期
        case 'AUTH_004': // RefreshToken过期
        case 'AUTH_006': // 会话过期
          forceLogout();
          showError(t('errors.sessionExpired'));
          break;

        case 'PERM_001': // 权限不足
          showError(t('errors.forbidden'));
          break;

        case 'TENANT_009': // 租户未初始化
          navigate('/tenant-setup');
          break;

        default:
          showError(error.message || t('errors.unknown'));
      }
    } else {
      // 系统错误
      console.error('Unexpected error:', error);
      showError(t('errors.unknown'));
    }
  }, [t, navigate]);

  return { handleError };
}
```

### 错误边界组件

```typescript
// frontend/src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 发送错误到监控服务
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>出错了</h1>
          <p>抱歉，应用程序遇到了一些问题。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 📊 错误监控和日志

### 错误日志记录

```typescript
// 前端错误日志
function logError(error: ApiError, context?: any) {
  const errorLog = {
    code: error.code,
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    tenantId: getCurrentTenantId(),
  };

  // 发送到后端日志服务
  axios.post('/api/v1/system/logs/error', errorLog).catch(console.error);

  // 开发环境打印
  if (import.meta.env.DEV) {
    console.error('[ERROR LOG]', errorLog);
  }
}
```

### 错误统计和监控

```typescript
// 错误统计
const errorStats = {
  totalErrors: 0,
  errorsByCode: {} as Record<string, number>,
  errorsByModule: {} as Record<string, number>,

  record(error: ApiError) {
    this.totalErrors++;
    this.errorsByCode[error.code] = (this.errorsByCode[error.code] || 0) + 1;

    const module = error.code.split('_')[0].toLowerCase();
    this.errorsByModule[module] = (this.errorsByModule[module] || 0) + 1;
  },

  getReport() {
    return {
      total: this.totalErrors,
      byCode: this.errorsByCode,
      byModule: this.errorsByModule,
    };
  }
};
```

---

## 🎯 总结

### 错误码设计原则

1. **模块化前缀**: 使用模块前缀（AUTH、USER、ROLE等）
2. **数字编号**: 每个模块内使用数字编号
3. **明确语义**: 错误码应能清楚表达错误类型
4. **分层处理**: HTTP状态码 + 业务错误码
5. **国际化**: 支持多语言错误消息

### 错误处理流程

1. **捕获错误**: 在Axios拦截器中统一捕获
2. **识别类型**: 根据错误码识别错误类型
3. **统一处理**: 根据错误类型执行相应处理
4. **用户友好**: 显示用户可理解的错误信息
5. **日志记录**: 记录错误日志用于分析

### 最佳实践建议

1. ✅ 使用统一的错误处理Hook
2. ✅ 在关键位置添加错误边界
3. ✅ 记录详细的错误日志
4. ✅ 提供用户友好的错误提示
5. ✅ 实现错误重试机制
6. ✅ 监控错误发生频率和趋势

---

**错误码文档版本**: v1.0
**最后更新**: 2026-04-09
**维护团队**: 后端开发团队
