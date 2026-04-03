import { useMemo, useRef, useState } from 'react';
import { Download, Loader2, Upload, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Button } from '../../../../components/ui/button';
import { ManagementActionBar, ManagementContentCard } from '../../../../shared/components/ui';
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
import type { SettingsSchema } from './hooks/useSettingsLogic';
import { getSystemSettingsCopy } from './systemSettingsCopy';

interface ExportedSettings {
  version: string;
  exportedAt: string;
  settings: Array<{ key: string; value: string }>;
}

export function SystemSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getSystemSettingsCopy(language);
  const settingsMessages = createEntityFeedback(zh, copy.entity);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQuerySettings = hasPermission(systemPermissions.settings.query);
  const canUpdateSettings = hasPermission(systemPermissions.settings.update);
  const canImportSettings = hasPermission(systemPermissions.settings.import);
  const canExportSettings = hasPermission(systemPermissions.settings.export);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const schema = useMemo<SettingsSchema>(
    () => ({
      basic: {
        title: copy.sections.basic.title,
        description: copy.sections.basic.description,
        settings: [
          {
            key: 'system.name',
            label: copy.sections.basic.settings.systemName,
            description: copy.sections.basic.settings.systemNameDescription,
            value: 'Pantheon Platform',
            type: 'text',
            editable: true,
            required: true,
          },
          {
            key: 'system.subtitle',
            label: copy.sections.basic.settings.systemSubtitle,
            description: copy.sections.basic.settings.systemSubtitleDescription,
            value: 'Enterprise Management Foundation',
            type: 'text',
            editable: true,
          },
          {
            key: 'system.default_language',
            label: copy.sections.basic.settings.defaultLanguage,
            description: copy.sections.basic.settings.defaultLanguageDescription,
            value: zh ? 'zh-CN' : 'en-US',
            type: 'select',
            editable: true,
            options: ['zh-CN', 'en-US'],
          },
        ],
      },
      security: {
        title: copy.sections.security.title,
        description: copy.sections.security.description,
        settings: [
          {
            key: 'security.enable_2fa',
            label: copy.sections.security.settings.enable2fa,
            description: copy.sections.security.settings.enable2faDescription,
            value: true,
            type: 'boolean',
            editable: true,
          },
          {
            key: 'security.max_login_attempts',
            label: copy.sections.security.settings.maxLoginAttempts,
            description: copy.sections.security.settings.maxLoginAttemptsDescription,
            value: 5,
            type: 'number',
            editable: true,
          },
          {
            key: 'security.password_min_length',
            label: copy.sections.security.settings.minPasswordLength,
            description: copy.sections.security.settings.minPasswordLengthDescription,
            value: 8,
            type: 'number',
            editable: true,
          },
        ],
      },
      email: {
        title: copy.sections.email.title,
        description: copy.sections.email.description,
        settings: [
          {
            key: 'email.smtp_host',
            label: copy.sections.email.settings.smtpHost,
            description: copy.sections.email.settings.smtpHostDescription,
            value: '',
            type: 'text',
            editable: true,
          },
          {
            key: 'email.smtp_port',
            label: copy.sections.email.settings.smtpPort,
            description: copy.sections.email.settings.smtpPortDescription,
            value: 465,
            type: 'number',
            editable: true,
          },
          {
            key: 'email.smtp_username',
            label: copy.sections.email.settings.smtpUsername,
            description: copy.sections.email.settings.smtpUsernameDescription,
            value: '',
            type: 'text',
            editable: true,
          },
        ],
      },
      notification: {
        title: copy.sections.notification.title,
        description: copy.sections.notification.description,
        settings: [
          {
            key: 'notification.enable_system_notice',
            label: copy.sections.notification.settings.enableSystemNotice,
            description: copy.sections.notification.settings.enableSystemNoticeDescription,
            value: true,
            type: 'boolean',
            editable: true,
          },
          {
            key: 'notification.enable_email_notice',
            label: copy.sections.notification.settings.enableEmailNotice,
            description: copy.sections.notification.settings.enableEmailNoticeDescription,
            value: false,
            type: 'boolean',
            editable: true,
          },
          {
            key: 'notification.webhook_url',
            label: copy.sections.notification.settings.webhook,
            description: copy.sections.notification.settings.webhookDescription,
            value: '',
            type: 'textarea',
            editable: true,
          },
        ],
      },
      storage: {
        title: copy.sections.storage.title,
        description: copy.sections.storage.description,
        settings: [
          {
            key: 'storage.upload_path',
            label: copy.sections.storage.settings.uploadPath,
            description: copy.sections.storage.settings.uploadPathDescription,
            value: '/data/uploads',
            type: 'text',
            editable: true,
          },
          {
            key: 'storage.max_upload_size',
            label: copy.sections.storage.settings.maxUploadSize,
            description: copy.sections.storage.settings.maxUploadSizeDescription,
            value: 20,
            type: 'number',
            editable: true,
          },
          {
            key: 'storage.allowed_extensions',
            label: copy.sections.storage.settings.allowedExtensions,
            description: copy.sections.storage.settings.allowedExtensionsDescription,
            value: '.png,.jpg,.pdf,.docx',
            type: 'textarea',
            editable: true,
          },
        ],
      },
    }),
    [copy, zh],
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
  } = useSettingsLogic(schema, copy.logic, canQuerySettings);

  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const activeSection = sectionsWithValues[activeTab] || sectionsWithValues.basic;
  const sidebarItems = useMemo(
    () =>
      Object.entries(schema).map(([id, section]) => ({
        id,
        title: section.title,
      })),
    [schema],
  );

  const handleExport = async () => {
    if (!ensureActionPermission(canExportSettings, copy.actions.export)) return;
    try {
      setExporting(true);
      const payload: ExportedSettings = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: Object.values(sectionsWithValues)
          .flatMap((section) => section.settings)
          .map((item) => ({
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
        toast.error(copy.messages.invalidFile);
        return;
      }

      const updates = Object.fromEntries(data.settings.map((item) => [item.key, item.value]));
      await settingApi.batchUpdateSettings(updates);
      toast.success(copy.messages.importReload);
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
      title={copy.page.title}
      description={copy.page.description}
      actions={canQuerySettings ? (
        <ManagementActionBar>
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
        </ManagementActionBar>
      ) : undefined}
    >
      {!canQuerySettings ? (
        <QueryAccessBoundary
          viewId="system-settings"
          title={copy.page.title}
          queryPermission={systemPermissions.settings.query}
        />
      ) : (
        <ManagementContentCard>
          <div className="flex min-h-[640px] gap-0 p-6">
            <SettingsSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              title={copy.sidebar.title}
              items={sidebarItems}
            />
            <div className="flex-1 pl-6">
              <SettingsFormGroup
                section={activeSection}
                values={editingValues}
                onChange={handleChange}
                copy={copy.form}
              />
            </div>
          </div>
        </ManagementContentCard>
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
          copy={copy.float}
        />
      ) : null}
    </PageLayout>
  );
}
