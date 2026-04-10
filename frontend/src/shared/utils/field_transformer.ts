/**
 * API字段名转换工具
 * 在后端的snake_case和前端的camelCase之间进行转换
 */

// 字段名转换映射表
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
  temp_token: 'tempToken',
  access_token: 'accessToken',
  refresh_token: 'refreshToken',
  token_type: 'tokenType',
  expires_in: 'expiresIn',

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
  db_password: 'dbPassword',
  admin_password: 'adminPassword',
  max_open_conns: 'maxOpenConns',
  max_idle_conns: 'maxIdleConns',
  conn_max_lifetime: 'connMaxLifetime',
  database_configured: 'databaseConfigured',
  is_first_login: 'isFirstLogin',
  enable_multi_tenant: 'enableMultiTenant',
  login_requires_tenant_code: 'loginRequiresTenantCode',

  // 系统相关
  is_system: 'isSystem',
  is_default: 'isDefault',
  is_configured: 'isConfigured',
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
  initialized_modules: 'initializedModules',
  deployment_mode: 'deploymentMode',
  tenant_strategy: 'tenantStrategy',

  // 其他常见字段
  api_key: 'apiKey',
  api_keys: 'apiKeys',
  user_type: 'userType',
  sort_order: 'sortOrder',
  sort_field: 'sortField',
};

// camelCase to snake_case 反向映射
const CAMEL_TO_SNAKE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL_MAP).map(([k, v]) => [v, k])
);

/**
 * 将snake_case字段名转换为camelCase
 */
export function snakeToCamel(str: string): string {
  // 优先使用映射表
  if (SNAKE_TO_CAMEL_MAP[str]) {
    return SNAKE_TO_CAMEL_MAP[str];
  }

  // 如果没有映射，使用正则转换
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 将camelCase字段名转换为snake_case
 */
export function camelToSnake(str: string): string {
  // 优先使用映射表
  if (CAMEL_TO_SNAKE_MAP[str]) {
    return CAMEL_TO_SNAKE_MAP[str];
  }

  // 如果没有映射，使用正则转换
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 转换对象的字段名从snake_case到camelCase
 */
export function transformObjectKeys<T>(obj: unknown): T {
  if (!obj || typeof obj !== 'object') {
    return obj as T;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => transformObjectKeys(item)) as T;
  }

  // 处理对象
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = snakeToCamel(key);
      const value = (obj as Record<string, unknown>)[key];

      // 递归处理嵌套对象
      if (typeof value === 'object' && value !== null) {
        result[newKey] = transformObjectKeys(value);
      } else {
        result[newKey] = value;
      }
    }
  }

  return result as T;
}

/**
 * 转换对象的字段名从camelCase到snake_case
 */
export function transformObjectKeysToSnake<T>(obj: unknown): T {
  if (!obj || typeof obj !== 'object') {
    return obj as T;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => transformObjectKeysToSnake(item)) as T;
  }

  // 处理对象
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = camelToSnake(key);
      const value = (obj as Record<string, unknown>)[key];

      // 递归处理嵌套对象
      if (typeof value === 'object' && value !== null) {
        result[newKey] = transformObjectKeysToSnake(value);
      } else {
        result[newKey] = value;
      }
    }
  }

  return result as T;
}

/**
 * 类型安全的字段转换器类
 */
export class FieldTransformer {
  /**
   * 转换API响应数据
   */
  static transformResponse<T>(data: unknown): T {
    if (!data) return data as T;
    return transformObjectKeys<T>(data);
  }

  /**
   * 转换API请求数据
   */
  static transformRequest<T>(data: T): unknown {
    if (!data) return data;
    return transformObjectKeysToSnake<T>(data);
  }

  /**
   * 批量转换响应数组
   */
  static transformResponseArray<T>(data: unknown[]): T[] {
    if (!data) return [];
    return data.map(item => transformObjectKeys<T>(item));
  }

  /**
   * 转换分页响应
   */
  static transformPaginatedResponse<T>(data: unknown): { items: T[]; pagination: Record<string, unknown> } {
    if (!data) return { items: [], pagination: {} };

    const transformed = transformObjectKeys<{ data?: { items?: T[]; pagination?: Record<string, unknown> } }>(data);
    return {
      items: transformed.data?.items || [],
      pagination: transformed.data?.pagination || {}
    };
  }
}

// 导出工具函数
export const fieldUtils = {
  snakeToCamel,
  camelToSnake,
  transformObjectKeys,
  transformObjectKeysToSnake,
};

export default FieldTransformer;
