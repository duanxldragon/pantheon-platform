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
import { useCallback } from 'react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { Badge } from '../../../../../components/ui/badge';
import { ActionButtons } from '../../../../../shared/components/ui/action_buttons';
import type { Column } from '../../../../../shared/components/ui/enhanced_data_table';
import { EnhancedDataTable } from '../../../../../shared/components/ui/enhanced_data_table';
import { useLanguageStore } from '../../../../../stores/language_store';
import { getAuditResourceBadgeClass, isRefreshStrategy, isRevokeStrategy, parseAuditDetail } from '../utils/audit_meta';
import { getUnifiedLogManagementCopy } from '../unified_log_management_copy';

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
  const { language } = useLanguageStore();
  const dateLocale = language === 'zh' ? zhCN : enUS;
  const moduleCopy = getUnifiedLogManagementCopy(language);
  const copy = moduleCopy.table;
  const detailCopy = moduleCopy.detail;

  const getStatusBadge = useCallback((status: 'success' | 'failure') => {
    if (status === 'success') {
      return (
        <Badge className="gap-1 border border-emerald-100 bg-emerald-50 font-medium text-emerald-600 hover:bg-emerald-50">
          <CheckCircle2 className="w-3 h-3" />
          {copy.statusSuccess}
        </Badge>
      );
    }

    return (
      <Badge className="gap-1 border border-rose-100 bg-rose-50 font-medium text-rose-600 hover:bg-rose-50">
        <XCircle className="w-3 h-3" />
        {copy.statusFailed}
      </Badge>
    );
  }, [copy.statusFailed, copy.statusSuccess]);

  const columns = useMemo(() => {
    const base: Column<UnifiedLogItem>[] = [
      {
        key: 'user',
        label: copy.userColumnLabel,
        width: '220px',
        render: (log) => (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm ${
                log.kind === 'operation' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
              }`}
            >
              {log.kind === 'operation' ? <Shield className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-bold leading-tight text-slate-900">{log.username}</span>
              <span className="text-[11px] text-slate-400">
                {log.kind === 'operation' ? copy.operationTypeLabel : copy.loginTypeLabel}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'timestamp',
        label: copy.timeColumnLabel,
        width: '180px',
        render: (log) => {
          const timestamp = log.kind === 'operation' ? log.createdAt : log.loginAt;
          const value = new Date(timestamp);
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-sm text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {format(value, 'HH:mm:ss', { locale: dateLocale })}
              </div>
              <span className="ml-5 text-[11px] text-slate-400">
                {format(value, 'yyyy-MM-dd', { locale: dateLocale })}
              </span>
            </div>
          );
        },
      },
      {
        key: 'ip',
        label: copy.ipColumnLabel,
        width: '180px',
        render: (log) => (
          <div className="flex flex-col gap-1">
            <code className="w-fit rounded-full border border-slate-200/80 bg-slate-50/90 px-2.5 py-1 font-mono text-[11px] text-slate-600 shadow-sm shadow-slate-200/40">
              {log.ip}
            </code>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Globe className="w-3 h-3" />
              {log.location || '-'}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: copy.statusColumnLabel,
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
              label: copy.deviceBrowserColumnLabel,
              width: '220px',
              render: (log) => {
                if (log.kind !== 'login') {
                  return <span className="text-xs text-slate-300">-</span>;
                }
                const isMobile = /iphone|android|mobile/i.test(`${log.os} ${log.browser}`);
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                      {isMobile ? <Smartphone className="w-4 h-4 text-slate-400" /> : <Monitor className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-medium text-slate-700">{log.os || '-'}</span>
                      <span className="truncate text-[10px] text-slate-400">{log.browser || '-'}</span>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'feedback',
              label: copy.loginFeedbackLabel,
              width: '280px',
              render: (log) => {
                if (log.kind !== 'login') {
                  return <span className="text-xs text-slate-300">-</span>;
                }

                return (
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {log.message || (log.status === 'success' ? copy.statusSuccess : copy.statusFailed)}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/90 px-2 py-0.5 shadow-sm shadow-slate-200/30">
                        <Clock className="h-3 w-3" />
                        {copy.logoutLabel}:{' '}
                        {log.logoutAt ? format(new Date(log.logoutAt), 'HH:mm:ss', { locale: dateLocale }) : '-'}
                      </span>
                    </div>
                  </div>
                );
              },
            },
          ]
        : [
            {
              key: 'operation',
              label: copy.operationColumnLabel,
              width: '380px',
              render: (log) => {
                if (log.kind !== 'operation') {
                  return <span className="text-xs text-slate-300">-</span>;
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
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full border border-slate-200/80 bg-slate-50/90 font-normal text-slate-600 shadow-sm shadow-slate-200/40">
                        {log.module}
                      </Badge>
                      <span className="truncate text-sm font-semibold text-slate-800">{title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <Badge className={`rounded-full font-mono text-[10px] shadow-sm ${methodColor[log.method] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {log.method}
                      </Badge>
                      <Badge variant="outline" className={`rounded-full shadow-sm ${resourceBadgeClass}`}>
                        <Tag className="w-3 h-3 mr-1" />
                        {log.resource || '-'}
                      </Badge>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600">{resourceName}</span>
                      <span className="font-mono text-slate-400">{log.duration}ms</span>
                      {log.errorMsg ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-600">
                          <AlertCircle className="w-3 h-3" />
                          {copy.errorLabel}
                        </span>
                      ) : null}
                    </div>
                    {affectedUsers || affectedRoles || refreshStrategy || sessionStrategy ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {affectedUsers ? (
                          <Badge variant="outline" className="rounded-full border-blue-100 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/40">
                            {detailCopy.impact.users(affectedUsers)}
                          </Badge>
                        ) : null}
                        {affectedRoles ? (
                          <Badge variant="outline" className="rounded-full border-purple-100 bg-purple-50 text-purple-700 shadow-sm shadow-purple-100/40">
                            {detailCopy.impact.roles(affectedRoles)}
                          </Badge>
                        ) : null}
                        {isRefreshStrategy(refreshStrategy) ? (
                          <Badge variant="outline" className="rounded-full border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/40">
                            {detailCopy.impact.authRefresh}
                          </Badge>
                        ) : null}
                        {isRevokeStrategy(sessionStrategy) ? (
                          <Badge variant="outline" className="rounded-full border-amber-100 bg-amber-50 text-amber-700 shadow-sm shadow-amber-100/40">
                            {detailCopy.impact.sessionRevoke}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              },
            },
            {
              key: 'target',
              label: copy.targetColumnLabel,
              width: '240px',
              render: (log) => {
                if (log.kind !== 'operation') {
                  return <span className="text-xs text-slate-300">-</span>;
                }

                return (
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {log.resourceName || log.resource || '-'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/90 px-2 py-0.5 font-mono shadow-sm shadow-slate-200/30">
                        <Tag className="h-3 w-3" />
                        {log.resourceId || '-'}
                      </span>
                      <span className="truncate font-mono">{log.requestUrl || '-'}</span>
                    </div>
                  </div>
                );
              },
            },
          ];

    const actions: Column<UnifiedLogItem> = {
      key: 'actions',
      label: copy.actionColumnLabel,
      width: '100px',
      align: 'right',
      render: (log) => (
        <ActionButtons
          actions={[
            {
              icon: <Eye className="w-4 h-4 text-blue-500" />,
              label: copy.detailActionLabel,
              onClick: () => onViewDetail(log),
            },
          ]}
        />
      ),
    };

    return [...base, ...typeCols, actions];
  }, [
    activeTab,
    copy.actionColumnLabel,
    copy.detailActionLabel,
    copy.deviceBrowserColumnLabel,
    copy.errorLabel,
    copy.ipColumnLabel,
    copy.loginFeedbackLabel,
    copy.loginTypeLabel,
    copy.logoutLabel,
    copy.operationColumnLabel,
    copy.operationTypeLabel,
    copy.statusColumnLabel,
    copy.statusFailed,
    copy.statusSuccess,
    copy.targetColumnLabel,
    copy.timeColumnLabel,
    copy.userColumnLabel,
    dateLocale,
    detailCopy.impact,
    getStatusBadge,
    onViewDetail,
  ]);

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









