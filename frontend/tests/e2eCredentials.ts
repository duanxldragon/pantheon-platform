export const e2eAdminUsername = process.env.E2E_ADMIN_USERNAME?.trim() || 'admin';
export const e2eTenantCode = process.env.E2E_TENANT_CODE?.trim() || '';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[e2e] Missing required environment variable: ${name}`);
  }
  return value;
}

export function getE2EAdminPassword(): string {
  return requireEnv('E2E_ADMIN_PASSWORD');
}

export function getE2EMysqlConfig() {
  return {
    mysqlBin: process.env.MYSQL_BIN || 'mysql',
    mysqlHost: process.env.E2E_MYSQL_HOST || '127.0.0.1',
    mysqlPort: Number(process.env.E2E_MYSQL_PORT || 3306),
    mysqlUser: process.env.E2E_MYSQL_USER || 'root',
    mysqlPassword: requireEnv('E2E_MYSQL_PASSWORD'),
  };
}
