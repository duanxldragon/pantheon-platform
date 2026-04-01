/**
 * 安全工具集
 * @description 提供XSS防护、CSRF防护等安全功能
 */

/**
 * XSS防护 - 输入清理
 */
export const sanitizeInput = {
  /**
   * 清理普通文本（移除HTML标签）
   */
  text: (input: string): string => {
    if (!input) return '';
    return input
      .replace(/[<>]/g, '') // 移除尖括号
      .replace(/javascript:/gi, '') // 移除javascript协议
      .replace(/on\w+\s*=/gi, '') // 移除事件处理器
      .trim();
  },

  /**
   * 清理HTML内容（只保留安全标签）
   */
  html: (input: string): string => {
    if (!input) return '';
    
    // 允许的安全标签
    const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'];
    const allowedAttrs = ['href', 'title', 'class'];
    
    // 简单的HTML清理（生产环境建议使用DOMPurify）
    let cleaned = input;
    
    // 移除脚本标签
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 移除事件处理器
    cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // 移除javascript协议
    cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
    
    return cleaned;
  },

  /**
   * 清理SQL（防止SQL注入）
   */
  sql: (input: string): string => {
    if (!input) return '';
    return input.replace(/['";\\]/g, '');
  },

  /**
   * 清理URL
   */
  url: (input: string): string => {
    if (!input) return '';
    try {
      const url = new URL(input);
      // 只允许http和https协议
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * 清理文件名
   */
  filename: (input: string): string => {
    if (!input) return '';
    return input
      .replace(/[^\w\s.-]/g, '') // 只保留字母、数字、空格、点和横线
      .replace(/\.\./g, '.') // 防止路径遍历
      .trim();
  },
};

/**
 * HTML转义（防止XSS）
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * HTML反转义
 */
export function unescapeHtml(text: string): string {
  const htmlUnescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  };
  
  return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => htmlUnescapeMap[entity] || entity);
}

/**
 * CSRF Token管理
 */
export class CSRFTokenManager {
  private static readonly TOKEN_KEY = 'csrf-token';
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 生成CSRF Token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // 存储Token和过期时间
    const tokenData = {
      token,
      expiry: Date.now() + this.TOKEN_EXPIRY,
    };
    
    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    
    return token;
  }

  /**
   * 获取当前Token
   */
  static getToken(): string | null {
    try {
      const data = sessionStorage.getItem(this.TOKEN_KEY);
      if (!data) return null;
      
      const tokenData = JSON.parse(data);
      
      // 检查是否过期
      if (Date.now() >= tokenData.expiry) {
        this.clearToken();
        return null;
      }
      
      return tokenData.token;
    } catch {
      return null;
    }
  }

  /**
   * 验证Token
   */
  static validateToken(token: string): boolean {
    const currentToken = this.getToken();
    if (!currentToken) return false;
    
    // 使用恒定时间比较防止时序攻击
    return this.constantTimeCompare(token, currentToken);
  }

  /**
   * 清除Token
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * 刷新Token（延长过期时间）
   */
  static refreshToken(): string | null {
    const token = this.getToken();
    if (!token) return null;
    
    const tokenData = {
      token,
      expiry: Date.now() + this.TOKEN_EXPIRY,
    };
    
    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    
    return token;
  }

  /**
   * 获取Token请求头
   */
  static getTokenHeader(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};
    
    return {
      [this.TOKEN_HEADER]: token,
    };
  }

  /**
   * 恒定时间字符串比较（防止时序攻击）
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

/**
 * 安全的随机字符串生成
 */
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 密码哈希（前端预处理）
 * 注意：这只是预处理，真正的哈希应该在后端完成
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 内容安全策略（CSP）配置
 */
export const CSPConfig = {
  /**
   * 获取CSP meta标签内容
   */
  getMetaContent(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 开发环境，生产环境应移除unsafe
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  },

  /**
   * 应用CSP到页面
   */
  apply(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.getMetaContent();
    document.head.appendChild(meta);
  },
};

/**
 * 安全头部检查
 */
export const SecurityHeaders = {
  /**
   * 检查必要的安全头部是否存在
   */
  check(): {
    passed: boolean;
    missing: string[];
  } {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
    ];
    
    const missing: string[] = [];
    
    // 注意：在前端只能检查meta标签，真正的HTTP头部需要后端设置
    requiredHeaders.forEach(header => {
      const meta = document.querySelector(`meta[http-equiv="${header}"]`);
      if (!meta) {
        missing.push(header);
      }
    });
    
    return {
      passed: missing.length === 0,
      missing,
    };
  },

  /**
   * 应用安全头部（通过meta标签）
   * 注意：某些头部（如 X-Frame-Options）必须通过 HTTP 响应头设置
   */
  apply(): void {
    const headers = {
      'X-Content-Type-Options': 'nosniff',
    };
    
    Object.entries(headers).forEach(([name, content]) => {
      const existing = document.querySelector(`meta[http-equiv="${name}"]`);
      if (existing) return;
      
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
  },
};

/**
 * 敏感数据脱敏
 */
export const maskSensitiveData = {
  /**
   * 手机号脱敏
   */
  phone: (phone: string): string => {
    if (!phone || phone.length < 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  /**
   * 邮箱脱敏
   */
  email: (email: string): string => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local.slice(0, 2)}***@${domain}`;
  },

  /**
   * 身份证号脱敏
   */
  idCard: (idCard: string): string => {
    if (!idCard || idCard.length < 18) return idCard;
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  },

  /**
   * 银行卡号脱敏
   */
  bankCard: (card: string): string => {
    if (!card || card.length < 16) return card;
    return card.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
  },

  /**
   * 密码脱敏（全部替换为星号）
   */
  password: (password: string): string => {
    if (!password) return '';
    return '*'.repeat(password.length);
  },

  /**
   * IP地址部分脱敏
   */
  ip: (ip: string): string => {
    if (!ip) return ip;
    const parts = ip.split('.');
    if (parts.length !== 4) return ip;
    return `${parts[0]}.${parts[1]}.***.***.`;
  },
};

/**
 * 初始化安全功能
 */
export function initializeSecurity(): void {
  // 应用CSP
  // CSPConfig.apply(); // 如果需要的话取消注释
  
  // 应用安全头部
  SecurityHeaders.apply();
  
  // 生成初始CSRF Token
  if (!CSRFTokenManager.getToken()) {
    CSRFTokenManager.generateToken();
  }
  
  // 定期刷新Token
  setInterval(() => {
    CSRFTokenManager.refreshToken();
  }, 30 * 60 * 1000); // 每30分钟刷新一次
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T = any>(json: string, defaultValue: T | null = null): T | null {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * 检测可疑活动
 */
export class SecurityMonitor {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly TIME_WINDOW = 5 * 60 * 1000; // 5分钟
  
  private static failedAttempts: Map<string, number[]> = new Map();

  /**
   * 记录失败尝试
   */
  static recordFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.failedAttempts.get(identifier) || [];
    
    // 清除过期的尝试记录
    const recentAttempts = attempts.filter(time => now - time < this.TIME_WINDOW);
    
    // 添加新的失败记录
    recentAttempts.push(now);
    this.failedAttempts.set(identifier, recentAttempts);
    
    // 检查是否超过限制
    return recentAttempts.length >= this.MAX_FAILED_ATTEMPTS;
  }

  /**
   * 清除失败记录
   */
  static clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  /**
   * 检查是否被限制
   */
  static isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.failedAttempts.get(identifier) || [];
    const recentAttempts = attempts.filter(time => now - time < this.TIME_WINDOW);
    
    return recentAttempts.length >= this.MAX_FAILED_ATTEMPTS;
  }
}

/**
 * 输入验证增强（防止注入攻击）
 */
export const secureValidation = {
  /**
   * 验证是否包含危险字符
   */
  hasDangerousChars: (input: string): boolean => {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /expression\(/i,
      /<iframe/i,
      /<embed/i,
      /<object/i,
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(input));
  },

  /**
   * 验证是否为安全的URL
   */
  isSafeUrl: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  /**
   * 验证是否为安全的文件路径
   */
  isSafePath: (path: string): boolean => {
    // 防止路径遍历攻击
    const dangerousPatterns = [
      /\.\./,
      /~/,
      /^[/\\]/,
      /[/\\]{2,}/,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(path));
  },
};
