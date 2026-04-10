import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  DetailDialogWrapper,
  ManagementContentCard,
  ManagementFocusCard,
  ManagementMetricCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useLanguageStore } from '../../../../stores/language_store';
import { useAuthStore } from '../../../auth/store/auth_store';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { settingApi } from '../../api/setting_api';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { SettingsActionFloat } from './components/settings_action_float';
import { SettingsFormGroup } from './components/settings_form_group';
import { SettingsSidebar } from './components/settings_sidebar';
import { useSettingsLogic } from './hooks/use_settings_logic';
import type { SettingsSaveResult, SettingsSchema } from './hooks/use_settings_logic';
import { getSystemSettingsCopy } from './system_settings_copy';

interface ExportedSettings {
  version: string;
  exportedAt: string;
  settings: Array<{ key: string; value: string }>;
}

interface SettingsSubmitSummary {
  result: SettingsSaveResult;
  affectedSectionCount: number;
  affectedItemCount: number;
  currentSectionKey: string;
  currentSectionTitle: string;
  focusSectionKey: string | null;
  focusSectionTitle: string | null;
  savedKeys: string[];
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
  const [selectedSettingKey, setSelectedSettingKey] = useState<string | null>(null);
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);
  const [allChangesDialogOpen, setAllChangesDialogOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitSummary, setSubmitSummary] = useState<SettingsSubmitSummary | null>(null);

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
    reload,
  } = useSettingsLogic(schema, copy.logic, canQuerySettings);

  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs: {},
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const activeSection = sectionsWithValues[activeTab] || sectionsWithValues.basic;
  const sectionChanges = Object.entries(sectionsWithValues)
    .map(([sectionKey, section]) => ({
      sectionKey,
      section,
      changes: section.settings.filter((item) => Object.prototype.hasOwnProperty.call(editingValues, item.key)),
    }))
    .filter((item) => item.changes.length > 0);
  const changedItemCount = Object.keys(editingValues).length;
  const modifiedSettingsInSection = activeSection.settings.filter((item) =>
    Object.prototype.hasOwnProperty.call(editingValues, item.key),
  );
  const selectedSetting = activeSection.settings.find((item) => item.key === selectedSettingKey) ?? null;
  const selectedSettingCurrentValue = selectedSetting
    ? (Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key)
      ? editingValues[selectedSetting.key]
      : selectedSetting.value)
    : null;
  const sidebarItems = useMemo(
    () =>
      Object.entries(schema).map(([id, section]) => ({
        id,
        title: section.title,
      })),
    [schema],
  );
  const allowedSettingKeys = useMemo(
    () => new Set(Object.values(sectionsWithValues).flatMap((section) => section.settings.map((item) => item.key))),
    [sectionsWithValues],
  );

  useEffect(() => {
    if (isDirty && submitSummary) {
      setSubmitSummary(null);
    }
  }, [isDirty, submitSummary]);

  useEffect(() => {
    if (
      selectedSettingKey &&
      !activeSection.settings.some((item) => item.key === selectedSettingKey)
    ) {
      setSelectedSettingKey(null);
    }
  }, [activeSection.settings, selectedSettingKey]);

  const formatSettingValue = (value: string | number | boolean | null | undefined) => {
    if (typeof value === 'boolean') {
      return value ? copy.form.enabled : copy.form.disabled;
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  };

  const getSectionChangeDensityLabel = (count: number) => {
    if (count >= 3) {
      return zh ? '高密度变更' : 'High Density';
    }
    if (count === 2) {
      return zh ? '中等变更' : 'Medium Density';
    }
    return zh ? '轻量变更' : 'Light Change';
  };

  const mostChangedSection = sectionChanges.reduce<(typeof sectionChanges)[number] | null>(
    (current, item) => {
      if (!current || item.changes.length > current.changes.length) {
        return item;
      }
      return current;
    },
    null,
  );
  const settingsReview =
    changedItemCount >= 5
      ? {
          variant: 'warning' as const,
          label: zh ? '优先复核重点分组' : 'Prioritize focus sections',
          hint: zh
            ? '当前存在较多待同步项，建议先查看改动最密集的分组。'
            : 'There are many pending changes. Review the densest section first.',
          nextAction: zh
            ? '先打开全部变更，再回到重点分组逐项确认。'
            : 'Open all changes first, then confirm the focus section item by item.',
          focus: mostChangedSection?.section.title || activeSection.title,
        }
      : isDirty
        ? {
            variant: 'info' as const,
            label: zh ? '当前存在待同步改动' : 'Pending changes in progress',
            hint: zh
              ? '当前改动范围可控，适合先看当前分组后再提交。'
              : 'The current change scope is manageable. Review the current section before saving.',
            nextAction: zh
              ? '先核对当前分组差异，再决定是否立即同步。'
              : 'Review the current section diff, then decide whether to sync now.',
            focus: activeSection.title,
          }
        : submitSummary
          ? {
              variant: 'success' as const,
              label: zh ? '最近一次同步已完成' : 'Latest sync completed',
              hint: zh
                ? '最近一次保存成功，可继续抽查重点分组或导出留档。'
                : 'The latest save succeeded. Continue with focused checks or export a snapshot.',
              nextAction: zh
                ? '先查看保存结果，再继续巡检其他分组。'
                : 'Review the save result first, then continue with other sections.',
              focus: submitSummary.focusSectionTitle || submitSummary.currentSectionTitle,
            }
          : {
              variant: 'success' as const,
              label: zh ? '当前配置稳定' : 'Configuration is stable',
              hint: zh
                ? '当前没有待同步项，可按分组执行常规巡检。'
                : 'No pending changes are present. Continue with routine section review.',
              nextAction: zh
                ? '先抽查安全与基础配置，再按需编辑。'
                : 'Sample security and basic settings first, then edit as needed.',
              focus: activeSection.title,
            };
  const settingsPriorities = [
    isDirty && mostChangedSection
      ? {
          id: 'focus-section',
          title: mostChangedSection.section.title,
          detail: zh
            ? `当前共有 ${mostChangedSection.changes.length} 项改动，建议优先复核。`
            : `${mostChangedSection.changes.length} changes are pending here. Review this section first.`,
        }
      : null,
    isDirty
      ? {
          id: 'current-section',
          title: activeSection.title,
          detail: zh
            ? '当前正在编辑的分组适合继续核对前后值差异。'
            : 'The active section is the best place to continue reviewing before/after values.',
        }
      : null,
    !isDirty && submitSummary
      ? {
          id: 'saved-result',
          title: zh ? '最近同步结果' : 'Latest Sync Result',
          detail: zh
            ? `已同步 ${submitSummary.affectedItemCount} 项配置，可继续留档或抽查。`
            : `${submitSummary.affectedItemCount} settings were synced. Continue with archival or spot checks.`,
        }
      : null,
    canExportSettings
      ? {
          id: 'export',
          title: zh ? '导出留档' : 'Export Snapshot',
          detail: zh
            ? '复核完成后可导出当前配置快照。'
            : 'Export the current configuration snapshot after review.',
        }
      : null,
  ].filter((item): item is { id: string; title: string; detail: string } => Boolean(item));

  const buildSectionChangeSummary = () => {
    return modifiedSettingsInSection
      .map((item) => {
        const before = formatSettingValue(item.value);
        const after = formatSettingValue(editingValues[item.key]);
        return `${item.label} (${item.key})\n- ${copy.detail.fields.before}: ${before}\n- ${copy.detail.fields.after}: ${after}`;
      })
      .join('\n\n');
  };

  const buildAllChangeSummary = () => {
    return sectionChanges
      .map(({ section, changes }) => {
        const detail = changes
          .map((item) => {
            const before = formatSettingValue(item.value);
            const after = formatSettingValue(editingValues[item.key]);
            return `${item.label} (${item.key})\n- ${copy.detail.fields.before}: ${before}\n- ${copy.detail.fields.after}: ${after}`;
          })
          .join('\n\n');
        return `${section.title}\n${detail}`;
      })
      .join('\n\n====================\n\n');
  };

  const handleCopyChanges = async () => {
    try {
      await navigator.clipboard?.writeText(buildSectionChangeSummary());
      toast.success(copy.messages.changesCopied);
    } catch {
      toast.error(copy.messages.changesCopyFailed);
    }
  };

  const handleExportChanges = () => {
    const summary = buildSectionChangeSummary();
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-settings-${activeTab}-changes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(copy.messages.changesExported);
  };

  const handleCopyAllChanges = async () => {
    try {
      await navigator.clipboard?.writeText(buildAllChangeSummary());
      toast.success(copy.messages.changesCopied);
    } catch {
      toast.error(copy.messages.changesCopyFailed);
    }
  };

  const handleExportAllChanges = () => {
    const summary = buildAllChangeSummary();
    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-settings-all-changes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(copy.messages.changesExported);
  };

  const triggerSaveWithConfirm = () => {
    if (!ensureActionPermission(canUpdateSettings, copy.actions.save)) {
      return;
    }
    setSubmitConfirmOpen(true);
  };

  const handleConfirmedSave = () => {
    if (!ensureActionPermission(canUpdateSettings, copy.actions.save)) {
      return;
    }

    const snapshot = {
      affectedSectionCount: sectionChanges.length,
      affectedItemCount: changedItemCount,
      currentSectionKey: activeTab,
      currentSectionTitle: activeSection.title,
      focusSectionKey: mostChangedSection?.sectionKey ?? null,
      focusSectionTitle: mostChangedSection?.section.title ?? null,
      savedKeys: Object.keys(editingValues),
    };

    void (async () => {
      const result = await handleSave();
      if (result) {
        setSubmitSummary({
          result,
          ...snapshot,
        });
        setAllChangesDialogOpen(false);
        setChangesDialogOpen(false);
      }
      setSubmitConfirmOpen(false);
    })();
  };

  const formatSavedAt = (savedAt: string) =>
    new Date(savedAt).toLocaleString(zh ? 'zh-CN' : 'en-US', {
      hour12: false,
    });

  const handleResetDraftState = () => {
    setSubmitSummary(null);
    setChangesDialogOpen(false);
    setAllChangesDialogOpen(false);
    setSubmitConfirmOpen(false);
    handleReset();
  };

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
            value: String(item.value ?? ''),
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

      const validSettings = data.settings.filter((item) => allowedSettingKeys.has(item.key));
      if (validSettings.length === 0) {
        toast.error(copy.messages.invalidFile);
        return;
      }

      const updates = Object.fromEntries(validSettings.map((item) => [item.key, item.value]));
      await settingApi.batchUpdateSettings(updates);
      toast.success(copy.messages.importReload);
      setSubmitSummary(null);
      setChangesDialogOpen(false);
      setAllChangesDialogOpen(false);
      setSubmitConfirmOpen(false);
      await reload();
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
    <div className="space-y-6">
      {canQuerySettings ? (
        <ManagementPageHeader
          eyebrow="SYSTEM"
          title={copy.page.title}
          description={copy.page.description}
          meta={
            <>
              <Badge variant="mono">Settings</Badge>
              <Badge variant="info">
                {zh ? `${sidebarItems.length} 个配置分组` : `${sidebarItems.length} setting groups`}
              </Badge>
              {isDirty ? (
                <Badge variant="warning">
                  {zh ? `${changedItemCount} 项待同步` : `${changedItemCount} pending`}
                </Badge>
              ) : submitSummary ? (
                <Badge variant="success">{copy.success.title}</Badge>
              ) : null}
            </>
          }
          actions={
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
            <Button variant="mono" size="pill" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {copy.actions.import}
            </Button>
          ) : null}
          {canExportSettings ? (
            <Button variant="mono" size="pill" onClick={() => void handleExport()} disabled={exporting}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {copy.actions.export}
            </Button>
          ) : null}
          {canUpdateSettings ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => setAllChangesDialogOpen(true)}
              disabled={!isDirty}
            >
              {copy.actions.viewAllChanges}
            </Button>
          ) : null}
          {canUpdateSettings ? (
            <Button
              size="pill"
              onClick={triggerSaveWithConfirm}
              disabled={!isDirty || loading}
            >
              <Zap className="mr-2 h-4 w-4" />
              {copy.actions.syncNow}
            </Button>
          ) : null}
            </>
          }
        />
      ) : null}
      {!canQuerySettings ? (
        <QueryAccessBoundary
          viewId="system-settings"
          title={copy.page.title}
          queryPermission={systemPermissions.settings.query}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ManagementMetricCard
              label={zh ? '配置分组' : 'Setting Groups'}
              value={sidebarItems.length}
              hint={zh ? '当前可巡检的配置域总数。' : 'Total configuration domains available for review.'}
            />
            <ManagementMetricCard
              label={zh ? '待同步项' : 'Pending Items'}
              value={changedItemCount}
              hint={
                isDirty
                  ? zh
                    ? '仍有改动未提交，建议先完成本轮复核。'
                    : 'Changes remain unsynced. Finish the current review cycle first.'
                  : zh
                    ? '当前没有待同步改动。'
                    : 'No pending changes are currently waiting to sync.'
              }
            />
            <ManagementMetricCard
              label={zh ? '受影响分组' : 'Affected Sections'}
              value={sectionChanges.length}
              hint={
                mostChangedSection
                  ? `${mostChangedSection.section.title} · ${mostChangedSection.changes.length}`
                  : zh
                    ? '当前无变更分组。'
                    : 'No changed sections at the moment.'
              }
            />
            <ManagementMetricCard
              label={zh ? '当前焦点' : 'Current Focus'}
              value={settingsReview.focus}
              hint={settingsReview.nextAction}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ManagementFocusCard
              icon={isDirty ? AlertTriangle : CheckCircle2}
              eyebrow="REVIEW"
              title={zh ? '配置审阅结论' : 'Settings Review'}
              value={settingsReview.label}
              hint={settingsReview.hint}
              badge={<Badge variant={settingsReview.variant}>{settingsReview.focus}</Badge>}
              action={
                <div className="flex flex-wrap gap-2">
                  {isDirty ? (
                    <Button type="button" variant="mono" size="pill" onClick={() => setAllChangesDialogOpen(true)}>
                      {copy.actions.viewAllChanges}
                    </Button>
                  ) : null}
                  {submitSummary ? (
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => setActiveTab(submitSummary.focusSectionKey || submitSummary.currentSectionKey)}
                    >
                      {zh ? '查看保存结果' : 'Review Saved Result'}
                    </Button>
                  ) : null}
                </div>
              }
            />
            <ManagementFocusCard
              icon={Zap}
              eyebrow="PRIORITY"
              title={zh ? '本次处理顺序' : 'Suggested Priority Order'}
              value={settingsPriorities[0]?.title ?? (zh ? '当前无优先事项' : 'No priority item right now')}
              hint={settingsPriorities[0]?.detail ?? (zh ? '当前可按分组进行常规巡检。' : 'Continue with routine section review by group.')}
              badge={
                settingsPriorities[0] ? (
                  <Badge variant={isDirty ? 'warning' : 'mono'}>{`01`}</Badge>
                ) : (
                  <Badge variant="success">{zh ? '稳定' : 'Stable'}</Badge>
                )
              }
              action={
                settingsPriorities.length > 1 ? (
                  <div className="text-xs leading-5 text-slate-500">
                    {zh ? `后续还可继续处理 ${settingsPriorities.length - 1} 项建议。` : `${settingsPriorities.length - 1} more suggested items remain after this.`}
                  </div>
                ) : undefined
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <ManagementContentCard className="p-6">
              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '配置审阅结论' : 'Settings Review'}
                description={
                  zh
                    ? '先判断当前是要处理待同步改动、查看同步结果，还是继续常规巡检。'
                    : 'Decide whether to handle pending changes, review sync results, or continue routine inspection.'
                }
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Outcome'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={settingsReview.variant}>{settingsReview.label}</Badge>
                      <span>{settingsReview.hint}</span>
                    </div>
                  }
                />
                <DetailKeyValueItem label={zh ? '下一步动作' : 'Next Action'} value={settingsReview.nextAction} />
                <DetailKeyValueItem label={zh ? '焦点分组' : 'Focus Section'} value={settingsReview.focus} />
                <DetailKeyValueItem label={zh ? '待同步项' : 'Pending Items'} value={changedItemCount} />
                <DetailKeyValueItem
                  label={zh ? '建议入口' : 'Suggested Entry'}
                  value={
                    <div className="flex flex-wrap gap-2">
                      {isDirty ? (
                        <Button type="button" variant="mono" size="pill" onClick={() => setAllChangesDialogOpen(true)}>
                          {copy.actions.viewAllChanges}
                        </Button>
                      ) : null}
                      {submitSummary ? (
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={() => setActiveTab(submitSummary.focusSectionKey || submitSummary.currentSectionKey)}
                        >
                          {zh ? '查看保存结果' : 'Review Saved Result'}
                        </Button>
                      ) : null}
                    </div>
                  }
                  className="md:col-span-2"
                />
              </DetailKeyValueSection>
            </ManagementContentCard>

            <ManagementContentCard className="p-6">
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">PRIORITY</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">
                    {zh ? '本次处理顺序' : 'Suggested Priority Order'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {zh ? '按当前改动和同步状态，建议优先处理这些事项。' : 'Based on the current change and sync state, handle these items first.'}
                  </div>
                </div>
                {settingsPriorities.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 && isDirty ? 'warning' : 'mono'}>{`0${index + 1}`}</Badge>
                      <div className="font-medium text-slate-900">{item.title}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{item.detail}</div>
                  </div>
                ))}
              </div>
            </ManagementContentCard>
          </div>

          {submitSummary ? (
            <ManagementContentCard className="border-emerald-200/80 bg-emerald-50/70">
              <div className="p-6">
                <div className="mb-4 flex flex-wrap justify-end gap-2">
                  {submitSummary.focusSectionKey ? (
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => setActiveTab(submitSummary.focusSectionKey ?? submitSummary.currentSectionKey)}
                    >
                      {copy.success.continueReview}
                    </Button>
                  ) : null}
                  <Button type="button" variant="mono" size="pill" onClick={() => setSubmitSummary(null)}>
                    {copy.success.dismiss}
                  </Button>
                </div>
                <DetailKeyValueSection
                  eyebrow="RESULT"
                  title={copy.success.title}
                  description={copy.success.description}
                >
                  <DetailKeyValueItem
                    label={copy.success.savedAt}
                    value={
                      <div className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{formatSavedAt(submitSummary.result.savedAt)}</span>
                      </div>
                    }
                  />
                  <DetailKeyValueItem label={copy.success.affectedSections} value={submitSummary.affectedSectionCount} />
                  <DetailKeyValueItem label={copy.success.affectedItems} value={submitSummary.affectedItemCount} />
                  <DetailKeyValueItem label={copy.success.currentSection} value={submitSummary.currentSectionTitle} />
                  <DetailKeyValueItem
                    label={copy.success.focusSection}
                    value={submitSummary.focusSectionTitle ?? submitSummary.currentSectionTitle}
                    hint={
                      submitSummary.focusSectionTitle
                        ? zh
                          ? '建议优先回看本次改动最密集的分组。'
                          : 'Review the densest section first after syncing.'
                        : undefined
                    }
                  />
                  <DetailKeyValueItem
                    label={copy.success.savedKeys}
                    value={submitSummary.savedKeys.join(', ')}
                    className="md:col-span-2"
                    valueClassName="font-mono text-xs"
                  />
                </DetailKeyValueSection>

                <div className="mt-5">
                  <DetailKeyValueSection
                    eyebrow="REVIEW"
                    title={zh ? '建议复核清单' : 'Recommended Review Checklist'}
                    description={
                      zh
                        ? '同步完成后，建议先核对重点分组、关键键和值变更范围。'
                        : 'After syncing, review the focus section, key settings, and scope of the applied changes.'
                    }
                  >
                    <DetailKeyValueItem
                      label={copy.success.reviewOutcome}
                      className="md:col-span-2"
                      value={
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={submitSummary.affectedItemCount >= 5 ? 'warning' : 'success'}>
                            {submitSummary.affectedItemCount >= 5
                              ? zh ? '建议重点复核' : 'Review carefully'
                              : zh ? '本次改动范围可控' : 'Scope remains manageable'}
                          </Badge>
                          <span>
                            {submitSummary.affectedItemCount >= 5
                              ? zh
                                ? '本次同步项较多，建议优先检查重点分组与关键配置键。'
                                : 'This sync touched many settings. Review the focus section and critical keys first.'
                              : zh
                                ? '本次同步范围较集中，建议快速复核重点分组即可。'
                                : 'This sync stayed focused. A quick review of the focus section is recommended.'}
                          </span>
                        </div>
                      }
                    />
                    <DetailKeyValueItem
                      label={copy.success.reviewScope}
                      value={`${submitSummary.affectedSectionCount} / ${submitSummary.affectedItemCount}`}
                      hint={zh ? '分组数 / 配置项数' : 'Sections / settings'}
                    />
                    <DetailKeyValueItem
                      label={copy.success.focusSection}
                      value={submitSummary.focusSectionTitle ?? submitSummary.currentSectionTitle}
                    />
                    <DetailKeyValueItem
                      label={copy.success.reviewAction}
                      className="md:col-span-2"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {submitSummary.focusSectionKey ? (
                            <Button
                              type="button"
                              variant="mono"
                              size="pill"
                              onClick={() => setActiveTab(submitSummary.focusSectionKey ?? submitSummary.currentSectionKey)}
                            >
                              {copy.success.continueReview}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="mono"
                            size="pill"
                            onClick={() => setAllChangesDialogOpen(true)}
                          >
                            {copy.actions.viewAllChanges}
                          </Button>
                        </div>
                      }
                    />
                  </DetailKeyValueSection>
                </div>
              </div>
            </ManagementContentCard>
          ) : null}

          <ManagementContentCard>
            <div className="flex min-h-[640px] gap-0 p-6">
              <SettingsSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                title={copy.sidebar.title}
                items={sidebarItems}
              />
              <div className="flex-1 pl-6">
                <DetailKeyValueSection
                  eyebrow="SECTION"
                  title={activeSection.title}
                  description={activeSection.description}
                  className="mb-4"
                >
                  <DetailKeyValueItem
                    label={zh ? '配置项数量' : 'Field Count'}
                    value={activeSection.settings.length}
                    hint={zh ? '当前分组下可配置字段总数' : 'Total configurable fields in this section'}
                  />
                  <DetailKeyValueItem
                    label={zh ? '已修改' : 'Modified'}
                    value={activeSection.settings.filter((item) => Object.prototype.hasOwnProperty.call(editingValues, item.key)).length}
                    hint={zh ? '尚未同步到后端的改动' : 'Unsynced changes in the current section'}
                  />
                  <DetailKeyValueItem
                    label={zh ? '必填项' : 'Required'}
                    value={activeSection.settings.filter((item) => item.required).length}
                  />
                  <DetailKeyValueItem
                    label={zh ? '可编辑项' : 'Editable'}
                    value={activeSection.settings.filter((item) => item.editable).length}
                  />
                </DetailKeyValueSection>
                {modifiedSettingsInSection.length > 0 ? (
                  <DetailKeyValueSection
                    eyebrow="CHANGES"
                    title={copy.detail.sections.changes}
                    description={
                      zh
                        ? '直接对比当前分组中尚未同步的配置差异。'
                        : 'Compare unsynced changes in the current section before saving.'
                    }
                    className="mb-4"
                  >
                    <DetailKeyValueItem
                      label={zh ? '快速操作' : 'Quick Action'}
                      className="md:col-span-2"
                      value={
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="mono"
                            size="pill"
                            onClick={() => void handleCopyChanges()}
                          >
                            {copy.actions.copyChanges}
                          </Button>
                          <Button
                            type="button"
                            variant="mono"
                            size="pill"
                            onClick={handleExportChanges}
                          >
                            {copy.actions.exportChanges}
                          </Button>
                          <Button
                            type="button"
                            variant="mono"
                            size="pill"
                            onClick={() => setChangesDialogOpen(true)}
                          >
                            {copy.actions.viewChanges}
                          </Button>
                        </div>
                      }
                    />
                    {modifiedSettingsInSection.map((item) => (
                      <DetailKeyValueItem
                        key={item.key}
                        label={item.label}
                        value={
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2 py-1">{copy.detail.fields.before}</span>
                              <span className="font-mono text-[11px] text-slate-700">{formatSettingValue(item.value)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{copy.detail.fields.after}</span>
                              <span className="font-mono text-[11px] text-slate-900">
                                {formatSettingValue(editingValues[item.key])}
                              </span>
                            </div>
                          </div>
                        }
                        hint={item.key}
                        valueClassName="text-xs font-normal"
                      />
                    ))}
                  </DetailKeyValueSection>
                ) : null}
                <SettingsFormGroup
                  section={activeSection}
                  values={editingValues}
                  onChange={handleChange}
                  onInspect={(field) => setSelectedSettingKey(field.key)}
                  copy={{
                    ...copy.form,
                    viewDetail: copy.actions.viewDetail,
                  }}
                />
              </div>
            </div>
          </ManagementContentCard>
        </>
      )}

      {canQuerySettings && canUpdateSettings ? (
        <SettingsActionFloat
          isVisible={isDirty}
          onSave={triggerSaveWithConfirm}
          onReset={handleResetDraftState}
          modifiedCount={Object.keys(editingValues).length}
          copy={copy.float}
        />
      ) : null}

      {selectedSetting ? (
        <DetailDialogWrapper
          open={Boolean(selectedSetting)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSettingKey(null);
            }
          }}
          title={copy.detail.title}
          description={copy.detail.description}
          size="lg"
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '配置项摘要' : 'Setting Review Summary'}
              description={zh ? '帮助快速判断当前配置项应先看什么。' : 'Helps decide what to review first for this setting.'}
            >
              <DetailKeyValueItem
                label={zh ? '当前结论' : 'Current Outcome'}
                value={
                  <Badge variant={Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key) ? 'warning' : 'success'}>
                    {Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key)
                      ? (zh ? '存在未同步修改' : 'Unsynced Change')
                      : (zh ? '配置已同步' : 'Synced')}
                  </Badge>
                }
                hint={
                  Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key)
                    ? (zh ? '当前配置项存在本地修改，建议先核对前后值差异。' : 'This setting has local changes. Review before/after values first.')
                    : (zh ? '当前配置项与已保存值一致。' : 'This setting matches the saved value.')
                }
              />
              <DetailKeyValueItem label={zh ? '所属分组' : 'Section'} value={activeSection.title} />
              <DetailKeyValueItem
                label={zh ? '下一步动作' : 'Next Action'}
                value={
                  Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key)
                    ? (zh ? '先看行为规则，再决定是否提交分组变更。' : 'Review behavior rules before deciding to submit section changes.')
                    : (zh ? '继续返回分组查看整体变更。' : 'Return to the section to review broader changes.')
                }
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="SETTING"
              title={selectedSetting.label}
              description={selectedSetting.description}
            >
              <DetailKeyValueItem label={copy.detail.fields.section} value={activeSection.title} />
              <DetailKeyValueItem label={copy.detail.fields.key} value={selectedSetting.key} valueClassName="font-mono text-xs" />
              <DetailKeyValueItem
                label={copy.detail.fields.currentValue}
                value={formatSettingValue(selectedSettingCurrentValue)}
                valueClassName={selectedSetting.type === 'textarea' ? 'font-mono text-xs whitespace-pre-wrap' : undefined}
              />
              <DetailKeyValueItem
                label={copy.detail.fields.savedValue}
                value={formatSettingValue(selectedSetting.value)}
                valueClassName={selectedSetting.type === 'textarea' ? 'font-mono text-xs whitespace-pre-wrap' : undefined}
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="RULE"
              title={copy.detail.sections.behavior}
              description={zh ? '用于判断该配置项是否允许编辑，以及当前是否存在未同步改动。' : 'Shows whether the setting is editable and whether it has local unsynced changes.'}
            >
              <DetailKeyValueItem label={copy.detail.fields.type} value={selectedSetting.type} />
              <DetailKeyValueItem
                label={copy.detail.fields.status}
                value={
                  <Badge variant={Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key) ? 'warning' : 'success'}>
                    {Object.prototype.hasOwnProperty.call(editingValues, selectedSetting.key)
                      ? copy.detail.states.modified
                      : copy.detail.states.synced}
                  </Badge>
                }
              />
              <DetailKeyValueItem
                label={copy.detail.fields.editable}
                value={
                  <Badge variant={selectedSetting.editable ? 'info' : 'mono'}>
                    {selectedSetting.editable ? copy.detail.states.editable : copy.detail.states.locked}
                  </Badge>
                }
              />
              <DetailKeyValueItem
                label={copy.detail.fields.required}
                value={
                  <Badge variant={selectedSetting.required ? 'warning' : 'mono'}>
                    {selectedSetting.required ? copy.detail.states.required : copy.detail.states.optional}
                  </Badge>
                }
              />
              <DetailKeyValueItem
                label={copy.detail.fields.description}
                value={selectedSetting.description}
                className="md:col-span-2"
              />
            </DetailKeyValueSection>
          </div>
        </DetailDialogWrapper>
      ) : null}

      {modifiedSettingsInSection.length > 0 ? (
        <DetailDialogWrapper
          open={changesDialogOpen}
          onOpenChange={setChangesDialogOpen}
          title={copy.detail.sections.changes}
          description={
            zh
              ? `查看 ${activeSection.title} 分组下所有待同步配置差异。`
              : `Review all pending configuration changes in the ${activeSection.title} section.`
          }
          size="xl"
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '分组差异摘要' : 'Section Change Summary'}
              description={zh ? '帮助快速判断当前分组差异的处理顺序。' : 'Helps decide the handling order for current section changes.'}
            >
              <DetailKeyValueItem label={zh ? '当前结论' : 'Current Outcome'} value={<Badge variant="warning">{zh ? '待同步分组' : 'Pending Section'}</Badge>} hint={zh ? '当前分组存在未同步配置差异，建议优先查看前后值变化。' : 'This section has pending configuration changes. Review before/after values first.'} />
              <DetailKeyValueItem label={zh ? '待同步项' : 'Pending Items'} value={modifiedSettingsInSection.length} />
              <DetailKeyValueItem label={zh ? '下一步动作' : 'Next Action'} value={zh ? '先复制或导出差异摘要，再决定是否提交。' : 'Copy or export the change summary before deciding to submit.'} className="md:col-span-2" />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="CHANGES"
              title={activeSection.title}
              description={activeSection.description}
            >
              <DetailKeyValueItem label={zh ? '待同步项' : 'Pending'} value={modifiedSettingsInSection.length} />
              <DetailKeyValueItem label={zh ? '分组名称' : 'Section'} value={activeSection.title} />
              <DetailKeyValueItem
                label={zh ? '复制摘要' : 'Copy Summary'}
                value={
                  <Button type="button" variant="mono" size="pill" onClick={() => void handleCopyChanges()}>
                    {copy.actions.copyChanges}
                  </Button>
                }
              />
              <DetailKeyValueItem
                label={zh ? '导出摘要' : 'Export Summary'}
                value={
                  <Button type="button" variant="mono" size="pill" onClick={handleExportChanges}>
                    {copy.actions.exportChanges}
                  </Button>
                }
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="DETAIL"
              title={copy.detail.sections.changes}
              description={
                zh
                  ? '逐项查看当前分组的修改前后对比。'
                  : 'Review before/after values for each pending change.'
              }
            >
              {modifiedSettingsInSection.map((item) => (
                <DetailKeyValueItem
                  key={`dialog-${item.key}`}
                  label={item.label}
                  hint={item.key}
                  className="md:col-span-2"
                  value={
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                          {copy.detail.fields.before}
                        </div>
                        <div className="break-words font-mono text-xs text-slate-700">
                          {formatSettingValue(item.value)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                        <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                          {copy.detail.fields.after}
                        </div>
                        <div className="break-words font-mono text-xs text-slate-900">
                          {formatSettingValue(editingValues[item.key])}
                        </div>
                      </div>
                    </div>
                  }
                />
              ))}
            </DetailKeyValueSection>
          </div>
        </DetailDialogWrapper>
      ) : null}

      {sectionChanges.length > 0 ? (
        <DetailDialogWrapper
          open={allChangesDialogOpen}
          onOpenChange={setAllChangesDialogOpen}
          title={copy.actions.viewAllChanges}
          description={
            zh
              ? '集中查看所有配置分组中的待同步差异。'
              : 'Review pending changes across all configuration sections.'
          }
          size="xl"
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '全局差异摘要' : 'Global Change Summary'}
              description={zh ? '帮助快速判断当前所有分组改动的风险与范围。' : 'Helps assess the risk and scope of changes across all sections.'}
            >
              <DetailKeyValueItem label={zh ? '当前结论' : 'Current Outcome'} value={<Badge variant={changedItemCount >= 5 ? 'warning' : 'info'}>{changedItemCount >= 5 ? (zh ? '高密度改动' : 'High Density') : (zh ? '常规改动' : 'Routine Changes')}</Badge>} hint={zh ? '当前存在跨分组改动，建议优先核对重点分组。' : 'There are cross-section changes. Review the focus section first.'} />
              <DetailKeyValueItem label={zh ? '重点分组' : 'Focus Section'} value={mostChangedSection?.section.title || '-'} />
              <DetailKeyValueItem label={zh ? '下一步动作' : 'Next Action'} value={zh ? '先看重点分组，再决定是否立即同步全部改动。' : 'Review the focus section first, then decide whether to sync all changes.'} className="md:col-span-2" />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="OVERVIEW"
              title={zh ? '全局变更摘要' : 'Global Change Summary'}
              description={
                zh
                  ? '用于在提交前快速确认哪些分组存在配置变更。'
                  : 'Used to confirm which sections contain pending changes before saving.'
              }
            >
              <DetailKeyValueItem label={zh ? '变更分组' : 'Changed Sections'} value={sectionChanges.length} />
              <DetailKeyValueItem label={zh ? '待同步项' : 'Pending Items'} value={changedItemCount} />
              <DetailKeyValueItem label={zh ? '当前分组' : 'Current Section'} value={activeSection.title} />
              <DetailKeyValueItem
                label={zh ? '保存入口' : 'Save Action'}
                value={
                  <Button
                    type="button"
                    size="pill"
                    onClick={triggerSaveWithConfirm}
                    disabled={!isDirty || loading}
                  >
                    {copy.actions.syncNow}
                  </Button>
                }
              />
              <DetailKeyValueItem
                label={zh ? '摘要动作' : 'Summary Actions'}
                className="md:col-span-2"
                value={
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="mono" size="pill" onClick={() => void handleCopyAllChanges()}>
                      {copy.actions.copyChanges}
                    </Button>
                    <Button type="button" variant="mono" size="pill" onClick={handleExportAllChanges}>
                      {copy.actions.exportChanges}
                    </Button>
                  </div>
                }
              />
            </DetailKeyValueSection>

            {sectionChanges.map(({ sectionKey, section, changes }) => (
              <DetailKeyValueSection
                key={sectionKey}
                eyebrow="SECTION"
                title={section.title}
                description={section.description}
              >
                {changes.map((item) => (
                  <DetailKeyValueItem
                    key={`all-${item.key}`}
                    label={item.label}
                    hint={item.key}
                    className="md:col-span-2"
                    value={
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            {copy.detail.fields.before}
                          </div>
                          <div className="break-words font-mono text-xs text-slate-700">
                            {formatSettingValue(item.value)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                            {copy.detail.fields.after}
                          </div>
                          <div className="break-words font-mono text-xs text-slate-900">
                            {formatSettingValue(editingValues[item.key])}
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))}
              </DetailKeyValueSection>
            ))}
          </div>
        </DetailDialogWrapper>
      ) : null}

      {sectionChanges.length > 0 ? (
        <DetailDialogWrapper
          open={submitConfirmOpen}
          onOpenChange={setSubmitConfirmOpen}
          title={copy.submit.title}
          description={copy.submit.description}
          size="lg"
          footer={
            <div className="flex justify-end">
              <Button size="pill" onClick={handleConfirmedSave} disabled={!isDirty || loading}>
                {copy.submit.continueSubmit}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '提交前摘要' : 'Pre-submit Summary'}
              description={zh ? '帮助快速判断当前提交的优先级与风险。' : 'Helps assess the priority and risk of the current submission.'}
            >
              <DetailKeyValueItem label={zh ? '当前结论' : 'Current Outcome'} value={<Badge variant={changedItemCount >= 5 ? 'warning' : 'info'}>{changedItemCount >= 5 ? (zh ? '需重点复核' : 'Needs Review') : (zh ? '可继续提交' : 'Ready to Submit')}</Badge>} hint={zh ? '建议在提交前确认重点分组与关键配置项。' : 'Confirm the focus section and key settings before submitting.'} />
              <DetailKeyValueItem label={zh ? '重点分组' : 'Focus Section'} value={mostChangedSection?.section.title || '-'} />
              <DetailKeyValueItem label={zh ? '下一步动作' : 'Next Action'} value={zh ? '先查看重点分组明细，再执行同步。' : 'Review the focus section details first, then continue syncing.'} className="md:col-span-2" />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="SUBMIT"
              title={copy.submit.summaryTitle}
              description={copy.submit.description}
            >
              <DetailKeyValueItem label={copy.submit.affectedSections} value={sectionChanges.length} />
              <DetailKeyValueItem label={copy.submit.affectedItems} value={changedItemCount} />
              <DetailKeyValueItem label={copy.submit.currentSection} value={activeSection.title} />
              <DetailKeyValueItem
                label={zh ? '待同步键' : 'Pending Keys'}
                value={Object.keys(editingValues).join(', ')}
                className="md:col-span-2"
                valueClassName="font-mono text-xs"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={copy.submit.reviewTitle}
              description={copy.submit.reviewDescription}
            >
              <DetailKeyValueItem
                label={copy.submit.focusSection}
                value={
                  mostChangedSection ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">{getSectionChangeDensityLabel(mostChangedSection.changes.length)}</Badge>
                      <span>{mostChangedSection.section.title}</span>
                    </div>
                  ) : (
                    '-'
                  )
                }
                hint={
                  mostChangedSection
                    ? zh
                      ? `该分组当前有 ${mostChangedSection.changes.length} 项待同步变更。`
                      : `${mostChangedSection.changes.length} pending updates in this section.`
                    : undefined
                }
              />
              <DetailKeyValueItem
                label={copy.submit.reviewRisk}
                value={
                  <div className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>{changedItemCount >= 5 ? copy.submit.reviewRiskHigh : copy.submit.reviewRiskLow}</span>
                  </div>
                }
                hint={copy.submit.reviewHint}
              />
              <DetailKeyValueItem
                label={copy.submit.reviewAction}
                className="md:col-span-2"
                value={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => setAllChangesDialogOpen(true)}
                    >
                      {copy.actions.viewAllChanges}
                    </Button>
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => setChangesDialogOpen(true)}
                      disabled={modifiedSettingsInSection.length === 0}
                    >
                      {copy.actions.viewChanges}
                    </Button>
                  </div>
                }
              />
            </DetailKeyValueSection>

            {sectionChanges.map(({ sectionKey, section, changes }) => (
              <DetailKeyValueSection
                key={`submit-${sectionKey}`}
                eyebrow="SECTION"
                title={section.title}
                description={`${section.description} · ${changes.length} ${zh ? '项变更' : 'changes'}`}
              >
                {changes.map((item) => (
                  <DetailKeyValueItem
                    key={`submit-item-${item.key}`}
                    label={item.label}
                    hint={item.key}
                    value={
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                            {copy.detail.fields.before}
                          </div>
                          <div className="break-words font-mono text-xs text-slate-700">
                            {formatSettingValue(item.value)}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                            {copy.detail.fields.after}
                          </div>
                          <div className="break-words font-mono text-xs text-slate-900">
                            {formatSettingValue(editingValues[item.key])}
                          </div>
                        </div>
                      </div>
                    }
                    className="md:col-span-2"
                  />
                ))}
              </DetailKeyValueSection>
            ))}
          </div>
        </DetailDialogWrapper>
      ) : null}
    </div>
  );
}









