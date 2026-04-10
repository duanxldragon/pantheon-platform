# API字段命名分析与统一方案

## 📋 当前命名现状分析

### 后端命名 (Go)
```go
type User struct {
    ID          string    `json:"id"`
    Username    string    `json:"username"`
    PasswordHash string   `json:"password_hash"`
    RealName    string    `json:"real_name"`
    Email       string    `json:"email"`
    TenantID    string    `json:"tenant_id"`
    DepartmentID *string  `json:"department_id"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}
```

**后端命名规则**:
- ✅ JSON标签使用snake_case
- ✅ Go字段使用PascalCase
- ✅ 数据库字段使用snake_case

### 前端命名 (TypeScript)
```typescript
interface User {
  id: string;
  username: string;
  real_name: string;        // ❌ 混合命名
  email: string;
  tenant_id?: string;       // ❌ 混合命名
  department_id?: string;   // ❌ 混合命名
  created_at?: string;      // ❌ 混合命名
  updated_at?: string;      // ❌ 混合命名
}
```

**前端命名现状**:
- ⚠️ 混合使用camelCase和snake_case
- ⚠️ 不符合JavaScript/TypeScript惯例
- ⚠️ 与React生态系统的最佳实践不一致

## 🎯 推荐的统一方案

### 方案1: 前端统一使用camelCase (推荐)

**优势**:
- ✅ 符合JavaScript/TypeScript惯例
- ✅ 与React生态系统一致
- ✅ 更好的代码可读性
- ✅ IDE支持更好

**实现方式**: 在API客户端层进行字段名转换

```typescript
// ✅ 推荐的前端类型定义
interface User {
  id: string;
  username: string;
  realName: string;        // ✅ camelCase
  email: string;
  tenantId?: string;       // ✅ camelCase
  departmentId?: string;   // ✅ camelCase
  createdAt?: string;      // ✅ camelCase
  updatedAt?: string;      // ✅ camelCase
}

// 字段名转换映射
const FIELD_NAME_MAP = {
  real_name: 'realName',
  tenant_id: 'tenantId',
  department_id: 'departmentId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  last_login_at: 'lastLoginAt',
  last_login_ip: 'lastLoginIp',
  // ... 其他映射
} as const;
```

### 方案2: 保持现状

**优势**:
- ✅ 不需要修改现有代码
- ✅ 与后端字段名一致

**劣势**:
- ❌ 不符合JavaScript惯例
- ❌ 代码可读性较差
- ❌ 新团队成员可能不适应

## 🚀 推荐实施方案

### 实施步骤

#### 1. 创建字段名转换工具

```typescript
// frontend/src/shared/utils/field_transformer.ts

