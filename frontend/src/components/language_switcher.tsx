import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguageSwitcher } from '../hooks/use_i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'compact';
}

/**
 * 语言切换器组件
 * 用于在应用中切换界面语言
 */
export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const { currentLanguage, supportedLanguages, changeLanguage, getCurrentLanguageInfo } = useLanguageSwitcher();
  const currentLangInfo = getCurrentLanguageInfo();

  const handleLanguageChange = async (lng: string) => {
    const success = await changeLanguage(lng);
    if (!success) {
      console.error(`Failed to change language to ${lng}`);
    }
  };

  if (variant === 'compact') {
    return <CompactLanguageSwitcher className={className} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <span className="mr-2">{currentLangInfo?.flag || '🌐'}</span>
          <span className="hidden sm:inline">{currentLangInfo?.name || 'Language'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={currentLanguage === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLanguage === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 简化的语言切换器（只显示图标）
 */
export function CompactLanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { currentLanguage, supportedLanguages, changeLanguage, getCurrentLanguageInfo } = useLanguageSwitcher();
  const currentLangInfo = getCurrentLanguageInfo();

  // 切换到下一个语言
  const handleNextLanguage = () => {
    const currentIndex = supportedLanguages.findIndex(lang => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    changeLanguage(supportedLanguages[nextIndex].code);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleNextLanguage}
      title={`当前语言: ${currentLangInfo?.name}`}
    >
      <span className="text-lg">{currentLangInfo?.flag || '🌐'}</span>
    </Button>
  );
}

export default LanguageSwitcher;
