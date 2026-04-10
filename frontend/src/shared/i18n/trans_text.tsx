import React from 'react';

import { useTranslation } from './hooks';
import type { TranslationParams } from './core';

interface TransTextProps {
  i18nKey: string;
  values?: TranslationParams;
  component?: React.ElementType;
  [key: string]: unknown;
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
