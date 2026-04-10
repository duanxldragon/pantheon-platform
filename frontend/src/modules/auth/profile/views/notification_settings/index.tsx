import { useEffect, useMemo, useState } from 'react';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Label } from '../../../../../components/ui/label';
import { Switch } from '../../../../../components/ui/switch';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useThemeStore } from '../../../../../stores/theme_store';
import { useAuthStore } from '../../../store/auth_store';
import { useProfilePreferenceSettings } from '../../hooks/use_profile_preference_settings';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadProfileNotificationSettings,
  saveProfileNotificationSettings,
} from '../../utils/profile_settings_storage';

interface NotificationOption {
  id: string;
  email: boolean;
  system: boolean;
}

const notificationCopy = {
  'system-alert': {
    zh: { label: '系统告警', description: '系统异常、服务故障等高优先级提醒' },
    en: { label: 'System Alerts', description: 'System exceptions and service failures' },
  },
  'task-update': {
    zh: { label: '任务更新', description: '任务执行进度、状态变化等提醒' },
    en: { label: 'Task Updates', description: 'Task execution and status changes' },
  },
  security: {
    zh: { label: '安全事件', description: '异常登录、权限变化等安全提醒' },
    en: { label: 'Security Events', description: 'Abnormal sign-ins and permission changes' },
  },
  release: {
    zh: { label: '系统更新', description: '版本发布、功能上线等产品更新提醒' },
    en: { label: 'System Updates', description: 'Version updates and feature releases' },
  },
} as const;

function cloneNotifications(notifications: NotificationOption[]) {
  return notifications.map((item) => ({ ...item }));
}

export function NotificationSettings() {
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const userId = useAuthStore((state) => state.user?.id);
  const { compactMode } = useProfilePreferenceSettings();
  const zh = language === 'zh';
  const copy = {
    savedTitle: zh ? '通知设置已保存' : 'Notification settings saved',
    savedDesc: zh ? '新的通知偏好会在当前账号下持续生效' : 'Your preferences are now stored for this account',
    channels: zh ? '通知渠道' : 'Notification Channels',
    channelsDesc: zh ? '为不同类型的消息选择接收方式。' : 'Choose how each kind of message should reach you.',
    email: zh ? '邮件通知' : 'Email',
    emailDesc: zh ? '发送到当前账号绑定的邮箱' : 'Delivered to your registered email',
    system: zh ? '站内通知' : 'In-app',
    systemDesc: zh ? '在系统内实时展示并支持后续查看' : 'Displayed directly in the system',
    type: zh ? '通知类型' : 'Type',
    quietHours: zh ? '免打扰时段' : 'Quiet Hours',
    quietHoursDesc: zh
      ? '开启后，22:00 - 08:00 仅接收高优先级通知，减少夜间打扰。'
      : 'Only high-priority notifications are allowed from 22:00 to 08:00.',
    unsaved: zh ? '当前有未保存的通知设置变更' : 'You have unsaved notification changes',
    synced: zh ? '通知设置已与当前账号保存状态同步' : 'Notification settings are in sync',
    saveSettings: zh ? '保存设置' : 'Save Settings',
  };

  const [notifications, setNotifications] = useState<NotificationOption[]>(
    cloneNotifications(DEFAULT_NOTIFICATION_SETTINGS.notifications),
  );
  const [quietHours, setQuietHours] = useState(DEFAULT_NOTIFICATION_SETTINGS.quietHours);
  const [savedNotifications, setSavedNotifications] = useState<NotificationOption[]>(
    cloneNotifications(DEFAULT_NOTIFICATION_SETTINGS.notifications),
  );
  const [savedQuietHours, setSavedQuietHours] = useState(DEFAULT_NOTIFICATION_SETTINGS.quietHours);

  useEffect(() => {
    const settings = loadProfileNotificationSettings(userId);
    setNotifications(cloneNotifications(settings.notifications));
    setQuietHours(settings.quietHours);
    setSavedNotifications(cloneNotifications(settings.notifications));
    setSavedQuietHours(settings.quietHours);
  }, [userId]);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(notifications) !== JSON.stringify(savedNotifications) || quietHours !== savedQuietHours,
    [notifications, quietHours, savedNotifications, savedQuietHours],
  );

  const handleToggle = (id: string, channel: 'email' | 'system', value: boolean) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, [channel]: value } : item)),
    );
  };

  const handleSave = () => {
    const nextSettings = {
      notifications: cloneNotifications(notifications),
      quietHours,
    };
    saveProfileNotificationSettings(nextSettings, userId);
    setSavedNotifications(cloneNotifications(notifications));
    setSavedQuietHours(quietHours);
    systemNotification.success(copy.savedTitle, copy.savedDesc);
  };

  return (
    <div className={compactMode ? 'space-y-4' : 'space-y-6'}>
      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <Bell className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {copy.channels}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.channelsDesc}
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${compactMode ? 'gap-3' : 'gap-4'} md:grid-cols-2`}>
          <div
            className={compactMode ? 'rounded-lg border p-3' : 'rounded-lg border p-4'}
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          >
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" style={{ color: theme.colors.primary }} />
              <div>
                <div style={{ color: theme.colors.text }}>{copy.email}</div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {copy.emailDesc}
                </div>
              </div>
            </div>
          </div>
          <div
            className={compactMode ? 'rounded-lg border p-3' : 'rounded-lg border p-4'}
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5" style={{ color: theme.colors.primary }} />
              <div>
                <div style={{ color: theme.colors.text }}>{copy.system}</div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {copy.systemDesc}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="mb-4 grid grid-cols-12 gap-4 border-b pb-3" style={{ borderColor: theme.colors.border }}>
          <div className="col-span-6">
            <Label>{copy.type}</Label>
          </div>
          <div className="col-span-3 text-center">
            <Label>{copy.email}</Label>
          </div>
          <div className="col-span-3 text-center">
            <Label>{copy.system}</Label>
          </div>
        </div>

        <div className="space-y-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`grid grid-cols-12 gap-4 border-b ${compactMode ? 'py-3' : 'py-4'}`}
              style={{ borderColor: theme.colors.border }}
            >
              <div className="col-span-6">
                <div style={{ color: theme.colors.text }}>
                  {notificationCopy[item.id as keyof typeof notificationCopy][zh ? 'zh' : 'en'].label}
                </div>
                <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {notificationCopy[item.id as keyof typeof notificationCopy][zh ? 'zh' : 'en'].description}
                </div>
              </div>
              <div className="col-span-3 flex justify-center">
                <Switch checked={item.email} onCheckedChange={(checked) => handleToggle(item.id, 'email', checked)} />
              </div>
              <div className="col-span-3 flex justify-center">
                <Switch checked={item.system} onCheckedChange={(checked) => handleToggle(item.id, 'system', checked)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg" style={{ color: theme.colors.text }}>
              {copy.quietHours}
            </div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.quietHoursDesc}
            </div>
          </div>
          <Switch checked={quietHours} onCheckedChange={setQuietHours} />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {hasChanges ? copy.unsaved : copy.synced}
        </div>
        <Button onClick={handleSave} disabled={!hasChanges}>
          <Save className="mr-2 h-4 w-4" />
          {copy.saveSettings}
        </Button>
      </div>
    </div>
  );
}





