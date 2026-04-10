import type { Language } from '../../../../stores/language_store';

export interface PositionManagementCopy {
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
    departmentRequired: string;
    departmentMissing: string;
    departmentInactive: string;
  };
  actionLabels: {
    add: string;
    edit: string;
    delete: string;
    import: string;
    export: string;
    members: string;
    detail: string;
    batchUpdate: string;
    batchDelete: string;
    batchEnable: string;
    batchDisable: string;
  };
  buttons: {
    batchEnable: (count: number) => string;
    batchDisable: (count: number) => string;
    batchDelete: (count: number) => string;
  };
  messages: {
    statusTitle: (enabled: boolean) => string;
    statusDescription: (positionName: string, enabled: boolean, affectedUsers: number) => string;
    statusConfirmText: (enabled: boolean) => string;
    statusSuccess: (positionName: string, enabled: boolean, affectedUsers: number) => string;
    batchTitle: (mode: 'enable' | 'disable' | 'delete') => string;
    batchDescription: (
      mode: 'enable' | 'disable' | 'delete',
      count: number,
      affectedUsers: number,
    ) => string;
    batchConfirmText: (mode: 'enable' | 'disable' | 'delete') => string;
    batchSuccess: (
      mode: 'enable' | 'disable' | 'delete',
      count: number,
      affectedUsers: number,
    ) => string;
    deleteDescription: (positionName: string, affectedUsers: number) => string;
    assignSuccess: (name: string, count: number) => string;
    unassignSuccess: (name: string) => string;
  };
  form: {
    name: string;
    code: string;
    department: string;
    departmentDescription: string;
    category: string;
    level: string;
    sort: string;
    status: string;
    responsibilities: string;
    requirements: string;
    description: string;
    namePlaceholder: string;
    codePlaceholder: string;
    departmentPlaceholder: string;
    categoryPlaceholder: string;
    levelPlaceholder: string;
    sortPlaceholder: string;
    responsibilitiesPlaceholder: string;
    requirementsPlaceholder: string;
    descriptionPlaceholder: string;
    active: string;
    inactive: string;
    relationTitle: string;
    relationDescription: string;
    currentDepartmentPrefix: string;
    categories: Array<{ value: string; label: string }>;
    levels: Array<{ value: number; label: string }>;
  };
  dialog: {
    addTitle: string;
    editTitle: string;
    importHeaders: string[];
    deleteFallback: (positionName?: string) => string;
  };
  users: {
    title: string;
    description: string;
    currentTab: string;
    assignTab: string;
    searchPlaceholder: string;
    emptyCurrent: string;
    emptyAvailable: string;
    selectedSummary: (selected: number, total: number) => string;
    selectAll: string;
    assignAction: string;
    confirmAssignTitle: string;
    confirmRemoveTitle: string;
    confirmAssignText: string;
    confirmRemoveText: string;
    cancelText: string;
    assignDescription: (positionName: string, count: number) => string;
    removeDescription: (positionName: string, username: string) => string;
    levelLabels: string[];
  };
  table: {
    name: string;
    department: string;
    level: string;
    users: string;
    status: string;
    description: string;
    actions: string;
  };
  search: {
    searchPlaceholder: string;
    departmentPlaceholder: string;
    departmentAll: string;
    levelPlaceholder: string;
    levelAll: string;
    levelL1: string;
    levelL2: string;
    levelL3: string;
    statusPlaceholder: string;
    statusAll: string;
    statusActive: string;
    statusInactive: string;
    reset: string;
  };
}

const categoryValues = ['技术岗', '产品岗', '运营岗', '管理岗', '其他'];

