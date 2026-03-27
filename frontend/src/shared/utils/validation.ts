/**
 * 表单验证工具
 * @description 提供常用的验证规则和方法
 */

export type ValidationRule = {
  validate: (value: any) => boolean;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * 验证器类
 */
export class Validator {
  private rules: ValidationRule[] = [];

  /**
   * 添加验证规则
   */
  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * 执行验证
   */
  validate(value: any): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * 预定义的验证规则
 */
export const ValidationRules = {
  /**
   * 必填验证
   */
  required: (message = '此字段为必填项'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== null && value !== undefined;
    },
    message,
  }),

  /**
   * 最小长度验证
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (value === null || value === undefined) return true;
      return value.length >= min;
    },
    message: message || `最少需要${min}个字符`,
  }),

  /**
   * 最大长度验证
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => {
      if (value === null || value === undefined) return true;
      return value.length <= max;
    },
    message: message || `最多允许${max}个字符`,
  }),

  /**
   * 邮箱验证
   */
  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message,
  }),

  /**
   * 手机号验证（中国）
   */
  phone: (message = '请输入有效的手机号'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return /^1[3-9]\d{9}$/.test(value);
    },
    message,
  }),

  /**
   * URL验证
   */
  url: (message = '请输入有效的URL地址'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  /**
   * 数字验证
   */
  number: (message = '请输入有效的数字'): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined || value === '') return true;
      return !isNaN(Number(value));
    },
    message,
  }),

  /**
   * 整数验证
   */
  integer: (message = '请输入整数'): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined || value === '') return true;
      return Number.isInteger(Number(value));
    },
    message,
  }),

  /**
   * 最小值验证
   */
  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined || value === '') return true;
      return Number(value) >= min;
    },
    message: message || `最小值为${min}`,
  }),

  /**
   * 最大值验证
   */
  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined || value === '') return true;
      return Number(value) <= max;
    },
    message: message || `最大值为${max}`,
  }),

  /**
   * 正则表达式验证
   */
  pattern: (regex: RegExp, message = '格式不正确'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return regex.test(value);
    },
    message,
  }),

  /**
   * 自定义验证
   */
  custom: (
    validator: (value: any) => boolean,
    message: string
  ): ValidationRule => ({
    validate: validator,
    message,
  }),

  /**
   * 用户名验证（字母、数字、下划线）
   */
  username: (message = '用户名只能包含字母、数字和下划线'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return /^[a-zA-Z0-9_]+$/.test(value);
    },
    message,
  }),

  /**
   * 密码强度验证（至少8位，包含大小写字母和数字）
   */
  strongPassword: (
    message = '密码必须至少8个字符，包含大小写字母和数字'
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return (
        value.length >= 8 &&
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value) &&
        /\d/.test(value)
      );
    },
    message,
  }),

  /**
   * IP地址验证
   */
  ip: (message = '请输入有效的IP地址'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) &&
        value.split('.').every(num => parseInt(num) <= 255);
    },
    message,
  }),

  /**
   * 日期验证
   */
  date: (message = '请输入有效的日期'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return !isNaN(Date.parse(value));
    },
    message,
  }),

  /**
   * 枚举值验证
   */
  enum: <T extends string>(
    allowedValues: T[],
    message?: string
  ): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return allowedValues.includes(value as T);
    },
    message: message || `值必须是以下之一: ${allowedValues.join(', ')}`,
  }),

  /**
   * 数组长度验证
   */
  arrayLength: (
    min?: number,
    max?: number,
    message?: string
  ): ValidationRule => ({
    validate: (value: any[]) => {
      if (!Array.isArray(value)) return false;
      if (min !== undefined && value.length < min) return false;
      if (max !== undefined && value.length > max) return false;
      return true;
    },
    message: message || `数组长度必须在${min || 0}到${max || '∞'}之间`,
  }),

  /**
   * 文件大小验证（字节）
   */
  fileSize: (maxSize: number, message?: string): ValidationRule => ({
    validate: (file: File) => {
      if (!file) return true;
      return file.size <= maxSize;
    },
    message: message || `文件大小不能超过${formatFileSize(maxSize)}`,
  }),

  /**
   * 文件类型验证
   */
  fileType: (allowedTypes: string[], message?: string): ValidationRule => ({
    validate: (file: File) => {
      if (!file) return true;
      return allowedTypes.includes(file.type);
    },
    message: message || `只允许上传以下类型: ${allowedTypes.join(', ')}`,
  }),
};

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 创建验证器
 * @example
 * ```tsx
 * const usernameValidator = createValidator()
 *   .addRule(ValidationRules.required())
 *   .addRule(ValidationRules.minLength(3))
 *   .addRule(ValidationRules.maxLength(20))
 *   .addRule(ValidationRules.username());
 * 
 * const result = usernameValidator.validate('admin');
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function createValidator(): Validator {
  return new Validator();
}

/**
 * 快速验证
 * @example
 * ```tsx
 * const { valid, errors } = validate('test@example.com', [
 *   ValidationRules.required(),
 *   ValidationRules.email(),
 * ]);
 * ```
 */
export function validate(value: any, rules: ValidationRule[]): ValidationResult {
  const validator = new Validator();
  rules.forEach(rule => validator.addRule(rule));
  return validator.validate(value);
}

/**
 * 表单字段验证
 */
export interface FormField {
  name: string;
  value: any;
  rules: ValidationRule[];
}

/**
 * 表单验证结果
 */
export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

/**
 * 验证整个表单
 * @example
 * ```tsx
 * const result = validateForm([
 *   {
 *     name: 'username',
 *     value: formData.username,
 *     rules: [
 *       ValidationRules.required(),
 *       ValidationRules.minLength(3),
 *     ],
 *   },
 *   {
 *     name: 'email',
 *     value: formData.email,
 *     rules: [
 *       ValidationRules.required(),
 *       ValidationRules.email(),
 *     ],
 *   },
 * ]);
 * ```
 */
export function validateForm(fields: FormField[]): FormValidationResult {
  const errors: Record<string, string[]> = {};
  let valid = true;

  fields.forEach(field => {
    const result = validate(field.value, field.rules);
    if (!result.valid) {
      errors[field.name] = result.errors;
      valid = false;
    }
  });

  return { valid, errors };
}

/**
 * 异步验证规则类型
 */
export type AsyncValidationRule = {
  validate: (value: any) => Promise<boolean>;
  message: string;
};

/**
 * 异步验证
 * @example
 * ```tsx
 * const usernameExists = async (username: string) => {
 *   const response = await api.checkUsername(username);
 *   return !response.exists;
 * };
 * 
 * const result = await validateAsync('admin', [
 *   {
 *     validate: usernameExists,
 *     message: '用户名已存在',
 *   },
 * ]);
 * ```
 */
export async function validateAsync(
  value: any,
  rules: AsyncValidationRule[]
): Promise<ValidationResult> {
  const errors: string[] = [];

  for (const rule of rules) {
    try {
      const isValid = await rule.validate(value);
      if (!isValid) {
        errors.push(rule.message);
      }
    } catch (error) {
      console.error('Async validation error:', error);
      errors.push('验证失败，请重试');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 数据库连接配置验证规则
 */
export const DatabaseValidationRules = {
  /**
   * 主机地址验证
   */
  host: (message = '请输入有效的主机地址'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      // 支持域名、IP地址或localhost
      return /^(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost|(\d{1,3}\.){3}\d{1,3})$/.test(value);
    },
    message,
  }),

  /**
   * 端口验证
   */
  port: (message = '请输入有效的端口号(1-65535)'): ValidationRule => ({
    validate: (value: any) => {
      if (!value) return false;
      const port = Number(value);
      return Number.isInteger(port) && port >= 1 && port <= 65535;
    },
    message,
  }),

  /**
   * 数据库名验证
   */
  database: (message = '请输入有效的数据库名'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      // 数据库名只能包含字母、数字、下划线，不能以数字开头
      return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value);
    },
    message,
  }),

  /**
   * 数据库用户名验证
   */
  username: (message = '请输入有效的用户名'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      return value.length >= 1 && value.length <= 32;
    },
    message,
  }),

  /**
   * 数据库密码验证
   */
  password: (message = '请输入密码'): ValidationRule => ({
    validate: (value: string) => {
      return value !== undefined && value !== null && value.length > 0;
    },
    message,
  }),

  /**
   * 文件路径验证（SQLite）
   */
  filepath: (message = '请输入有效的文件路径'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return false;
      // 支持绝对路径和相对路径
      return /^([a-zA-Z]:)?[/\\].*|^\.\/.*|^~\/.*/.test(value);
    },
    message,
  }),

  /**
   * 数据库类型验证
   */
  databaseType: (message = '请选择数据库类型'): ValidationRule => ({
    validate: (value: string) => {
      return ['mysql', 'postgresql', 'sqlite', 'mssql'].includes(value);
    },
    message,
  }),
};

/**
 * 验证数据库连接配置
 */
export function validateDatabaseConfig(config: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  // 验证数据库类型
  if (!config.databaseType) {
    errors.push('请选择数据库类型');
  }

  // SQLite 特殊处理
  if (config.databaseType === 'sqlite') {
    if (!config.filepath) {
      errors.push('请输入数据库文件路径');
    }
  } else {
    // 其他数据库类型的通用验证
    if (!config.host) {
      errors.push('请输入主机地址');
    }
    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('请输入有效的端口号');
    }
    if (!config.database) {
      errors.push('请输入数据库名');
    }
    if (!config.username) {
      errors.push('请输入用户名');
    }
    if (!config.password) {
      errors.push('请输入密码');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
