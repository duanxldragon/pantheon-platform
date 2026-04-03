import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BUILTIN_TRANSLATIONS } from './resources';
import { DEFAULT_LANGUAGE, RTL_LANGUAGES, SUPPORTED_LANGUAGES, type LanguageCode, type Translations } from './types';
import { TranslationContext, type TranslationProviderProps, resolveTranslation, type TranslationContextType, type TranslationParams } from './core';

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

  const applyDocumentLanguage = useCallback((language: LanguageCode) => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  }, []);

  const loadTranslations = useCallback(async (language: LanguageCode) => {
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
  }, [loadedTranslations]);

  const handleSetLanguage = useCallback((language: LanguageCode) => {
    setCurrentLanguage(language);
    applyDocumentLanguage(language);
    void loadTranslations(language);
  }, [applyDocumentLanguage, loadTranslations]);

  const t = useCallback((key: string, paramsOrFallback?: TranslationParams | string, fallback?: string): string => {
    return resolveTranslation(loadedTranslations, currentLanguage, key, paramsOrFallback, fallback);
  }, [currentLanguage, loadedTranslations]);

  useEffect(() => {
    applyDocumentLanguage(currentLanguage);
    void loadTranslations(currentLanguage);
  }, [applyDocumentLanguage, currentLanguage, loadTranslations]);

  const value = useMemo<TranslationContextType>(
    () => ({
      currentLanguage,
      setLanguage: handleSetLanguage,
      t,
      isRTL: rtl,
      loadTranslations,
      languages: SUPPORTED_LANGUAGES,
    }),
    [currentLanguage, handleSetLanguage, loadTranslations, rtl, t]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};
