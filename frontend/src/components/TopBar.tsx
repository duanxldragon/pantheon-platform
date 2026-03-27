import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  Languages,
  LogOut,
  Palette,
  Search,
  Settings,
  User,
} from 'lucide-react';

import { useAuthStore } from '../modules/auth/store/authStore';
import { notificationApi } from '../modules/notification/api/notificationApi';
import { useViewManager } from '../shared/components/ViewManager';
import { systemNotification } from '../shared/utils/notification';
import { useLanguageStore } from '../stores/languageStore';
import { themes, ThemeType, useThemeStore } from '../stores/themeStore';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { TenantSwitcher } from './TenantSwitcher';

interface TopBarProps {
  onSearch?: (query: string) => void;
  onNavigate?: (viewId: string) => void;
}

const themeDots: Record<ThemeType, string> = {
  blue: 'bg-blue-600',
  dark: 'bg-gray-800',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-600',
};

export function TopBar({ onSearch, onNavigate }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);

  const { navigateToView: openView } = useViewManager();
  const { theme, themeType, setTheme } = useThemeStore();
  const { user, logout, enableMultiTenant, isAuthenticated } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();
  const zh = language === 'zh';

  const navigateToView = (viewId: string) => {
    if (onNavigate) {
      onNavigate(viewId);
      return;
    }

    openView(viewId);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to load unread count:', error);
        setUnreadCount(0);
      }
    };

    void loadUnreadCount();
    const interval = setInterval(() => {
      void loadUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleLogout = () => {
    logout();
    systemNotification.logoutSuccess();
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    };

    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', options);
  };

  return (
    <div
      className="h-16 border-b flex items-center justify-between px-6 transition-colors duration-200"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: theme.colors.textSecondary }}
          />
          <Input
            value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={t.topBar.searchPlaceholder}
            className="pl-9 pr-4 h-9 w-full transition-all duration-200"
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-6">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: theme.colors.hover }}
        >
          <Clock className="w-4 h-4" style={{ color: theme.colors.primary }} />
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: theme.colors.text }}>
              {formatTime(currentTime)}
            </span>
            <span className="text-xs" style={{ color: theme.colors.textSecondary }}>
              {formatDate(currentTime)}
            </span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8" style={{ backgroundColor: theme.colors.border }} />

        <div className="flex items-center gap-1">
          {enableMultiTenant && <TenantSwitcher />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-colors duration-200 h-9 w-9"
                style={{ color: theme.colors.text }}
              >
                <Palette className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <DropdownMenuLabel style={{ color: theme.colors.text }}>
                {t.topBar.theme}
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: theme.colors.border }} />
              {Object.entries(themes).map(([key, themeItem]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setTheme(key as ThemeType)}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: theme.colors.text,
                    backgroundColor: themeType === key ? theme.colors.hover : 'transparent',
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${themeDots[key as ThemeType]}`} />
                  <span className="flex-1">{themeItem.name}</span>
                  {themeType === key && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-colors duration-200 h-9 w-9"
                style={{ color: theme.colors.text }}
              >
                <Languages className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <DropdownMenuLabel style={{ color: theme.colors.text }}>
                {t.topBar.language}
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: theme.colors.border }} />
              <DropdownMenuItem
                onClick={() => setLanguage('zh')}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  color: theme.colors.text,
                  backgroundColor: language === 'zh' ? theme.colors.hover : 'transparent',
                }}
              >
                <span className="flex-1">{t.topBar.languageChinese}</span>
                {language === 'zh' && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  color: theme.colors.text,
                  backgroundColor: language === 'en' ? theme.colors.hover : 'transparent',
                }}
              >
                <span className="flex-1">{t.topBar.languageEnglish}</span>
                {language === 'en' && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-colors duration-200 h-9 w-9"
                style={{ color: theme.colors.text }}
                onClick={() => navigateToView('notification-center')}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 min-w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center px-1"
                    style={{
                      backgroundColor: '#ef4444',
                      boxShadow: `0 0 0 2px ${theme.colors.surface}`,
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }}
            >
              <DropdownMenuLabel style={{ color: theme.colors.text }}>
                {t.topBar.notifications}
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: theme.colors.border }} />
              <DropdownMenuItem onClick={() => navigateToView('notification-center')}>
                <Inbox className="w-4 h-4 mr-2" />
                <span>{t.notification.inbox}</span>
                {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToView('notification-center')}>
                <FileText className="w-4 h-4 mr-2" />
                <span>{t.notification.templates}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToView('system-settings')}>
                <Settings className="w-4 h-4 mr-2" />
                <span>{t.common.settings}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="transition-colors duration-200 h-9 w-9"
            style={{ color: theme.colors.text }}
            onClick={() => navigateToView('system-settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" style={{ backgroundColor: theme.colors.border }} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm"
              style={{
                backgroundColor: theme.colors.hover,
                color: theme.colors.text,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                }}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm leading-tight" style={{ color: theme.colors.text }}>
                  {user?.realName || (zh ? '管理员' : 'Admin')}
                </p>
                <p className="text-xs leading-tight" style={{ color: theme.colors.textSecondary }}>
                  {user?.username || 'admin'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: theme.colors.textSecondary }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <DropdownMenuLabel style={{ color: theme.colors.text }}>
              {t.topBar.myAccount}
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ backgroundColor: theme.colors.border }} />
            <DropdownMenuItem
              className="cursor-pointer"
              style={{ color: theme.colors.text }}
              onClick={() => navigateToView('profile-center')}
            >
              <User className="w-4 h-4 mr-2" />
              {t.topBar.profileCenter}
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: theme.colors.border }} />
            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t.topBar.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
