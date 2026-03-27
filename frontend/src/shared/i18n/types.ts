export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationKey {
  key: string;
  value: string;
  params?: Record<string, any>;
}

export interface Translations {
  [key: string]: string | Translations;
}

export interface LanguageState {
  currentLanguage: string;
  languages: Language[];
  translations: Record<string, Translations>;
  setLanguage: (languageCode: string) => void;
  t: (key: string, paramsOrFallback?: Record<string, any> | string, fallback?: string) => string;
  loadTranslations: (languageCode: string) => Promise<void>;
  isRTL: () => boolean;
}

export type LanguageCode = 'zh' | 'en';

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳',
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
  },
];

export const RTL_LANGUAGES = ['ar', 'he', 'fa'];

export const LANGUAGE_STORAGE_KEY = 'pantheon-language';

export const DEFAULT_LANGUAGE: LanguageCode = 'zh';

export const API_ERROR_MESSAGES: Record<string, Record<string, string>> = {
  zh: {
    NETWORK_ERROR: '网络错误',
    UNAUTHORIZED: '未授权',
    FORBIDDEN: '禁止访问',
    NOT_FOUND: '未找到',
    SERVER_ERROR: '服务器错误',
    VALIDATION_ERROR: '校验失败',
  },
  en: {
    NETWORK_ERROR: 'Network error',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Not found',
    SERVER_ERROR: 'Server error',
    VALIDATION_ERROR: 'Validation error',
  },
};
