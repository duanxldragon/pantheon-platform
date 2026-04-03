import React, { createContext } from 'react';

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type Translations,
} from './types';

export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

export interface TranslationContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, paramsOrFallback?: TranslationParams | string, fallback?: string) => string;
  isRTL: boolean;
  loadTranslations: (language: LanguageCode) => Promise<void>;
  languages: typeof SUPPORTED_LANGUAGES;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export interface TranslationProviderProps {
  children: React.ReactNode;
  defaultLanguage?: LanguageCode;
  translations?: Partial<Record<LanguageCode, Translations>>;
}

export function resolveTranslation(
  translations: Partial<Record<LanguageCode, Translations>>,
  currentLanguage: LanguageCode,
  key: string,
  paramsOrFallback?: TranslationParams | string,
  fallback?: string,
): string {
  const params = typeof paramsOrFallback === 'string' ? undefined : paramsOrFallback;
  const fallbackText = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback;
  const keys = key.split('.');

  const findValue = (source?: Translations): string | Translations | undefined => {
    let value: string | Translations | undefined = source;
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
