import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { supportedLanguages } from '../i18n';

/**
 * 国际化Hook
 * 封装react-i18next的useTranslation，提供更好的类型支持
 */
export function useI18n(namespace?: string) {
  const { t, i18n: i18nInstance } = useI18nextTranslation(namespace);

  return {
    // 翻译函数
    t,

    // 当前语言
    currentLanguage: i18nInstance.language,

    // 是否RTL语言（如阿拉伯语）
    isRTL: i18nInstance.dir() === 'rtl',

    // 切换语言
    changeLanguage: (lng: string) => {
      return i18nInstance.changeLanguage(lng);
    },

    // 获取所有支持的语言
    languages: supportedLanguages,

    // 检查是否支持指定语言
    hasLanguage: (lng: string) => {
      return supportedLanguages.some(lang => lang.code === lng);
    }
  };
}

/**
 * 简化的翻译Hook，用于只需要t函数的场景
 */
export function useT(namespace?: string) {
  const { t } = useI18nextTranslation(namespace);
  return t;
}

/**
 * 语言切换Hook
 * 专门用于处理语言切换逻辑
 */
export function useLanguageSwitcher() {
  const { i18n } = useI18nextTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng);
      // 更新HTML的lang属性
      document.documentElement.lang = lng;
      // 更新HTML的dir属性（针对RTL语言）
      document.documentElement.dir = i18n.dir(lng);
      // 存储到localStorage
      localStorage.setItem('i18nextLng', lng);
      return true;
    } catch (error) {
      console.error('Language change failed:', error);
      return false;
    }
  };

  return {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    // 获取当前语言信息
    getCurrentLanguageInfo: () => {
      return supportedLanguages.find(lang => lang.code === currentLanguage);
    }
  };
}

export default useI18n;
