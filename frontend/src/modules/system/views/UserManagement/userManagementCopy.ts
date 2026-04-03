import type { Language } from '../../../../stores/languageStore';

export interface UserManagementCopy {
  entity: {
    zh: string;
    en: string;
    enPlural: string;
  };
  page: {
    title: string;
  };
  validation: {
    usernameRequired: string;
    realNameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    phoneRequired: string;
    departmentRequired: string;
    departmentMissing: string;
    departmentInactive: string;
    roleRequired: string;
    roleInvalid: string;
    passwordRequired: string;
    inactiveRole: (roleName: string) => string;
  };
  actionLabels: {
    add: string;
    edit: string;
    delete: string;
    resetPassword: string;
    roleAssignment: string;
    import: string;
    export: string;
    detail: string;
    roleGuard: string;
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
  confirms: {
    batchDeleteTitle: string;
    deleteText: string;
  };
  messages: {
    selfProtected: (action: 'delete' | 'disable') => string;
    deleteDescription: (userName: string, roleCount: number, isActive: boolean) => string;
    deleteBlocked: (details: string, isBatch: boolean) => string;
    batchDeleteDescription: (count: number, activeCount: number, roleBindingCount: number) => string;
    statusTitle: (enabled: boolean) => string;
    statusDescription: (userName: string, enabled: boolean) => string;
    statusConfirmText: (enabled: boolean) => string;
    statusSuccess: (userName: string, enabled: boolean) => string;
    batchStatusTitle: (enabled: boolean) => string;
    batchStatusDescription: (count: number, enabled: boolean) => string;
    batchStatusConfirmText: (enabled: boolean) => string;
    batchStatusSuccess: (count: number, enabled: boolean) => string;
    importSuccess: (count: number) => string;
    resetPasswordSuccess: string;
    resetPasswordFailed: string;
    roleUpdated: (userName: string) => string;
  };
  form: {
    username: string;
    usernamePlaceholder: string;
    realName: string;
    realNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    department: string;
    departmentPlaceholder: string;
    role: string;
    selectedCount: string;
    status: string;
    statusEnabled: string;
    statusDisabled: string;
    remark: string;
    remarkPlaceholder: string;
    roleBindingDescription: string;
    selectedRolesEmpty: string;
  };
  dialog: {
    importHeaders: string[];
    addTitle: string;
    editTitle: string;
    deleteTitle: string;
    resourceName: string;
    deleteFallback: (userName?: string) => string;
  };
  resetPassword: {
    emptyPassword: string;
    passwordTooShort: string;
    mismatch: string;
    failed: string;
    title: string;
    description: (displayName?: string) => string;
    cancel: string;
    submit: string;
    submitting: string;
    tip: string;
    newPassword: string;
    confirmPassword: string;
    newPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
  };
  detail: {
    description: string;
    tabInfo: string;
    tabPermissions: string;
    tabActivity: string;
    username: string;
    realName: string;
    email: string;
    phone: string;
    department: string;
    roles: string;
    noRoles: string;
    status: string;
    statusActive: string;
    statusInactive: string;
    statusLocked: string;
    createdAt: string;
    lastLogin: string;
    noRecord: string;
    remark: string;
    recentLoginTime: string;
    recentLoginIp: string;
  };
  permissionsPanel: {
    title: string;
    description: string;
    total: string;
    searchPlaceholder: string;
    loading: string;
    noData: string;
    copyButton: string;
    verifyTitle: string;
    verifyHint: string;
    verifyPlaceholder: string;
    verifyButton: string;
    verifyHas: string;
    verifyNot: string;
    loadPermissionsFailed: string;
    permissionCodeCopied: string;
  };
  table: {
    username: string;
    info: string;
    department: string;
    role: string;
    status: string;
    actions: string;
    view: string;
    edit: string;
    delete: string;
    assignRoles: string;
    resetPassword: string;
  };
  roleAssign: {
    title: string;
    description: string;
    selectRoles: string;
    searchPlaceholder: string;
    rolesLabel: string;
    systemRole: string;
    customRole: string;
    setExpiry: string;
    expiryPlaceholder: string;
    tipAssignPrefix: string;
    tipRoleSuffix: string;
    tipUntil: string;
    cancel: string;
    confirm: string;
    updated: string;
    updateFailed: string;
  };
  search: {
    searchPlaceholder: string;
    departmentPlaceholder: string;
    departmentAll: string;
    statusPlaceholder: string;
    statusAll: string;
    statusEnabled: string;
    statusDisabled: string;
    roleLabel: string;
    rolePlaceholder: string;
    roleAll: string;
    reset: string;
    filter: string;
  };
}

const zhCopy: UserManagementCopy = {
  entity: {
    zh: '用户',
    en: 'User',
    enPlural: 'users',
  },
  page: {
    title: '用户管理',
  },
  validation: {
    usernameRequired: '请输入用户名。',
    realNameRequired: '请输入姓名。',
    emailRequired: '请输入邮箱地址。',
    emailInvalid: '请输入正确的邮箱地址。',
    phoneRequired: '请输入手机号。',
    departmentRequired: '请选择所属部门。',
    departmentMissing: '所选部门不存在，请重新选择。',
    departmentInactive: '所属部门已被禁用，请先启用部门。',
    roleRequired: '请至少分配一个角色。',
    roleInvalid: '存在无效角色，请重新选择。',
    passwordRequired: '新建用户时必须设置初始密码。',
    inactiveRole: (roleName) => `角色「${roleName}」已被禁用，请先启用后再分配。`,
  },
  actionLabels: {
    add: '新增',
    edit: '编辑',
    delete: '删除',
    resetPassword: '重置密码',
    roleAssignment: '角色分配',
    import: '导入',
    export: '导出',
    detail: '详情',
    roleGuard: '角色分配授权',
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
  confirms: {
    batchDeleteTitle: '确认批量删除用户',
    deleteText: '确认删除',
  },
  messages: {
    selfProtected: (action) =>
      action === 'delete'
        ? '当前登录账号不能删除自己，请使用其他管理员账号操作。'
        : '当前登录账号不能禁用自己，请使用其他管理员账号操作。',
    deleteDescription: (userName, roleCount, isActive) =>
      isActive
        ? `确认删除用户「${userName}」？删除后将立即强制其登录会话失效，移除 ${roleCount} 个角色绑定及组织关系，且不可恢复。`
        : `确认删除用户「${userName}」？删除后将移除 ${roleCount} 个角色绑定及组织关系，且不可恢复。`,
    deleteBlocked: (details, isBatch) =>
      `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details} 中包含当前登录账号，请使用其他管理员账号操作。`,
    batchDeleteDescription: (count, activeCount, roleBindingCount) =>
      activeCount > 0
        ? `确认批量删除 ${count} 个用户？其中 ${activeCount} 个账号当前处于启用状态，删除后将立即强制其会话失效，并移除共 ${roleBindingCount} 个角色绑定与组织关系。`
        : `确认批量删除 ${count} 个用户？删除后将移除共 ${roleBindingCount} 个角色绑定与组织关系，且不可恢复。`,
    statusTitle: (enabled) => `确认${enabled ? '启用' : '禁用'}用户`,
    statusDescription: (userName, enabled) =>
      enabled
        ? `用户「${userName}」启用后将恢复登录能力，并在下次鉴权时重新加载动态菜单与权限快照。`
        : `用户「${userName}」禁用后将立即强制其会话失效，并撤销当前动态菜单与权限快照。`,
    statusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    statusSuccess: (userName, enabled) =>
      enabled
        ? `已启用用户「${userName}」，其登录能力已恢复`
        : `已禁用用户「${userName}」，相关会话已强制失效`,
    batchStatusTitle: (enabled) => `确认批量${enabled ? '启用' : '禁用'}用户`,
    batchStatusDescription: (count, enabled) =>
      enabled
        ? `将批量启用 ${count} 个用户，并在其后续鉴权时重新加载动态菜单与权限快照。`
        : `将批量禁用 ${count} 个用户，并立即强制这些用户的会话失效。`,
    batchStatusConfirmText: (enabled) => `确认${enabled ? '启用' : '禁用'}`,
    batchStatusSuccess: (count, enabled) =>
      enabled ? `已批量启用 ${count} 个用户` : `已批量禁用 ${count} 个用户，相关会话已强制失效`,
    importSuccess: (count) => `成功导入 ${count} 个用户`,
    resetPasswordSuccess: '密码重置成功',
    resetPasswordFailed: '密码重置失败，请稍后重试',
    roleUpdated: (userName) => `用户「${userName}」角色已更新，动态菜单与权限快照将立即刷新。`,
  },
  form: {
    username: '用户名',
    usernamePlaceholder: '请输入用户名',
    realName: '姓名',
    realNamePlaceholder: '请输入姓名',
    email: '邮箱',
    emailPlaceholder: '请输入邮箱地址',
    phone: '手机号',
    phonePlaceholder: '请输入手机号',
    password: '密码',
    passwordPlaceholder: '请输入初始密码',
    department: '所属部门',
    departmentPlaceholder: '请选择部门',
    role: '角色',
    selectedCount: '已选角色',
    status: '状态',
    statusEnabled: '启用',
    statusDisabled: '禁用',
    remark: '备注',
    remarkPlaceholder: '请输入备注信息',
    roleBindingDescription: '用户可同时绑定多个角色，保存后会重新计算动态菜单与权限快照。',
    selectedRolesEmpty: '请至少选择一个角色。',
  },
  dialog: {
    importHeaders: ['用户名', '姓名', '邮箱', '手机号', '部门', '岗位', '角色'],
    addTitle: '新增用户',
    editTitle: '编辑用户',
    deleteTitle: '删除',
    resourceName: '用户',
    deleteFallback: (userName) => (userName ? `确认删除用户「${userName}」？` : ''),
  },
  resetPassword: {
    emptyPassword: '请输入新密码',
    passwordTooShort: '密码长度至少为 6 位',
    mismatch: '两次输入的密码不一致',
    failed: '密码重置失败，请稍后重试',
    title: '重置密码',
    description: (displayName) =>
      displayName ? `为 ${displayName} 重置登录密码` : '重置用户登录密码',
    cancel: '取消',
    submit: '确认重置',
    submitting: '重置中...',
    tip: '建议使用强密码，并在重置后通知用户及时修改。',
    newPassword: '新密码',
    confirmPassword: '确认密码',
    newPasswordPlaceholder: '请输入新密码',
    confirmPasswordPlaceholder: '请再次输入新密码',
  },
  detail: {
    description: '查看用户基础资料、权限详情和最近登录活动。',
    tabInfo: '基本信息',
    tabPermissions: '权限明细',
    tabActivity: '登录活动',
    username: '用户名',
    realName: '姓名',
    email: '邮箱',
    phone: '手机号',
    department: '所属部门',
    roles: '角色',
    noRoles: '未分配角色',
    status: '账号状态',
    statusActive: '启用',
    statusInactive: '停用',
    statusLocked: '锁定',
    createdAt: '创建时间',
    lastLogin: '最近登录',
    noRecord: '暂无记录',
    remark: '备注说明',
    recentLoginTime: '最近登录时间：',
    recentLoginIp: '最近登录 IP：',
  },
  permissionsPanel: {
    title: '权限明细',
    description: '查看用户继承到的权限并校验特定权限码。',
    total: '总数',
    searchPlaceholder: '搜索权限标识',
    loading: '加载中...',
    noData: '暂无权限数据',
    copyButton: '复制',
    verifyTitle: '权限校验',
    verifyHint: '输入权限标识，校验当前用户是否拥有该权限。',
    verifyPlaceholder: '请输入权限标识',
    verifyButton: '校验',
    verifyHas: '当前用户拥有该权限',
    verifyNot: '当前用户不具备该权限',
    loadPermissionsFailed: '加载用户权限失败，请重试',
    permissionCodeCopied: '权限标识已复制',
  },
  table: {
    username: '用户名',
    info: '联系信息',
    department: '部门 / 岗位',
    role: '角色',
    status: '状态',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    assignRoles: '分配角色',
    resetPassword: '重置密码',
  },
  roleAssign: {
    title: '角色分配',
    description: '为以下用户配置角色：',
    selectRoles: '选择要绑定的角色',
    searchPlaceholder: '搜索角色名称或编码',
    rolesLabel: '角色列表',
    systemRole: '系统角色',
    customRole: '自定义角色',
    setExpiry: '设置到期时间',
    expiryPlaceholder: '请选择到期日期',
    tipAssignPrefix: '本次将为用户分配',
    tipRoleSuffix: '个角色',
    tipUntil: '有效期至',
    cancel: '取消',
    confirm: '确认',
    updated: '角色分配已更新',
    updateFailed: '更新角色分配失败，请重试',
  },
  search: {
    searchPlaceholder: '搜索用户名、姓名、邮箱或手机号',
    departmentPlaceholder: '所属部门',
    departmentAll: '全部部门',
    statusPlaceholder: '账号状态',
    statusAll: '全部状态',
    statusEnabled: '启用',
    statusDisabled: '禁用',
    roleLabel: '角色',
    rolePlaceholder: '角色',
    roleAll: '全部角色',
    reset: '重置',
    filter: '更多筛选',
  },
};

const enCopy: UserManagementCopy = {
  entity: {
    zh: '用户',
    en: 'User',
    enPlural: 'users',
  },
  page: {
    title: 'User Management',
  },
  validation: {
    usernameRequired: 'Please enter the username.',
    realNameRequired: 'Please enter the real name.',
    emailRequired: 'Please enter the email address.',
    emailInvalid: 'Please enter a valid email address.',
    phoneRequired: 'Please enter the phone number.',
    departmentRequired: 'Please select a department.',
    departmentMissing: 'The selected department does not exist.',
    departmentInactive: 'The selected department is inactive.',
    roleRequired: 'Please assign at least one role.',
    roleInvalid: 'One or more selected roles are invalid.',
    passwordRequired: 'An initial password is required when creating a user.',
    inactiveRole: (roleName) => `Role "${roleName}" is inactive.`,
  },
  actionLabels: {
    add: 'create',
    edit: 'edit',
    delete: 'delete',
    resetPassword: 'reset password',
    roleAssignment: 'role assignment',
    import: 'import',
    export: 'export',
    detail: 'details',
    roleGuard: 'role assignment',
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
  confirms: {
    batchDeleteTitle: 'Confirm batch delete users',
    deleteText: 'Delete',
  },
  messages: {
    selfProtected: (action) =>
      action === 'delete'
        ? 'You cannot delete the account currently in use.'
        : 'You cannot disable the account currently in use.',
    deleteDescription: (userName, roleCount, isActive) =>
      isActive
        ? `Delete user "${userName}"? This immediately revokes active sessions, removes ${roleCount} role bindings and organization relations, and cannot be undone.`
        : `Delete user "${userName}"? This removes ${roleCount} role bindings and organization relations, and cannot be undone.`,
    deleteBlocked: (details, isBatch) =>
      `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details} includes the current signed-in account.`,
    batchDeleteDescription: (count, activeCount, roleBindingCount) =>
      activeCount > 0
        ? `Delete ${count} users? ${activeCount} accounts are still active. This immediately revokes their sessions and removes ${roleBindingCount} role bindings and organization relations.`
        : `Delete ${count} users? This removes ${roleBindingCount} role bindings and organization relations and cannot be undone.`,
    statusTitle: (enabled) => `Confirm ${enabled ? 'enable' : 'disable'} user`,
    statusDescription: (userName, enabled) =>
      enabled
        ? `Enabling user "${userName}" restores sign-in access and reloads menus and permission snapshots on the next authorization check.`
        : `Disabling user "${userName}" immediately revokes active sessions and removes current menu and permission snapshots.`,
    statusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    statusSuccess: (userName, enabled) =>
      enabled
        ? `User "${userName}" enabled. Sign-in access was restored.`
        : `User "${userName}" disabled. Related sessions were revoked.`,
    batchStatusTitle: (enabled) => `Confirm batch ${enabled ? 'enable' : 'disable'} users`,
    batchStatusDescription: (count, enabled) =>
      enabled
        ? `This enables ${count} users and reloads their menus and permission snapshots on the next authorization check.`
        : `This disables ${count} users and immediately revokes their sessions.`,
    batchStatusConfirmText: (enabled) => (enabled ? 'Enable' : 'Disable'),
    batchStatusSuccess: (count, enabled) =>
      enabled ? `${count} users enabled.` : `${count} users disabled. Related sessions were revoked.`,
    importSuccess: (count) => `${count} users imported successfully`,
    resetPasswordSuccess: 'Password reset successfully',
    resetPasswordFailed: 'Failed to reset password. Please try again later.',
    roleUpdated: (userName) =>
      `Roles for "${userName}" were updated. Menus and permission snapshots will refresh immediately.`,
  },
  form: {
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    realName: 'Name',
    realNamePlaceholder: 'Enter name',
    email: 'Email',
    emailPlaceholder: 'Enter email address',
    phone: 'Phone',
    phonePlaceholder: 'Enter phone number',
    password: 'Password',
    passwordPlaceholder: 'Enter initial password',
    department: 'Department',
    departmentPlaceholder: 'Select a department',
    role: 'Role',
    selectedCount: 'Selected Roles',
    status: 'Status',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    remark: 'Remarks',
    remarkPlaceholder: 'Enter remarks',
    roleBindingDescription: 'A user can be assigned multiple roles. Saving recalculates menus and permission snapshots.',
    selectedRolesEmpty: 'Select at least one role.',
  },
  dialog: {
    importHeaders: ['Username', 'RealName', 'Email', 'Phone', 'Department', 'Position', 'Roles'],
    addTitle: 'Create User',
    editTitle: 'Edit User',
    deleteTitle: 'Delete',
    resourceName: 'users',
    deleteFallback: (userName) => (userName ? `Delete user "${userName}"?` : ''),
  },
  resetPassword: {
    emptyPassword: 'Please enter a new password',
    passwordTooShort: 'Password must be at least 6 characters',
    mismatch: 'The two passwords do not match',
    failed: 'Failed to reset password. Please try again later.',
    title: 'Reset Password',
    description: (displayName) =>
      displayName ? `Reset sign-in password for ${displayName}` : 'Reset user sign-in password',
    cancel: 'Cancel',
    submit: 'Confirm Reset',
    submitting: 'Resetting...',
    tip: 'Use a strong password and ask the user to change it after reset.',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    newPasswordPlaceholder: 'Enter new password',
    confirmPasswordPlaceholder: 'Enter the new password again',
  },
  detail: {
    description: 'View user profile, permission details, and recent login activity.',
    tabInfo: 'Profile',
    tabPermissions: 'Permissions',
    tabActivity: 'Activity',
    username: 'Username',
    realName: 'Name',
    email: 'Email',
    phone: 'Phone',
    department: 'Department',
    roles: 'Roles',
    noRoles: 'No roles assigned',
    status: 'Account Status',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusLocked: 'Locked',
    createdAt: 'Created At',
    lastLogin: 'Last Login',
    noRecord: 'No record',
    remark: 'Remarks',
    recentLoginTime: 'Last login time: ',
    recentLoginIp: 'Last login IP: ',
  },
  permissionsPanel: {
    title: 'Permission Details',
    description: 'Review inherited permissions and verify specific permission codes.',
    total: 'Total',
    searchPlaceholder: 'Search permission code',
    loading: 'Loading...',
    noData: 'No permission data',
    copyButton: 'Copy',
    verifyTitle: 'Permission Check',
    verifyHint: 'Enter a permission code to verify whether the user has it.',
    verifyPlaceholder: 'Enter permission code',
    verifyButton: 'Verify',
    verifyHas: 'The user has this permission',
    verifyNot: 'The user does not have this permission',
    loadPermissionsFailed: 'Failed to load user permissions',
    permissionCodeCopied: 'Permission code copied',
  },
  table: {
    username: 'Username',
    info: 'Contact',
    department: 'Department / Position',
    role: 'Roles',
    status: 'Status',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    assignRoles: 'Assign Roles',
    resetPassword: 'Reset Password',
  },
  roleAssign: {
    title: 'Role Assignment',
    description: 'Configure roles for:',
    selectRoles: 'Select roles to assign',
    searchPlaceholder: 'Search role name or code',
    rolesLabel: 'Role List',
    systemRole: 'Built-in Role',
    customRole: 'Custom Role',
    setExpiry: 'Set Expiry',
    expiryPlaceholder: 'Select an expiry date',
    tipAssignPrefix: 'This assignment will grant',
    tipRoleSuffix: 'roles',
    tipUntil: 'until',
    cancel: 'Cancel',
    confirm: 'Confirm',
    updated: 'Role assignment updated',
    updateFailed: 'Failed to update role assignment',
  },
  search: {
    searchPlaceholder: 'Search username, name, email, or phone',
    departmentPlaceholder: 'Department',
    departmentAll: 'All Departments',
    statusPlaceholder: 'Account Status',
    statusAll: 'All Statuses',
    statusEnabled: 'Enabled',
    statusDisabled: 'Disabled',
    roleLabel: 'Role',
    rolePlaceholder: 'Role',
    roleAll: 'All Roles',
    reset: 'Reset',
    filter: 'More Filters',
  },
};

export function getUserManagementCopy(language: Language): UserManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}
