import { useState } from 'react';
import { Bell, Clock, ExternalLink, Settings, Shield, User, X } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { getDialogClassName } from '../../../shared/constants/dialogSizes';
import { useLanguageStore } from '../../../stores/languageStore';
import { useThemeStore } from '../../../stores/themeStore';
import { useProfilePreferenceSettings } from '../profile/hooks';
import { LoginHistory, NotificationSettings, PersonalInfo, PreferenceSettings, SecuritySettings } from '../profile/views';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (viewId: string) => void;
}

export function ProfileDialog({ open, onOpenChange, onNavigate }: ProfileDialogProps) {
  const { theme } = useThemeStore();
  const { language, t } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const [activeTab, setActiveTab] = useState('personal');
  const zh = language === 'zh';
  const description = zh
    ? '管理您的个人信息、安全设置和偏好配置'
    : 'Manage your personal information, security settings, and preferences';

  const handleGoToAccountSettings = () => {
    onOpenChange(false);
    onNavigate?.('account-settings');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={getDialogClassName('4xl', 'p-0')}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <DialogHeader
          className={compactMode ? 'border-b px-4 pb-3 pt-4' : 'border-b px-6 pb-4 pt-6'}
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl" style={{ color: theme.colors.text }}>
                {t.profile.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm" style={{ color: theme.colors.textSecondary }}>
                {description}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-500 hover:bg-opacity-10"
              style={{ color: theme.colors.textSecondary }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className={compactMode ? 'border-b px-4' : 'border-b px-6'} style={{ borderColor: theme.colors.border }}>
            <TabsList className="h-auto w-full justify-start border-0 bg-transparent p-0">
              <TabsTrigger
                value="personal"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'personal' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'personal' ? theme.colors.primary : 'transparent',
                }}
              >
                <User className="mr-2 h-4 w-4" />
                {t.profile.personalInfo}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'security' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'security' ? theme.colors.primary : 'transparent',
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                {t.profile.security}
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'preferences' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'preferences' ? theme.colors.primary : 'transparent',
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t.profile.preferences}
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'notifications' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'notifications' ? theme.colors.primary : 'transparent',
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                {t.profile.notifications}
              </TabsTrigger>
              <TabsTrigger
                value="loginHistory"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'loginHistory' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'loginHistory' ? theme.colors.primary : 'transparent',
                }}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t.profile.loginHistory}
              </TabsTrigger>
            </TabsList>
          </div>

          <div
            className={compactMode ? 'overflow-y-auto px-4 py-4' : 'overflow-y-auto px-6 py-6'}
            style={{ maxHeight: 'calc(90vh - 180px)' }}
          >
            <TabsContent value="personal" className="mt-0">
              <PersonalInfo />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>
            <TabsContent value="preferences" className="mt-0">
              <PreferenceSettings />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="loginHistory" className="mt-0">
              <LoginHistory />
            </TabsContent>
          </div>

          <div className={compactMode ? 'border-t px-4 py-3' : 'border-t px-6 py-4'} style={{ borderColor: theme.colors.border }}>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoToAccountSettings}
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.primary,
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t.profile.accountSettings}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
