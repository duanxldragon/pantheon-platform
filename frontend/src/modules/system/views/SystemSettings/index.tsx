import { useMemo, useRef, useState } from 'react';
import { Download, Loader2, Upload, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { settingApi } from '../../api/settingApi';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { SettingsActionFloat } from './components/SettingsActionFloat';
import { SettingsFormGroup } from './components/SettingsFormGroup';
import { SettingsSidebar } from './components/SettingsSidebar';
import { useSettingsLogic } from './hooks/useSettingsLogic';

interface ExportedSettings {
  version: string;
  exportedAt: string;
  settings: Array<{ key: string; value: string }>;
}

export function SystemSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const settingsMessages = createEntityFeedback(zh, { zh: '系统设置', en: 'Settings' });
  const invalidSettingsFileMessage = zh ? '无效的配置文件格式' : 'Invalid configuration file format';
  const settingsImportReloadMessage = zh
    ? '系统设置导入成功，页面即将刷新'
    : 'Settings imported successfully, reloading...';
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQuerySettings = hasPermission(systemPermissions.settings.query);
  const canUpdateSettings = hasPermission(systemPermissions.settings.update);
  const canImportSettings = hasPermission(systemPermissions.settings.import);
  const canExportSettings = hasPermission(systemPermissions.settings.export);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const schema = useMemo(
    () => ({
      basic: {
        title: t?.settings?.basic?.title || (zh ? '基础设置' : 'Basic Settings'),
        description: zh ? '维护系统基础信息、品牌标识和默认语言。' : 'Maintain base system info and default locale.',
        settings: [
          { key: 'system.name', label: zh ? '系统名称' : 'System Name', description: zh ? '用于页面标题和导航栏展示。' : 'Displayed in the page title and navigation.', value: 'Pantheon Platform', type: 'text', editable: true, required: true },
          { key: 'system.subtitle', label: zh ? '系统副标题' : 'System Subtitle', description: zh ? '用于登录页和欢迎页文案。' : 'Used on login and welcome pages.', value: 'Enterprise Management Foundation', type: 'text', editable: true },
          { key: 'system.default_language', label: zh ? '默认语言' : 'Default Language', description: zh ? '新用户首次进入系统时使用。' : 'Used when new users first visit the platform.', value: zh ? 'zh-CN' : 'en-US', type: 'select', editable: true, options: ['zh-CN', 'en-US'] },
        ],
      },
      security: {
        title: t?.settings?.security?.title || (zh ? '安全设置' : 'Security Settings'),
        description: zh ? '控制登录安全、密码策略和二次认证。' : 'Control login security, password policy, and MFA.',
        settings: [
          { key: 'security.enable_2fa', label: zh ? '启用二次认证' : 'Enable 2FA', description: zh ? '允许用户在个人中心绑定二次认证。' : 'Allow users to bind two-factor authentication.', value: true, type: 'boolean', editable: true },
          { key: 'security.max_login_attempts', label: zh ? '最大登录失败次数' : 'Max Login Attempts', description: zh ? '超过次数后触发临时锁定。' : 'Triggers a temporary lock after repeated failures.', value: 5, type: 'number', editable: true },
          { key: 'security.password_min_length', label: zh ? '密码最小长度' : 'Minimum Password Length', description: zh ? '影响密码校验和重置流程。' : 'Used by password validation and reset flows.', value: 8, type: 'number', editable: true },
        ],
      },
      email: {
        title: t?.settings?.email?.title || (zh ? '邮件设置' : 'Email Settings'),
        description: zh ? '用于通知邮件、验证码和告警邮件发送。' : 'Used for notifications, verification codes, and alerts.',
        settings: [
          { key: 'email.smtp_host', label: zh ? 'SMTP 主机' : 'SMTP Host', description: zh ? '邮件服务主机地址。' : 'Mail server host.', value: '', type: 'text', editable: true },
          { key: 'email.smtp_port', label: zh ? 'SMTP 端口' : 'SMTP Port', description: zh ? '常见为 25、465 或 587。' : 'Common values are 25, 465, or 587.', value: 465, type: 'number', editable: true },
          { key: 'email.smtp_username', label: zh ? 'SMTP 用户名' : 'SMTP Username', description: zh ? '用于邮件发送认证。' : 'Used to authenticate email sending.', value: '', type: 'text', editable: true },
        ],
      },
      notification: {
        title: t?.settings?.notification?.title || (zh ? '通知设置' : 'Notification Settings'),
        description: zh ? '控制系统内部通知、邮件通知和告警推送。' : 'Control in-app, email, and alert notifications.',
        settings: [
          { key: 'notification.enable_system_notice', label: zh ? '启用系统通知' : 'Enable In-App Notifications', description: zh ? '站内消息和顶部提醒开关。' : 'Toggle in-app messages and top-bar alerts.', value: true, type: 'boolean', editable: true },
          { key: 'notification.enable_email_notice', label: zh ? '启用邮件通知' : 'Enable Email Notifications', description: zh ? '关键事件通过邮件发送。' : 'Send important events by email.', value: false, type: 'boolean', editable: true },
          { key: 'notification.webhook_url', label: zh ? 'Webhook 地址' : 'Webhook URL', description: zh ? '用于第三方告警集成。' : 'Used for third-party alert integrations.', value: '', type: 'textarea', editable: true },
        ],
      },
      storage: {
        title: t?.settings?.storage?.title || (zh ? '存储设置' : 'Storage Settings'),
        description: zh ? '配置文件上传、静态资源和备份路径。' : 'Configure uploads, static assets, and backup paths.',
        settings: [
          { key: 'storage.upload_path', label: zh ? '上传目录' : 'Upload Path', description: zh ? '头像、附件等文件的保存目录。' : 'Storage path for avatars and attachments.', value: '/data/uploads', type: 'text', editable: true },
          { key: 'storage.max_upload_size', label: zh ? '最大上传大小(MB)' : 'Max Upload Size (MB)', description: zh ? '限制上传附件大小。' : 'Limits attachment upload size.', value: 20, type: 'number', editable: true },
          { key: 'storage.allowed_extensions', label: zh ? '允许的扩展名' : 'Allowed Extensions', description: zh ? '逗号分隔的文件扩展名。' : 'Comma-separated allowed extensions.', value: '.png,.jpg,.pdf,.docx', type: 'textarea', editable: true },
        ],
      },
    }),
    [t, zh],
  );

  const {
    activeTab,
    setActiveTab,
    editingValues,
    isDirty,
    loading,
    sectionsWithValues,
    handleChange,
    handleSave,
    handleReset,
  } = useSettingsLogic(schema, canQuerySettings);
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t?.menu?.systemSettings || (zh ? '系统设置' : 'System Settings'),
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const activeSection = sectionsWithValues[activeTab] || sectionsWithValues.basic;

  const handleExport = async () => {
    if (!ensureActionPermission(canExportSettings, zh ? '导出' : 'export')) return;
    try {
      setExporting(true);
      const payload: ExportedSettings = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: Object.values(sectionsWithValues)
          .flatMap((section: any) => section.settings || [])
          .map((item: any) => ({
            key: item.key,
            value: String(editingValues[item.key] ?? item.value ?? ''),
          })),
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-settings-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(settingsMessages.exportSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : settingsMessages.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!ensureActionPermission(canImportSettings, zh ? '导入' : 'import')) return;
    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text) as ExportedSettings;
      if (!Array.isArray(data.settings)) {
        toast.error(invalidSettingsFileMessage);
        return;
      }

      const updates = Object.fromEntries(data.settings.map((item) => [item.key, item.value]));
      await settingApi.batchUpdateSettings(updates);
      toast.success(settingsImportReloadMessage);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : settingsMessages.importFailed);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <PageLayout
      title={t?.menu?.systemSettings || (zh ? '系统设置' : 'System Settings')}
      description={zh ? '统一管理系统基础、安全、通知、邮件和存储配置。' : 'Manage base, security, notification, email, and storage settings.'}
      actions={canQuerySettings ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImport(file);
              }
            }}
          />
          {canImportSettings ? (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {zh ? '导入' : 'Import'}
            </Button>
          ) : null}
          {canExportSettings ? (
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {zh ? '导出' : 'Export'}
            </Button>
          ) : null}
          {canUpdateSettings ? (
            <Button onClick={() => { if (ensureActionPermission(canUpdateSettings, zh ? '保存' : 'save')) { void handleSave(); } }} disabled={!isDirty || loading}>
              <Zap className="mr-2 h-4 w-4" />
              {zh ? '立即同步' : 'Sync Now'}
            </Button>
          ) : null}
        </>
      ) : undefined}
    >
      {!canQuerySettings ? (
        <QueryAccessBoundary
          viewId="system-settings"
          title={t?.menu?.systemSettings || (zh ? '系统设置' : 'System Settings')}
          queryPermission={systemPermissions.settings.query}
        />
      ) : (
        <Card className="overflow-hidden border-none bg-white/80 shadow-sm backdrop-blur-sm">
          <div className="flex min-h-[640px] gap-0 p-6">
            <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex-1 pl-6">
              <SettingsFormGroup section={activeSection} values={editingValues} onChange={handleChange} />
            </div>
          </div>
        </Card>
      )}

      {canQuerySettings && canUpdateSettings ? (
        <SettingsActionFloat
          isVisible={isDirty}
          onSave={() => { if (ensureActionPermission(canUpdateSettings, zh ? '保存' : 'save')) { void handleSave(); } }}
          onReset={handleReset}
          modifiedCount={Object.keys(editingValues).length}
        />
      ) : null}
    </PageLayout>
  );
}
