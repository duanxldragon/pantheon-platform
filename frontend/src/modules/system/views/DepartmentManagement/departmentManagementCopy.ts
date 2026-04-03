import type { Language } from '../../../../stores/languageStore';

export interface DepartmentManagementCopy {
  entity: {
    zh: string;
    en: string;
    enPlural: string;
  };
  page: {
    title: string;
    searchPlaceholder: string;
  };
  actionLabels: {
    add: string;
    edit: string;
    delete: string;
    import: string;
    export: string;
    memberAssign: string;
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
  titles: {
    expandAll: string;
    collapseAll: string;
    addDialog: string;
    editDialog: string;
  };
  validation: {
    nameRequired: string;
    codeRequired: string;
    emailInvalid: string;
    leaderMissing: string;
    parentMissing: string;
    parentInactive: string;
    parentSelf: string;
    parentDescendant: string;
  };
  messages: {
    detailSeparator: string;
    namesSeparator: string;
    moreSuffix: string;
    directChildrenLabel: (count: number) => string;
    directMembersLabel: (count: number) => string;
    deleteBlockedItem: (name: string, details: string) => string;
    deleteBlockedSummary: (details: string, isBatch: boolean, hasMore: boolean) => string;
    deleteDescription: (departmentName: string) => string;
    statusTitle: (enabled: boolean) => string;
    statusDescription: (departmentName: string, enabled: boolean, affectedUsers: number) => string;
    statusConfirmText: (enabled: boolean) => string;
    statusSuccess: (departmentName: string, enabled: boolean, affectedUsers: number) => string;
    batchDeleteTitle: string;
    batchDeleteDescription: (
      selectedCount: number,
      descendantCount: number,
      affectedUsers: number,
    ) => string;
    batchDeleteSuccess: (count: number, preview: string) => string;
    batchStatusTitle: (enabled: boolean) => string;
    batchStatusDescription: (count: number, enabled: boolean, affectedUsers: number) => string;
    batchStatusConfirmText: (enabled: boolean) => string;
    batchStatusSuccess: (count: number, enabled: boolean, affectedUsers: number) => string;
    addMembersSuccess: (departmentName: string, count: number) => string;
    removeMemberSuccess: (departmentName: string) => string;
  };
  form: {
    name: string;
    code: string;
    codeDescription: string;
    parent: string;
    parentDescription: string;
    leader: string;
    leaderDescription: string;
    phone: string;
    email: string;
    sort: string;
    status: string;
    description: string;
    namePlaceholder: string;
    codePlaceholder: string;
    parentPlaceholder: string;
    leaderPlaceholder: string;
    none: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    sortPlaceholder: string;
    descriptionPlaceholder: string;
    active: string;
    inactive: string;
    relationTitle: string;
    relationDescription: string;
    currentParentPrefix: string;
  };
  dialog: {
    importHeaders: string[];
    deleteFallback: (departmentName?: string) => string;
  };
  members: {
    title: string;
    description: string;
    currentTab: string;
    addTab: string;
    searchPlaceholder: string;
    emptyCurrent: string;
    emptyAvailable: string;
    selectedSummary: (selected: number, total: number) => string;
    selectAll: string;
    addAction: string;
    confirmAddTitle: string;
    confirmRemoveTitle: string;
    confirmAddText: string;
    confirmRemoveText: string;
    cancelText: string;
    addDescription: (departmentName: string, count: number) => string;
    removeDescription: (departmentName: string, username: string) => string;
  };
  table: {
    name: string;
    leader: string;
    noLeader: string;
    contact: string;
    members: string;
    status: string;
    actions: string;
    addSubDepartment: string;
    memberDetails: string;
  };
}

const zhCopy: DepartmentManagementCopy = {
  entity: {
    zh: '部门',
    en: 'Department',
    enPlural: 'departments',
  },
  page: {
    title: '部门管理',
    searchPlaceholder: '搜索部门名称、编码或负责人',
  },
  actionLabels: {
    add: '新增',
    edit: '编辑',
    delete: '删除',
    import: '导入',
    export: '导出',
    memberAssign: '成员分配',
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
  titles: {
    expandAll: '全部展开',
    collapseAll: '全部收起',
    addDialog: '新增部门',
    editDialog: '编辑部门',
  },
  validation: {
    nameRequired: '请输入部门名称。',
    codeRequired: '请输入部门编码。',
    emailInvalid: '请输入正确的邮箱地址。',
    leaderMissing: '所选负责人不存在，请重新选择。',
    parentMissing: '所选上级部门不存在，请重新选择。',
    parentInactive: '上级部门已被禁用，请先启用上级部门。',
    parentSelf: '上级部门不能选择自己。',
    parentDescendant: '上级部门不能选择当前部门或其下级部门。',
  },
  messages: {
    detailSeparator: '；',
    namesSeparator: '、',
    moreSuffix: ' 等',
    directChildrenLabel: (count) => `${count} 个直属下级部门`,
    directMembersLabel: (count) => `${count} 名直属成员`,
    deleteBlockedItem: (name, details) => `${name}（${details}）`,
    deleteBlockedSummary: (details, isBatch, hasMore) =>
      `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${hasMore ? '；其余部门也存在直属下级或直属成员' : ''}`,
    deleteDescription: (departmentName) =>
      `确认删除部门“${departmentName}”？当前部门无直属下级部门、无直属成员，删除后立即生效且不可恢复。`,
    statusTitle: (enabled) => `确认${enabled ? '启用' : '禁用'}部门`,
    statusDescription: (departmentName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `部门“${departmentName}”状态变更后，将影响 ${affectedUsers} 名用户，并触发权限刷新。请确认后继续。`
        : `部门“${departmentName}”${enabled ? '启用' : '禁用'}后会立即生效，不影响现有成员权限。请确认后继续。`,
    statusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    statusSuccess: (departmentName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `已将部门“${departmentName}”${enabled ? '启用' : '禁用'}，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
        : `已将部门“${departmentName}”${enabled ? '启用' : '禁用'}`,
    batchDeleteTitle: '确认批量删除部门',
    batchDeleteDescription: (selectedCount, descendantCount, affectedUsers) =>
      `将删除 ${selectedCount} 个部门，涉及 ${descendantCount} 个下级部门、${affectedUsers} 名关联用户。若所选部门仍有直属下级或直属成员，后端会拒绝删除。`,
    batchDeleteSuccess: (count, preview) =>
      `已提交删除 ${count} 个部门${preview ? `（${preview}）` : ''}`,
    batchStatusTitle: (enabled) => `确认批量${enabled ? '启用' : '禁用'}部门`,
    batchStatusDescription: (count, enabled, affectedUsers) =>
      `将${enabled ? '启用' : '禁用'} ${count} 个部门，预计影响 ${affectedUsers} 名用户，并触发权限刷新。`,
    batchStatusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    batchStatusSuccess: (count, enabled, affectedUsers) =>
      `已${enabled ? '启用' : '禁用'} ${count} 个部门，影响 ${affectedUsers} 名用户，相关用户权限已刷新`,
    addMembersSuccess: (departmentName, count) =>
      `已为部门“${departmentName}”添加 ${count} 名成员，相关用户权限已刷新`,
    removeMemberSuccess: (departmentName) =>
      `已从部门“${departmentName}”移除成员，相关用户权限已刷新`,
  },
  form: {
    name: '部门名称',
    code: '部门编码',
    codeDescription: '用于系统内部唯一标识部门。',
    parent: '上级部门',
    parentDescription: '上级部门必须存在并且处于启用状态。',
    leader: '负责人',
    leaderDescription: '负责人以用户身份保存，便于后续权限与组织关系扩展。',
    phone: '联系电话',
    email: '邮箱',
    sort: '排序',
    status: '状态',
    description: '部门说明',
    namePlaceholder: '请输入部门名称',
    codePlaceholder: '请输入部门编码',
    parentPlaceholder: '请选择上级部门，不选则为顶级部门',
    leaderPlaceholder: '请选择负责人',
    none: '无',
    phonePlaceholder: '请输入联系电话',
    emailPlaceholder: '请输入邮箱地址',
    sortPlaceholder: '数字越小越靠前',
    descriptionPlaceholder: '请输入部门说明',
    active: '启用',
    inactive: '禁用',
    relationTitle: '层级关系提示',
    relationDescription:
      '部门不能选择自己或自己的下级部门作为父级；保存时后端会再次校验。',
    currentParentPrefix: '当前父级：',
  },
  dialog: {
    importHeaders: ['名称', '编码', '上级部门ID', '负责人', '电话', '邮箱', '排序'],
    deleteFallback: (departmentName) =>
      departmentName ? `确认删除部门“${departmentName}”？` : '',
  },
  members: {
    title: '部门成员管理',
    description: '管理部门成员，支持添加成员、移出成员，并触发相关权限刷新。',
    currentTab: '当前成员',
    addTab: '添加成员',
    searchPlaceholder: '搜索用户名、姓名或邮箱',
    emptyCurrent: '当前部门暂无成员',
    emptyAvailable: '暂无可添加的用户',
    selectedSummary: (selected, total) => `已选 ${selected} / ${total}`,
    selectAll: '全选当前列表',
    addAction: '添加到部门',
    confirmAddTitle: '确认添加成员',
    confirmRemoveTitle: '确认移出成员',
    confirmAddText: '确认添加',
    confirmRemoveText: '确认移出',
    cancelText: '取消',
    addDescription: (departmentName, count) =>
      `本次将为部门“${departmentName}”添加 ${count} 名成员，并触发相关用户的权限刷新。`,
    removeDescription: (departmentName, username) =>
      `本次将从部门“${departmentName}”移出成员“${username}”，并触发该用户的权限刷新。`,
  },
  table: {
    name: '部门',
    leader: '负责人',
    noLeader: '未设置',
    contact: '联系信息',
    members: '成员数',
    status: '状态',
    actions: '操作',
    addSubDepartment: '新增下级部门',
    memberDetails: '成员管理',
  },
};

const enCopy: DepartmentManagementCopy = {
  entity: {
    zh: '部门',
    en: 'Department',
    enPlural: 'departments',
  },
  page: {
    title: 'Department Management',
    searchPlaceholder: 'Search by department name, code, or leader',
  },
  actionLabels: {
    add: 'create',
    edit: 'edit',
    delete: 'delete',
    import: 'import',
    export: 'export',
    memberAssign: 'member assignment',
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
  titles: {
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    addDialog: 'Create Department',
    editDialog: 'Edit Department',
  },
  validation: {
    nameRequired: 'Please enter the department name.',
    codeRequired: 'Please enter the department code.',
    emailInvalid: 'Please enter a valid email address.',
    leaderMissing: 'The selected leader does not exist.',
    parentMissing: 'The selected parent department does not exist.',
    parentInactive: 'The selected parent department is inactive.',
    parentSelf: 'The parent department cannot be itself.',
    parentDescendant:
      'The parent department cannot be the current department or one of its descendants.',
  },
  messages: {
    detailSeparator: '; ',
    namesSeparator: ', ',
    moreSuffix: ' and more',
    directChildrenLabel: (count) => `${count} direct child departments`,
    directMembersLabel: (count) => `${count} direct members`,
    deleteBlockedItem: (name, details) => `${name} (${details})`,
    deleteBlockedSummary: (details, isBatch, hasMore) =>
      `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${hasMore ? '; other departments also still have direct children or direct members' : ''}`,
    deleteDescription: (departmentName) =>
      `Delete department "${departmentName}"? It currently has no direct child departments or direct members. This action takes effect immediately and cannot be undone.`,
    statusTitle: (enabled) => `Confirm ${enabled ? 'enable' : 'disable'} department`,
    statusDescription: (departmentName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `Changing department "${departmentName}" will affect ${affectedUsers} users and refresh their authorization snapshot.`
        : `${enabled ? 'Enabling' : 'Disabling'} department "${departmentName}" takes effect immediately and does not affect existing user permissions.`,
    statusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    statusSuccess: (departmentName, enabled, affectedUsers) =>
      affectedUsers > 0
        ? `Department "${departmentName}" has been ${enabled ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and refreshed.`
        : `Department "${departmentName}" has been ${enabled ? 'enabled' : 'disabled'}.`,
    batchDeleteTitle: 'Confirm batch delete departments',
    batchDeleteDescription: (selectedCount, descendantCount, affectedUsers) =>
      `This will delete ${selectedCount} departments, involving ${descendantCount} child departments and ${affectedUsers} related users. The backend will reject deletion if a selected department still has direct children or direct members.`,
    batchDeleteSuccess: (count, preview) =>
      `Deleted ${count} departments${preview ? ` (${preview})` : ''}.`,
    batchStatusTitle: (enabled) => `Confirm batch ${enabled ? 'enable' : 'disable'} departments`,
    batchStatusDescription: (count, enabled, affectedUsers) =>
      `This will ${enabled ? 'enable' : 'disable'} ${count} departments, affect ${affectedUsers} users, and refresh their authorization snapshot.`,
    batchStatusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    batchStatusSuccess: (count, enabled, affectedUsers) =>
      `${count} departments have been ${enabled ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and refreshed.`,
    addMembersSuccess: (departmentName, count) =>
      `Added ${count} members to department "${departmentName}". Related user permissions were refreshed.`,
    removeMemberSuccess: (departmentName) =>
      `Removed a member from department "${departmentName}". Related user permissions were refreshed.`,
  },
  form: {
    name: 'Department Name',
    code: 'Department Code',
    codeDescription: 'Used as the unique internal identifier for the department.',
    parent: 'Parent Department',
    parentDescription: 'The parent department must exist and stay active.',
    leader: 'Leader',
    leaderDescription:
      'The leader is stored as a user identity for future permission and organization linkage.',
    phone: 'Phone',
    email: 'Email',
    sort: 'Sort',
    status: 'Status',
    description: 'Department Description',
    namePlaceholder: 'Enter department name',
    codePlaceholder: 'Enter department code',
    parentPlaceholder: 'Select a parent department, or leave empty for top level',
    leaderPlaceholder: 'Select leader',
    none: 'None',
    phonePlaceholder: 'Enter contact phone',
    emailPlaceholder: 'Enter email address',
    sortPlaceholder: 'Smaller numbers appear first',
    descriptionPlaceholder: 'Enter department description',
    active: 'Active',
    inactive: 'Inactive',
    relationTitle: 'Hierarchy Hint',
    relationDescription:
      'A department cannot choose itself or one of its descendants as the parent; the backend validates this again on save.',
    currentParentPrefix: 'Current parent: ',
  },
  dialog: {
    importHeaders: ['Name', 'Code', 'ParentId', 'Leader', 'Phone', 'Email', 'Sort'],
    deleteFallback: (departmentName) =>
      departmentName ? `Delete department "${departmentName}"?` : '',
  },
  members: {
    title: 'Department Members',
    description:
      'Manage department members, including add and remove actions with permission refresh.',
    currentTab: 'Current Members',
    addTab: 'Add Members',
    searchPlaceholder: 'Search by username, name, or email',
    emptyCurrent: 'No members in this department',
    emptyAvailable: 'No available users to add',
    selectedSummary: (selected, total) => `Selected ${selected} / ${total}`,
    selectAll: 'Select Current List',
    addAction: 'Add to Department',
    confirmAddTitle: 'Confirm Add Members',
    confirmRemoveTitle: 'Confirm Remove Member',
    confirmAddText: 'Confirm Add',
    confirmRemoveText: 'Confirm Remove',
    cancelText: 'Cancel',
    addDescription: (departmentName, count) =>
      `This will add ${count} members to "${departmentName}" and refresh related user permissions.`,
    removeDescription: (departmentName, username) =>
      `This will remove "${username}" from "${departmentName}" and refresh that user's permissions.`,
  },
  table: {
    name: 'Department',
    leader: 'Leader',
    noLeader: 'Not Set',
    contact: 'Contact',
    members: 'Members',
    status: 'Status',
    actions: 'Actions',
    addSubDepartment: 'Add Child Department',
    memberDetails: 'Manage Members',
  },
};

export function getDepartmentManagementCopy(language: Language): DepartmentManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}
