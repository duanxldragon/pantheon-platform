import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  LogOut,
  Palette,
  Search,
  Settings,
  User,
} from 'lucide-react';

import { useAuthStore } from '../modules/auth/store/auth_store';
import { notificationApi } from '../modules/notification/api/notification_api';
import { useViewManager } from '../shared/components/use_view_manager';
import { systemNotification } from '../shared/utils/notification';
import { useLanguageStore } from '../stores/language_store';
import { themes, ThemeType, useThemeStore } from '../stores/theme_store';
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
import { cn } from './ui/utils';
import { TenantSwitcher } from './tenant_switcher';
import { ConfirmDialog } from '../shared/components/ui/confirm_dialog';
import { LanguageSwitcher } from './language_switcher';

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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const { navigateToView: openView } = useViewManager();
  const { theme, themeType, setTheme } = useThemeStore();
  const { user, logout, enableMultiTenant, isAuthenticated } = useAuthStore();
  const { language, t } = useLanguageStore();
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

  const performLogout = () => {
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
    <div className="h-16 border-b flex items-center justify-between px-6 bg-card border-border transition-colors duration-200">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={t.topBar.searchPlaceholder}
            className="pl-9 pr-4 h-9 w-full transition-all duration-200 bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
          <Clock className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(currentTime)}
            </span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 bg-border" />

        <div className="flex items-center gap-1">
          {enableMultiTenant && <TenantSwitcher />}

          <LanguageSwitcher variant="dropdown" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-colors duration-200 h-9 w-9 text-foreground"
              >
                <Palette className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border-border">
              <DropdownMenuLabel className="text-foreground">
                {t.topBar.theme}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {Object.entries(themes).map(([key, themeItem]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setTheme(key as ThemeType)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer text-foreground",
                    themeType === key && "bg-muted"
                  )}
                >
                  <div className={`w-3 h-3 rounded-full ${themeDots[key as ThemeType]}`} />
                  <span className="flex-1">{themeItem.name}</span>
                  {themeType === key && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
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
                className="relative transition-colors duration-200 h-9 w-9 text-foreground"
                onClick={() => navigateToView('notification-center')}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center px-1 bg-destructive ring-2 ring-card">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-border">
              <DropdownMenuLabel className="text-foreground">
                {t.topBar.notifications}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => navigateToView('notification-center')}
                className="text-foreground cursor-pointer"
              >
                <Inbox className="w-4 h-4 mr-2" />
                <span>{t.notification.inbox}</span>
                {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigateToView('notification-center')}
                className="text-foreground cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>{t.notification.templates}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigateToView('system-settings')}
                className="text-foreground cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span>{t.common.settings}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="transition-colors duration-200 h-9 w-9 text-foreground"
            onClick={() => navigateToView('system-settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm bg-muted text-foreground">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`,
                }}
              >
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm leading-tight text-foreground">
                  {user?.realName || (zh ? '管理员' : 'Admin')}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">
                  {user?.username || 'admin'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuLabel className="text-foreground">
              {t.topBar.myAccount}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer text-foreground"
              onClick={() => navigateToView('profile-center')}
            >
              <User className="w-4 h-4 mr-2" />
              {t.topBar.profileCenter}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-foreground"
              onClick={() => navigateToView('account-settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              {zh ? '账户设置' : 'Account Settings'}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.topBar.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={performLogout}
        title={zh ? '确认退出登录' : 'Confirm Logout'}
        description={
          zh
            ? '退出后将清理当前登录态，并返回登录页。建议先确认当前工作是否已保存。'
            : 'Signing out clears the current session and returns you to the login page. Make sure your work has been saved first.'
        }
        confirmText={zh ? '确认退出' : 'Sign Out'}
        cancelText={zh ? '取消' : 'Cancel'}
        variant="warning"
      />
    </div>
  );
}



