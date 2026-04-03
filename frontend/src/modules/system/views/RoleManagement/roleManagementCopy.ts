import type { Language } from '../../../../stores/languageStore';

type RoleMenuTypeKey = 'directory' | 'menu' | 'button';

export interface RoleManagementCopy {
  entity: {
    zh: string;
    en: string;
    enPlural: string;
  };
  page: {
    title: string;
  };
  actionLabels: {
    add: string;
    edit: string;
    delete: string;
    permission: string;
    detail: string;
    members: string;
    import: string;
    export: string;
    batchEnable: string;
    batchDisable: string;
    batchDelete: string;
    batchStatusUpdate: string;
  };
  buttons: {
    batchEnable: (count: number) => string;
    batchDisable: (count: number) => string;
    batchDelete: (count: number) => string;
  };
  messages: {
    separator: string;
    roleDeleteBlockedItem: (name: string, userCount: number) => string;
    roleDeleteBlockedSummary: (details: string, isBatch: boolean, hasMore: boolean) => string;
    systemRoleDeleteBlocked: (details: string, isBatch: boolean, hasMore: boolean) => string;
    deleteDescriptionBlocked: (roleName: string, userCount: number) => string;
    deleteDescriptionStandalone: (roleName: string) => string;
    statusTitle: (enabled: boolean) => string;
    statusDescription: (roleName: string, enabled: boolean, userCount: number) => string;
    statusConfirmText: (enabled: boolean) => string;
    statusSuccess: (roleName: string, enabled: boolean, userCount: number) => string;
    batchStatusTitle: (enabled: boolean) => string;
    batchStatusDescription: (count: number, enabled: boolean, userCount: number) => string;
    batchStatusConfirmText: (enabled: boolean) => string;
    batchStatusSuccess: (count: number, enabled: boolean, userCount: number) => string;
  };
  form: {
    name: string;
    code: string;
    status: string;
    description: string;
    menuPermissions: string;
    menuPermissionsDescription: string;
    namePlaceholder: string;
    codePlaceholder: string;
    descriptionPlaceholder: string;
    active: string;
    inactive: string;
    selectedCount: string;
    menuType: Record<RoleMenuTypeKey, string>;
  };
  dialog: {
    addTitle: string;
    editTitle: string;
    addDescription: string;
    editDescription: string;
    cancel: string;
    confirm: string;
    importHeaders: string[];
    deleteTitle: string;
    resourceName: string;
    deleteFallback: (roleName?: string) => string;
    permissionTitle: string;
    permissionDescription: (roleName: string) => string;
    permissionCancel: string;
    permissionSubmit: string;
    permissionSubmitting: string;
    permissionSaveSuccess: string;
    permissionSaveFailed: string;
    permissionSelected: (count: number) => string;
    permissionClear: string;
  };
  table: {
    name: string;
    info: string;
    status: string;
    description: string;
    actions: string;
    edit: string;
    delete: string;
    statusEnabled: string;
    statusDisabled: string;
    builtIn: string;
    custom: string;
    stats: string;
    configurePermissions: string;
    viewDetails: string;
    members: string;
  };
  detail: {
    description: string;
    status: string;
    statusEnabled: string;
    statusDisabled: string;
    linkedUsers: string;
    menuCount: string;
    roleType: string;
    systemRole: string;
    customRole: string;
    createdAt: string;
  };
  users: {
    title: string;
    description: string;
    searchPlaceholder: string;
    tabCurrent: string;
    tabAdd: string;
    emptySearch: string;
    emptyCurrent: string;
    selectedLabel: string;
    selectAll: string;
    removeSelected: string;
    addSelected: string;
    addSuccess: string;
    removeSuccess: string;
    loadFailed: string;
    addFailed: string;
    removeFailed: string;
  };
  search: {
    searchPlaceholder: string;
    typePlaceholder: string;
    typeAll: string;
    typeSystem: string;
    typeCustom: string;
    statusPlaceholder: string;
    statusAll: string;
    statusEnabled: string;
    statusDisabled: string;
    reset: string;
  };
}

