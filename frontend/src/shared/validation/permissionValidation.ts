/**
 * 权限数据验证工具
 */

// ============================================
// 验证结果类型
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================
// 权限类型
// ============================================

export const PERMISSION_TYPES = ['menu', 'operation', 'data', 'field'] as const;
export type PermissionType = typeof PERMISSION_TYPES[number];

export const PERMISSION_TYPE_DESCRIPTIONS: Record<PermissionType, string> = {
  menu: '菜单权限',
  operation: '操作权限',
  data: '数据权限',
  field: '字段权限',
} as const;

// ============================================
// 常见模块列表
// ============================================

export const COMMON_MODULES = [
  'system',
  'user',
  'role',
  'permission',
  'department',
  'position',
  'menu',
  'log',
  'settings',
] as const;

// ============================================
// 验证函数
// ============================================

const PERMISSION_CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9:_-]*$/;
const PERMISSION_CODE_MIN_LENGTH = 2;
const PERMISSION_CODE_MAX_LENGTH = 100;

export function validatePermissionCode(code: string): ValidationResult {
  if (!code) {
    return { valid: false, error: '权限代码不能为空' };
  }

  if (code.length < PERMISSION_CODE_MIN_LENGTH) {
    return { valid: false, error: `权限代码至少${PERMISSION_CODE_MIN_LENGTH}个字符` };
  }

  if (code.length > PERMISSION_CODE_MAX_LENGTH) {
    return { valid: false, error: `权限代码最多${PERMISSION_CODE_MAX_LENGTH}个字符` };
  }

  if (!PERMISSION_CODE_PATTERN.test(code)) {
    return { valid: false, error: '权限代码只能包含字母、数字、冒号、下划线和连字符，且必须以字母开头' };
  }

  return { valid: true };
}

export function validatePermissionName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: '权限名称不能为空' };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: '权限名称不能为空' };
  }

  if (name.length > 100) {
    return { valid: false, error: '权限名称最多100个字符' };
  }

  return { valid: true };
}

export function validatePermissionType(type: string): ValidationResult {
  if (!type) {
    return { valid: false, error: '权限类型不能为空' };
  }

  if (!PERMISSION_TYPES.includes(type as PermissionType)) {
    return { valid: false, error: `无效的权限类型` };
  }

  return { valid: true };
}

export function validatePermissionModule(module: string): ValidationResult {
  if (!module) {
    return { valid: false, error: '权限模块不能为空' };
  }

  if (module.length > 50) {
    return { valid: false, error: '权限模块最多50个字符' };
  }

  // 验证模块格式（小写字母、数字、下划线）
  const MODULE_PATTERN = /^[a-z][a-z0-9_]*$/;
  if (!MODULE_PATTERN.test(module)) {
    return { valid: false, error: '模块名称只能包含小写字母、数字和下划线，且必须以小写字母开头' };
  }

  return { valid: true };
}

export function validatePermissionDescription(description: string): ValidationResult {
  if (description && description.length > 500) {
    return { valid: false, error: '权限描述最多500个字符' };
  }

  return { valid: true };
}

// ============================================
// 权限代码格式建议
// ============================================

/**
 * 生成权限代码建议
 * @param module 模块名
 * @param action 操作名
 * @returns 权限代码
 * @example generatePermissionCode('user', 'create') => 'user:create'
 */
export function generatePermissionCode(module: string, action: string): string {
  return `${module}:${action}`.toLowerCase();
}

/**
 * 解析权限代码
 * @param code 权限代码
 * @returns 解析结果
 * @example parsePermissionCode('user:create') => { module: 'user', action: 'create' }
 */
export function parsePermissionCode(code: string): { module: string; action: string } | null {
  const parts = code.split(':');
  if (parts.length < 2) {
    return null;
  }

  return {
    module: parts[0],
    action: parts.slice(1).join(':'),
  };
}

// ============================================
// 常见操作列表
// ============================================

export const COMMON_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'import',
  'approve',
  'reject',
] as const;
