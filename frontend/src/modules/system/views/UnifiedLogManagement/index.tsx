import { useState } from 'react';
import { toast } from 'sonner';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Badge } from '../../../../components/ui/badge';
import { Card } from '../../../../components/ui/card';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
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

export function UnifiedLogManagement() {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = {
    detail: zh ? '日志详情' : 'log detail',
    clearLogs: zh ? '清空日志' : 'clear logs',
    export: zh ? '导出' : 'export',
    tabSummaryTitle: zh ? '当前视图' : 'Current View',
    tabLoginLogs: zh ? '登录日志' : 'Login Logs',
    tabOperationLogs: zh ? '操作日志' : 'Operation Logs',
    clearHint: zh ? '仅操作日志支持清空。' : 'Only operation logs can be cleared.',
    exportHint: zh ? '导出会按当前页签和筛选条件生成文件。' : 'Export respects the current tab and filters.',
    totalLabel: zh ? '总数' : 'Total',
    loginHeaders: zh
      ? ['用户名', 'IP 地址', '位置', '浏览器', '操作系统', '状态', '消息', '登录时间']
      : ['Username', 'IP', 'Location', 'Browser', 'OS', 'Status', 'Message', 'Login Time'],
    operationHeaders: zh
      ? ['用户名', '模块', '资源', '资源 ID', '操作摘要', '请求方法', '请求 URL', 'IP 地址', '位置', '状态', '耗时(ms)', '错误信息', '创建时间']
      : ['Username', 'Module', 'Resource', 'Resource ID', 'Summary', 'Method', 'Request URL', 'IP', 'Location', 'Status', 'Duration', 'Error Message', 'Created At'],
  };
  const logMessages = createEntityFeedback(zh, { zh: '日志', en: 'Log', enPlural: 'logs' });
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
    pageTitle: t.systemManagement.logs.title,
    dialogs: { detail: isDetailOpen },
    protectedDialogs: {
      detail: copy.detail,
    },
    closeDialogs: () => {
      setIsDetailOpen(false);
      setSelectedLog(null);
    },
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t.systemManagement.logs.title,
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
    if (!ensureActionPermission(canClearLogs, copy.clearLogs)) return;
    if (activeTab !== 'operation') {
      toast.info(t.systemManagement.logs.onlyOperationCanClear);
      return;
    }

    await clearOperationLogs();
    toast.success(t.systemManagement.logs.cleared);
    setSelectedLogs([]);
    refresh();
  };

  const handleExport = () => {
    if (!ensureActionPermission(canExportLogs, copy.export)) return;
    try {
      const headers = activeTab === 'login' ? copy.loginHeaders : copy.operationHeaders;
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
    } catch (error: any) {
      toast.error(error?.message || logMessages.exportFailed);
    }
  };

  const activeTabLabel = activeTab === 'login' ? copy.tabLoginLogs : copy.tabOperationLogs;
  const tabHint = activeTab === 'operation' ? copy.clearHint : copy.exportHint;

  return (
    <PageLayout title={t.systemManagement.logs.title} description={t.systemManagement.logs.description}>
      {!canQueryLogs ? (
        <QueryAccessBoundary
          viewId="system-logs"
          title={t.systemManagement.logs.title}
          queryPermission={systemPermissions.logs.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
          <LogStatsCards activeTab={activeTab} stats={stats} loading={loading} />

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-200/70 bg-white/88 px-4 py-3 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">{copy.tabSummaryTitle}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{activeTabLabel}</span>
                <Badge variant="outline" className="rounded-full border-slate-200/80 bg-slate-50/90 text-slate-600 shadow-sm shadow-slate-200/30">
                  {copy.totalLabel}: {loading ? '--' : stats.total.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="rounded-full border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/30">
                  {t.modules.deploy.status.success}: {loading ? '--' : stats.success.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="rounded-full border-rose-100 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/30">
                  {t.modules.deploy.status.failed}: {loading ? '--' : stats.failed.toLocaleString()}
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

          <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
          </Card>

          <LogDetailDrawer log={selectedLog} open={isDetailOpen} onOpenChange={setIsDetailOpen} />
        </>
      )}
    </PageLayout>
  );
}
