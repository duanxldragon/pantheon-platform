import type { Language } from '../../../../stores/language_store';

type PermissionTypeKey = 'menu' | 'operation' | 'data' | 'field';

export interface PermissionModuleCatalogEntry {
  value: string;
  zh: string;
  en: string;
  aliases: string[];
}

export interface PermissionManagementCopy {
  entity: {
    zh: string;
    en: string;
    enPlural: string;
  };
  page: {
    title: string;
    description: string;
  };
  modules: {
    uncategorized: string;
  };
  actionLabels: {
    add: string;
    edit: string;
    delete: string;
    import: string;
    export: string;
    batchEnable: string;
    batchDisable: string;
    batchStatusUpdate: string;
    batchDelete: string;
  };
  buttons: {
    batchEnable: (count: number) => string;
    batchDisable: (count: number) => string;
    batchDelete: (count: number) => string;
  };
  feedback: {
    loadFailed: string;
    importSuccess: string;
    exporting: string;
  };
  stats: {
    total: string;
    operation: string;
    data: string;
    menu: string;
  };
  search: {
    searchPlaceholder: string;
    typePlaceholder: string;
    typeAll: string;
    typeMenu: string;
    typeOperation: string;
    typeData: string;
    modulePlaceholder: string;
    moduleAll: string;
  };
  messages: {
    separator: string;
    deleteBlockedSummaryPrefix: (isBatch: boolean) => string;
    deleteBlockedSummarySuffix: (hasMore: boolean) => string;
    deleteBlockedItem: (name: string, roleCount: number, userCount: number) => string;
    deleteDescriptionAffected: (name: string, roleCount: number, userCount: number) => string;
    deleteDescriptionStandalone: (name: string) => string;
    statusTitle: (enabled: boolean) => string;
    statusDescriptionAffected: (name: string, roleCount: number, userCount: number) => string;
    statusDescriptionStandalone: (name: string) => string;
    statusConfirmText: (enabled: boolean) => string;
    statusSuccessAffected: (
      name: string,
      enabled: boolean,
      roleCount: number,
      userCount: number,
    ) => string;
    statusSuccessStandalone: (name: string, enabled: boolean) => string;
    batchStatusTitle: (enabled: boolean) => string;
    batchStatusDescriptionAffected: (
      count: number,
      enabled: boolean,
      roleCount: number,
      userCount: number,
    ) => string;
    batchStatusDescriptionStandalone: (count: number, enabled: boolean) => string;
    batchStatusConfirmText: (enabled: boolean) => string;
    batchStatusSuccessAffected: (
      count: number,
      enabled: boolean,
      roleCount: number,
      userCount: number,
    ) => string;
    batchStatusSuccessStandalone: (count: number, enabled: boolean) => string;
  };
  form: {
    code: string;
    name: string;
    type: string;
    module: string;
    menu: string;
    description: string;
    codePlaceholder: string;
    namePlaceholder: string;
    typePlaceholder: string;
    modulePlaceholder: string;
    menuPlaceholder: string;
    descriptionPlaceholder: string;
    none: string;
    guideTitle: string;
    guideItems: string[];
    typeOptions: Array<{ value: PermissionTypeKey; label: string }>;
  };
  dialog: {
    resourceName: string;
    addTitle: string;
    editTitle: string;
    addDescription: string;
    editDescription: string;
    deleteTitle: string;
    deleteFallback: (permissionName?: string) => string;
    cancelText: string;
    submitText: string;
    submittingText: string;
    confirmDeleteText: string;
    confirmingDeleteText: string;
    importHeaders: string[];
  };
  table: {
    code: string;
    name: string;
    type: string;
    module: string;
    status: string;
    description: string;
    createdAt: string;
    actions: string;
    edit: string;
    delete: string;
    clickToCopy: string;
    typeMenu: string;
    typeOperation: string;
    typeData: string;
  };
  group: {
    empty: string;
    countSuffix: string;
    noDescription: string;
    relatedMenu: string;
    edit: string;
    delete: string;
    uncategorized: string;
    typeMeta: Record<PermissionTypeKey, string>;
  };
}

const permissionModuleCatalog: PermissionModuleCatalogEntry[] = [
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
];