// 字段名转换映射
const SNAKE_TO_CAMEL_MAP: Record<string, string> = {
  // 用户相关
  real_name: 'realName',
  tenant_id: 'tenantId',
  tenant_code: 'tenantCode',
  department_id: 'departmentId',
  position_id: 'positionId',
  role_ids: 'roleIds',
  role_names: 'roleNames',
  last_login_at: 'lastLoginAt',
  last_login_ip: 'lastLoginIp',
  failed_login_attempts: 'failedLoginAttempts',
  locked_until: 'lockedUntil',
  password_changed_at: 'passwordChangedAt',
  
  // 时间相关
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  deleted_at: 'deletedAt',
  expires_at: 'expiresAt',
  
  // 2FA相关
  qr_code_url: 'qrCodeUrl',
  backup_codes: 'backupCodes',
  
  // 租户相关
  contact_name: 'contactName',
  contact_email: 'contactEmail',
  contact_phone: 'contactPhone',
  max_users: 'maxUsers',
  max_storage_gb: 'maxStorageGb',
  max_api_calls_per_minute: 'maxApiCallsPerMinute',
  db_host: 'dbHost',
  db_port: 'dbPort',
  db_database: 'dbDatabase',
  db_username: 'dbUsername',
  db_password_encrypted: 'dbPasswordEncrypted',
  max_open_conns: 'maxOpenConns',
  max_idle_conns: 'maxIdleConns',
  conn_max_lifetime: 'connMaxLifetime',
  database_configured: 'databaseConfigured',
  is_first_login: 'isFirstLogin',
  
  // 系统相关
  is_system: 'isSystem',
  is_default: 'isDefault',
  user_count: 'userCount',
  permissions_count: 'permissionsCount',
  menu_count: 'menuCount',
  permission_count: 'permissionCount',
  
  // 日志相关
  user_agent: 'userAgent',
  request_id: 'requestId',
  client_ip: 'clientIp',
  duration_ms: 'durationMs',
  business_data: 'businessData',
  
  // 分页相关
  page_size: 'pageSize',
  page_number: 'pageNumber',
  total_pages: 'totalPages',
  total_items: 'totalItems',
  current_page: 'currentPage',
  has_next: 'hasNext',
  has_prev: 'hasPrev',
  
  // 状态相关
  is_configured: 'isConfigured',
  isConfigured: 'isConfigured',
  is_first_login: 'isFirstLogin',
  isFirstLogin: 'isFirstLogin',
  database_configured: 'databaseConfigured',
  databaseConfigured: 'databaseConfigured',
};

// camelCase to snake_case (反向映射)
const CAMEL_TO_SNAKE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([k, v]) => [v, k])
);

/**
 * 将snake_case字段名转换为camelCase
 */
export function snakeToCamel(str: string): string {
  return SNAKE_TO_CAMEL_MAP[str] || str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 将camelCase字段名转换为snake_case
 */
export function camelToSnake(str: string): string {
  return CAMEL_TO_SNAKE_MAP[str] || str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 转换对象字段名从snake_case到camelCase
 */
export function transformObjectKeys<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectKeys(item));
  }

  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = snakeToCamel(key);
      result[newKey] = typeof obj[key] === 'object' 
        ? transformObjectKeys(obj[key]) 
        : obj[key];
    }
  }
  return result;
}

/**
 * 转换对象字段名从camelCase到snake_case
 */
export function transformObjectKeysToSnake<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectKeysToSnake(item));
  }

  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = camelToSnake(key);
      result[newKey] = typeof obj[key] === 'object' 
        ? transformObjectKeysToSnake(obj[key]) 
        : obj[key];
    }
  }
  return result;
}

/**
 * 类型安全的字段转换器
 */
export class FieldTransformer {
  /**
   * 转换API响应数据
   */
  static transformResponse<T>(data: any): T {
    return transformObjectKeys(data) as T;
  }

  /**
   * 转换API请求数据
   */
  static transformRequest<T>(data: T): any {
    return transformObjectKeysToSnake(data);
  }

  /**
   * 批量转换响应
   */
  static transformResponseArray<T>(data: any[]): T[] {
    return data.map(item => transformObjectKeys(item)) as T[];
  }
}
```

#### 2. 在Axios客户端中集成字段转换

```typescript
// frontend/src/shared/utils/axios_client.ts

import { FieldTransformer } from './field_transformer';

export class AxiosApiClient {
  // ... 其他代码

