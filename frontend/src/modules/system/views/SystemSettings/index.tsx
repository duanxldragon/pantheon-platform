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
  const copy = zh
    ? {
        invalidFile: '无效的配置文件格式',
        importReload: '系统设置导入成功，页面即将刷新',
        pageTitle: '系统设置',
        pageDescription: '统一管理系统基础、安全、通知、邮件和存储配置。',
        actions: {
          import: '导入',
          export: '导出',
          save: '保存',
          syncNow: '立即同步',
        },
        basic: {
          title: '基础设置',
          description: '维护系统基础信息、品牌标识和默认语言。',
          systemName: '系统名称',
          systemNameDescription: '用于页面标题和导航栏展示。',
          systemSubtitle: '系统副标题',
          systemSubtitleDescription: '用于登录页和欢迎页文案。',
          defaultLanguage: '默认语言',
          defaultLanguageDescription: '新用户首次进入系统时使用。',
        },
        security: {
          title: '安全设置',
          description: '控制登录安全、密码策略和二次认证。',
          enable2fa: '启用二次认证',
          enable2faDescription: '允许用户在个人中心绑定二次认证。',
          maxLoginAttempts: '最大登录失败次数',
          maxLoginAttemptsDescription: '超过次数后触发临时锁定。',
          minPasswordLength: '密码最小长度',
          minPasswordLengthDescription: '影响密码校验和重置流程。',
        },
        email: {
          title: '邮件设置',
          description: '用于通知邮件、验证码和告警邮件发送。',
          smtpHost: 'SMTP 主机',
          smtpHostDescription: '邮件服务主机地址。',
          smtpPort: 'SMTP 端口',
          smtpPortDescription: '常见为 25、465 或 587。',
          smtpUsername: 'SMTP 用户名',
          smtpUsernameDescription: '用于邮件发送认证。',
        },
        notification: {
          title: '通知设置',
          description: '控制系统内部通知、邮件通知和告警推送。',
          enableSystemNotice: '启用系统通知',
          enableSystemNoticeDescription: '站内消息和顶部提醒开关。',
          enableEmailNotice: '启用邮件通知',
          enableEmailNoticeDescription: '关键事件通过邮件发送。',
          webhook: 'Webhook 地址',
          webhookDescription: '用于第三方告警集成。',
        },
        storage: {
          title: '存储设置',
          description: '配置文件上传、静态资源和备份路径。',
          uploadPath: '上传目录',
          uploadPathDescription: '头像、附件等文件的保存目录。',
          maxUploadSize: '最大上传大小(MB)',
          maxUploadSizeDescription: '限制上传附件大小。',
          allowedExtensions: '允许的扩展名',
          allowedExtensionsDescription: '逗号分隔的文件扩展名。',
        },
      }
    : {
        invalidFile: 'Invalid configuration file format',
        importReload: 'Settings imported successfully, reloading...',
        pageTitle: 'System Settings',
        pageDescription: 'Manage base, security, notification, email, and storage settings.',
        actions: {
          import: 'Import',
          export: 'Export',
          save: 'save',
          syncNow: 'Sync Now',
        },
        basic: {
          title: 'Basic Settings',
          description: 'Maintain base system info and default locale.',
          systemName: 'System Name',
          systemNameDescription: 'Displayed in the page title and navigation.',
          systemSubtitle: 'System Subtitle',
          systemSubtitleDescription: 'Used on login and welcome pages.',
          defaultLanguage: 'Default Language',
          defaultLanguageDescription: 'Used when new users first visit the platform.',
        },
        security: {
          title: 'Security Settings',
          description: 'Control login security, password policy, and MFA.',
          enable2fa: 'Enable 2FA',
          enable2faDescription: 'Allow users to bind two-factor authentication.',
          maxLoginAttempts: 'Max Login Attempts',
          maxLoginAttemptsDescription: 'Triggers a temporary lock after repeated failures.',
          minPasswordLength: 'Minimum Password Length',
          minPasswordLengthDescription: 'Used by password validation and reset flows.',
        },
        email: {
          title: 'Email Settings',
          description: 'Used for notifications, verification codes, and alerts.',
          smtpHost: 'SMTP Host',
          smtpHostDescription: 'Mail server host.',
          smtpPort: 'SMTP Port',
          smtpPortDescription: 'Common values are 25, 465, or 587.',
          smtpUsername: 'SMTP Username',
          smtpUsernameDescription: 'Used to authenticate email sending.',
        },
        notification: {
          title: 'Notification Settings',
          description: 'Control in-app, email, and alert notifications.',
          enableSystemNotice: 'Enable In-App Notifications',
          enableSystemNoticeDescription: 'Toggle in-app messages and top-bar alerts.',
          enableEmailNotice: 'Enable Email Notifications',
          enableEmailNoticeDescription: 'Send important events by email.',
          webhook: 'Webhook URL',
          webhookDescription: 'Used for third-party alert integrations.',
        },
        storage: {
          title: 'Storage Settings',
          description: 'Configure uploads, static assets, and backup paths.',
          uploadPath: 'Upload Path',
          uploadPathDescription: 'Storage path for avatars and attachments.',
          maxUploadSize: 'Max Upload Size (MB)',
          maxUploadSizeDescription: 'Limits attachment upload size.',
          allowedExtensions: 'Allowed Extensions',
          allowedExtensionsDescription: 'Comma-separated allowed extensions.',
        },
      };

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
        title: t?.settings?.basic?.title || copy.basic.title,
        description: copy.basic.description,
        settings: [
          {
            key: 'system.name',
            label: copy.basic.systemName,
            description: copy.basic.systemNameDescription,
            value: 'Pantheon Platform',
            type: 'text',
            editable: true,
            required: true,
          },
          {
            key: 'system.subtitle',
            label: copy.basic.systemSubtitle,
            description: copy.basic.systemSubtitleDescription,
            value: 'Enterprise Management Foundation',
            type: 'text',
            editable: true,
          },
          {
            key: 'system.default_language',
            label: copy.basic.defaultLanguage,
            description: copy.basic.defaultLanguageDescription,
            value: zh ? 'zh-CN' : 'en-US',
            type: 'select',
            editable: true,
            options: ['zh-CN', 'en-US'],
          },
        ],
      },
      security: {
        title: t?.settings?.security?.title || copy.security.title,
        description: copy.security.description,
        settings: [
          {
            key: 'security.enable_2fa',
            label: copy.security.enable2fa,
            description: copy.security.enable2faDescription,
            value: true,
            type: 'boolean',
            editable: true,
          },
          {
            key: 'security.max_login_attempts',
            label: copy.security.maxLoginAttempts,
            description: copy.security.maxLoginAttemptsDescription,
            value: 5,
            type: 'number',
            editable: true,
          },
          {
            key: 'security.password_min_length',
            label: copy.security.minPasswordLength,
            description: copy.security.minPasswordLengthDescription,
            value: 8,
            type: 'number',
            editable: true,
          },
        ],
      },
      email: {
        title: t?.settings?.email?.title || copy.email.title,
        description: copy.email.description,
        settings: [
          {
            key: 'email.smtp_host',
            label: copy.email.smtpHost,
            description: copy.email.smtpHostDescription,
            value: '',
            type: 'text',
            editable: true,
          },
          {
            key: 'email.smtp_port',
            label: copy.email.smtpPort,
            description: copy.email.smtpPortDescription,
            value: 465,
            type: 'number',
            editable: true,
          },
          {
            key: 'email.smtp_username',
            label: copy.email.smtpUsername,
            description: copy.email.smtpUsernameDescription,
            value: '',
            type: 'text',
            editable: true,
          },
        ],
      },
      notification: {
        title: t?.settings?.notification?.title || copy.notification.title,
        description: copy.notification.description,
        settings: [
          {
            key: 'notification.enable_system_notice',
            label: copy.notification.enableSystemNotice,
            description: copy.notification.enableSystemNoticeDescription,
            value: true,
            type: 'boolean',
            editable: true,
          },
          {
            key: 'notification.enable_email_notice',
            label: copy.notification.enableEmailNotice,
            description: copy.notification.enableEmailNoticeDescription,
            value: false,
            type: 'boolean',
            editable: true,
          },
          {
            key: 'notification.webhook_url',
            label: copy.notification.webhook,
            description: copy.notification.webhookDescription,
            value: '',
            type: 'textarea',
            editable: true,
          },
        ],
      },
      storage: {
        title: t?.settings?.storage?.title || copy.storage.title,
        description: copy.storage.description,
        settings: [
          {
            key: 'storage.upload_path',
            label: copy.storage.uploadPath,
            description: copy.storage.uploadPathDescription,
            value: '/data/uploads',
            type: 'text',
            editable: true,
          },
          {
            key: 'storage.max_upload_size',
            label: copy.storage.maxUploadSize,
            description: copy.storage.maxUploadSizeDescription,
            value: 20,
            type: 'number',
            editable: true,
          },
          {
            key: 'storage.allowed_extensions',
            label: copy.storage.allowedExtensions,
            description: copy.storage.allowedExtensionsDescription,
            value: '.png,.jpg,.pdf,.docx',
            type: 'textarea',
            editable: true,
          },
        ],
      },
    }),
    [copy, t, zh],
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
    pageTitle: t?.menu?.systemSettings || copy.pageTitle,
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const activeSection = sectionsWithValues[activeTab] || sectionsWithValues.basic;

  const handleExport = async () => {
    if (!ensureActionPermission(canExportSettings, copy.actions.export)) return;
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

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
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
    if (!ensureActionPermission(canImportSettings, copy.actions.import)) return;
    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text) as ExportedSettings;
      if (!Array.isArray(data.settings)) {
        toast.error(copy.invalidFile);
        return;
      }

      const updates = Object.fromEntries(data.settings.map((item) => [item.key, item.value]));
      await settingApi.batchUpdateSettings(updates);
      toast.success(copy.importReload);
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
      title={t?.menu?.systemSettings || copy.pageTitle}
      description={copy.pageDescription}
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
              {copy.actions.import}
            </Button>
          ) : null}
          {canExportSettings ? (
            <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {copy.actions.export}
            </Button>
          ) : null}
          {canUpdateSettings ? (
            <Button
              onClick={() => {
                if (ensureActionPermission(canUpdateSettings, copy.actions.save)) {
                  void handleSave();
                }
              }}
              disabled={!isDirty || loading}
            >
              <Zap className="mr-2 h-4 w-4" />
              {copy.actions.syncNow}
            </Button>
          ) : null}
        </>
      ) : undefined}
    >
      {!canQuerySettings ? (
        <QueryAccessBoundary
          viewId="system-settings"
          title={t?.menu?.systemSettings || copy.pageTitle}
          queryPermission={systemPermissions.settings.query}
        />
      ) : (
        <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
          onSave={() => {
            if (ensureActionPermission(canUpdateSettings, copy.actions.save)) {
              void handleSave();
            }
          }}
          onReset={handleReset}
          modifiedCount={Object.keys(editingValues).length}
        />
      ) : null}
    </PageLayout>
  );
}
