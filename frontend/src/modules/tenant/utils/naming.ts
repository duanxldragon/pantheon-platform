const TENANT_CODE_MAX_LENGTH = 32;
const TENANT_CODE_MIN_LENGTH = 3;
const TENANT_DATABASE_PREFIX = 'pantheon_tenant_';
const DEFAULT_TENANT_CODE = 'default';

function trimUnderscores(value: string) {
  return value.replace(/^_+|_+$/g, '');
}

export function normalizeTenantCode(input: string): string {
  const normalized = trimUnderscores(
    input
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_'),
  );

  const withPrefix = /^[0-9]/.test(normalized) ? `t_${normalized}` : normalized;
  return withPrefix.slice(0, TENANT_CODE_MAX_LENGTH);
}

export function isValidTenantCode(value: string): boolean {
  return (
    value.length >= TENANT_CODE_MIN_LENGTH &&
    value.length <= TENANT_CODE_MAX_LENGTH &&
    /^[a-z][a-z0-9_]*$/.test(value)
  );
}

export function buildRecommendedTenantDatabaseName(code?: string): string {
  const normalizedCode = normalizeTenantCode(code || '') || DEFAULT_TENANT_CODE;
  return `${TENANT_DATABASE_PREFIX}${normalizedCode}`;
}

export function buildRecommendedSQLitePath(code?: string): string {
  return `/data/${buildRecommendedTenantDatabaseName(code)}.db`;
}
