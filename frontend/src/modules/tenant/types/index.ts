export type DatabaseType = 'mysql' | 'postgresql' | 'sqlite' | 'mssql';

export type SSLMode = 'disable' | 'require' | 'verify-ca' | 'verify-full';

export interface ConnectionField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'password' | 'select';
  options?: { label: string; value: string }[];
}

export interface DatabaseTypeInfo {
  type: DatabaseType;
  name: string;
  icon: string;
  description: string;
  defaultPort: number;
  requiredFields: ConnectionField[];
  optionalFields: ConnectionField[];
  features?: string[];
}

export interface DatabaseConnectionConfig {
  databaseType: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filepath?: string;
  sslMode?: SSLMode;
  maxOpenConns?: number;
  maxIdleConns?: number;
  connMaxLifetime?: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  version?: string;
  latency?: number;
  databaseSize?: string;
  error?: string;
}

export interface TenantSetupStatus {
  isConfigured: boolean;
  isFirstLogin: boolean;
  databaseConfigured: boolean;
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
  status?: string;
}

export type TenantLifecycleStatus = 'active' | 'pending' | 'suspended';

export interface TenantInfo {
  id: string;
  name: string;
  code: string;
  description?: string;
  contactPerson?: string;
  expireAt?: string;
  status?: TenantLifecycleStatus;
  databaseType: DatabaseType;
  databaseConfigured: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TenantListItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  contactPerson?: string;
  expireAt?: string;
  status: TenantLifecycleStatus;
  isFirstLogin: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TenantQuotaItem {
  id: string;
  tenant_id: string;
  quota_type: 'users' | 'storage' | 'depts' | 'roles';
  max_value: number;
  current_value: number;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantListResult {
  items: TenantListItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

export interface TenantBootstrapResult {
  seeded: boolean;
  adminCreated: boolean;
  roleCreated: boolean;
  adminUsername?: string;
  adminEmail?: string;
  initialPassword?: string;
  roleCode?: string;
  menuCount?: number;
  permissionCount?: number;
}

export interface TenantSetupResult {
  tenantId: string;
  configId?: string;
  databaseType?: DatabaseType;
  database?: string;
  initializedModules?: string[];
  deploymentMode?: string;
  tenantStrategy?: string;
  bootstrap?: TenantBootstrapResult;
  message?: string;
}

export type WizardStep = 'welcome' | 'database-type' | 'connection-config' | 'test-connection' | 'complete';

export interface WizardStepInfo {
  id: WizardStep;
  title: string;
  description: string;
  icon?: string;
}

export type ConnectionTestStatus = 'idle' | 'testing' | 'success' | 'error';
