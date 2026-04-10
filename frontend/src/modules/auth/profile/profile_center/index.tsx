import { Bell, Clock, Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';

import { Card } from '../../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { useLanguageStore } from '../../../../stores/language_store';
import { useThemeStore } from '../../../../stores/theme_store';
import { useProfilePreferenceSettings } from '../hooks';
import { LoginHistory, NotificationSettings, PersonalInfo, PreferenceSettings, SecuritySettings } from '../views';

export function ProfileCenter() {
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className={compactMode ? 'space-y-4 p-4' : 'space-y-6 p-6'}>
      <div>
        <h1 className="mb-2 text-2xl" style={{ color: theme.colors.text }}>
          {t.profile.title}
        </h1>
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {t.profile.description}
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

          <div className={compactMode ? 'p-4' : 'p-6'}>
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
        </Tabs>
      </Card>
    </div>
  );
}

