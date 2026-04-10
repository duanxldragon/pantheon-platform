import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import ja from '../shared/i18n/locales/ja.json';
import ko from '../shared/i18n/locales/ko.json';

// 翻译资源配置
const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  },
  'ja': {
    translation: ja
  },
  'ko': {
    translation: ko
  }
};

// i18next配置
i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 绑定react-i18next
  .init({
    resources,

    // 默认语言
    lng: 'zh-CN',

    // 备用语言
    fallbackLng: 'en-US',

    // 语言列表
    supportedLngs: ['zh-CN', 'en-US', 'ja', 'ko'],

    // 调试模式（生产环境设为false）
    debug: import.meta.env.DEV,

    // 插值配置
    interpolation: {
      escapeValue: false // React已防止XSS
    },

    // 语言检测配置
    detection: {
      // 检测顺序
      order: ['localStorage', 'navigator', 'htmlTag'],

      // 缓存用户语言选择
      caches: ['localStorage'],

      // localStorage键名
      lookupLocalStorage: 'i18nextLng',

      // 语言cookie过期时间（分钟）
      cookieMinutes: 10080 // 7天
    },

    // 命名空间（如果需要拆分翻译文件）
    ns: ['translation'],
    defaultNS: 'translation',

    // React特殊配置
    react: {
      // 使用Suspense组件
      useSuspense: false,

      // 绑定存储（语言切换时重新渲染）
      bindI18n: 'languageChanged',

      // 绑定存储（命名空间变化时重新渲染）
      bindI18nStore: 'added'
    }
  });

export default i18n;

// 导出语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

// 导出类型安全的翻译函数类型
export type TranslationKeys = typeof zhCN;
export type TranslationPath = keyof TranslationKeys | string;