const zhCopy: PermissionManagementCopy = {
  entity: {
    zh: '权限',
    en: 'Permission',
    enPlural: 'permissions',
  },
  page: {
    title: '权限管理',
    description: '统一维护权限编码、模块归属、状态和角色引用关系。',
  },
  modules: {
    uncategorized: '未分类',
  },
  actionLabels: {
    add: '新增',
    edit: '编辑',
    delete: '删除',
    import: '导入',
    export: '导出',
    batchEnable: '批量启用',
    batchDisable: '批量禁用',
    batchStatusUpdate: '批量状态变更',
    batchDelete: '批量删除',
  },
  buttons: {
    batchEnable: (count) => `批量启用 (${count})`,
    batchDisable: (count) => `批量禁用 (${count})`,
    batchDelete: (count) => `批量删除 (${count})`,
  },
  feedback: {
    loadFailed: '加载权限列表失败，请重试',
    importSuccess: '权限导入成功',
    exporting: '正在导出权限数据',
  },
  stats: {
    total: '全部权限',
    operation: '操作权限',
    data: '数据权限',
    menu: '菜单权限',
  },
  search: {
    searchPlaceholder: '搜索权限编码、名称或说明',
    typePlaceholder: '权限类型',
    typeAll: '全部类型',
    typeMenu: '菜单权限',
    typeOperation: '操作权限',
    typeData: '数据权限',
    modulePlaceholder: '所属模块',
    moduleAll: '全部模块',
  },
  messages: {
    separator: '；',
    deleteBlockedSummaryPrefix: (isBatch) => (isBatch ? '批量删除已拦截：' : '删除已拦截：'),
    deleteBlockedSummarySuffix: (hasMore) => (hasMore ? '；其余权限也仍被角色引用' : ''),
    deleteBlockedItem: (name, roleCount, userCount) =>
      `${name}（${roleCount} 个角色，${userCount} 名角色成员）`,
    deleteDescriptionAffected: (name, roleCount, userCount) =>
      `权限「${name}」当前仍被 ${roleCount} 个角色引用，影响 ${userCount} 名角色成员，后端会拒绝删除。`,
    deleteDescriptionStandalone: (name) =>
      `确认删除权限「${name}」？当前未被角色引用，删除后立即生效且不可恢复。`,
    statusTitle: (enabled) => `确认${enabled ? '启用' : '禁用'}权限`,
    statusDescriptionAffected: (name, roleCount, userCount) =>
      `权限「${name}」状态变更将影响 ${roleCount} 个角色、${userCount} 名角色成员，并触发权限刷新。`,
    statusDescriptionStandalone: (name) =>
      `权限「${name}」状态变更将立即生效。当前未被角色引用。`,
    statusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    statusSuccessAffected: (name, enabled, roleCount, userCount) =>
      `已${enabled ? '启用' : '禁用'}权限「${name}」，影响 ${roleCount} 个角色、${userCount} 名角色成员`,
    statusSuccessStandalone: (name, enabled) =>
      `已${enabled ? '启用' : '禁用'}权限「${name}」`,
    batchStatusTitle: (enabled) => `确认批量${enabled ? '启用' : '禁用'}权限`,
    batchStatusDescriptionAffected: (count, enabled, roleCount, userCount) =>
      `将批量${enabled ? '启用' : '禁用'} ${count} 项权限，影响 ${roleCount} 个角色、${userCount} 名角色成员，并触发权限刷新。`,
    batchStatusDescriptionStandalone: (count, enabled) =>
      `将批量${enabled ? '启用' : '禁用'} ${count} 项权限，当前未影响任何角色。`,
    batchStatusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    batchStatusSuccessAffected: (count, enabled, roleCount, userCount) =>
      `已批量${enabled ? '启用' : '禁用'} ${count} 项权限，影响 ${roleCount} 个角色、${userCount} 名角色成员`,
    batchStatusSuccessStandalone: (count, enabled) =>
      `已批量${enabled ? '启用' : '禁用'} ${count} 项权限`,
  },
  form: {
    code: '权限编码',
    name: '权限名称',
    type: '权限类型',
    module: '所属模块',
    menu: '关联菜单',
    description: '权限说明',
    codePlaceholder: '请输入权限编码，例如 system:user:view',
    namePlaceholder: '请输入权限名称',
    typePlaceholder: '请选择权限类型',
    modulePlaceholder: '请选择所属模块',
    menuPlaceholder: '请选择关联菜单，可为空',
    descriptionPlaceholder: '请输入权限说明',
    none: '无',
    guideTitle: '权限编码建议',
    guideItems: [
      '建议格式：模块:资源:动作，例如 `system:user:view`。',
      '统一使用小写英文和冒号分隔，方便前后端做稳定校验。',
      '常见动作包括 `view`、`add`、`edit`、`delete`、`export`。',
      '一个权限编码只表达一个明确动作，避免混合多个含义。',
    ],
    typeOptions: [
      { value: 'menu', label: '菜单权限' },
      { value: 'operation', label: '操作权限' },
      { value: 'data', label: '数据权限' },
      { value: 'field', label: '字段权限' },
    ],
  },
  dialog: {
    resourceName: '权限',
    addTitle: '新增权限',
    editTitle: '编辑权限',
    addDescription: '创建权限后，可在角色授权中分配，并影响登录后的动态权限快照。',
    editDescription: '修改权限配置后，相关角色与在线用户的权限快照会按刷新策略更新。',
    deleteTitle: '删除权限',
    deleteFallback: (permissionName) =>
      permissionName ? `确认删除权限“${permissionName}”吗？` : '',
    cancelText: '取消',
    submitText: '确认提交',
    submittingText: '提交中...',
    confirmDeleteText: '确认删除',
    confirmingDeleteText: '删除中...',
    importHeaders: ['权限名称', '权限编码', '权限类型', '所属模块', '权限说明'],
  },
  table: {
    code: '权限编码',
    name: '权限名称',
    type: '权限类型',
    module: '所属模块',
    status: '状态',
    description: '说明',
    createdAt: '创建时间',
    actions: '操作',
    edit: '编辑',
    delete: '删除',
    clickToCopy: '点击后可复制',
    typeMenu: '菜单权限',
    typeOperation: '操作权限',
    typeData: '数据权限',
  },
  group: {
    empty: '暂无权限数据',
    countSuffix: '项权限',
    noDescription: '暂无说明',
    relatedMenu: '关联菜单 ID：',
    edit: '编辑',
    delete: '删除',
    uncategorized: '未分类',
    typeMeta: {
      menu: '菜单权限',
      operation: '操作权限',
      data: '数据权限',
      field: '字段权限',
    },
  },
};