const zhCopy: RoleManagementCopy = {
  entity: {
    zh: '角色',
    en: 'Role',
    enPlural: 'roles',
  },
  page: {
    title: '角色管理',
  },
  actionLabels: {
    add: '新增',
    edit: '编辑',
    delete: '删除',
    permission: '权限授权',
    detail: '详情',
    members: '成员列表',
    import: '导入',
    export: '导出',
    batchEnable: '批量启用',
    batchDisable: '批量禁用',
    batchDelete: '批量删除',
    batchStatusUpdate: '批量状态变更',
  },
  buttons: {
    batchEnable: (count) => `批量启用 (${count})`,
    batchDisable: (count) => `批量禁用 (${count})`,
    batchDelete: (count) => `批量删除 (${count})`,
  },
  messages: {
    separator: '；',
    roleDeleteBlockedItem: (name, userCount) => `${name}（${userCount} 名成员）`,
    roleDeleteBlockedSummary: (details, isBatch, hasMore) =>
      `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${hasMore ? '；其余角色也仍存在成员' : ''}`,
    systemRoleDeleteBlocked: (details, isBatch, hasMore) =>
      `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${hasMore ? '；其余系统内置角色也不可删除' : ' 为系统内置角色，不允许删除'}`,
    deleteDescriptionBlocked: (roleName, userCount) =>
      `角色「${roleName}」当前仍有 ${userCount} 名成员，后端会拒绝删除，请先解除成员绑定。`,
    deleteDescriptionStandalone: (roleName) =>
      `确认删除角色「${roleName}」？当前无成员绑定，删除后角色授权关系会一并移除，且不可恢复。`,
    statusTitle: (enabled) => `确认${enabled ? '启用' : '禁用'}角色`,
    statusDescription: (roleName, enabled, userCount) =>
      enabled
        ? `角色「${roleName}」启用后，将恢复 ${userCount} 名成员的授权快照并刷新权限。`
        : `角色「${roleName}」禁用后，将影响 ${userCount} 名成员，并强制其相关会话失效。`,
    statusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    statusSuccess: (roleName, enabled, userCount) =>
      enabled
        ? `已启用角色「${roleName}」，恢复 ${userCount} 名成员的授权快照`
        : `已禁用角色「${roleName}」，影响 ${userCount} 名成员并强制其会话失效`,
    batchStatusTitle: (enabled) => `确认批量${enabled ? '启用' : '禁用'}角色`,
    batchStatusDescription: (count, enabled, userCount) =>
      enabled
        ? `将批量启用 ${count} 个角色，恢复 ${userCount} 名成员的授权快照并刷新权限。`
        : `将批量禁用 ${count} 个角色，影响 ${userCount} 名成员，并强制相关会话失效。`,
    batchStatusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    batchStatusSuccess: (count, enabled, userCount) =>
      enabled
        ? `已批量启用 ${count} 个角色，恢复 ${userCount} 名成员的授权快照`
        : `已批量禁用 ${count} 个角色，影响 ${userCount} 名成员并强制其会话失效`,
  },
  form: {
    name: '角色名称',
    code: '角色编码',
    status: '状态',
    description: '角色说明',
    menuPermissions: '菜单权限',
    menuPermissionsDescription: '为角色勾选可访问的菜单与按钮权限。',
    namePlaceholder: '请输入角色名称',
    codePlaceholder: '请输入角色编码',
    descriptionPlaceholder: '请输入角色说明',
    active: '启用',
    inactive: '禁用',
    selectedCount: '已选权限',
    menuType: {
      directory: '目录',
      menu: '菜单',
      button: '按钮',
    },
  },
  dialog: {
    addTitle: '新增角色',
    editTitle: '编辑角色',
    addDescription: '创建新角色并配置菜单与按钮权限。',
    editDescription: '调整角色信息、状态和菜单权限配置。',
    cancel: '取消',
    confirm: '确认',
    importHeaders: ['角色名称', '角色编码', '角色说明', '状态', '类型', '排序'],
    deleteTitle: '删除',
    resourceName: '角色',
    deleteFallback: (roleName) => (roleName ? `确认删除角色「${roleName}」？` : ''),
    permissionTitle: '配置菜单权限',
    permissionDescription: (roleName) => `为角色「${roleName}」配置可访问的菜单与按钮。`,
    permissionCancel: '取消',
    permissionSubmit: '保存配置',
    permissionSubmitting: '保存中...',
    permissionSaveSuccess: '角色菜单权限已保存',
    permissionSaveFailed: '保存角色菜单权限失败，请重试',
    permissionSelected: (count) => `已选择 ${count} 项菜单权限`,
    permissionClear: '清空选择',
  },
  table: {
    name: '角色',
    info: '信息',
    status: '状态',
    description: '说明',
    actions: '操作',
    edit: '编辑',
    delete: '删除',
    statusEnabled: '启用',
    statusDisabled: '禁用',
    builtIn: '系统内置',
    custom: '自定义',
    stats: '权限/成员',
    configurePermissions: '权限配置',
    viewDetails: '查看详情',
    members: '成员列表',
  },
  detail: {
    description: '角色说明',
    status: '状态',
    statusEnabled: '启用',
    statusDisabled: '禁用',
    linkedUsers: '关联用户数',
    menuCount: '菜单权限数',
    roleType: '角色类型',
    systemRole: '系统角色',
    customRole: '自定义角色',
    createdAt: '创建时间',
  },
  users: {
    title: '角色成员',
    description: '查看当前成员并为角色增减用户。',
    searchPlaceholder: '搜索姓名、用户名或邮箱',
    tabCurrent: '当前成员',
    tabAdd: '添加成员',
    emptySearch: '没有匹配的用户',
    emptyCurrent: '当前暂无成员',
    selectedLabel: '已选择',
    selectAll: '全选',
    removeSelected: '移除所选',
    addSelected: '添加所选',
    addSuccess: '角色成员已更新',
    removeSuccess: '已移除所选成员',
    loadFailed: '加载角色成员失败，请重试',
    addFailed: '添加角色成员失败，请重试',
    removeFailed: '移除角色成员失败，请重试',
  },
  search: {
    searchPlaceholder: '搜索角色名称、编码或说明',
    typePlaceholder: '角色类型',
    typeAll: '全部类型',
    typeSystem: '系统角色',
    typeCustom: '自定义角色',
    statusPlaceholder: '状态',
    statusAll: '全部状态',
    statusEnabled: '启用',
    statusDisabled: '禁用',
    reset: '重置',
  },
};