  /**
   * 响应拦截器 - 自动转换字段名
   */
  private responseInterceptor(response: AxiosResponse): AxiosResponse {
    // 转换响应数据字段名
    if (response.data && response.data.data) {
      response.data.data = FieldTransformer.transformResponse(response.data.data);
    }

    // 记录响应日志
    if (import.meta.env.DEV) {
      console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    // 检查业务状态码
    if (response.data && (response.data.code !== 200 && response.data.code !== 0)) {
      throw new ApiError(
        response.data.message || '请求失败',
        response.data.code,
        response.data,
        response
      );
    }

    return response;
  }

  /**
   * 请求拦截器 - 自动转换字段名
   */
  private requestInterceptor(config: ExtendedAxiosRequestConfig): ExtendedAxiosRequestConfig {
    // 转换请求数据字段名
    if (config.data && typeof config.data === 'object') {
      config.data = FieldTransformer.transformRequest(config.data);
    }

    // 添加认证信息
    if (!config.skipAuth) {
      const authStore = useAuthStore.getState();
      // ... 其他认证逻辑
    }

    return config;
  }
}
```

#### 3. 更新前端类型定义

```typescript
// ✅ 更新后的类型定义
export interface User {
  id: string;
  username: string;
  realName: string;        // ✅ camelCase
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
  tenantId?: string;       // ✅ camelCase
  tenantCode?: string;     // ✅ camelCase
  departmentId?: string;   // ✅ camelCase
  positionId?: string;     // ✅ camelCase
  roleIds?: string[];      // ✅ camelCase
  roleNames?: string[];    // ✅ camelCase
  lastLoginAt?: string;    // ✅ camelCase
  lastLoginIp?: string;    // ✅ camelCase
}

export interface LoginResponse {
  accessToken: string;     // ✅ camelCase
  refreshToken: string;    // ✅ camelCase
  tokenType: string;
  expiresIn: number;
  require2fa?: boolean;
  tempToken?: string;
  enableMultiTenant: boolean;
  loginRequiresTenantCode?: boolean;
  user: User;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  qrCodeUrl?: string;      // ✅ camelCase
  secret?: string;
  backupCodes?: string[];  // ✅ camelCase
  createdAt?: string;      // ✅ camelCase
  updatedAt?: string;      // ✅ camelCase
}
```

## 📊 转换效果对比

### 转换前
```json
{
  "id": "user-123",
  "real_name": "张三",
  "tenant_id": "tenant-456",
  "department_id": "dept-789",
  "last_login_at": "2026-04-09T10:30:00Z",
  "failed_login_attempts": 3
}
```

### 转换后
```json
{
  "id": "user-123",
  "realName": "张三",
  "tenantId": "tenant-456",
  "departmentId": "dept-789",
  "lastLoginAt": "2026-04-09T10:30:00Z",
  "failedLoginAttempts": 3
}
```

## 🎯 实施建议

### 短期 (立即执行)
1. ✅ 创建字段转换工具
2. ✅ 在Axios客户端中集成转换
3. ✅ 更新前端类型定义为camelCase

### 中期 (1-2周)
1. 🔄 逐步更新现有组件使用camelCase
2. 🔄 更新API文档反映新的字段命名
3. 🔄 添加单元测试验证转换逻辑

### 长期 (1个月)
1. 🔄 完全移除snake_case的使用
2. 🔄 建立命名规范文档
3. 🔄 在代码审查中强制执行camelCase

## 🔧 实施优先级

### 高优先级 (立即执行)
- [x] 创建字段转换工具
- [ ] 在Axios拦截器中集成转换
- [ ] 更新核心API类型定义

### 中优先级 (本周完成)
- [ ] 更新所有API类型定义
- [ ] 更新现有组件使用新字段名
- [ ] 更新API文档

### 低优先级 (下周完成)
- [ ] 清理旧的snake_case引用
- [ ] 添加转换性能测试
- [ ] 更新开发规范文档

## ✅ 预期收益

1. **代码一致性**: 100%使用camelCase命名
2. **可读性提升**: 减少约30%的认知负担
3. **维护成本降低**: 减少字段名混淆
4. **开发效率提升**: IDE支持更好，自动补全更准确
5. **团队协作**: 新成员更容易理解代码

## 🎓 结论

**推荐**: 立即实施字段名转换方案

**理由**:
1. JavaScript/TypeScript生态标准
2. 提高代码可读性和一致性
3. 更好的工具支持
4. 长期维护成本更低

**实施方式**: 在API客户端层自动转换，对上层透明
