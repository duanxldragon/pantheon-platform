/**
 * 用户数据验证工具
 * @description 从 DDD 架构提取的用户相关验证函数
 */

// ============================================
// 验证结果类型
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PasswordStrengthResult {
  score: number; // 0-100
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
}

// ============================================
// 用户名验证
// ============================================

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { valid: false, error: '用户名不能为空' };
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `用户名至少需要${USERNAME_MIN_LENGTH}个字符` };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `用户名最多${USERNAME_MAX_LENGTH}个字符` };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字和下划线，且必须以字母开头' };
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

// ============================================
// 手机号验证
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
// 密码验证
// ============================================

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('密码不能为空');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }

  if (password.length > 32) {
    errors.push('密码长度最多32位');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// 密码强度计算
// ============================================

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // 长度得分
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;

  // 字符类型得分
  if (/[a-z]/.test(password)) { score += 15; } else { feedback.push('添加小写字母'); }
  if (/[A-Z]/.test(password)) { score += 15; } else { feedback.push('添加大写字母'); }
  if (/\d/.test(password)) { score += 15; } else { feedback.push('添加数字'); }
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) { score += 15; } else { feedback.push('添加特殊字符'); }
  if (password.length >= 16) score += 10;

  // 扣分
  if (/(.)\1{2,}/.test(password)) {
    score -= 10; // 重复字符
    feedback.push('避免连续重复字符');
  }

  if (/(abc|123|qwe)/i.test(password)) {
    score -= 10; // 常见模式
    feedback.push('避免常见键盘模式');
  }

  // 确保分数在 0-100
  score = Math.max(0, Math.min(100, score));

  // 确定强度等级
  let level: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  if (score >= 80) level = 'very-strong';
  else if (score >= 60) level = 'strong';
  else if (score >= 40) level = 'medium';

  return { score, level, feedback };
}

// ============================================
// 临时密码生成
// ============================================

export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // 确保包含各种字符类型
  password += getRandomChar('abcdefghijklmnopqrstuvwxyz');
  password += getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  password += getRandomChar('0123456789');
  password += getRandomChar('!@#$%^&*');

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // 打乱顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

function getRandomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

// ============================================
// 真实姓名验证
// ============================================

export function validateRealName(realName: string): ValidationResult {
  if (!realName) {
    return { valid: false, error: '真实姓名不能为空' };
  }

  if (realName.trim().length === 0) {
    return { valid: false, error: '真实姓名不能为空' };
  }

  if (realName.length > 50) {
    return { valid: false, error: '真实姓名最多50个字符' };
  }

  return { valid: true };
}

// ============================================
// 用户状态验证
// ============================================

export const USER_STATUSES = ['active', 'inactive', 'locked'] as const;
export type UserStatus = typeof USER_STATUSES[number];

export function validateUserStatus(status: string): ValidationResult {
  if (!status) {
    return { valid: false, error: '用户状态不能为空' };
  }

  if (!USER_STATUSES.includes(status as UserStatus)) {
    return { valid: false, error: `无效的用户状态，必须是 ${USER_STATUSES.join(', ')} 之一` };
  }

  return { valid: true };
}

// ============================================
// 用户状态描述
// ============================================

export const USER_STATUS_DESCRIPTIONS: Record<UserStatus, string> = {
  active: '正常',
  inactive: '停用',
  locked: '锁定',
} as const;
