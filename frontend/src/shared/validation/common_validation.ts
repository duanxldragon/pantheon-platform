/**
 * 通用验证工具
 */

// ============================================
// 验证结果类型
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================
// ID 验证
// ============================================

export function validateId(id: string | null | undefined): ValidationResult {
  if (!id) {
    return { valid: false, error: 'ID不能为空' };
  }

  if (typeof id !== 'string') {
    return { valid: false, error: 'ID必须是字符串' };
  }

  if (id.trim().length === 0) {
    return { valid: false, error: 'ID不能为空' };
  }

  // UUID 格式验证（可选）
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_PATTERN.test(id)) {
    // 如果不是 UUID 格式，检查是否是简单的数字ID或其他格式
    // 这里只做警告，不返回错误
    // return { valid: false, error: 'ID格式无效' };
  }

  return { valid: true };
}

// ============================================
// ID 数组验证
// ============================================

export function validateIdArray(ids: (string | null | undefined)[] | null | undefined): ValidationResult {
  if (!ids || ids.length === 0) {
    return { valid: false, error: '请至少选择一项' };
  }

  for (const id of ids) {
    const result = validateId(id);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

// ============================================
// 代码格式验证（通用）
// ============================================

const CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function validateCode(
  code: string,
  options: {
    minLength?: number;
    maxLength?: number;
    fieldName?: string;
  } = {}
): ValidationResult {
  const {
    minLength = 2,
    maxLength = 50,
    fieldName = '代码'
  } = options;

  if (!code) {
    return { valid: false, error: `${fieldName}不能为空` };
  }

  if (code.length < minLength) {
    return { valid: false, error: `${fieldName}至少${minLength}个字符` };
  }

  if (code.length > maxLength) {
    return { valid: false, error: `${fieldName}最多${maxLength}个字符` };
  }

  if (!CODE_PATTERN.test(code)) {
    return { valid: false, error: `${fieldName}只能包含字母、数字和下划线，且必须以字母开头` };
  }

  return { valid: true };
}

// ============================================
// 名称验证（通用）
// ============================================

export function validateName(
  name: string,
  options: {
    minLength?: number;
    maxLength?: number;
    fieldName?: string;
  } = {}
): ValidationResult {
  const {
    minLength = 1,
    maxLength = 50,
    fieldName = '名称'
  } = options;

  if (!name) {
    return { valid: false, error: `${fieldName}不能为空` };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: `${fieldName}不能为空` };
  }

  if (name.length < minLength) {
    return { valid: false, error: `${fieldName}至少${minLength}个字符` };
  }

  if (name.length > maxLength) {
    return { valid: false, error: `${fieldName}最多${maxLength}个字符` };
  }

  return { valid: true };
}

// ============================================
// 描述验证（通用）
// ============================================

export function validateDescription(
  description: string,
  options: {
    maxLength?: number;
    required?: boolean;
    fieldName?: string;
  } = {}
): ValidationResult {
  const {
    maxLength = 500,
    required = false,
    fieldName = '描述'
  } = options;

  if (!description) {
    if (required) {
      return { valid: false, error: `${fieldName}不能为空` };
    }
    return { valid: true };
  }

  if (description.length > maxLength) {
    return { valid: false, error: `${fieldName}最多${maxLength}个字符` };
  }

  return { valid: true };
}

// ============================================
// 排序值验证
// ============================================

export function validateSortOrder(sortOrder: number | string | null | undefined): ValidationResult {
  if (sortOrder === null || sortOrder === undefined) {
    return { valid: true }; // 排序值是可选的
  }

  const numValue = typeof sortOrder === 'string' ? parseInt(sortOrder, 10) : sortOrder;

  if (isNaN(numValue)) {
    return { valid: false, error: '排序值必须是数字' };
  }

  if (numValue < 0 || numValue > 9999) {
    return { valid: false, error: '排序值必须在0-9999之间' };
  }

  return { valid: true };
}

// ============================================
// 状态验证（通用）
// ============================================

export const COMMON_STATUSES = ['active', 'inactive'] as const;
export type CommonStatus = typeof COMMON_STATUSES[number];

export function validateCommonStatus(
  status: string,
  options: {
    fieldName?: string;
  } = {}
): ValidationResult {
  const { fieldName = '状态' } = options;

  if (!status) {
    return { valid: false, error: `${fieldName}不能为空` };
  }

  if (!COMMON_STATUSES.includes(status as CommonStatus)) {
    return { valid: false, error: `无效的${fieldName}` };
  }

  return { valid: true };
}

// ============================================
// 批量验证
// ============================================

export function validateAll(
  validations: ValidationResult[]
): ValidationResult {
  for (const result of validations) {
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

// ============================================
// URL 验证
// ============================================

export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: true }; // URL是可选的
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: '无效的URL格式' };
  }
}

// ============================================
// 手机号验证（中国）
// ============================================

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: true }; // 手机号是可选的
  }

  if (!PHONE_REGEX.test(phone)) {
    return { valid: false, error: '无效的手机号' };
  }

  return { valid: true };
}

// ============================================
// 邮箱验证
// ============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: '邮箱不能为空' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: '无效的邮箱地址' };
  }

  return { valid: true };
}
