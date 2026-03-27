import { useEffect, useState } from 'react';
import { Save, Shield, UserRound } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Switch } from '../../../../../components/ui/switch';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useAuthStore } from '../../../store/authStore';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useThemeStore } from '../../../../../stores/themeStore';
import { useProfilePreferenceSettings } from '../../hooks/useProfilePreferenceSettings';
import {
  DEFAULT_PRIVACY_SETTINGS,
  loadProfilePrivacySettings,
  saveProfilePrivacySettings,
} from '../../utils/profileSettingsStorage';

export function PrivacySettings() {
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const userId = useAuthStore((state) => state.user?.id);
  const [settings, setSettings] = useState(DEFAULT_PRIVACY_SETTINGS);

  useEffect(() => {
    setSettings(loadProfilePrivacySettings(userId));
  }, [userId]);

  const toggle = (key: keyof typeof settings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    saveProfilePrivacySettings(settings, userId);
    systemNotification.success(t.profile.privacy.privacySettingsSaved);
  };

  return (
    <div className={compactMode ? 'space-y-4' : 'space-y-6'}>
      <Card className={compactMode ? 'p-4' : 'p-6'} style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <UserRound className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {t.profile.privacy.visibility}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {t.profile.privacy.controlVisibility}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <SettingItem
            title={t.profile.privacy.showProfile}
            description={t.profile.privacy.allowOtherUsers}
            checked={settings.showProfile}
            onCheckedChange={(value) => toggle('showProfile', value)}
          />
          <SettingItem
            title={t.profile.privacy.showLastLogin}
            description={t.profile.privacy.exposeLoginTime}
            checked={settings.showLastLogin}
            onCheckedChange={(value) => toggle('showLastLogin', value)}
          />
          <SettingItem
            title={t.profile.privacy.allowSearch}
            description={t.profile.privacy.allowSearchDiscovery}
            checked={settings.allowSearch}
            onCheckedChange={(value) => toggle('allowSearch', value)}
          />
        </div>
      </Card>

      <Card className={compactMode ? 'p-4' : 'p-6'} style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}>
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <Shield className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {t.profile.privacy.dataPrivacy}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {t.profile.privacy.improvePerformance}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <SettingItem
            title={t.profile.privacy.shareActivity}
            description={t.profile.privacy.showOnlineStatus}
            checked={settings.shareActivity}
            onCheckedChange={(value) => toggle('shareActivity', value)}
          />
          <SettingItem
            title={t.profile.privacy.collectUsage}
            description={t.profile.privacy.improvePerformance}
            checked={settings.collectUsage}
            onCheckedChange={(value) => toggle('collectUsage', value)}
          />
          <SettingItem
            title={t.profile.privacy.allowThirdPartySharing}
            description={t.profile.privacy.approvedIntegrations}
            checked={settings.allowThirdPartySharing}
            onCheckedChange={(value) => toggle('allowThirdPartySharing', value)}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save}>
          <Save className="mr-2 h-4 w-4" />
          {t.profile.privacy.saveSettings}
        </Button>
      </div>
    </div>
  );
}

interface SettingItemProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingItem({ title, description, checked, onCheckedChange }: SettingItemProps) {
  const theme = useThemeStore((state) => state.theme);
  const { compactMode } = useProfilePreferenceSettings();

  return (
    <div
      className={compactMode ? 'flex items-center justify-between rounded-lg border p-3' : 'flex items-center justify-between rounded-lg border p-4'}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="pr-6">
        <div className="font-medium" style={{ color: theme.colors.text }}>{title}</div>
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}


