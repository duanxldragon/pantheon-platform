import { useCallback, useEffect, useMemo, useState } from 'react';

import tenantDatabaseApi from '../../../api/tenantDatabaseApi';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'suspended' | 'pending';
  dbType: 'mysql' | 'postgres' | 'sqlite' | 'mssql';
  dbName: string;
  userCount: number;
  userLimit: number;
  expireTime: string;
  createdAt: string;
  contactPerson: string;
  description?: string;
  isFirstLogin?: boolean;
}

type TenantFilterStatus = Tenant['status'] | 'all';

function normalizeDbType(value?: string): Tenant['dbType'] {
  switch (value) {
    case 'postgres':
    case 'postgresql':
      return 'postgres';
    case 'sqlite':
      return 'sqlite';
    case 'mssql':
      return 'mssql';
    case 'mysql':
    default:
      return 'mysql';
  }
}

function buildFallbackTenantMap(initialData: Tenant[]) {
  return new Map(initialData.map((item) => [item.code, item]));
}

function buildTenantFromRemote(
  item: Awaited<ReturnType<typeof tenantDatabaseApi.listTenants>>['items'][number],
  fallback?: Tenant,
): Tenant {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    status: item.status,
    dbType: normalizeDbType(fallback?.dbType),
    dbName: fallback?.dbName || `${item.code.toLowerCase()}_db`,
    userCount: fallback?.userCount ?? 0,
    userLimit: fallback?.userLimit ?? 0,
    expireTime: item.expireAt || fallback?.expireTime || '-',
    createdAt: item.createdAt,
    contactPerson: item.contactPerson || fallback?.contactPerson || '-',
    description: item.description,
    isFirstLogin: item.isFirstLogin,
  };
}

export function useTenantLogic(initialData: Tenant[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TenantFilterStatus>('all');
  const [page, setPage] = useState(1);
  const [sourceData, setSourceData] = useState<Tenant[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [usingMockData, setUsingMockData] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const pageSize = 10;

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tenantDatabaseApi.listTenants({ page: 1, pageSize: 500 });
      const fallbackMap = buildFallbackTenantMap(initialData);
      const merged = await Promise.all(
        response.items.map(async (item) => {
          const base = buildTenantFromRemote(item, fallbackMap.get(item.code));
          try {
            const quotas = await tenantDatabaseApi.getTenantQuotas(item.id);
            const userQuota = quotas.find((quota) => quota.quota_type === 'users');
            if (!userQuota) {
              return base;
            }
            return {
              ...base,
              userCount: userQuota.current_value,
              userLimit: userQuota.max_value,
            };
          } catch (error) {
            console.warn(`Failed to load quotas for tenant ${item.id}:`, error);
            return base;
          }
        }),
      );

      if (merged.length > 0) {
        setSourceData(merged);
        setUsingMockData(false);
        setLastLoadedAt(new Date().toISOString());
        return;
      }

      setSourceData(initialData);
      setUsingMockData(true);
      setLastLoadedAt(new Date().toISOString());
    } catch (error) {
      console.error('Failed to load tenants from API:', error);
      setSourceData(initialData);
      setUsingMockData(true);
      setLastLoadedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const filteredData = useMemo(() => {
    return sourceData.filter((tenant) => {
      const matchesSearch =
        !searchQuery ||
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, searchQuery, sourceData]);

  const stats = useMemo(() => {
    return {
      total: sourceData.length,
      active: sourceData.filter((tenant) => tenant.status === 'active').length,
      suspended: sourceData.filter((tenant) => tenant.status === 'suspended').length,
      warning: sourceData.filter(
        (tenant) => tenant.userLimit > 0 && tenant.userCount / tenant.userLimit > 0.9,
      ).length,
    };
  }, [sourceData]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  return {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    totalPages,
    paginatedData,
    stats,
    loading,
    usingMockData,
    lastLoadedAt,
    reloadTenants: loadTenants,
  };
}
