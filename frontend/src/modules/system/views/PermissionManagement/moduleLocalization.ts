const MODULE_CATALOG = [
  {
    value: '仪表盘',
    zh: '仪表盘',
    en: 'Dashboard',
    aliases: ['仪表盘', 'dashboard'],
  },
  {
    value: '主机管理',
    zh: '主机管理',
    en: 'Host Management',
    aliases: ['主机管理', 'host management'],
  },
  {
    value: 'K8s 管理',
    zh: 'K8s 管理',
    en: 'K8s Management',
    aliases: ['k8s 管理', 'k8s management'],
  },
  {
    value: '组件部署',
    zh: '组件部署',
    en: 'Component Deploy',
    aliases: ['组件部署', 'component deploy'],
  },
  {
    value: '运维操作',
    zh: '运维操作',
    en: 'Operations',
    aliases: ['运维操作', 'operations'],
  },
  {
    value: '告警中心',
    zh: '告警中心',
    en: 'Alerts',
    aliases: ['告警中心', 'alerts'],
  },
  {
    value: '系统管理',
    zh: '系统管理',
    en: 'System Management',
    aliases: ['系统管理', 'system management'],
  },
  {
    value: '数据权限',
    zh: '数据权限',
    en: 'Data Scope',
    aliases: ['数据权限', 'data scope'],
  },
] as const;

const normalizeKeyword = (value?: string) => value?.trim().toLowerCase() || '';

const findModuleEntry = (value?: string) => {
  const keyword = normalizeKeyword(value);
  if (!keyword) {
    return undefined;
  }

  return MODULE_CATALOG.find((entry) =>
    entry.aliases.some((alias) => normalizeKeyword(alias) === keyword),
  );
};

export const normalizePermissionModule = (value?: string) => {
  const entry = findModuleEntry(value);
  return entry?.value || value?.trim() || '';
};

export const getPermissionModuleLabel = (value: string | undefined, language: string) => {
  const entry = findModuleEntry(value);
  if (entry) {
    return language === 'zh' ? entry.zh : entry.en;
  }

  if (value?.trim()) {
    return value.trim();
  }

  return language === 'zh' ? '未分类' : 'Uncategorized';
};

export const getPermissionModuleOptions = (language: string) =>
  MODULE_CATALOG.map((entry) => ({
    value: entry.value,
    label: language === 'zh' ? entry.zh : entry.en,
  }));

export const getPermissionModuleWeight = (value: string | undefined) => {
  const normalizedValue = normalizePermissionModule(value);
  const index = MODULE_CATALOG.findIndex((entry) => entry.value === normalizedValue);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};