const enCopy: RoleManagementCopy = {
  entity: {
    zh: '角色',
    en: 'Role',
    enPlural: 'roles',
  },
  page: {
    title: 'Role Management',
  },
  actionLabels: {
    add: 'create',
    edit: 'edit',
    delete: 'delete',
    permission: 'permission authorization',
    detail: 'details',
    members: 'member list',
    import: 'import',
    export: 'export',
    batchEnable: 'batch enable',
    batchDisable: 'batch disable',
    batchDelete: 'batch delete',
    batchStatusUpdate: 'batch status update',
  },
  buttons: {
    batchEnable: (count) => `Enable (${count})`,
    batchDisable: (count) => `Disable (${count})`,
    batchDelete: (count) => `Delete (${count})`,
  },
  messages: {
    separator: '; ',
    roleDeleteBlockedItem: (name, userCount) => `${name} (${userCount} members)`,
    roleDeleteBlockedSummary: (details, isBatch, hasMore) =>
      `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${hasMore ? '; other roles also still have members' : ''}`,
    systemRoleDeleteBlocked: (details, isBatch, hasMore) =>
      `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${hasMore ? '; other built-in roles also cannot be deleted' : ' is a built-in system role and cannot be deleted'}`,
    deleteDescriptionBlocked: (roleName, userCount) =>
      `Role "${roleName}" still has ${userCount} members. The backend will reject deletion until members are unbound.`,
    deleteDescriptionStandalone: (roleName) =>
      `Delete role "${roleName}"? It currently has no members. Role authorization relations will be removed and cannot be restored.`,
    statusTitle: (enabled) => `Confirm ${enabled ? 'enable' : 'disable'} role`,
    statusDescription: (roleName, enabled, userCount) =>
      enabled
        ? `Enabling role "${roleName}" will restore authorization snapshots for ${userCount} members and refresh their permissions.`
        : `Disabling role "${roleName}" will affect ${userCount} members and revoke their related sessions.`,
    statusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    statusSuccess: (roleName, enabled, userCount) =>
      enabled
        ? `Role "${roleName}" enabled. Authorization snapshots for ${userCount} members were restored.`
        : `Role "${roleName}" disabled. ${userCount} members were affected and their sessions were revoked.`,
    batchStatusTitle: (enabled) => `Confirm batch ${enabled ? 'enable' : 'disable'} roles`,
    batchStatusDescription: (count, enabled, userCount) =>
      enabled
        ? `This will enable ${count} roles, restore authorization snapshots for ${userCount} members, and refresh their permissions.`
        : `This will disable ${count} roles, affect ${userCount} members, and revoke related sessions.`,
    batchStatusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    batchStatusSuccess: (count, enabled, userCount) =>
      enabled
        ? `${count} roles enabled. Authorization snapshots for ${userCount} members were restored.`
        : `${count} roles disabled. ${userCount} members were affected and their sessions were revoked.`,
  },
  form: {
    name: 'Role Name',
    code: 'Role Code',
    status: 'Status',
    description: 'Description',
    menuPermissions: 'Menu Permissions',
    menuPermissionsDescription: 'Select accessible menus and button permissions for this role.',
    namePlaceholder: 'Enter role name',
    codePlaceholder: 'Enter role code',
    descriptionPlaceholder: 'Enter role description',
    active: 'Active',
    inactive: 'Inactive',
    selectedCount: 'Selected',
    menuType: {
      directory: 'Directory',
      menu: 'Menu',
      button: 'Button',
    },
  },
  dialog: {
    addTitle: 'Create Role',
    editTitle: 'Edit Role',
    addDescription: 'Create a new role and configure its menus and button permissions.',
    editDescription: 'Adjust role info, status, and menu permissions.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    importHeaders: ['Name', 'Code', 'Description', 'Status', 'Type', 'Sort'],
    deleteTitle: 'Delete',
    resourceName: 'roles',
    deleteFallback: (roleName) => (roleName ? `Delete role "${roleName}"?` : ''),
    permissionTitle: 'Configure Menu Permissions',
    permissionDescription: (roleName) =>
      `Configure accessible menus and buttons for role "${roleName}".`,
    permissionCancel: 'Cancel',
    permissionSubmit: 'Save',
    permissionSubmitting: 'Saving...',
    permissionSaveSuccess: 'Role menu permissions saved',
    permissionSaveFailed: 'Failed to save role menu permissions',
    permissionSelected: (count) => `Selected ${count} menu permissions`,
    permissionClear: 'Clear',
  },
  table: {
    name: 'Role',
    info: 'Info',
    status: 'Status',
    description: 'Description',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    builtIn: 'Built-in',
    custom: 'Custom',
    stats: 'Perms/Users',
    configurePermissions: 'Configure Permissions',
    viewDetails: 'View Details',
    members: 'Members',
  },
  detail: {
    description: 'Role Description',
    status: 'Status',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    linkedUsers: 'Linked Users',
    menuCount: 'Menu Permissions',
    roleType: 'Role Type',
    systemRole: 'Built-in Role',
    customRole: 'Custom Role',
    createdAt: 'Created At',
  },
  users: {
    title: 'Role Members',
    description: 'Review current members and add or remove users from this role.',
    searchPlaceholder: 'Search name, username, or email',
    tabCurrent: 'Current Members',
    tabAdd: 'Add Members',
    emptySearch: 'No matching users',
    emptyCurrent: 'No members yet',
    selectedLabel: 'Selected',
    selectAll: 'Select All',
    removeSelected: 'Remove Selected',
    addSelected: 'Add Selected',
    addSuccess: 'Role members updated',
    removeSuccess: 'Selected members removed',
    loadFailed: 'Failed to load role members',
    addFailed: 'Failed to add role members',
    removeFailed: 'Failed to remove role members',
  },
  search: {
    searchPlaceholder: 'Search role name, code, or description',
    typePlaceholder: 'Role Type',
    typeAll: 'All Types',
    typeSystem: 'Built-in Roles',
    typeCustom: 'Custom Roles',
    statusPlaceholder: 'Status',
    statusAll: 'All Statuses',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    reset: 'Reset',
  },
};

export function getRoleManagementCopy(language: Language): RoleManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}
