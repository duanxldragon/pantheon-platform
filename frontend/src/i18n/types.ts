/**
 * 国际化类型定义
 * 为翻译键提供类型安全支持
 */

// 导入翻译文件作为类型基础
import zhCN from '../i18n/locales/zh-CN.json';

// 翻译值的类型
type TranslationValue = string | number | boolean;
interface TranslationRecord {
  [key: string]: TranslationValue | TranslationRecord;
}

// 翻译键类型（支持嵌套路径）
type TranslationKeys = typeof zhCN;

// 类型安全的翻译键类型
export type CommonTranslationKeys = keyof typeof zhCN.common;
export type ValidationTranslationKeys = keyof typeof zhCN.validation;
export type ErrorTranslationKeys = keyof typeof zhCN.errors;
export type ModuleTranslationKeys = keyof typeof zhCN.modules;
export type MessageTranslationKeys = keyof typeof zhCN.messages;
export type PlaceholderTranslationKeys = keyof typeof zhCN.placeholders;

// 模块翻译键类型
export type AuthTranslationKeys = keyof typeof zhCN.modules.auth;
export type TenantTranslationKeys = keyof typeof zhCN.modules.tenant;
export type SystemTranslationKeys = keyof typeof zhCN.modules.system;
export type NotificationTranslationKeys = keyof typeof zhCN.modules.notification;

// 系统模块翻译键类型
export type SystemUserTranslationKeys = keyof typeof zhCN.modules.system.user;
export type SystemRoleTranslationKeys = keyof typeof zhCN.modules.system.role;
export type SystemDeptTranslationKeys = keyof typeof zhCN.modules.system.dept;
export type SystemPositionTranslationKeys = keyof typeof zhCN.modules.system.position;
export type SystemMenuTranslationKeys = keyof typeof zhCN.modules.system.menu;
export type SystemPermissionTranslationKeys = keyof typeof zhCN.modules.system.permission;
export type SystemDictTranslationKeys = keyof typeof zhCN.modules.system.dict;
export type SystemLogTranslationKeys = keyof typeof zhCN.modules.system.log;
export type SystemSettingTranslationKeys = keyof typeof zhCN.modules.system.setting;
export type SystemMonitorTranslationKeys = keyof typeof zhCN.modules.system.monitor;

// 常用翻译键类型
export type ActionKeys = keyof typeof zhCN.common.actions;
export type StatusKeys = keyof typeof zhCN.common.status;
export type UIKeys = keyof typeof zhCN.common.ui;
export type TimeKeys = keyof typeof zhCN.common.time;

// 验证翻译键类型
export type ValidationConfirmKeys = keyof typeof zhCN.validation.confirm;
export type ValidationPasswordKeys = keyof typeof zhCN.validation.password;
export type ValidationUsernameKeys = keyof typeof zhCN.validation.username;

// 认证模块翻译键类型
export type AuthLoginKeys = keyof typeof zhCN.modules.auth.login;
export type AuthProfileKeys = keyof typeof zhCN.modules.auth.profile;

// 租户模块翻译键类型
export type TenantSetupKeys = keyof typeof zhCN.modules.tenant.setup;
export type TenantStatusKeys = keyof typeof zhCN.modules.tenant.status;

// 类型安全的翻译函数参数类型
export type TranslationParams = {
  [key: string]: string | number | boolean;
};

// 类型安全的翻译函数
export type TypedTranslateFunction = (
  key: string,
  params?: TranslationParams
) => string;

// 翻译命名空间类型
export type TranslationNamespace =
  | 'common'
  | 'validation'
  | 'errors'
  | 'modules'
  | 'messages'
  | 'placeholders';

// 模块命名空间类型
export type ModuleNamespace =
  | 'auth'
  | 'tenant'
  | 'system'
  | 'notification';

// 完整的翻译配置类型
export interface I18nConfig {
  lng: string;
  fallbackLng: string;
  supportedLngs: string[];
  resources: Record<string, TranslationRecord>;
  debug: boolean;
  interpolation: {
    escapeValue: boolean;
  };
  detection: {
    order: string[];
    caches: string[];
    lookupLocalStorage: string;
  };
  react: {
    useSuspense: boolean;
    bindI18n: string;
    bindI18nStore: string;
  };
}

// 语言信息类型
export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

// i18n上下文类型
export interface I18nContext {
  t: (key: string, params?: TranslationParams) => string;
  i18n: {
    language: string;
    languages: LanguageInfo[];
    changeLanguage: (lng: string) => Promise<string>;
    dir: (lng?: string) => 'ltr' | 'rtl';
  };
  currentLanguage: string;
  isRTL: boolean;
  changeLanguage: (lng: string) => Promise<boolean>;
  languages: LanguageInfo[];
  hasLanguage: (lng: string) => boolean;
}

// 翻译文件结构类型（用于生成）
export interface TranslationFileStructure {
  common: {
    actions: Record<string, string>;
    status: Record<string, string>;
    ui: Record<string, string>;
    time: Record<string, string>;
  };
  validation: {
    required: string;
    invalid: string;
    minLength: string;
    maxLength: string;
    min: string;
    max: string;
    email: string;
    phone: string;
    url: string;
    password: Record<string, string>;
    username: Record<string, string>;
    confirm: Record<string, string>;
  };
  errors: Record<string, string>;
  modules: {
    auth: TranslationRecord;
    tenant: TranslationRecord;
    system: TranslationRecord;
    notification: TranslationRecord;
  };
  messages: Record<string, string>;
  placeholders: Record<string, string>;
}

// 类型守卫
export function isTranslationKey(key: string, _namespace?: TranslationNamespace): key is keyof TranslationFileStructure {
  // 这里可以添加更复杂的验证逻辑
  return typeof key === 'string';
}

// 类型安全的翻译键构造器
export class TranslationKeyBuilder {
  private parts: string[] = [];

  add(part: string): TranslationKeyBuilder {
    this.parts.push(part);
    return this;
  }

  build(): string {
    return this.parts.join('.');
  }

  // 预定义的常用方法
  static common(key: ActionKeys | StatusKeys | UIKeys): string {
    return `common.${key}`;
  }

  static validation(key: ValidationConfirmKeys): string {
    return `validation.${key}`;
  }

  static error(key: ErrorTranslationKeys): string {
    return `errors.${key}`;
  }

  static module(module: ModuleNamespace, key: string): string {
    return `modules.${module}.${key}`;
  }

  static message(key: MessageTranslationKeys): string {
    return `messages.${key}`;
  }
}

// 翻译工具类型
export interface TranslationUtils {
  t: (key: string, params?: TranslationParams) => string;
  changeLanguage: (lng: string) => Promise<boolean>;
  getCurrentLanguage: () => string;
  getSupportedLanguages: () => LanguageInfo[];
  formatMessage: (key: string, params?: TranslationParams) => string;
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (num: number, format?: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

// 导出默认的翻译键类型
export default TranslationKeys;
