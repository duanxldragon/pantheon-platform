import { useCallback, useEffect, useMemo, useState } from 'react';

import tenantDatabaseApi from '../../../api/tenant_database_api';
import { buildRecommendedTenantDatabaseName } from '../../../utils/naming';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'suspended' | 'pending';
  dbType: 'mysql' | 'postgres' | 'sqlite' | 'mssql' | 'unknown';
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
type TenantSourceState = 'remote' | 'empty' | 'error';

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
      return 'mysql';
    default:
      return 'unknown';
  }
}

function buildTenantFromRemote(
  item: Awaited<ReturnType<typeof tenantDatabaseApi.listTenants>>['items'][number],
): Tenant {
  const normalizedStatus: Tenant['status'] =
    item.status === 'suspended' ? 'suspended' : item.isFirstLogin ? 'pending' : 'active';

  return {
    id: item.id,
    name: item.name,
    code: item.code,
    status: normalizedStatus,
    dbType: normalizeDbType(),
    dbName: buildRecommendedTenantDatabaseName(item.code),
    userCount: 0,
    userLimit: 0,
    expireTime: item.expireAt || '-',
    createdAt: item.createdAt,
    contactPerson: item.contactPerson || '-',
    description: item.description,
    isFirstLogin: item.isFirstLogin,
  };
}

export function useTenantLogic() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TenantFilterStatus>('all');
  const [page, setPage] = useState(1);
  const [sourceData, setSourceData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceState, setSourceState] = useState<TenantSourceState>('remote');
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const pageSize = 10;

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await tenantDatabaseApi.listTenants({ page: 1, pageSize: 500 });
      const merged = await Promise.all(
        response.items.map(async (item) => {
          const base = buildTenantFromRemote(item);
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

      setSourceData(merged);
      setSourceState(merged.length > 0 ? 'remote' : 'empty');
      setLastLoadedAt(new Date().toISOString());
      return merged;
    } catch (error) {
      console.error('Failed to load tenants from API:', error);
      setSourceData([]);
      setSourceState('error');
      setLastLoadedAt(new Date().toISOString());
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

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
    sourceData,
    page,
    setPage,
    totalPages,
    paginatedData,
    stats,
    loading,
    sourceState,
    lastLoadedAt,
    reloadTenants: loadTenants,
  };
}



