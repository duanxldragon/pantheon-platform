import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import {
  API_ERROR_MESSAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageState,
  type Translations,
} from './types';
import { BUILTIN_TRANSLATIONS } from './resources';

const TRANSLATIONS_MAP: Record<string, Translations> = {
  ...BUILTIN_TRANSLATIONS,
};

function resolveTranslation(
  translations: Record<string, Translations>,
  currentLanguage: string,
  key: string,
  paramsOrFallback?: Record<string, unknown> | string,
  fallback?: string,
): string {
  const params = typeof paramsOrFallback === 'string' ? undefined : paramsOrFallback;
  const fallbackText = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;
  const keys = key.split('.');

  const findValue = (source?: Translations) => {
    let value: unknown = source;
    for (const segment of keys) {
      if (value && typeof value === 'object' && segment in value) {
        value = (value as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }
    return value;
  };

  const value = findValue(translations[currentLanguage]) ?? findValue(translations[DEFAULT_LANGUAGE]);
  if (typeof value !== 'string') {
    return fallbackText ?? key;
  }

  if (!params) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (match, param) => {
    return params[param] !== undefined ? String(params[param]) : match;
  });
}

export const useLanguageStore = create<LanguageState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        currentLanguage: DEFAULT_LANGUAGE,
        languages: SUPPORTED_LANGUAGES,
        translations: TRANSLATIONS_MAP,

        setLanguage: (languageCode: string) => {
          set({ currentLanguage: languageCode });

          if (typeof document !== 'undefined') {
            document.documentElement.lang = languageCode;
            document.documentElement.dir = RTL_LANGUAGES.includes(languageCode) ? 'rtl' : 'ltr';
          }
        },

        t: (key, paramsOrFallback, fallbackText) => {
          const { currentLanguage, translations } = get();
          return resolveTranslation(translations, currentLanguage, key, paramsOrFallback, fallbackText);
        },

        loadTranslations: async (languageCode: string) => {
          if (TRANSLATIONS_MAP[languageCode]) {
            return;
          }

          try {
            const module = await import(`./locales/${languageCode}.json`);
            const loaded = module.default as Translations;
            set((state) => ({
              translations: {
                ...state.translations,
                [languageCode]: loaded,
              },
            }));
          } catch (error) {
            console.error(`Failed to load translations for ${languageCode}:`, error);
          }
        },

        isRTL: () => {
          const { currentLanguage } = get();
          return RTL_LANGUAGES.includes(currentLanguage);
        },
      }),
      {
        name: LANGUAGE_STORAGE_KEY,
        partialize: (state) => ({
          currentLanguage: state.currentLanguage,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state || typeof document === 'undefined') {
            return;
          }

          document.documentElement.lang = state.currentLanguage;
          document.documentElement.dir = RTL_LANGUAGES.includes(state.currentLanguage) ? 'rtl' : 'ltr';
        },
      }
    )
  )
);

export const t = (key: string, paramsOrFallback?: Record<string, unknown> | string, fallback?: string) => {
  return useLanguageStore.getState().t(key, paramsOrFallback, fallback);
};

export const getCurrentLanguage = (): LanguageCode => {
  return useLanguageStore.getState().currentLanguage as LanguageCode;
};

export const isRTL = (): boolean => {
  return useLanguageStore.getState().isRTL();
};

export const getErrorMessage = (errorCode: string): string => {
  const { currentLanguage } = useLanguageStore.getState();
  return API_ERROR_MESSAGES[currentLanguage]?.[errorCode] || errorCode;
};

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const { currentLanguage } = useLanguageStore.getState();
  const value = typeof date === 'string' ? new Date(date) : date;
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  try {
    return value.toLocaleDateString(currentLanguage, formatOptions);
  } catch {
    return value.toLocaleDateString('en-US', formatOptions);
  }
};

export const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
  const { currentLanguage } = useLanguageStore.getState();

  try {
    return number.toLocaleString(currentLanguage, options);
  } catch {
    return number.toLocaleString('en-US', options);
  }
};

export const formatCurrency = (
  amount: number,
  currency: string = 'CNY',
  options?: Intl.NumberFormatOptions
): string => {
  const { currentLanguage } = useLanguageStore.getState();
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    ...options,
  };

  try {
    return amount.toLocaleString(currentLanguage, formatOptions);
  } catch {
    return amount.toLocaleString('en-US', formatOptions);
  }
};

export const useLanguage = () => {
  const languageStore = useLanguageStore();

  return {
    ...languageStore,
    switchLanguage: (languageCode: string) => {
      languageStore.setLanguage(languageCode);
    },
  };
};