const enCopy: PermissionManagementCopy = {
  entity: {
    zh: '权限',
    en: 'Permission',
    enPlural: 'permissions',
  },
  page: {
    title: 'Permission Management',
    description: 'Maintain permission codes, module ownership, status, and role references in one place.',
  },
  modules: {
    uncategorized: 'Uncategorized',
  },
  actionLabels: {
    add: 'create',
    edit: 'edit',
    delete: 'delete',
    import: 'import',
    export: 'export',
    batchEnable: 'batch enable',
    batchDisable: 'batch disable',
    batchStatusUpdate: 'batch status update',
    batchDelete: 'batch delete',
  },
  buttons: {
    batchEnable: (count) => `Enable (${count})`,
    batchDisable: (count) => `Disable (${count})`,
    batchDelete: (count) => `Delete (${count})`,
  },
  feedback: {
    loadFailed: 'Failed to load permissions',
    importSuccess: 'Permissions imported successfully',
    exporting: 'Exporting permission data',
  },
  stats: {
    total: 'All Permissions',
    operation: 'Operation Permissions',
    data: 'Data Permissions',
    menu: 'Menu Permissions',
  },
  search: {
    searchPlaceholder: 'Search code, name, or description',
    typePlaceholder: 'Permission Type',
    typeAll: 'All Types',
    typeMenu: 'Menu Permission',
    typeOperation: 'Operation Permission',
    typeData: 'Data Permission',
    modulePlaceholder: 'Module',
    moduleAll: 'All Modules',
  },
  messages: {
    separator: '; ',
    deleteBlockedSummaryPrefix: (isBatch) => (isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '),
    deleteBlockedSummarySuffix: (hasMore) =>
      hasMore ? '; other permissions are also still referenced by roles' : '',
    deleteBlockedItem: (name, roleCount, userCount) =>
      `${name} (${roleCount} roles, ${userCount} role members)`,
    deleteDescriptionAffected: (name, roleCount, userCount) =>
      `Permission "${name}" is still referenced by ${roleCount} roles and affects ${userCount} role members. The backend will reject deletion.`,
    deleteDescriptionStandalone: (name) =>
      `Delete permission "${name}"? It is not referenced by any role and the action cannot be undone.`,
    statusTitle: (enabled) => `Confirm ${enabled ? 'enable' : 'disable'} permission`,
    statusDescriptionAffected: (name, roleCount, userCount) =>
      `Changing permission "${name}" will affect ${roleCount} roles and ${userCount} role members, and refresh their authorization snapshot.`,
    statusDescriptionStandalone: (name) =>
      `Changing permission "${name}" takes effect immediately. It is not referenced by any role.`,
    statusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    statusSuccessAffected: (name, enabled, roleCount, userCount) =>
      `Permission "${name}" ${enabled ? 'enabled' : 'disabled'}. ${roleCount} roles and ${userCount} role members were affected.`,
    statusSuccessStandalone: (name, enabled) =>
      `Permission "${name}" ${enabled ? 'enabled' : 'disabled'}.`,
    batchStatusTitle: (enabled) => `Confirm batch ${enabled ? 'enable' : 'disable'} permissions`,
    batchStatusDescriptionAffected: (count, enabled, roleCount, userCount) =>
      `This will ${enabled ? 'enable' : 'disable'} ${count} permissions, affect ${roleCount} roles and ${userCount} role members, and refresh authorization snapshots.`,
    batchStatusDescriptionStandalone: (count, enabled) =>
      `This will ${enabled ? 'enable' : 'disable'} ${count} permissions and currently affects no roles.`,
    batchStatusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    batchStatusSuccessAffected: (count, enabled, roleCount, userCount) =>
      `${count} permissions ${enabled ? 'enabled' : 'disabled'}. ${roleCount} roles and ${userCount} role members were affected.`,
    batchStatusSuccessStandalone: (count, enabled) =>
      `${count} permissions ${enabled ? 'enabled' : 'disabled'}.`,
  },
  form: {
    code: 'Permission Code',
    name: 'Permission Name',
    type: 'Permission Type',
    module: 'Module',
    menu: 'Related Menu',
    description: 'Description',
    codePlaceholder: 'Enter permission code, e.g. system:user:view',
    namePlaceholder: 'Enter permission name',
    typePlaceholder: 'Select permission type',
    modulePlaceholder: 'Select module',
    menuPlaceholder: 'Select related menu, optional',
    descriptionPlaceholder: 'Enter permission description',
    none: 'None',
    guideTitle: 'Permission Code Guide',
    guideItems: [
      'Recommended format: module:resource:action, e.g. `system:user:view`.',
      'Prefer lowercase words separated by colons for stable frontend/backend checks.',
      'Common actions include `view`, `add`, `edit`, `delete`, and `export`.',
      'A single permission code should represent one clear action only.',
    ],
    typeOptions: [
      { value: 'menu', label: 'Menu Permission' },
      { value: 'operation', label: 'Operation Permission' },
      { value: 'data', label: 'Data Permission' },
      { value: 'field', label: 'Field Permission' },
    ],
  },
  dialog: {
    resourceName: 'Permission',
    addTitle: 'Add Permission',
    editTitle: 'Edit Permission',
    addDescription:
      'New permissions can be assigned to roles and affect dynamic authorization snapshots after login.',
    editDescription:
      'Changes affect related roles and online user authorization snapshots according to refresh strategy.',
    deleteTitle: 'Delete Permission',
    deleteFallback: (permissionName) =>
      permissionName
        ? `Are you sure you want to delete permission "${permissionName}"?`
        : '',
    cancelText: 'Cancel',
    submitText: 'Submit',
    submittingText: 'Submitting...',
    confirmDeleteText: 'Delete',
    confirmingDeleteText: 'Deleting...',
    importHeaders: ['Name', 'Code', 'Type', 'Module', 'Description'],
  },
  table: {
    code: 'Permission Code',
    name: 'Permission Name',
    type: 'Permission Type',
    module: 'Module',
    status: 'Status',
    description: 'Description',
    createdAt: 'Created At',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    clickToCopy: 'Click to copy',
    typeMenu: 'Menu Permission',
    typeOperation: 'Operation Permission',
    typeData: 'Data Permission',
  },
  group: {
    empty: 'No permissions available',
    countSuffix: 'permissions',
    noDescription: 'No description',
    relatedMenu: 'Related Menu ID: ',
    edit: 'Edit',
    delete: 'Delete',
    uncategorized: 'Uncategorized',
    typeMeta: {
      menu: 'Menu Permission',
      operation: 'Operation Permission',
      data: 'Data Permission',
      field: 'Field Permission',
    },
  },
};

export function getPermissionManagementCopy(language: Language): PermissionManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}

export function getPermissionModuleCatalog(): PermissionModuleCatalogEntry[] {
  return permissionModuleCatalog;
}

