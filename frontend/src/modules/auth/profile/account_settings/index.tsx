import { Bell, Globe, Key, Lock, Settings, Shield } from 'lucide-react';
import { useState } from 'react';

import { Card } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { useLanguageStore } from '../../../../stores/language_store';
import { useThemeStore } from '../../../../stores/theme_store';
import { useProfilePreferenceSettings } from '../hooks';
import {
  ApiKeyManagement,
  NotificationSettings,
  PreferenceSettings,
  PrivacySettings,
  SecuritySettings,
  SessionManagement,
} from '../views';

export function AccountSettings() {
  const { theme } = useThemeStore();
  const { language, t } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const [activeTab, setActiveTab] = useState('security');
  const zh = language === 'zh';
  const copy = {
    title: t.profile.accountSettings,
    description: zh ? '管理您的账户安全、隐私、通知和系统偏好。' : 'Manage your account security, privacy, notifications, and system preferences.',
    security: t.profile.security,
    privacy: zh ? '隐私设置' : 'Privacy',
    notifications: t.profile.notifications,
    preferences: t.profile.preferences,
    apiKeys: zh ? 'API 密钥' : 'API Keys',
    sessions: zh ? '会话管理' : 'Sessions',
  };

  return (
    <div className={compactMode ? 'space-y-4 p-4' : 'space-y-6 p-6'}>
      <div>
        <h1 className="mb-2 text-2xl" style={{ color: theme.colors.text }}>
          {copy.title}
        </h1>
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {copy.description}
        </p>
      </div>

      <Card
        className="border shadow-sm"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div
            className={compactMode ? 'border-b px-4 pt-4' : 'border-b px-6 pt-6'}
            style={{ borderColor: theme.colors.border }}
          >
            <TabsList className="h-auto w-full justify-start border-0 bg-transparent p-0" style={{ backgroundColor: 'transparent' }}>
              <TabsTrigger
                value="security"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'security' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'security' ? theme.colors.primary : 'transparent',
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                {copy.security}
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'privacy' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'privacy' ? theme.colors.primary : 'transparent',
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                {copy.privacy}
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
                {copy.notifications}
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'preferences' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'preferences' ? theme.colors.primary : 'transparent',
                }}
              >
                <Globe className="mr-2 h-4 w-4" />
                {copy.preferences}
              </TabsTrigger>
              <TabsTrigger
                value="apiKeys"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'apiKeys' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'apiKeys' ? theme.colors.primary : 'transparent',
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                {copy.apiKeys}
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="rounded-none px-4 py-3 data-[state=active]:border-b-2"
                style={{
                  color: activeTab === 'sessions' ? theme.colors.primary : theme.colors.textSecondary,
                  borderColor: activeTab === 'sessions' ? theme.colors.primary : 'transparent',
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                {copy.sessions}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className={compactMode ? 'p-4' : 'p-6'}>
            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>
            <TabsContent value="privacy" className="mt-0">
              <PrivacySettings />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="preferences" className="mt-0">
              <PreferenceSettings />
            </TabsContent>
            <TabsContent value="apiKeys" className="mt-0">
              <ApiKeyManagement />
            </TabsContent>
            <TabsContent value="sessions" className="mt-0">
              <SessionManagement />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}

