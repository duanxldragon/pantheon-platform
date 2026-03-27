import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  Monitor,
  Shield,
  Smartphone,
  Tag,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { Badge } from '../../../../../components/ui/badge';
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import type { Column } from '../../../../../shared/components/ui/EnhancedDataTable';
import { EnhancedDataTable } from '../../../../../shared/components/ui/EnhancedDataTable';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { getAuditResourceBadgeClass, isRefreshStrategy, isRevokeStrategy, parseAuditDetail } from '../utils/auditMeta';

export type UnifiedLogItem =
  | {
      kind: 'login';
      id: string;
      username: string;
      ip: string;
      location: string;
      status: 'success' | 'failure';
      loginAt: string;
      logoutAt?: string;
      browser: string;
      os: string;
      message?: string;
    }
  | {
      kind: 'operation';
      id: string;
      username: string;
      ip: string;
      location: string;
      status: 'success' | 'failure';
      createdAt: string;
      module: string;
      resource?: string;
      resourceId?: string;
      resourceName?: string;
      operation: string;
      summary?: string;
      detail?: string;
      method: string;
      requestUrl: string;
      requestBody?: string;
      responseBody?: string;
      duration: number;
      errorMsg?: string;
    };

type LogTab = 'login' | 'operation';

interface LogTableProps {
  activeTab: LogTab;
  data: UnifiedLogItem[];
  loading?: boolean;
  selectedItems: UnifiedLogItem[];
  onSelectionChange: (items: UnifiedLogItem[]) => void;
  onViewDetail: (log: UnifiedLogItem) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

export const LogTable: React.FC<LogTableProps> = ({
  activeTab,
  data,
  loading,
  selectedItems,
  onSelectionChange,
  onViewDetail,
  pagination,
}) => {
  const { t, language } = useLanguageStore();
  const dateLocale = language === 'zh' ? zhCN : enUS;

  const getStatusBadge = (status: 'success' | 'failure') => {
    if (status === 'success') {
      return (
        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 gap-1 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          {t.modules.deploy.status.success}
        </Badge>
      );
    }

    return (
      <Badge className="bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-50 gap-1 font-medium">
        <XCircle className="w-3 h-3" />
        {t.modules.deploy.status.failed}
      </Badge>
    );
  };

  const columns = useMemo(() => {
    const base: Column<UnifiedLogItem>[] = [
      {
        key: 'user',
        label: t.systemManagement.logs.columns.user,
        width: '220px',
        render: (log) => (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                log.kind === 'operation' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {log.kind === 'operation' ? <Shield className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-gray-900 leading-tight truncate">{log.username}</span>
              <span className="text-[11px] text-gray-400">
                {log.kind === 'operation' ? t.systemManagement.logs.tabOperation : t.systemManagement.logs.tabLogin}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'timestamp',
        label: t.systemManagement.logs.columns.time,
        width: '180px',
        render: (log) => {
          const timestamp = log.kind === 'operation' ? log.createdAt : log.loginAt;
          const value = new Date(timestamp);
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {format(value, 'HH:mm:ss', { locale: dateLocale })}
              </div>
              <span className="text-[11px] text-gray-400 ml-5">{format(value, 'yyyy-MM-dd', { locale: dateLocale })}</span>
            </div>
          );
        },
      },
      {
        key: 'ip',
        label: t.systemManagement.logs.columns.ip,
        width: '180px',
        render: (log) => (
          <div className="flex flex-col gap-1">
            <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-100 w-fit font-mono">
              {log.ip}
            </code>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Globe className="w-3 h-3" />
              {log.location || '-'}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: t.systemManagement.logs.columns.status,
        width: '110px',
        align: 'center',
        render: (log) => getStatusBadge(log.status),
      },
    ];

    const typeCols: Column<UnifiedLogItem>[] =
      activeTab === 'login'
        ? [
            {
              key: 'device',
              label: t.systemManagement.logs.deviceBrowser,
              width: '220px',
              render: (log) => {
                if (log.kind !== 'login') {
                  return <span className="text-gray-300 text-xs">-</span>;
                }
                const isMobile = /iphone|android|mobile/i.test(`${log.os} ${log.browser}`);
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg border border-gray-100">
                      {isMobile ? <Smartphone className="w-4 h-4 text-gray-400" /> : <Monitor className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-gray-700 truncate">{log.os || '-'}</span>
                      <span className="text-[10px] text-gray-400 truncate">{log.browser || '-'}</span>
                    </div>
                  </div>
                );
              },
            },
          ]
        : [
            {
              key: 'operation',
              label: t.systemManagement.logs.columns.operation,
              width: '380px',
              render: (log) => {
                if (log.kind !== 'operation') {
                  return <span className="text-gray-300 text-xs">-</span>;
                }

                const methodColor: Record<string, string> = {
                  GET: 'bg-blue-50 text-blue-600 border-blue-100',
                  POST: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                  PUT: 'bg-amber-50 text-amber-600 border-amber-100',
                  PATCH: 'bg-violet-50 text-violet-600 border-violet-100',
                  DELETE: 'bg-rose-50 text-rose-600 border-rose-100',
                };

                const title = log.summary || log.operation;
                const resourceName = log.resourceName || log.resource || '-';
                const detailMap = parseAuditDetail(log.detail);
                const affectedUsers = detailMap.affected_users;
                const affectedRoles = detailMap.affected_roles;
                const refreshStrategy = detailMap.refresh_strategy;
                const sessionStrategy = detailMap.session_strategy;
                const resourceBadgeClass = getAuditResourceBadgeClass(log.resource);

                return (
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Badge variant="outline" className="bg-gray-50/50 font-normal text-gray-600 border-gray-100">
                        {log.module}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-800 truncate">{title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
                      <Badge className={`font-mono text-[10px] ${methodColor[log.method] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                        {log.method}
                      </Badge>
                      <Badge variant="outline" className={resourceBadgeClass}>
                        <Tag className="w-3 h-3 mr-1" />
                        {log.resource || '-'}
                      </Badge>
                      <span className="inline-flex items-center gap-1 font-medium text-gray-600">{resourceName}</span>
                      <span className="font-mono text-gray-400">{log.duration}ms</span>
                      {log.errorMsg ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-600">
                          <AlertCircle className="w-3 h-3" />
                          {t.systemManagement.logs.columns.error}
                        </span>
                      ) : null}
                    </div>
                    {affectedUsers || affectedRoles || refreshStrategy || sessionStrategy ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {affectedUsers ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                            {t.systemManagement.logs.impact.users.replace('{count}', affectedUsers)}
                          </Badge>
                        ) : null}
                        {affectedRoles ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">
                            {t.systemManagement.logs.impact.roles.replace('{count}', affectedRoles)}
                          </Badge>
                        ) : null}
                        {isRefreshStrategy(refreshStrategy) ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                            {t.systemManagement.logs.impact.authRefresh}
                          </Badge>
                        ) : null}
                        {isRevokeStrategy(sessionStrategy) ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">
                            {t.systemManagement.logs.impact.sessionRevoke}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              },
            },
          ];

    const actions: Column<UnifiedLogItem> = {
      key: 'actions',
      label: t.common.actions,
      width: '100px',
      align: 'right',
      render: (log) => (
        <ActionButtons
          actions={[
            {
              icon: <Eye className="w-4 h-4 text-blue-500" />,
              label: t.systemManagement.logs.actions.detail,
              onClick: () => onViewDetail(log),
            },
          ]}
        />
      ),
    };

    return [...base, ...typeCols, actions];
  }, [activeTab, dateLocale, onViewDetail, t]);

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      rowKey={(log) => log.id}
      loading={loading}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        onPageChange: pagination.onPageChange,
        pageSize: pagination.pageSize,
      }}
      className="border-none shadow-none"
    />
  );
};
