import { useEffect, useRef, useState } from 'react';

import { logApi } from '../../../api/log_api';
import type { LoginLog, OperationLog } from '../../../types';

import type { UnifiedLogItem } from '../components/log_table';

type LogTab = 'login' | 'operation';
type StatusFilter = 'all' | 'success' | 'failure';

function normalizeOperation(log: OperationLog): UnifiedLogItem {
  return {
    kind: 'operation',
    id: String(log.id),
    username: log.username,
    ip: log.ip,
    location: log.location,
    status: log.status,
    createdAt: log.createdAt,
    module: log.module,
    resource: log.resource,
    resourceId: log.resourceId,
    resourceName: log.resourceName,
    operation: log.operation,
    summary: log.summary,
    detail: log.detail,
    method: log.method,
    requestUrl: log.requestUrl,
    requestBody: log.requestParams,
    responseBody: log.responseBody,
    duration: log.duration,
    errorMsg: log.errorMsg,
  };
}

function normalizeLogin(log: LoginLog): UnifiedLogItem {
  return {
    kind: 'login',
    id: String(log.id),
    username: log.username,
    ip: log.ip,
    location: log.location,
    status: log.status,
    loginAt: log.loginAt,
    logoutAt: log.logoutAt,
    browser: log.browser,
    os: log.os,
    message: log.message,
  };
}

export function useLogManagement(enabled = true) {
  const [activeTab, setActiveTab] = useState<LogTab>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedLogs, setSelectedLogs] = useState<UnifiedLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UnifiedLogItem[]>([]);
  const [total, setTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleTabChange = (tab: LogTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('all');
  };

  const refresh = async () => {
    if (!enabled) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const apiStatus = statusFilter === 'all' ? undefined : statusFilter;

      if (activeTab === 'operation') {
        const resp = await logApi.getOperationLogs({
          page,
          pageSize,
          username: debouncedSearch || undefined,
          status: apiStatus,
        });
        setItems((resp.items || []).map(normalizeOperation));
        setTotal(resp.total ?? resp.items.length);
        return;
      }

      const resp = await logApi.getLoginLogs({
        page,
        pageSize,
        username: debouncedSearch || undefined,
        status: apiStatus,
      });
      setItems((resp.items || []).map(normalizeLogin));
      setTotal(resp.total ?? resp.items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, pageSize, debouncedSearch, statusFilter, enabled]);

  const stats = {
    total,
    success:
      statusFilter === 'success'
        ? total
        : statusFilter === 'failure'
          ? 0
          : items.filter((item) => item.status === 'success').length,
    failed:
      statusFilter === 'failure'
        ? total
        : statusFilter === 'success'
          ? 0
          : items.filter((item) => item.status === 'failure').length,
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const clearOperationLogs = async () => {
    await logApi.clearOperationLogs();
  };

  return {
    activeTab,
    setActiveTab: handleTabChange,
    searchTerm,
    setSearchTerm: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusChange,
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
  };
}




