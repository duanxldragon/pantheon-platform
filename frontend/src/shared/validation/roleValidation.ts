/**
 * 角色数据验证工具
 */

import type { ID } from '@/modules/system/types';

// ============================================
// 验证结果类型
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================
// 角色状态
// ============================================

export const ROLE_STATUSES = ['active', 'inactive'] as const;
export type RoleStatus = typeof ROLE_STATUSES[number];

export const ROLE_STATUS_DESCRIPTIONS: Record<RoleStatus, string> = {
  active: '正常',
  inactive: '停用',
} as const;

// ============================================
// 角色类型
// ============================================

export const ROLE_TYPES = ['system', 'custom'] as const;
export type RoleType = typeof ROLE_TYPES[number];

export const ROLE_TYPE_DESCRIPTIONS: Record<RoleType, string> = {
  system: '系统角色',
  custom: '自定义角色',
} as const;

// ============================================
// 验证函数
// ============================================

const ROLE_CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const ROLE_CODE_MIN_LENGTH = 2;
const ROLE_CODE_MAX_LENGTH = 50;

export function validateRoleCode(code: string): ValidationResult {
  if (!code) {
    return { valid: false, error: '角色代码不能为空' };
  }

  if (code.length < ROLE_CODE_MIN_LENGTH) {
    return { valid: false, error: `角色代码至少${ROLE_CODE_MIN_LENGTH}个字符` };
  }

  if (code.length > ROLE_CODE_MAX_LENGTH) {
    return { valid: false, error: `角色代码最多${ROLE_CODE_MAX_LENGTH}个字符` };
  }

  if (!ROLE_CODE_PATTERN.test(code)) {
    return { valid: false, error: '角色代码只能包含字母、数字和下划线，且必须以字母开头' };
  }

  return { valid: true };
}

export function validateRoleName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: '角色名称不能为空' };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: '角色名称不能为空' };
  }

  if (name.length > 50) {
    return { valid: false, error: '角色名称最多50个字符' };
  }

  return { valid: true };
}

export function validateRoleStatus(status: string): ValidationResult {
  if (!status) {
    return { valid: false, error: '角色状态不能为空' };
  }

  if (!ROLE_STATUSES.includes(status as RoleStatus)) {
    return { valid: false, error: `无效的角色状态` };
  }

  return { valid: true };
}

export function validateRoleType(type: string): ValidationResult {
  if (!type) {
    return { valid: false, error: '角色类型不能为空' };
  }

  if (!ROLE_TYPES.includes(type as RoleType)) {
    return { valid: false, error: `无效的角色类型` };
  }

  return { valid: true };
}

export function validateRoleDescription(description: string): ValidationResult {
  if (description && description.length > 500) {
    return { valid: false, error: '角色描述最多500个字符' };
  }

  return { valid: true };
}

// ============================================
// 业务规则验证
// ============================================

/**
 * 检查是否是系统角色
 */
export function isSystemRole(code: string): boolean {
  const SYSTEM_ROLE_CODES = ['admin', 'super_admin', 'system_admin'];
  return SYSTEM_ROLE_CODES.includes(code);
}

/**
 * 检查系统角色是否可编辑
 */
export function canEditSystemRole(code: string): boolean {
  // 部分系统角色允许编辑，但不允许删除
  const NON_EDITABLE_SYSTEM_ROLES = ['super_admin'];
  return !NON_EDITABLE_SYSTEM_ROLES.includes(code);
}

/**
 * 检查系统角色是否可删除
 */
export function canDeleteSystemRole(code: string): boolean {
  // 系统角色通常不允许删除
  return !isSystemRole(code);
}

/**
 * 检查角色分配前的验证
 */
export function validateRoleAssignment(
  userIds: ID[],
  roleIds: ID[]
): { valid: boolean; error?: string } {
  if (!userIds || userIds.length === 0) {
    return { valid: false, error: '请选择要分配角色的用户' };
  }

  if (!roleIds || roleIds.length === 0) {
    return { valid: false, error: '请选择要分配的角色' };
  }

  return { valid: true };
}
