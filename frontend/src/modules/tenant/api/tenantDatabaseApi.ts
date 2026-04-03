import { api } from '@/shared/utils/apiClient';

import type {
  DatabaseConnectionConfig,
  DatabaseType,
  TenantBootstrapResult,
  TenantInfo,
  TenantListItem,
  TenantListResult,
  TenantQuotaItem,
  TenantSetupResult,
  TenantSetupStatus,
  TestConnectionResult,
} from '../types';

type TenantStatusPayload = {
  is_configured?: boolean;
  isConfigured?: boolean;
  is_first_login?: boolean;
  isFirstLogin?: boolean;
  database_configured?: boolean;
  databaseConfigured?: boolean;
  tenant_id?: string;
  tenantId?: string;
  tenant_code?: string;
  tenantCode?: string;
  tenant_name?: string;
  tenantName?: string;
  status?: string;
};

type TenantInfoPayload = {
  id: string;
  name: string;
  code: string;
  description?: string;
  contact_person?: string;
  contactPerson?: string;
  expire_at?: string;
  expireAt?: string;
  status?: string;
  database_type?: TenantInfo['databaseType'];
  databaseType?: TenantInfo['databaseType'];
  database_configured?: boolean;
  databaseConfigured?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type TenantListPayload = {
  id: string;
  name: string;
  code: string;
  description?: string;
  contact_person?: string;
  contactPerson?: string;
  expire_at?: string;
  expireAt?: string;
  status?: string;
  is_first_login?: boolean;
  isFirstLogin?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type TenantSwitchPayload = {
  tenant?: TenantInfoPayload;
};

type TenantBootstrapPayload = {
  seeded?: boolean;
  admin_created?: boolean;
  adminCreated?: boolean;
  role_created?: boolean;
  roleCreated?: boolean;
  admin_username?: string;
  adminUsername?: string;
  admin_email?: string;
  adminEmail?: string;
  role_code?: string;
  roleCode?: string;
  menu_count?: number;
  menuCount?: number;
  permission_count?: number;
  permissionCount?: number;
};

type TenantSetupPayload = {
  tenant_id?: string;
  tenantId?: string;
  config_id?: string;
  configId?: string;
  database_type?: DatabaseType;
  databaseType?: DatabaseType;
  database?: string;
  initialized_modules?: string[];
  initializedModules?: string[];
  deployment_mode?: string;
  deploymentMode?: string;
  tenant_strategy?: string;
  tenantStrategy?: string;
  bootstrap?: TenantBootstrapPayload;
  message?: string;
};

function normalizeTenantStatusValue(status?: string): TenantListItem['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'disabled':
    case 'suspended':
      return 'suspended';
    case 'pending':
    default:
      return 'pending';
  }
}

function normalizeDatabaseType(type?: string): DatabaseType {
  switch (type) {
    case 'postgres':
    case 'postgresql':
      return 'postgresql';
    case 'sqlite':
      return 'sqlite';
    case 'mssql':
      return 'mssql';
    case 'mysql':
    default:
      return 'mysql';
  }
}

function normalizeTenantStatus(payload: TenantStatusPayload): TenantSetupStatus {
  return {
    isConfigured: payload.isConfigured ?? payload.is_configured ?? false,
    isFirstLogin: payload.isFirstLogin ?? payload.is_first_login ?? false,
    databaseConfigured: payload.databaseConfigured ?? payload.database_configured ?? false,
    tenantId: payload.tenantId ?? payload.tenant_id,
    tenantCode: payload.tenantCode ?? payload.tenant_code,
    tenantName: payload.tenantName ?? payload.tenant_name,
    status: payload.status,
  };
}

function normalizeTenantInfo(payload: TenantInfoPayload): TenantInfo {
  return {
    id: payload.id,
    name: payload.name,
    code: payload.code,
    description: payload.description || '',
    contactPerson: payload.contactPerson ?? payload.contact_person ?? '',
    expireAt: payload.expireAt ?? payload.expire_at ?? '',
    status: normalizeTenantStatusValue(payload.status),
    databaseType: normalizeDatabaseType(payload.databaseType ?? payload.database_type),
    databaseConfigured: payload.databaseConfigured ?? payload.database_configured ?? false,
    createdAt: payload.createdAt ?? payload.created_at ?? new Date().toISOString(),
    updatedAt: payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
  };
}

function normalizeTenantListItem(payload: TenantListPayload): TenantListItem {
  return {
    id: payload.id,
    name: payload.name,
    code: payload.code,
    description: payload.description || '',
    contactPerson: payload.contactPerson ?? payload.contact_person ?? '',
    expireAt: payload.expireAt ?? payload.expire_at ?? '',
    status: normalizeTenantStatusValue(payload.status),
    isFirstLogin: payload.isFirstLogin ?? payload.is_first_login ?? false,
    createdAt: payload.createdAt ?? payload.created_at ?? new Date().toISOString(),
    updatedAt: payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
  };
}

function normalizeBootstrap(payload?: TenantBootstrapPayload): TenantBootstrapResult | undefined {
  if (!payload) {
    return undefined;
  }

  return {
    seeded: payload.seeded ?? false,
    adminCreated: payload.adminCreated ?? payload.admin_created ?? false,
    roleCreated: payload.roleCreated ?? payload.role_created ?? false,
    adminUsername: payload.adminUsername ?? payload.admin_username,
    adminEmail: payload.adminEmail ?? payload.admin_email,
    roleCode: payload.roleCode ?? payload.role_code,
    menuCount: payload.menuCount ?? payload.menu_count,
    permissionCount: payload.permissionCount ?? payload.permission_count,
  };
}

function normalizeSetupResult(payload: TenantSetupPayload): TenantSetupResult {
  return {
    tenantId: payload.tenantId ?? payload.tenant_id ?? '',
    configId: payload.configId ?? payload.config_id,
    databaseType: payload.databaseType ?? payload.database_type,
    database: payload.database,
    initializedModules: payload.initializedModules ?? payload.initialized_modules ?? [],
    deploymentMode: payload.deploymentMode ?? payload.deployment_mode,
    tenantStrategy: payload.tenantStrategy ?? payload.tenant_strategy,
    bootstrap: normalizeBootstrap(payload.bootstrap),
    message: payload.message,
  };
}

function toTenantDatabasePayload(config: DatabaseConnectionConfig) {
  return {
    database_type: config.databaseType,
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password,
    admin_password: config.adminPassword,
    filepath: config.filepath,
    ssl_mode: config.sslMode,
    max_open_conns: config.maxOpenConns,
    max_idle_conns: config.maxIdleConns,
    conn_max_lifetime: config.connMaxLifetime,
  };
}

export const tenantDatabaseApi = {
  async createTenant(data: {
    name: string;
    code: string;
    description?: string;
    contact_person?: string;
    expire_at?: string;
  }): Promise<TenantInfo> {
    const response = await api.post<TenantInfoPayload>('/v1/tenants/register', data);
    return normalizeTenantInfo(response.data);
  },

  async getStatus(code?: string): Promise<TenantSetupStatus> {
    const response = await api.get<TenantStatusPayload>('/v1/tenants/status', code ? { code } : undefined);
    return normalizeTenantStatus(response.data);
  },

  async testConnection(config: DatabaseConnectionConfig): Promise<TestConnectionResult> {
    const response = await api.post<TestConnectionResult>('/v1/tenants/test-connection', toTenantDatabasePayload(config));
    return response.data;
  },

  async setupDatabase(config: DatabaseConnectionConfig): Promise<TenantSetupResult> {
    const response = await api.post<TenantSetupPayload>(
      '/v1/tenants/setup',
      toTenantDatabasePayload(config),
    );

    return normalizeSetupResult(response.data);
  },

  async setupTenantDatabase(id: string, config: DatabaseConnectionConfig): Promise<TenantSetupResult> {
    const response = await api.post<TenantSetupPayload>(
      `/v1/tenants/${id}/setup`,
      toTenantDatabasePayload(config),
    );

    return normalizeSetupResult(response.data);
  },

  async getCurrentTenant(): Promise<TenantInfo> {
    const response = await api.get<TenantInfoPayload>('/v1/tenants/current');
    return normalizeTenantInfo(response.data);
  },

  async listTenants(params?: { page?: number; pageSize?: number }): Promise<TenantListResult> {
    const response = await api.get<{
      items?: TenantListPayload[];
      pagination?: TenantListResult['pagination'];
    }>('/v1/tenants/list', {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 100,
    });

    return {
      items: (response.data.items || []).map(normalizeTenantListItem),
      pagination: {
        page: response.data.pagination?.page ?? 1,
        page_size: response.data.pagination?.page_size ?? (params?.pageSize ?? 100),
        total: response.data.pagination?.total ?? response.data.items?.length ?? 0,
        total_pages: response.data.pagination?.total_pages ?? 1,
        has_next: response.data.pagination?.has_next ?? false,
        has_prev: response.data.pagination?.has_prev ?? false,
      },
    };
  },

  async confirmTenantContext(id: string): Promise<TenantInfo | null> {
    const response = await api.post<TenantSwitchPayload>(`/v1/tenants/switch/${id}`);
    return response.data.tenant ? normalizeTenantInfo(response.data.tenant) : null;
  },

  async updateTenant(
    id: string,
    data: { name: string; description?: string; contact_person?: string; expire_at?: string },
  ): Promise<TenantInfo> {
    const response = await api.put<TenantInfoPayload>(`/v1/tenants/${id}`, data);
    return normalizeTenantInfo(response.data);
  },

  async getTenantQuotas(id: string): Promise<TenantQuotaItem[]> {
    const response = await api.get<TenantQuotaItem[]>(`/v1/tenants/${id}/quotas`);
    return response.data || [];
  },

  async updateTenantQuotas(
    id: string,
    items: Array<{ type: 'users' | 'storage' | 'depts' | 'roles'; maxValue: number; unit?: string }>,
  ): Promise<TenantQuotaItem[]> {
    const response = await api.put<{ items?: TenantQuotaItem[] }>(`/v1/tenants/${id}/quotas`, { items });
    return response.data.items || [];
  },

  async activateTenant(id: string): Promise<void> {
    await api.put(`/v1/tenants/${id}/activate`);
  },

  async suspendTenant(id: string): Promise<void> {
    await api.put(`/v1/tenants/${id}/suspend`);
  },

  async deleteTenant(id: string): Promise<void> {
    await api.delete(`/v1/tenants/${id}`);
  },
};

export { tenantDatabaseApi as default };
