import { useEffect, useMemo, useState } from 'react';
import { Globe, Layout, Palette, Save, Zap } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Label } from '../../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Switch } from '../../../../../components/ui/switch';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/language_store';
import { themes, ThemeType, useThemeStore } from '../../../../../stores/theme_store';
import { useAuthStore } from '../../../store/auth_store';
import {
  DEFAULT_PREFERENCE_SETTINGS,
  loadProfilePreferenceSettings,
  saveProfilePreferenceSettings,
} from '../../utils/profile_settings_storage';

export function PreferenceSettings() {
  const { theme, themeType, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const userId = useAuthStore((state) => state.user?.id);
  const zh = language === 'zh';
  const copy = {
    savedTitle: zh ? '偏好设置已保存' : 'Preferences saved',
    savedDesc: zh ? '当前账号的界面偏好已同步更新' : 'Your interface preferences have been updated',
    themeTitle: zh ? '主题设置' : 'Theme',
    themeDesc: zh ? '选择系统界面使用的配色方案。' : 'Choose the color style used by the system.',
    languageTitle: zh ? '语言设置' : 'Language',
    languageDesc: zh ? '切换界面显示语言。' : 'Switch the language used by the interface.',
    interfaceLanguage: zh ? '界面语言' : 'Interface Language',
    simplifiedChinese: zh ? '简体中文' : 'Simplified Chinese',
    layoutTitle: zh ? '布局偏好' : 'Layout Preferences',
    layoutDesc: zh ? '控制页面密度和列表展示方式。' : 'Control page density and list presentation.',
    compactMode: zh ? '紧凑模式' : 'Compact Mode',
    compactDesc: zh ? '减少间距，在一屏展示更多内容。' : 'Reduce spacing to show more content on one screen.',
    rowsPerPage: zh ? '每页条数' : 'Rows per page',
    performanceTitle: zh ? '性能偏好' : 'Performance',
    performanceDesc: zh ? '控制自动刷新和后台轮询行为。' : 'Control auto-refresh and background polling behavior.',
    autoRefresh: zh ? '自动刷新' : 'Auto Refresh',
    autoRefreshDesc: zh
      ? '监控和日志页面默认每 30 秒刷新一次。'
      : 'Monitoring and log pages refresh every 30 seconds by default.',
    unsaved: zh ? '当前有未保存的偏好设置变更' : 'You have unsaved preference changes',
    synced: zh ? '偏好设置已与当前账号同步' : 'Preferences are in sync',
    saveSettings: zh ? '保存设置' : 'Save Settings',
  };

  const [pageSize, setPageSize] = useState(DEFAULT_PREFERENCE_SETTINGS.pageSize);
  const [autoRefresh, setAutoRefresh] = useState(DEFAULT_PREFERENCE_SETTINGS.autoRefresh);
  const [compactMode, setCompactMode] = useState(DEFAULT_PREFERENCE_SETTINGS.compactMode);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_PREFERENCE_SETTINGS);

  useEffect(() => {
    const settings = loadProfilePreferenceSettings(userId);
    setPageSize(settings.pageSize);
    setAutoRefresh(settings.autoRefresh);
    setCompactMode(settings.compactMode);
    setSavedSettings(settings);
  }, [userId]);

  const hasChanges = useMemo(
    () =>
      pageSize !== savedSettings.pageSize ||
      autoRefresh !== savedSettings.autoRefresh ||
      compactMode !== savedSettings.compactMode,
    [autoRefresh, compactMode, pageSize, savedSettings],
  );

  const saveSettings = () => {
    const nextSettings = { pageSize, autoRefresh, compactMode };
    saveProfilePreferenceSettings(nextSettings, userId);
    setSavedSettings(nextSettings);
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
            <Palette className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {copy.themeTitle}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.themeDesc}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(themes).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key as ThemeType)}
              className="rounded-lg border p-4 text-left transition hover:border-blue-400"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: themeType === key ? theme.colors.primary : theme.colors.border,
              }}
            >
              <div className="font-medium" style={{ color: theme.colors.text }}>
                {value.name}
              </div>
              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {key}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <Globe className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {copy.languageTitle}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.languageDesc}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{copy.interfaceLanguage}</Label>
          <Select value={language} onValueChange={(value) => setLanguage(value as 'zh' | 'en')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">{copy.simplifiedChinese}</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <Layout className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {copy.layoutTitle}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.layoutDesc}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: theme.colors.text }}>{copy.compactMode}</div>
              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                {copy.compactDesc}
              </div>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>
          <div className="space-y-2">
            <Label>{copy.rowsPerPage}</Label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <Zap className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {copy.performanceTitle}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.performanceDesc}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: theme.colors.text }}>{copy.autoRefresh}</div>
            <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.autoRefreshDesc}
            </div>
          </div>
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {hasChanges ? copy.unsaved : copy.synced}
        </div>
        <Button onClick={saveSettings} disabled={!hasChanges}>
          <Save className="mr-2 h-4 w-4" />
          {copy.saveSettings}
        </Button>
      </div>
    </div>
  );
}





