import React, { useContext } from 'react';

import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, type LanguageCode, type Translations } from './types';
import { TranslationContext, resolveTranslation, type TranslationContextType, type TranslationParams } from './core';
import { useLanguageStore } from '../../stores/language_store';

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  const storeLanguage = useLanguageStore((state) => state.language);
  const storeTranslations = useLanguageStore((state) => state.t);
  const storeSetLanguage = useLanguageStore((state) => state.setLanguage);

  if (context) {
    return context;
  }

  const fallbackLanguage = storeLanguage as LanguageCode;

  return {
    currentLanguage: fallbackLanguage,
    setLanguage: (language: LanguageCode) => storeSetLanguage(language),
    t: (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string) =>
      resolveTranslation(
        { [fallbackLanguage]: storeTranslations as Translations },
        fallbackLanguage,
        key,
        paramsOrFallback,
        fallback,
      ),
    isRTL: RTL_LANGUAGES.includes(fallbackLanguage),
    loadTranslations: async () => undefined,
    languages: SUPPORTED_LANGUAGES,
  };
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

