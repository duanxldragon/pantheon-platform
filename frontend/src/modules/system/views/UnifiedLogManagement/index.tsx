import { useState } from 'react';
import { toast } from 'sonner';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Badge } from '../../../../components/ui/badge';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { ManagementContentCard } from '../../../../shared/components/ui';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { LogDetailDrawer } from './components/LogDetailDrawer';
import { LogFilters } from './components/LogFilters';
import { LogStatsCards } from './components/LogStatsCards';
import { LogTable, type UnifiedLogItem } from './components/LogTable';
import { useLogManagement } from './hooks/useLogManagement';
import { getUnifiedLogManagementCopy } from './unifiedLogManagementCopy';

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
      const headers = activeTab === 'login' ? copy.index.loginHeaders : copy.index.operationHeaders;
      const rows = items.map((item) => {
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
      link.download = `${activeTab}-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(logMessages.exportSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : logMessages.exportFailed);
    }
  };

  const activeTabLabel =
    activeTab === 'login' ? copy.index.tabLoginLogs : copy.index.tabOperationLogs;
  const tabHint = activeTab === 'operation' ? copy.index.clearHint : copy.index.exportHint;

  return (
    <PageLayout title={copy.page.title} description={copy.page.description}>
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
    </PageLayout>
  );
}
