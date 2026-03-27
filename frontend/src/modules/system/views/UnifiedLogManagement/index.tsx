import { useState } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';

import { LogDetailDrawer } from './components/LogDetailDrawer';
import { LogFilters } from './components/LogFilters';
import { LogStatsCards } from './components/LogStatsCards';
import { LogTable, type UnifiedLogItem } from './components/LogTable';
import { useLogManagement } from './hooks/useLogManagement';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

export function UnifiedLogManagement() {
  const { t } = useLanguageStore();
  const zh = t.language === 'zh';
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
      detail: zh ? '日志详情' : 'log detail',
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
    if (!ensureActionPermission(canClearLogs, zh ? '清空日志' : 'clear logs')) return;
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
    if (!ensureActionPermission(canExportLogs, zh ? '导出' : 'export')) return;
    try {
      // Convert logs to CSV format
      const headers =
        activeTab === 'login'
          ? [
              zh ? '用户名' : 'Username',
              zh ? 'IP 地址' : 'IP',
              zh ? '位置' : 'Location',
              zh ? '浏览器' : 'Browser',
              zh ? '操作系统' : 'OS',
              zh ? '状态' : 'Status',
              zh ? '消息' : 'Message',
              zh ? '登录时间' : 'Login Time',
            ]
        : [
              zh ? '用户名' : 'Username',
              zh ? '模块' : 'Module',
              zh ? '资源' : 'Resource',
              zh ? '资源 ID' : 'Resource ID',
              zh ? '操作摘要' : 'Summary',
              zh ? '请求方法' : 'Method',
              zh ? '请求 URL' : 'Request URL',
              zh ? 'IP 地址' : 'IP',
              zh ? '位置' : 'Location',
              zh ? '状态' : 'Status',
              zh ? '耗时(ms)' : 'Duration',
              zh ? '错误信息' : 'Error Message',
              zh ? '创建时间' : 'Created At',
            ];

      const rows = items.map(item => {
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

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(logMessages.exportSuccess);
    } catch (error: any) {
      toast.error(error?.message || logMessages.exportFailed);
    }
  };

  const handleImport = () => {
    // Log import is not supported
    toast.info(t.systemManagement.logs.importNotSupported);
  };

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
          <LogStatsCards stats={stats} loading={loading} />

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
            selectedCount={selectedLogs.length}
            onBatchDelete={handleClearLogs}
            onImport={handleImport}
            onExport={handleExport}
            canBatchDelete={canClearLogs}
            canExport={canExportLogs}
          />

          <Card className="border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-xl">
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


