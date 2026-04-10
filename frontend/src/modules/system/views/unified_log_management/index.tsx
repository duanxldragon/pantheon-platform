import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../../../../components/ui/badge';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementFocusCard,
  ManagementMetricCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/use_query_permission_dialog_guard';
import { useLanguageStore } from '../../../../stores/language_store';
import { useAuthStore } from '../../../auth/store/auth_store';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { LogDetailDrawer } from './components/log_detail_drawer';
import { LogFilters } from './components/log_filters';
import { LogStatsCards } from './components/log_stats_cards';
import { LogTable, type UnifiedLogItem } from './components/log_table';
import { useLogManagement } from './hooks/use_log_management';
import { getUnifiedLogManagementCopy } from './unified_log_management_copy';

export function UnifiedLogManagement() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getUnifiedLogManagementCopy(language);
  const logMessages = createEntityFeedback(zh, copy.entity);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryLogs = hasPermission(systemPermissions.logs.query);
  const canClearLogs = hasPermission(systemPermissions.logs.clear);
  const canExportLogs = hasPermission(systemPermissions.logs.export);

  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedLogs,
    setSelectedLogs,
    page,
    setPage,
    pageSize,
    totalPages,
    items,
    stats,
    loading,
    refresh,
    clearOperationLogs,
  } = useLogManagement(canQueryLogs);

  const [selectedLog, setSelectedLog] = useState<UnifiedLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { lossDescription: queryLossDescription } = useQueryPermissionDialogGuard({
    canQuery: canQueryLogs,
    pageTitle: copy.page.title,
    dialogs: { detail: isDetailOpen },
    protectedDialogs: {
      detail: copy.index.detail,
    },
    closeDialogs: () => {
      setIsDetailOpen(false);
      setSelectedLog(null);
    },
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs: { detail: isDetailOpen },
    guardedDialogs: {},
    closeDialogs: () => undefined,
  });

  const handleViewDetail = (log: UnifiedLogItem) => {
    if (!canQueryLogs) {
      return;
    }
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleClearLogs = async () => {
    if (!ensureActionPermission(canClearLogs, copy.index.clearLogs)) return;
    if (activeTab !== 'operation') {
      toast.info(copy.index.onlyOperationCanClear);
      return;
    }

    await clearOperationLogs();
    toast.success(copy.index.cleared);
    setSelectedLogs([]);
    refresh();
  };

  const handleExport = () => {
    if (!ensureActionPermission(canExportLogs, copy.index.export)) return;
    try {
      const exportItems = selectedLogs.length > 0 ? selectedLogs : items;
      const headers = activeTab === 'login' ? copy.index.loginHeaders : copy.index.operationHeaders;
      const rows = exportItems.map((item) => {
        if (item.kind === 'login') {
          return [
            item.username,
            item.ip,
            item.location,
            item.browser || '',
            item.os || '',
            item.status,
            item.message || '',
            item.loginAt || '',
          ];
        }

        return [
          item.username,
          item.module || '',
          item.resourceName || item.resource || '',
          item.resourceId || '',
          item.summary || item.operation || '',
          item.method || '',
          item.requestUrl || '',
          item.ip,
          item.location,
          item.status,
          item.duration?.toString() || '',
          item.errorMsg || '',
          item.createdAt || '',
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeTab}-logs-${selectedLogs.length > 0 ? 'selected' : 'filtered'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(logMessages.exportSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : logMessages.exportFailed);
    }
  };

  useEffect(() => {
    const itemMap = new Map(items.map((item) => [`${item.kind}:${item.id}`, item] as const));

    setSelectedLogs((current) => {
      const next = current
        .map((item) => itemMap.get(`${item.kind}:${item.id}`))
        .filter((item): item is UnifiedLogItem => Boolean(item));

      return next.length === current.length && next.every((item, index) => item === current[index])
        ? current
        : next;
    });

    if (!selectedLog) {
      return;
    }

    const nextSelectedLog = itemMap.get(`${selectedLog.kind}:${selectedLog.id}`) ?? null;
    if (!nextSelectedLog) {
      setSelectedLog(null);
      setIsDetailOpen(false);
      return;
    }

    if (nextSelectedLog !== selectedLog) {
      setSelectedLog(nextSelectedLog);
    }
  }, [items, selectedLog, setSelectedLogs]);

  const activeTabLabel =
    activeTab === 'login' ? copy.index.tabLoginLogs : copy.index.tabOperationLogs;
  const tabHint = activeTab === 'operation' ? copy.index.clearHint : copy.index.exportHint;
  const logReview =
    stats.failed > 0
      ? {
          variant: 'warning' as const,
          label: zh ? '优先处理失败日志' : 'Prioritize failed logs',
          hint: zh
            ? '当前存在失败记录，建议先从失败状态、目标资源和详细说明开始排查。'
            : 'Failures exist. Start with status, target resource, and detail notes.',
          nextAction: zh
            ? '先切到失败记录，再查看详情抽屉中的差异与原始报文。'
            : 'Filter failed records first, then inspect diffs and raw payloads in detail view.',
          focus: zh ? '失败状态、资源对象、错误说明' : 'Failure status, target resource, error notes',
        }
      : searchTerm.trim()
        ? {
            variant: 'info' as const,
            label: zh ? '当前聚焦筛选结果' : 'Focused on filtered results',
            hint: zh
              ? '当前列表受搜索条件影响，适合继续核对用户、模块和请求路径。'
              : 'The list is filtered. Continue reviewing users, modules, and request paths.',
            nextAction: zh
              ? '先完成当前筛选核对，再恢复全量巡检。'
              : 'Finish the current filtered review, then return to the full inspection flow.',
            focus: zh ? '搜索命中项、模块分布、请求路径' : 'Search hits, module distribution, request paths',
          }
        : {
            variant: 'success' as const,
            label: zh ? '当前日志流稳定' : 'Current log flow looks stable',
            hint: zh
              ? '当前没有明显失败堆积，可按登录 / 操作分栏做常规巡检。'
              : 'No obvious failure backlog. Continue with routine login/operation inspection.',
            nextAction: zh
              ? '先看统计卡，再抽查最近详情记录。'
              : 'Review stat cards first, then sample recent detail records.',
            focus: zh ? '成功率、模块热点、最近活动' : 'Success rate, module hotspots, recent activity',
          };
  const logPriorities = [
    stats.failed > 0
      ? {
          id: 'failed',
          title: zh ? '失败记录' : 'Failed Records',
          detail: zh ? '优先查看失败状态、异常说明与受影响资源。' : 'Review failed status, error notes, and affected resources first.',
        }
      : null,
    activeTab === 'operation'
      ? {
          id: 'operation',
          title: zh ? '操作日志' : 'Operation Logs',
          detail: zh ? '适合核对高风险变更、请求路径与资源对象。' : 'Best for high-risk changes, request paths, and resources.',
        }
      : {
          id: 'login',
          title: zh ? '登录日志' : 'Login Logs',
          detail: zh ? '适合核对登录异常、IP 与设备环境。' : 'Best for login anomalies, IPs, and device environments.',
        },
    canExportLogs
      ? {
          id: 'export',
          title: zh ? '导出留档' : 'Export Snapshot',
          detail: zh ? '核对完成后可导出当前结果用于留档或协作。' : 'Export the current result set after review for archival or collaboration.',
        }
      : null,
  ].filter((item): item is { id: string; title: string; detail: string } => Boolean(item));

  return (
    <div className="space-y-6">
      {canQueryLogs ? (
        <ManagementPageHeader
          eyebrow="SYSTEM"
          title={copy.page.title}
          description={copy.page.description}
          meta={
            <>
              <Badge variant="mono">Logs</Badge>
              <Badge variant="info">{activeTabLabel}</Badge>
              <Badge variant={stats.failed > 0 ? 'warning' : 'success'}>
                {copy.index.statusFailed}: {loading ? '--' : stats.failed.toLocaleString()}
              </Badge>
            </>
          }
          actions={
            canClearLogs && activeTab === 'operation' ? (
              <Badge variant="warning" className="h-11 rounded-full px-4 text-xs font-medium">
                {copy.index.clearHint}
              </Badge>
            ) : undefined
          }
        />
      ) : null}
      {!canQueryLogs ? (
        <QueryAccessBoundary
          viewId="system-logs"
          title={copy.page.title}
          queryPermission={systemPermissions.logs.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
          <LogStatsCards activeTab={activeTab} stats={stats} loading={loading} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ManagementMetricCard
              label={zh ? '当前分栏' : 'Current Tab'}
              value={activeTabLabel}
              hint={tabHint}
            />
            <ManagementMetricCard
              label={copy.index.totalLabel}
              value={loading ? '--' : stats.total.toLocaleString()}
              hint={zh ? '当前筛选条件下的日志总量。' : 'Total log count under the current filter.'}
            />
            <ManagementMetricCard
              label={copy.index.statusSuccess}
              value={loading ? '--' : stats.success.toLocaleString()}
              hint={zh ? '用于判断当前主流程是否稳定。' : 'Helps judge whether the main flow stays stable.'}
            />
            <ManagementMetricCard
              label={copy.index.statusFailed}
              value={loading ? '--' : stats.failed.toLocaleString()}
              hint={
                stats.failed > 0
                  ? zh
                    ? '存在失败记录，建议优先查看。'
                    : 'Failures exist and should be reviewed first.'
                  : zh
                    ? '当前没有失败堆积。'
                    : 'No failure backlog is currently visible.'
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ManagementFocusCard
              icon={stats.failed > 0 ? AlertTriangle : CheckCircle2}
              eyebrow="REVIEW"
              title={zh ? '日志审阅结论' : 'Log Review'}
              value={logReview.label}
              hint={logReview.hint}
              badge={<Badge variant={logReview.variant}>{logReview.focus}</Badge>}
              action={
                <div className="text-xs leading-5 text-slate-500">
                  {logReview.nextAction}
                </div>
              }
            />
            <ManagementFocusCard
              icon={Zap}
              eyebrow="PRIORITY"
              title={zh ? '本次查看顺序' : 'Suggested Reading Order'}
              value={logPriorities[0]?.title ?? (zh ? '当前无优先事项' : 'No priority item right now')}
              hint={logPriorities[0]?.detail ?? (zh ? '当前可继续常规巡检。' : 'Continue with routine inspection now.')}
              badge={
                logPriorities[0] ? (
                  <Badge variant={stats.failed > 0 ? 'warning' : 'mono'}>{`01`}</Badge>
                ) : (
                  <Badge variant="success">{zh ? '稳定' : 'Stable'}</Badge>
                )
              }
              action={
                logPriorities.length > 1 ? (
                  <div className="text-xs leading-5 text-slate-500">
                    {zh ? `后续还可继续查看 ${logPriorities.length - 1} 个重点。` : `${logPriorities.length - 1} more focus items remain after this.`}
                  </div>
                ) : undefined
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <ManagementContentCard className="p-6">
              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '日志审阅结论' : 'Log Review'}
                description={
                  zh
                    ? '先决定本次应聚焦失败、筛选结果还是常规巡检。'
                    : 'Decide whether this review should focus on failures, filtered results, or routine inspection.'
                }
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Outcome'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={logReview.variant}>{logReview.label}</Badge>
                      <span>{logReview.hint}</span>
                    </div>
                  }
                />
                <DetailKeyValueItem label={zh ? '下一步动作' : 'Next Action'} value={logReview.nextAction} />
                <DetailKeyValueItem label={zh ? '检查焦点' : 'Focus'} value={logReview.focus} />
                <DetailKeyValueItem
                  label={zh ? '当前分栏' : 'Current Tab'}
                  value={activeTabLabel}
                  hint={tabHint}
                />
                <DetailKeyValueItem
                  label={zh ? '已选记录' : 'Selected Logs'}
                  value={selectedLogs.length}
                />
              </DetailKeyValueSection>
            </ManagementContentCard>

            <ManagementContentCard className="p-6">
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                    {zh ? 'PRIORITY' : 'PRIORITY'}
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-900">
                    {zh ? '本次查看顺序' : 'Suggested Reading Order'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {zh ? '按风险和当前分栏，优先查看这些内容。' : 'Based on risk and the current tab, review these items first.'}
                  </div>
                </div>
                {logPriorities.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'warning' : 'mono'}>{`0${index + 1}`}</Badge>
                      <div className="font-medium text-slate-900">{item.title}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{item.detail}</div>
                  </div>
                ))}
              </div>
            </ManagementContentCard>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-200/70 bg-white/88 px-4 py-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                {copy.index.tabSummaryTitle}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{activeTabLabel}</span>
                <Badge variant="outline" className="rounded-full border-slate-200/80 bg-slate-50/90 text-slate-600 shadow-sm shadow-slate-200/30">
                  {copy.index.totalLabel}: {loading ? '--' : stats.total.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="rounded-full border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/30">
                  {copy.index.statusSuccess}: {loading ? '--' : stats.success.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="rounded-full border-rose-100 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/30">
                  {copy.index.statusFailed}: {loading ? '--' : stats.failed.toLocaleString()}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-slate-500">{tabHint}</div>
          </div>

          <LogFilters
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSelectedLogs([]);
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onClearLogs={handleClearLogs}
            onExport={handleExport}
            canClearLogs={canClearLogs}
            canImport={false}
            canExport={canExportLogs}
          />

          <ManagementContentCard>
            <LogTable
              activeTab={activeTab}
              data={items}
              loading={loading}
              selectedItems={selectedLogs}
              onSelectionChange={setSelectedLogs}
              onViewDetail={handleViewDetail}
              pagination={{
                currentPage: page,
                totalPages,
                pageSize,
                onPageChange: setPage,
              }}
            />
          </ManagementContentCard>

          <LogDetailDrawer log={selectedLog} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
        </>
      )}
    </div>
  );
}









