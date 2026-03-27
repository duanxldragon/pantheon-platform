import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_LANGUAGE,
  RTL_LANGUAGES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type Translations,
} from './types';
import { BUILTIN_TRANSLATIONS } from './resources';

interface TranslationContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, paramsOrFallback?: Record<string, any> | string, fallback?: string) => string;
  isRTL: boolean;
  loadTranslations: (language: LanguageCode) => Promise<void>;
  languages: typeof SUPPORTED_LANGUAGES;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: React.ReactNode;
  defaultLanguage?: LanguageCode;
  translations?: Partial<Record<LanguageCode, Translations>>;
}

function resolveTranslation(
  translations: Partial<Record<LanguageCode, Translations>>,
  currentLanguage: LanguageCode,
  key: string,
  paramsOrFallback?: Record<string, any> | string,
  fallback?: string,
): string {
  const params = typeof paramsOrFallback === 'string' ? undefined : paramsOrFallback;
  const fallbackText = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;
  const keys = key.split('.');

  const findValue = (source?: Translations) => {
    let value: any = source;
    for (const segment of keys) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
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

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  defaultLanguage = DEFAULT_LANGUAGE,
  translations = {},
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(defaultLanguage);
  const [loadedTranslations, setLoadedTranslations] = useState<Partial<Record<LanguageCode, Translations>>>({
    ...BUILTIN_TRANSLATIONS,
    ...translations,
  });

  const rtl = RTL_LANGUAGES.includes(currentLanguage);

  const applyDocumentLanguage = (language: LanguageCode) => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  };

  const loadTranslations = async (language: LanguageCode) => {
    if (loadedTranslations[language]) {
      return;
    }

    try {
      const module = await import(`./locales/${language}.json`);
      const nextTranslations = module.default as Translations;
      setLoadedTranslations((prev) => ({
        ...prev,
        [language]: nextTranslations,
      }));
    } catch (error) {
      console.error(`Failed to load translations for ${language}:`, error);
    }
  };

  const handleSetLanguage = (language: LanguageCode) => {
    setCurrentLanguage(language);
    applyDocumentLanguage(language);
    void loadTranslations(language);
  };

  const t = (key: string, paramsOrFallback?: Record<string, any> | string, fallback?: string): string => {
    return resolveTranslation(loadedTranslations, currentLanguage, key, paramsOrFallback, fallback);
  };

  useEffect(() => {
    applyDocumentLanguage(currentLanguage);
    void loadTranslations(currentLanguage);
  }, []);

  const value = useMemo<TranslationContextType>(
    () => ({
      currentLanguage,
      setLanguage: handleSetLanguage,
      t,
      isRTL: rtl,
      loadTranslations,
      languages: SUPPORTED_LANGUAGES,
    }),
    [currentLanguage, loadedTranslations, rtl]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const useLanguage = useTranslation;

export const withTranslation = <P extends object>(Component: React.ComponentType<P>) => {
  const WithTranslationComponent = (props: P) => {
    const translationContext = useTranslation();
    return <Component {...props} {...translationContext} />;
  };

  WithTranslationComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
  return WithTranslationComponent;
};

interface TransTextProps {
  i18nKey: string;
  values?: Record<string, any>;
  component?: React.ElementType;
  [key: string]: any;
}

export const TransText: React.FC<TransTextProps> = ({
  i18nKey,
  values,
  component: Component = 'span',
  ...props
}) => {
  const { t } = useTranslation();
  return <Component {...props}>{t(i18nKey, values)}</Component>;
};

export const useFormatNumber = () => {
  const { currentLanguage } = useTranslation();
  return (number: number, options?: Intl.NumberFormatOptions): string => {
    return number.toLocaleString(currentLanguage, options);
  };
};

export const useFormatCurrency = () => {
  const { currentLanguage } = useTranslation();

  return (amount: number, currency: string = 'CNY', options?: Intl.NumberFormatOptions): string => {
    return amount.toLocaleString(currentLanguage, {
      style: 'currency',
      currency,
      ...options,
    });
  };
};

export const useFormatDate = () => {
  const { currentLanguage } = useTranslation();

  return (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
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
};
