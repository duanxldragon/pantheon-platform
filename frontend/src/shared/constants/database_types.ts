import type { DatabaseType, DatabaseTypeInfo } from '@/modules/tenant/types';

export const DATABASE_TYPES: DatabaseTypeInfo[] = [
  {
    type: 'mysql',
    name: 'MySQL',
    icon: 'database',
    description: '适合大多数生产环境，生态成熟、部署广泛。',
    defaultPort: 3306,
    requiredFields: [
      { key: 'host', label: '主机地址', placeholder: 'localhost 或 127.0.0.1', type: 'text' },
      { key: 'port', label: '端口', placeholder: '默认 3306', type: 'number' },
      { key: 'database', label: '数据库名', placeholder: 'tenant_db', type: 'text' },
      { key: 'username', label: '用户名', placeholder: 'root', type: 'text' },
      { key: 'password', label: '密码', placeholder: '请输入数据库密码', type: 'password' },
    ],
    optionalFields: [
      {
        key: 'sslMode',
        label: 'SSL 模式',
        placeholder: '选择 SSL 模式',
        type: 'select',
        options: [
          { label: '禁用', value: 'disable' },
          { label: '要求', value: 'require' },
          { label: '验证 CA', value: 'verify-ca' },
          { label: '完全验证', value: 'verify-full' },
        ],
      },
    ],
    features: ['事务支持', '生态成熟', '维护成本低'],
  },
  {
    type: 'postgresql',
    name: 'PostgreSQL',
    icon: 'database',
    description: '适合复杂查询和高一致性场景，扩展能力强。',
    defaultPort: 5432,
    requiredFields: [
      { key: 'host', label: '主机地址', placeholder: 'localhost 或 127.0.0.1', type: 'text' },
      { key: 'port', label: '端口', placeholder: '默认 5432', type: 'number' },
      { key: 'database', label: '数据库名', placeholder: 'tenant_db', type: 'text' },
      { key: 'username', label: '用户名', placeholder: 'postgres', type: 'text' },
      { key: 'password', label: '密码', placeholder: '请输入数据库密码', type: 'password' },
    ],
    optionalFields: [
      {
        key: 'sslMode',
        label: 'SSL 模式',
        placeholder: '选择 SSL 模式',
        type: 'select',
        options: [
          { label: '禁用', value: 'disable' },
          { label: '要求', value: 'require' },
          { label: '验证 CA', value: 'verify-ca' },
          { label: '完全验证', value: 'verify-full' },
        ],
      },
    ],
    features: ['复杂查询', 'JSON 能力', '扩展性强'],
  },
  {
    type: 'sqlite',
    name: 'SQLite',
    icon: 'file',
    description: '适合单机、私有化轻量部署和开发验证环境。',
    defaultPort: 0,
    requiredFields: [
      { key: 'filepath', label: '数据库文件路径', placeholder: '/data/pantheon.db', type: 'text' },
    ],
    optionalFields: [],
    features: ['轻量部署', '零额外服务', '适合单体模式'],
  },
  {
    type: 'mssql',
    name: 'SQL Server',
    icon: 'server',
    description: '适合既有微软基础设施或企业统一技术栈。',
    defaultPort: 1433,
    requiredFields: [
      { key: 'host', label: '主机地址', placeholder: 'localhost 或 127.0.0.1', type: 'text' },
      { key: 'port', label: '端口', placeholder: '默认 1433', type: 'number' },
      { key: 'database', label: '数据库名', placeholder: 'tenant_db', type: 'text' },
      { key: 'username', label: '用户名', placeholder: 'sa', type: 'text' },
      { key: 'password', label: '密码', placeholder: '请输入数据库密码', type: 'password' },
    ],
    optionalFields: [
      {
        key: 'sslMode',
        label: '加密模式',
        placeholder: '选择加密模式',
        type: 'select',
        options: [
          { label: '禁用', value: 'disable' },
          { label: '启用', value: 'require' },
        ],
      },
    ],
    features: ['企业级支持', '微软生态', '适合既有环境'],
  },
];

export function getDatabaseTypeConfig(type: DatabaseType | string): DatabaseTypeInfo | undefined {
  return DATABASE_TYPES.find((databaseType) => databaseType.type === type);
}

export function getDefaultPort(type: DatabaseType | string): number {
  return getDatabaseTypeConfig(type)?.defaultPort || 0;
}

export function requiresPort(type: DatabaseType | string): boolean {
  return type !== 'sqlite';
}
