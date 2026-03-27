import React, { useState } from 'react';
import {
  useTranslation,
  type LanguageCode,
} from '../i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'select';
  size?: 'sm' | 'default' | 'lg';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  size = 'default',
  showFlag = true,
  showName = true,
  className = '',
}) => {
  const { currentLanguage, setLanguage, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find((lang) => lang.code === currentLanguage);

  const handleLanguageChange = (languageCode: LanguageCode) => {
    setLanguage(languageCode);
    setIsOpen(false);
  };

  if (variant === 'select') {
    return (
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className={`w-[180px] ${className}`}>
          <SelectValue>
            <div className="flex items-center gap-2">
              {showFlag && currentLang?.flag && (
                <span className="text-base">{currentLang.flag}</span>
              )}
              {showName && currentLang?.name && (
                <span>{currentLang.name}</span>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span className="text-base">{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className={`gap-2 ${className}`}>
          <Globe className="h-4 w-4" />
          {showFlag && currentLang?.flag && (
            <span className="text-base">{currentLang.flag}</span>
          )}
          {showName && currentLang?.name && (
            <span className="hidden sm:inline">{currentLang.name}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code as LanguageCode)}
            className="flex items-center gap-2"
          >
            <span className="text-base">{language.flag}</span>
            <span>{language.name}</span>
            {currentLanguage === language.code && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 简化版语言选择器，仅显示语言代码
export const SimpleLanguageSelector: React.FC<{
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => {
  const { languages } = useTranslation();

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as LanguageCode)}
      className={`rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.flag} {language.name}
        </option>
      ))}
    </select>
  );
};

// 语言切换按钮组
export const LanguageToggleGroup: React.FC<{
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => {
  const { languages } = useTranslation();

  return (
    <div className={`inline-flex rounded-md border border-gray-200 ${className}`}>
      {languages.map((language, index) => (
        <button
          key={language.code}
          onClick={() => onChange(language.code as LanguageCode)}
          className={`
            border-0 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500
            ${value === language.code
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
            ${index === 0 ? 'rounded-l-md' : ''}
            ${index === languages.length - 1 ? 'rounded-r-md' : ''}
            ${index > 0 && index < languages.length - 1 ? 'border-l border-gray-200' : ''}
          `}
        >
          <span className="mr-2">{language.flag}</span>
          <span className="hidden sm:inline">{language.name}</span>
        </button>
      ))}
    </div>
  );
};

// 语言标签组件
export const LanguageTag: React.FC<{
  languageCode: LanguageCode;
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}> = ({ languageCode, showFlag = true, showName = false, className = '' }) => {
  const { languages } = useTranslation();
  const language = languages.find((item) => item.code === languageCode);

  if (!language) {
    return null;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {showFlag && <span>{language.flag}</span>}
      {showName && <span>{language.name}</span>}
    </span>
  );
};
