import i18n, { type Module } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translationLoader, i18nApi, type SupportedLanguage } from '../shared/i18n/i18n_api';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

/**
 * 语言代码映射
 */
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  'zh-CN': 'zh',
  'en-US': 'en',
  'ja': 'ja',
  'ko': 'ko',
};

/**
 * 反向映射
 */
const REVERSE_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  'zh': 'zh-CN',
  'en': 'en-US',
  'ja': 'ja',
  'ko': 'ko',
};

/**
 * 将前端语言代码转换为后端语言代码
 */
export function toBackendLanguage(locale: string): SupportedLanguage {
  return LANGUAGE_MAP[locale] || 'zh';
}

/**
 * 将后端语言代码转换为前端语言代码
 */
export function toFrontendLocale(language: SupportedLanguage): string {
  return REVERSE_LANGUAGE_MAP[language] || 'zh-CN';
}

/**
 * 动态加载后端翻译
 */
async function loadBackendTranslations(language: SupportedLanguage): Promise<void> {
  try {
    // 从后端加载翻译
    const translations = await translationLoader.loadLanguage(language);

    // 将扁平化的键值转换为嵌套结构
    const nestedTranslations = nestTranslations(translations);

    // 添加到 i18next 资源中
    const locale = toFrontendLocale(language);
    i18n.addResourceBundle(locale, 'translation', nestedTranslations, true, true);

    console.log(`[i18n] Loaded ${Object.keys(translations).length} translations for ${locale}`);
  } catch (error) {
    console.error('[i18n] Failed to load backend translations:', error);
    // 失败时继续使用静态翻译
  }
}

/**
 * 将扁平化的键值转换为嵌套结构
 * 例如: { "system.user.create.success": "成功" } -> { system: { user: { create: { success: "成功" } } } }
 */
function nestTranslations(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in flat) {
    const value = flat[key];
    const keys = key.split('.');
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k]) {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  return result;
}

/**
 * 合并静态翻译和动态翻译
 */
function mergeTranslations(
  staticTranslations: Record<string, any>,
  dynamicTranslations: Record<string, any>
): Record<string, any> {
  return {
    ...staticTranslations,
    ...dynamicTranslations,
  };
}

/**
 * 初始化 i18next
 */
export async function initializeI18n(): Promise<void> {
  // 先使用静态翻译初始化（确保启动时有默认翻译）
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        'zh-CN': {
          translation: zhCN,
        },
        'en-US': {
          translation: enUS,
        },
      },
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      supportedLngs: ['zh-CN', 'en-US', 'ja', 'ko', 'zh', 'en'], // 支持前端和后端语言代码
      nonExplicitSupportedLngs: true, // 允许模糊匹配（如 'zh' 匹配 'zh-CN'）
      interpolation: {
        escapeValue: false,
      },
    });

  // 尝试从后端加载动态翻译
  const currentLanguage = toBackendLanguage(i18n.language);
  await loadBackendTranslations(currentLanguage);
}

/**
 * 切换语言
 */
export async function changeLanguage(locale: string): Promise<void> {
  const backendLanguage = toBackendLanguage(locale);
  const frontendLocale = toFrontendLocale(backendLanguage);

  // 检查是否已加载该语言的动态翻译
  const hasDynamicTranslations = i18n.hasResourceBundle(frontendLocale, 'translation');

  // 加载动态翻译（如果还没加载）
  if (!hasDynamicTranslations) {
    await loadBackendTranslations(backendLanguage);
  }

  // 切换语言
  await i18n.changeLanguage(frontendLocale);
}

/**
 * 重新加载翻译（用于管理员更新翻译后）
 */
export async function reloadTranslations(language?: SupportedLanguage): Promise<void> {
  const lang = language || toBackendLanguage(i18n.language);
  const locale = toFrontendLocale(lang);

  // 清除缓存
  translationLoader.clearLanguage(lang);

  // 重新加载
  await loadBackendTranslations(lang);

  console.log(`[i18n] Reloaded translations for ${locale}`);
}

/**
 * i18n 插件：自动加载后端翻译
 */
const BackendTranslationLoader: any = {
  type: 'backend',
  init: function (services: any, backendOptions: any, i18nextOptions: any) {
    // 在 i18next 初始化后自动加载
    services.i18n.on('initialized', async (options: any) => {
      const language = toBackendLanguage(options.lng);
      await loadBackendTranslations(language);
    });
  },
  read: function (language: string, namespace: string, callback: any) {
    // 这个方法由动态加载处理
    callback(null, null);
  },
};

// 使用 i18next 配置
i18n.use(BackendTranslationLoader as any);

export default i18n;