const zhCopy: PositionManagementCopy = {
  entity: {
    zh: '岗位',
    en: 'Position',
    enPlural: 'positions',
  },
  page: {
    title: '岗位管理',
  },
  validation: {
    nameRequired: '请输入岗位名称。',
    codeRequired: '请输入岗位编码。',
    departmentRequired: '请选择所属部门。',
    departmentMissing: '所选部门不存在，请重新选择。',
    departmentInactive: '所属部门已被禁用，请先启用部门。',
  },
  actionLabels: {
    add: '新增',
    edit: '编辑',
    delete: '删除',
    import: '导入',
    export: '导出',
    members: '成员分配',
    detail: '详情',
    batchUpdate: '批量状态变更',
    batchDelete: '批量删除',
    batchEnable: '批量启用',
    batchDisable: '批量禁用',
  },
  buttons: {
    batchEnable: (count) => `批量启用 (${count})`,
    batchDisable: (count) => `批量禁用 (${count})`,
    batchDelete: (count) => `批量删除 (${count})`,
  },
  messages: {
    statusTitle: (enabled) => `确认${enabled ? '启用' : '禁用'}岗位`,
    statusDescription: (positionName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `岗位“${positionName}”状态变更后，将影响 ${affectedUsers} 名用户，并触发权限刷新。请确认后继续。`
        : `岗位“${positionName}”${enabled ? '启用' : '禁用'}后会立即生效，不影响现有成员权限。请确认后继续。`,
    statusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    statusSuccess: (positionName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `已将岗位“${positionName}”${enabled ? '启用' : '禁用'}，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
        : `已将岗位“${positionName}”${enabled ? '启用' : '禁用'}`,
    batchTitle: (mode) =>
      mode === 'delete'
        ? '确认批量删除岗位'
        : `确认批量${mode === 'enable' ? '启用' : '禁用'}岗位`,
    batchDescription: (mode, count, affectedUsers) =>
      mode === 'delete'
        ? `将删除 ${count} 个岗位，预计影响 ${affectedUsers} 名关联用户，并触发权限刷新。请确认后继续。`
        : `将${mode === 'enable' ? '启用' : '禁用'} ${count} 个岗位，预计影响 ${affectedUsers} 名用户，并触发权限刷新。请确认后继续。`,
    batchConfirmText: (mode) =>
      mode === 'delete' ? '确认删除' : `确认${mode === 'enable' ? '启用' : '禁用'}`,
    batchSuccess: (mode, count, affectedUsers) =>
      mode === 'delete'
        ? `已删除 ${count} 个岗位，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
        : `已${mode === 'enable' ? '启用' : '禁用'} ${count} 个岗位，影响 ${affectedUsers} 名用户，相关用户权限已刷新`,
    deleteDescription: (positionName, affectedUsers) =>
      affectedUsers > 0
        ? `确认删除岗位“${positionName}”？删除后将影响 ${affectedUsers} 名用户，并触发权限刷新。该操作不可恢复。`
        : `确认删除岗位“${positionName}”？当前岗位无关联成员，删除后立即生效且不可恢复。`,
    assignSuccess: (name, count) => `已为岗位“${name}”分配 ${count} 名成员，相关用户权限已刷新`,
    unassignSuccess: (name) => `已从岗位“${name}”移除成员，相关用户权限已刷新`,
  },
  form: {
    name: '岗位名称',
    code: '岗位编码',
    department: '所属部门',
    departmentDescription: '岗位必须归属到一个有效部门。',
    category: '岗位类别',
    level: '岗位级别',
    sort: '排序',
    status: '状态',
    responsibilities: '岗位职责',
    requirements: '任职要求',
    description: '岗位说明',
    namePlaceholder: '请输入岗位名称',
    codePlaceholder: '请输入岗位编码',
    departmentPlaceholder: '请选择所属部门',
    categoryPlaceholder: '请选择岗位类别',
    levelPlaceholder: '请选择岗位级别',
    sortPlaceholder: '数字越小越靠前',
    responsibilitiesPlaceholder: '请输入岗位职责',
    requirementsPlaceholder: '请输入任职要求',
    descriptionPlaceholder: '请输入岗位说明',
    active: '启用',
    inactive: '禁用',
    relationTitle: '归属关系提示',
    relationDescription: '岗位保存前会校验所属部门是否存在且处于启用状态。',
    currentDepartmentPrefix: '当前部门：',
    categories: [
      { value: categoryValues[0], label: '技术岗' },
      { value: categoryValues[1], label: '产品岗' },
      { value: categoryValues[2], label: '运营岗' },
      { value: categoryValues[3], label: '管理岗' },
      { value: categoryValues[4], label: '其他' },
    ],
    levels: [
      { value: 1, label: 'P1 - 初级' },
      { value: 2, label: 'P2 - 中级' },
      { value: 3, label: 'P3 - 高级' },
      { value: 4, label: 'P4 - 资深' },
      { value: 5, label: 'P5 - 专家' },
    ],
  },
  dialog: {
    addTitle: '新增岗位',
    editTitle: '编辑岗位',
    importHeaders: ['名称', '编码', '部门ID', '级别', '排序', '说明'],
    deleteFallback: (positionName) => (positionName ? `确认删除岗位“${positionName}”？` : ''),
  },
  users: {
    title: '岗位成员分配',
    description: '管理岗位成员，支持分配用户、移出用户，并触发相关权限刷新。',
    currentTab: '当前成员',
    assignTab: '分配成员',
    searchPlaceholder: '搜索用户名、姓名或邮箱',
    emptyCurrent: '当前岗位暂无成员',
    emptyAvailable: '暂无可分配的用户',
    selectedSummary: (selected, total) => `已选 ${selected} / ${total}`,
    selectAll: '全选当前列表',
    assignAction: '分配到岗位',
    confirmAssignTitle: '确认分配成员',
    confirmRemoveTitle: '确认移出成员',
    confirmAssignText: '确认分配',
    confirmRemoveText: '确认移出',
    cancelText: '取消',
    assignDescription: (positionName, count) =>
      `本次将为岗位“${positionName}”分配 ${count} 名成员，并触发相关用户的权限刷新。`,
    removeDescription: (positionName, username) =>
      `本次将从岗位“${positionName}”移出成员“${username}”，并触发该用户的权限刷新。`,
    levelLabels: ['', 'P1-初级', 'P2-中级', 'P3-高级', 'P4-资深', 'P5-专家'],
  },
  table: {
    name: '岗位',
    department: '部门',
    level: '级别',
    users: '成员数',
    status: '状态',
    description: '说明',
    actions: '操作',
  },
  search: {
    searchPlaceholder: '搜索岗位名称、编码或说明',
    departmentPlaceholder: '所属部门',
    departmentAll: '全部部门',
    levelPlaceholder: '岗位级别',
    levelAll: '全部级别',
    levelL1: 'L1',
    levelL2: 'L2',
    levelL3: 'L3',
    statusPlaceholder: '岗位状态',
    statusAll: '全部状态',
    statusActive: '启用',
    statusInactive: '禁用',
    reset: '重置',
  },
};

const enCopy: PositionManagementCopy = {
  entity: {
    zh: '岗位',
    en: 'Position',
    enPlural: 'positions',
  },
  page: {
    title: 'Position Management',
  },
  validation: {
    nameRequired: 'Please enter the position name.',
    codeRequired: 'Please enter the position code.',
    departmentRequired: 'Please select a department.',
    departmentMissing: 'The selected department does not exist.',
    departmentInactive: 'The selected department is inactive.',
  },
  actionLabels: {
    add: 'create',
    edit: 'edit',
    delete: 'delete',
    import: 'import',
    export: 'export',
    members: 'member assignment',
    detail: 'details',
    batchUpdate: 'batch status update',
    batchDelete: 'batch delete',
    batchEnable: 'batch enable',
    batchDisable: 'batch disable',
  },
  buttons: {
    batchEnable: (count) => `Enable (${count})`,
    batchDisable: (count) => `Disable (${count})`,
    batchDelete: (count) => `Delete (${count})`,
  },
  messages: {
    statusTitle: (enabled) => `Confirm ${enabled ? 'enable' : 'disable'} position`,
    statusDescription: (positionName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `Changing the status of position "${positionName}" will affect ${affectedUsers} users and refresh their authorization snapshot.`
        : `${enabled ? 'Enabling' : 'Disabling'} position "${positionName}" takes effect immediately and does not affect existing users.`,
    statusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    statusSuccess: (positionName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `Position "${positionName}" has been ${enabled ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and refreshed.`
        : `Position "${positionName}" has been ${enabled ? 'enabled' : 'disabled'}.`,
    batchTitle: (mode) =>
      mode === 'delete'
        ? 'Confirm batch delete positions'
        : `Confirm batch ${mode === 'enable' ? 'enable' : 'disable'} positions`,
    batchDescription: (mode, count, affectedUsers) =>
      mode === 'delete'
        ? `This will delete ${count} positions, affect ${affectedUsers} users, and refresh their authorization snapshot.`
        : `This will ${mode === 'enable' ? 'enable' : 'disable'} ${count} positions, affect ${affectedUsers} users, and refresh their authorization snapshot.`,
    batchConfirmText: (mode) =>
      mode === 'delete' ? 'Delete' : mode === 'enable' ? 'Enable' : 'Disable',
    batchSuccess: (mode, count, affectedUsers) =>
      mode === 'delete'
        ? `Deleted ${count} positions. ${affectedUsers} users were affected and refreshed.`
        : `${count} positions have been ${mode === 'enable' ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and refreshed.`,
    deleteDescription: (positionName, affectedUsers) =>
      affectedUsers > 0
        ? `Delete position "${positionName}"? This will affect ${affectedUsers} users and refresh their authorization snapshot.`
        : `Delete position "${positionName}"? It currently has no related users. This action cannot be undone.`,
    assignSuccess: (name, count) =>
      `Assigned ${count} members to position "${name}". Related user permissions were refreshed.`,
    unassignSuccess: (name) =>
      `Removed a member from position "${name}". Related user permissions were refreshed.`,
  },
  form: {
    name: 'Position Name',
    code: 'Position Code',
    department: 'Department',
    departmentDescription: 'A position must belong to a valid department.',
    category: 'Category',
    level: 'Level',
    sort: 'Sort',
    status: 'Status',
    responsibilities: 'Responsibilities',
    requirements: 'Requirements',
    description: 'Description',
    namePlaceholder: 'Enter position name',
    codePlaceholder: 'Enter position code',
    departmentPlaceholder: 'Select department',
    categoryPlaceholder: 'Select category',
    levelPlaceholder: 'Select level',
    sortPlaceholder: 'Smaller numbers appear first',
    responsibilitiesPlaceholder: 'Enter responsibilities',
    requirementsPlaceholder: 'Enter requirements',
    descriptionPlaceholder: 'Enter position description',
    active: 'Active',
    inactive: 'Inactive',
    relationTitle: 'Assignment Hint',
    relationDescription: 'Before saving, the system validates that the selected department exists and is active.',
    currentDepartmentPrefix: 'Current department: ',
    categories: [
      { value: categoryValues[0], label: 'Technical' },
      { value: categoryValues[1], label: 'Product' },
      { value: categoryValues[2], label: 'Operations' },
      { value: categoryValues[3], label: 'Management' },
      { value: categoryValues[4], label: 'Other' },
    ],
    levels: [
      { value: 1, label: 'P1 - Junior' },
      { value: 2, label: 'P2 - Mid' },
      { value: 3, label: 'P3 - Senior' },
      { value: 4, label: 'P4 - Staff' },
      { value: 5, label: 'P5 - Principal' },
    ],
  },
  dialog: {
    addTitle: 'Create Position',
    editTitle: 'Edit Position',
    importHeaders: ['Name', 'Code', 'DepartmentId', 'Level', 'Sort', 'Description'],
    deleteFallback: (positionName) => (positionName ? `Delete position "${positionName}"?` : ''),
  },
  users: {
    title: 'Position Assignment',
    description: 'Manage position users, including assignment, removal, and permission refresh.',
    currentTab: 'Current Members',
    assignTab: 'Assign Members',
    searchPlaceholder: 'Search by username, name, or email',
    emptyCurrent: 'No users assigned to this position',
    emptyAvailable: 'No available users to assign',
    selectedSummary: (selected, total) => `Selected ${selected} / ${total}`,
    selectAll: 'Select Current List',
    assignAction: 'Assign to Position',
    confirmAssignTitle: 'Confirm Assign Members',
    confirmRemoveTitle: 'Confirm Remove Member',
    confirmAssignText: 'Confirm Assign',
    confirmRemoveText: 'Confirm Remove',
    cancelText: 'Cancel',
    assignDescription: (positionName, count) =>
      `This will assign ${count} users to "${positionName}" and refresh related user permissions.`,
    removeDescription: (positionName, username) =>
      `This will remove "${username}" from "${positionName}" and refresh that user's permissions.`,
    levelLabels: ['', 'P1-Junior', 'P2-Mid', 'P3-Senior', 'P4-Staff', 'P5-Expert'],
  },
  table: {
    name: 'Position',
    department: 'Department',
    level: 'Level',
    users: 'Users',
    status: 'Status',
    description: 'Description',
    actions: 'Actions',
  },
  search: {
    searchPlaceholder: 'Search position name, code, or description',
    departmentPlaceholder: 'Department',
    departmentAll: 'All Departments',
    levelPlaceholder: 'Level',
    levelAll: 'All Levels',
    levelL1: 'L1',
    levelL2: 'L2',
    levelL3: 'L3',
    statusPlaceholder: 'Status',
    statusAll: 'All Statuses',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    reset: 'Reset',
  },
};

export function getPositionManagementCopy(language: Language): PositionManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}

