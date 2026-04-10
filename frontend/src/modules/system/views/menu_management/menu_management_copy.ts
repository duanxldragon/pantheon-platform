import type { Language } from '../../../../stores/language_store';

type MenuTypeKey = 'directory' | 'menu' | 'button';

export interface MenuStatusHintCopy {
  fieldDescription: string;
  title?: string;
  description?: string;
  tone?: 'info' | 'warning' | 'success';
}

export interface MenuManagementCopy {
  entity: {
    zh: string;
    en: string;
    enPlural: string;
  };
  page: {
    title: string;
  };
  validation: {
    nameRequired: string;
    codeRequired: string;
    typeRequired: string;
    pathRequired: string;
    parentMissing: string;
    parentInactive: string;
    parentSelf: string;
    directoryParent: string;
    buttonParentRequired: string;
    buttonParentType: string;
    menuParentType: string;
    externalPath: string;
    componentRequired: string;
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
  titles: {
    statusNote: string;
    enableImpact: string;
    disableImpact: string;
    confirmBatchDelete: string;
    confirmDelete: string;
    expandAll: string;
    collapseAll: string;
  };
  buttons: {
    batchEnable: (count: number) => string;
    batchDisable: (count: number) => string;
    batchDelete: (count: number) => string;
  };
  table: {
    name: string;
    type: string;
    routePermission: string;
    status: string;
    sort: string;
    actions: string;
    typeDirectory: string;
    typeMenu: string;
    typeButton: string;
    addChild: string;
    edit: string;
    delete: string;
    routePrefix: string;
    permissionPrefix: string;
  };
  search: {
    searchPlaceholder: string;
    typePlaceholder: string;
    typeAll: string;
    typeDirectory: string;
    typeMenu: string;
    typeButton: string;
    statusPlaceholder: string;
    statusAll: string;
    statusEnabled: string;
    statusDisabled: string;
    reset: string;
  };
  dialog: {
    addTitle: string;
    editTitle: string;
    deleteTitle: string;
    deleteFallback: (menuName?: string) => string;
    resourceName: string;
  };
  messages: {
    separator: string;
    batchBlockedItem: (name: string, childCount: number) => string;
    batchBlockedSummary: (details: string, hasMore: boolean) => string;
    deleteBlocked: (menuName: string, childCount: number) => string;
    deleteDescriptionBlocked: (menuName: string, childCount: number) => string;
    deleteDescriptionAffected: (menuName: string, roleCount: number, userCount: number) => string;
    deleteDescriptionStandalone: (menuName: string) => string;
    batchDeleteDescriptionAffected: (count: number, roleCount: number, userCount: number) => string;
    batchDeleteDescriptionStandalone: (count: number) => string;
    statusTitle: (enabled: boolean) => string;
    statusDescriptionAffected: (menuName: string, roleCount: number, userCount: number) => string;
    statusDescriptionStandalone: (menuName: string) => string;
    statusConfirmText: (enabled: boolean) => string;
    statusSuccessAffected: (
      menuName: string,
      enabled: boolean,
      roleCount: number,
      userCount: number,
    ) => string;
    statusSuccessStandalone: (menuName: string, enabled: boolean) => string;
    formStatusNew: string;
    formStatusFieldDescription: string;
    formStatusUnchanged: string;
    formStatusAffected: (roleCount: number, userCount: number) => string;
    formStatusStandalone: (enabled: boolean) => string;
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
    name: string;
    code: string;
    type: string;
    parent: string;
    path: string;
    icon: string;
    component: string;
    sort: string;
    status: string;
    external: string;
    permissionCode: string;
    description: string;
    codeDescription: string;
    typeDescription: string;
    parentDescription: Record<MenuTypeKey, string>;
    pathDescriptionInternal: string;
    pathDescriptionExternal: string;
    componentDescriptionInternal: string;
    componentDescriptionExternal: string;
    componentDescriptionNonMenu: string;
    statusDescriptionDefault: string;
    externalDescription: string;
    permissionDescription: string;
    namePlaceholder: string;
    codePlaceholder: string;
    parentPlaceholder: string;
    routePlaceholderInternal: string;
    routePlaceholderExternal: string;
    iconPlaceholder: string;
    componentPlaceholder: string;
    sortPlaceholder: string;
    permissionPlaceholder: string;
    descriptionPlaceholder: string;
    add: string;
    active: string;
    inactive: string;
    internalMenu: string;
    externalMenu: string;
    typeOption: Record<MenuTypeKey, string>;
    typeHint: Record<MenuTypeKey, { title: string; description: string }>;
    externalTypeHint: { title: string; description: string };
    currentParentPrefix: string;
    externalHintTitle: string;
    externalHintDescription: string;
  };
  templateHeaders: string[];
}

const zhCopy: MenuManagementCopy = {
  entity: {
    zh: '菜单',
    en: 'Menu',
    enPlural: 'menus',
  },
  page: {
    title: '菜单管理',
  },
  validation: {
    nameRequired: '请输入菜单名称。',
    codeRequired: '请输入菜单编码。',
    typeRequired: '请选择菜单类型。',
    pathRequired: '请输入路由路径。',
    parentMissing: '所选上级菜单不存在，请重新选择。',
    parentInactive: '上级菜单已被禁用，请先启用上级菜单。',
    parentSelf: '上级菜单不能选择自己。',
    directoryParent: '目录类型只能挂载在目录下。',
    buttonParentRequired: '按钮类型必须选择一个菜单作为父级。',
    buttonParentType: '按钮类型只能挂载在菜单节点下。',
    menuParentType: '菜单类型不能挂载在按钮节点下。',
    externalPath: '外链菜单的路由路径必须以 http:// 或 https:// 开头。',
    componentRequired: '普通菜单必须配置组件路径。',
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
  titles: {
    statusNote: '状态变更说明',
    enableImpact: '启用风险提示',
    disableImpact: '禁用风险提示',
    confirmBatchDelete: '确认批量删除菜单',
    confirmDelete: '确认删除',
    expandAll: '全部展开',
    collapseAll: '全部收起',
  },
  buttons: {
    batchEnable: (count) => `批量启用 (${count})`,
    batchDisable: (count) => `批量禁用 (${count})`,
    batchDelete: (count) => `批量删除 (${count})`,
  },
  table: {
    name: '菜单',
    type: '类型',
    routePermission: '路由 / 权限',
    status: '状态',
    sort: '排序',
    actions: '操作',
    typeDirectory: '目录',
    typeMenu: '菜单',
    typeButton: '按钮',
    addChild: '新增下级',
    edit: '编辑',
    delete: '删除',
    routePrefix: '路由：',
    permissionPrefix: '权限：',
  },
  search: {
    searchPlaceholder: '搜索菜单名称、路由或权限标识',
    typePlaceholder: '菜单类型',
    typeAll: '全部类型',
    typeDirectory: '目录',
    typeMenu: '菜单',
    typeButton: '按钮',
    statusPlaceholder: '状态',
    statusAll: '全部状态',
    statusEnabled: '启用',
    statusDisabled: '禁用',
    reset: '重置',
  },
  dialog: {
    addTitle: '新增菜单',
    editTitle: '编辑菜单',
    deleteTitle: '删除',
    deleteFallback: (menuName) => (menuName ? `确认删除菜单「${menuName}」？` : ''),
    resourceName: '菜单',
  },
  messages: {
    separator: '；',
    batchBlockedItem: (name, childCount) => `${name}（仍有 ${childCount} 个未选下级菜单）`,
    batchBlockedSummary: (details, hasMore) =>
      `批量删除已拦截：${details}${hasMore ? '；其余菜单也仍存在未选下级菜单' : ''}`,
    deleteBlocked: (menuName, childCount) =>
      `删除已拦截：菜单「${menuName}」仍有 ${childCount} 个下级菜单，请先删除或迁移下级菜单。`,
    deleteDescriptionBlocked: (menuName, childCount) =>
      `菜单「${menuName}」仍有 ${childCount} 个下级菜单，前端已阻断删除。请先处理子菜单。`,
    deleteDescriptionAffected: (menuName, roleCount, userCount) =>
      `确认删除菜单「${menuName}」？预计影响 ${roleCount} 个角色、${userCount} 名角色成员的动态菜单与权限快照，并触发刷新。`,
    deleteDescriptionStandalone: (menuName) =>
      `确认删除菜单「${menuName}」？当前未关联角色，删除后立即生效且不可恢复。`,
    batchDeleteDescriptionAffected: (count, roleCount, userCount) =>
      `确认批量删除 ${count} 个菜单？预计影响 ${roleCount} 个角色、${userCount} 名角色成员的动态菜单与权限快照，并按层级自底向上删除。`,
    batchDeleteDescriptionStandalone: (count) =>
      `确认批量删除 ${count} 个菜单？当前未关联角色，将按层级自底向上删除，且不可恢复。`,
    statusTitle: (enabled) => `确认${enabled ? '启用' : '禁用'}菜单`,
    statusDescriptionAffected: (menuName, roleCount, userCount) =>
      `菜单「${menuName}」状态变更将影响 ${roleCount} 个角色、${userCount} 名角色成员，并触发动态菜单刷新。`,
    statusDescriptionStandalone: (menuName) =>
      `菜单「${menuName}」状态变更将立即生效。当前未关联角色。`,
    statusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    statusSuccessAffected: (menuName, enabled, roleCount, userCount) =>
      `已${enabled ? '启用' : '禁用'}菜单「${menuName}」，影响 ${roleCount} 个角色、${userCount} 名角色成员`,
    statusSuccessStandalone: (menuName, enabled) =>
      `已${enabled ? '启用' : '禁用'}菜单「${menuName}」`,
    formStatusNew: '新建菜单时可先保存为禁用状态，待角色授权和路由配置确认后再启用。',
    formStatusFieldDescription:
      '修改状态后，保存时会再次确认；若菜单已分配给角色，将触发动态菜单刷新。',
    formStatusUnchanged:
      '当前未修改状态；若后续切换启用或禁用，系统会根据角色引用情况提示影响范围。',
    formStatusAffected: (roleCount, userCount) =>
      `当前菜单已关联 ${roleCount} 个角色、${userCount} 名角色成员。保存后将触发动态菜单刷新，并按最新授权快照生效。`,
    formStatusStandalone: (enabled) =>
      `当前菜单未关联角色，${enabled ? '启用' : '禁用'}后会立即生效，但仍需二次确认。`,
    batchStatusTitle: (enabled) => `确认批量${enabled ? '启用' : '禁用'}菜单`,
    batchStatusDescriptionAffected: (count, enabled, roleCount, userCount) =>
      `将批量${enabled ? '启用' : '禁用'} ${count} 个菜单，影响 ${roleCount} 个角色、${userCount} 名角色成员，并触发动态菜单刷新。`,
    batchStatusDescriptionStandalone: (count, enabled) =>
      `将批量${enabled ? '启用' : '禁用'} ${count} 个菜单，当前未关联角色。`,
    batchStatusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    batchStatusSuccessAffected: (count, enabled, roleCount, userCount) =>
      `已批量${enabled ? '启用' : '禁用'} ${count} 个菜单，影响 ${roleCount} 个角色、${userCount} 名角色成员`,
    batchStatusSuccessStandalone: (count, enabled) =>
      `已批量${enabled ? '启用' : '禁用'} ${count} 个菜单`,
  },
  form: {
    name: '菜单名称',
    code: '菜单编码',
    type: '菜单类型',
    parent: '上级菜单',
    path: '路由路径',
    icon: '图标',
    component: '组件路径',
    sort: '排序',
    status: '状态',
    external: '是否外链',
    permissionCode: '权限标识',
    description: '菜单说明',
    codeDescription: '用于系统内部唯一标识菜单。',
    typeDescription: '切换类型后，父级、组件、外链等字段会自动联动调整。',
    parentDescription: {
      button: '按钮必须挂在某个菜单节点下。',
      directory: '目录只能挂在目录下，或作为顶级节点。',
      menu: '菜单可以作为顶级节点，也可以挂在目录或菜单下。',
    },
    pathDescriptionInternal: '例如：/system/user',
    pathDescriptionExternal: '外链地址必须以 http:// 或 https:// 开头。',
    componentDescriptionInternal: '普通菜单必须配置前端页面组件路径。',
    componentDescriptionExternal: '外链菜单不需要本地组件路径。',
    componentDescriptionNonMenu: '目录和按钮不需要组件路径，提交时会自动清空。',
    statusDescriptionDefault: '修改状态后，保存时会再次确认。',
    externalDescription: '启用后菜单将以外部链接打开，不再使用本地组件。',
    permissionDescription: '可为菜单维护一个或多个权限标识。',
    namePlaceholder: '请输入菜单名称',
    codePlaceholder: '请输入菜单编码',
    parentPlaceholder: '请选择上级菜单，不选则为顶级菜单',
    routePlaceholderInternal: '/system/user',
    routePlaceholderExternal: 'https://example.com',
    iconPlaceholder: '请选择图标',
    componentPlaceholder: 'system/user_management',
    sortPlaceholder: '数字越小越靠前',
    permissionPlaceholder: '输入权限标识后按回车，例如 system:user:view',
    descriptionPlaceholder: '请输入菜单说明',
    add: '添加',
    active: '启用',
    inactive: '禁用',
    internalMenu: '内部菜单',
    externalMenu: '外链菜单',
    typeOption: {
      directory: '目录',
      menu: '菜单',
      button: '按钮',
    },
    typeHint: {
      directory: {
        title: '目录类型规则',
        description: '目录只用于承载导航层级，不挂载组件、不允许外链；若选择上级菜单，则上级也必须是目录。',
      },
      button: {
        title: '按钮类型规则',
        description: '按钮必须挂在某个菜单下，不能作为顶级节点，也不能配置组件或外链地址。',
      },
      menu: {
        title: '菜单类型规则',
        description: '普通菜单需要配置前端组件路径；若选择上级节点，上级不能是按钮。',
      },
    },
    externalTypeHint: {
      title: '外链菜单规则',
      description: '外链菜单的路径必须以 http:// 或 https:// 开头，且不再配置本地组件路径。',
    },
    currentParentPrefix: '当前父级：',
    externalHintTitle: '外链菜单提示',
    externalHintDescription: '外链菜单只保留菜单节点和跳转地址，不参与本地页面组件挂载。',
  },
  templateHeaders: ['名称', '编码', '上级ID', '类型', '路径', '图标', '权限标识', '排序'],
};

const enCopy: MenuManagementCopy = {
  entity: {
    zh: '菜单',
    en: 'Menu',
    enPlural: 'menus',
  },
  page: {
    title: 'Menu Management',
  },
  validation: {
    nameRequired: 'Please enter the menu name.',
    codeRequired: 'Please enter the menu code.',
    typeRequired: 'Please select the menu type.',
    pathRequired: 'Please enter the route path.',
    parentMissing: 'The selected parent menu does not exist.',
    parentInactive: 'The selected parent menu is inactive.',
    parentSelf: 'The parent menu cannot be itself.',
    directoryParent: 'A directory can only be placed under another directory.',
    buttonParentRequired: 'A button must have a parent menu.',
    buttonParentType: 'A button can only be placed under a menu node.',
    menuParentType: 'A menu cannot be placed under a button node.',
    externalPath: 'External menu paths must start with http:// or https://.',
    componentRequired: 'A regular menu must have a component path.',
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
  titles: {
    statusNote: 'Status change note',
    enableImpact: 'Enable impact preview',
    disableImpact: 'Disable impact preview',
    confirmBatchDelete: 'Confirm batch delete menus',
    confirmDelete: 'Delete',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
  },
  buttons: {
    batchEnable: (count) => `Enable (${count})`,
    batchDisable: (count) => `Disable (${count})`,
    batchDelete: (count) => `Delete (${count})`,
  },
  table: {
    name: 'Menu',
    type: 'Type',
    routePermission: 'Route / Permission',
    status: 'Status',
    sort: 'Sort',
    actions: 'Actions',
    typeDirectory: 'Directory',
    typeMenu: 'Menu',
    typeButton: 'Button',
    addChild: 'Add Child',
    edit: 'Edit',
    delete: 'Delete',
    routePrefix: 'URL:',
    permissionPrefix: 'Perm:',
  },
  search: {
    searchPlaceholder: 'Search menu name, route, or permission code',
    typePlaceholder: 'Menu Type',
    typeAll: 'All Types',
    typeDirectory: 'Directory',
    typeMenu: 'Menu',
    typeButton: 'Button',
    statusPlaceholder: 'Status',
    statusAll: 'All Statuses',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    reset: 'Reset',
  },
  dialog: {
    addTitle: 'Create Menu',
    editTitle: 'Edit Menu',
    deleteTitle: 'Delete',
    deleteFallback: (menuName) => (menuName ? `Delete menu "${menuName}"?` : ''),
    resourceName: 'menus',
  },
  messages: {
    separator: '; ',
    batchBlockedItem: (name, childCount) =>
      `${name} (${childCount} unselected child menus remain)`,
    batchBlockedSummary: (details, hasMore) =>
      `Batch delete blocked: ${details}${hasMore ? '; other menus also still have unselected child menus' : ''}`,
    deleteBlocked: (menuName, childCount) =>
      `Delete blocked: menu "${menuName}" still has ${childCount} child menus. Remove or move child menus first.`,
    deleteDescriptionBlocked: (menuName, childCount) =>
      `Menu "${menuName}" still has ${childCount} child menus. Deletion is blocked until child menus are handled.`,
    deleteDescriptionAffected: (menuName, roleCount, userCount) =>
      `Delete menu "${menuName}"? This is expected to affect ${roleCount} roles and ${userCount} role members, and refresh their menu snapshot.`,
    deleteDescriptionStandalone: (menuName) =>
      `Delete menu "${menuName}"? It is not linked to any role and the action cannot be undone.`,
    batchDeleteDescriptionAffected: (count, roleCount, userCount) =>
      `Delete ${count} menus? This is expected to affect ${roleCount} roles and ${userCount} role members, and menus will be deleted from leaf to root.`,
    batchDeleteDescriptionStandalone: (count) =>
      `Delete ${count} menus? They are not linked to any role and will be deleted from leaf to root. This cannot be undone.`,
    statusTitle: (enabled) => `Confirm ${enabled ? 'enable' : 'disable'} menu`,
    statusDescriptionAffected: (menuName, roleCount, userCount) =>
      `Changing menu "${menuName}" will affect ${roleCount} roles and ${userCount} role members, and refresh their menu snapshot.`,
    statusDescriptionStandalone: (menuName) =>
      `Changing menu "${menuName}" takes effect immediately. It is not linked to any role.`,
    statusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    statusSuccessAffected: (menuName, enabled, roleCount, userCount) =>
      `Menu "${menuName}" ${enabled ? 'enabled' : 'disabled'}. ${roleCount} roles and ${userCount} role members were affected.`,
    statusSuccessStandalone: (menuName, enabled) =>
      `Menu "${menuName}" ${enabled ? 'enabled' : 'disabled'}.`,
    formStatusNew:
      'New menus can be saved as inactive first and enabled after role binding and route checks are ready.',
    formStatusFieldDescription:
      'If you change the status, saving will require confirmation and may refresh dynamic menus for linked roles.',
    formStatusUnchanged:
      'Status is unchanged. If you switch it later, the system will preview the impact based on linked roles.',
    formStatusAffected: (roleCount, userCount) =>
      `This menu is linked to ${roleCount} roles and ${userCount} role members. Saving will refresh dynamic menus and apply the latest authorization snapshot.`,
    formStatusStandalone: (enabled) =>
      `This menu is not linked to any role. ${enabled ? 'Enabling' : 'Disabling'} it takes effect immediately, but still requires confirmation.`,
    batchStatusTitle: (enabled) => `Confirm batch ${enabled ? 'enable' : 'disable'} menus`,
    batchStatusDescriptionAffected: (count, enabled, roleCount, userCount) =>
      `This will ${enabled ? 'enable' : 'disable'} ${count} menus, affect ${roleCount} roles and ${userCount} role members, and refresh their menu snapshots.`,
    batchStatusDescriptionStandalone: (count, enabled) =>
      `This will ${enabled ? 'enable' : 'disable'} ${count} menus and currently affects no roles.`,
    batchStatusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    batchStatusSuccessAffected: (count, enabled, roleCount, userCount) =>
      `${count} menus ${enabled ? 'enabled' : 'disabled'}. ${roleCount} roles and ${userCount} role members were affected.`,
    batchStatusSuccessStandalone: (count, enabled) =>
      `${count} menus ${enabled ? 'enabled' : 'disabled'}.`,
  },
  form: {
    name: 'Menu Name',
    code: 'Menu Code',
    type: 'Menu Type',
    parent: 'Parent Menu',
    path: 'Route Path',
    icon: 'Icon',
    component: 'Component Path',
    sort: 'Sort',
    status: 'Status',
    external: 'External Link',
    permissionCode: 'Permission Codes',
    description: 'Description',
    codeDescription: 'Used as the unique internal identifier for the menu.',
    typeDescription: 'Switching type auto-adjusts parent, component, and external-link related fields.',
    parentDescription: {
      button: 'A button must be placed under a menu node.',
      directory: 'A directory can stay under another directory or at the top level.',
      menu: 'A menu can be top-level or nested under a directory or menu.',
    },
    pathDescriptionInternal: 'Example: /system/user',
    pathDescriptionExternal: 'External links must start with http:// or https://.',
    componentDescriptionInternal: 'Regular menus require a frontend component path.',
    componentDescriptionExternal: 'External menus do not require a local component path.',
    componentDescriptionNonMenu:
      'Directories and buttons do not need a component path and it will be cleared on submit.',
    statusDescriptionDefault: 'Status changes require confirmation before saving.',
    externalDescription: 'When enabled, the menu opens as an external link instead of a local component.',
    permissionDescription: 'You can maintain one or more permission codes for this menu.',
    namePlaceholder: 'Enter menu name',
    codePlaceholder: 'Enter menu code',
    parentPlaceholder: 'Select a parent menu, or leave empty for top level',
    routePlaceholderInternal: '/system/user',
    routePlaceholderExternal: 'https://example.com',
    iconPlaceholder: 'Select icon',
    componentPlaceholder: 'system/user_management',
    sortPlaceholder: 'Smaller numbers appear first',
    permissionPlaceholder: 'Enter a permission code and press Enter, e.g. system:user:view',
    descriptionPlaceholder: 'Enter menu description',
    add: 'Add',
    active: 'Active',
    inactive: 'Inactive',
    internalMenu: 'Internal Menu',
    externalMenu: 'External Menu',
    typeOption: {
      directory: 'Directory',
      menu: 'Menu',
      button: 'Button',
    },
    typeHint: {
      directory: {
        title: 'Directory Rules',
        description:
          'Directories only organize navigation levels. They do not mount components or external links, and their parent must also be a directory.',
      },
      button: {
        title: 'Button Rules',
        description:
          'Buttons must stay under a menu node and cannot be top-level, external, or bound to a component.',
      },
      menu: {
        title: 'Menu Rules',
        description:
          'Regular menus require a frontend component path, and their parent cannot be a button.',
      },
    },
    externalTypeHint: {
      title: 'External Menu Rules',
      description:
        'External menus must use an http(s) URL and do not need a local component path.',
    },
    currentParentPrefix: 'Current parent: ',
    externalHintTitle: 'External Menu Note',
    externalHintDescription:
      'External menus only keep the node and target URL, and do not participate in local view mounting.',
  },
  templateHeaders: ['Name', 'Code', 'ParentId', 'Type', 'Path', 'Icon', 'Permission', 'Sort'],
};

export function getMenuManagementCopy(language: Language): MenuManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}


