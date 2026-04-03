import type { Language } from '../../../../stores/languageStore';

export interface UnifiedLogManagementCopy {
  entity: {
    zh: string;
    en: string;
    enPlural: string;
  };
  page: {
    title: string;
    description: string;
  };
  index: {
    detail: string;
    clearLogs: string;
    export: string;
    tabSummaryTitle: string;
    tabLoginLogs: string;
    tabOperationLogs: string;
    clearHint: string;
    exportHint: string;
    totalLabel: string;
    statusSuccess: string;
    statusFailed: string;
    onlyOperationCanClear: string;
    cleared: string;
    loginHeaders: string[];
    operationHeaders: string[];
  };
  filters: {
    loginTabLabel: string;
    operationTabLabel: string;
    clearLogsLabel: string;
    importLabel: string;
    exportLabel: string;
    searchPlaceholder: string;
    statusAll: string;
    statusSuccess: string;
    statusFailed: string;
    loginTabDescription: string;
    operationTabDescription: string;
  };
  stats: {
    loginLogs: string;
    operationLogs: string;
    currentFilteredResults: string;
    statusSuccess: string;
    statusFailed: string;
    completionRate: (rate: number) => string;
    needsAttention: string;
    noFailures: string;
    loadingHint: string;
  };
  detail: {
    title: string;
    description: string;
    loginBadge: string;
    operationBadge: string;
    idLabel: string;
    overviewLabel: string;
    statusLabel: string;
    targetLabel: string;
    requestSummaryLabel: string;
    loginSummaryLabel: string;
    sections: {
      userEnv: string;
      bizAction: string;
      impactScope: string;
      detailNote: string;
    };
    fields: {
      username: string;
      time: string;
      ip: string;
      location: string;
      module: string;
      operation: string;
      resource: string;
      resourceName: string;
      resourceId: string;
      request: string;
      duration: string;
      device: string;
      browser: string;
      logoutTime: string;
      detail: string;
      requestBody: string;
      responseBody: string;
    };
    auditDetailLabels: Record<string, string>;
    impact: {
      users: (count: string) => string;
      roles: (count: string) => string;
      authRefresh: string;
      sessionRevoke: string;
    };
    statusSuccess: string;
    statusFailed: string;
  };
  table: {
    userColumnLabel: string;
    timeColumnLabel: string;
    ipColumnLabel: string;
    statusColumnLabel: string;
    deviceBrowserColumnLabel: string;
    operationColumnLabel: string;
    targetColumnLabel: string;
    actionColumnLabel: string;
    detailActionLabel: string;
    loginTypeLabel: string;
    operationTypeLabel: string;
    loginFeedbackLabel: string;
    logoutLabel: string;
    statusSuccess: string;
    statusFailed: string;
    errorLabel: string;
  };
}

const zhCopy: UnifiedLogManagementCopy = {
  entity: {
    zh: '日志',
    en: 'Log',
    enPlural: 'logs',
  },
  page: {
    title: '日志管理',
    description: '查看登录审计、操作记录、失败状态和受影响范围。',
  },
  index: {
    detail: '日志详情',
    clearLogs: '清空日志',
    export: '导出',
    tabSummaryTitle: '当前视图',
    tabLoginLogs: '登录日志',
    tabOperationLogs: '操作日志',
    clearHint: '仅操作日志支持清空。',
    exportHint: '导出会按当前页签和筛选条件生成文件。',
    totalLabel: '总数',
    statusSuccess: '成功',
    statusFailed: '失败',
    onlyOperationCanClear: '仅操作日志支持清空。',
    cleared: '日志已清空',
    loginHeaders: ['用户名', 'IP 地址', '位置', '浏览器', '操作系统', '状态', '消息', '登录时间'],
    operationHeaders: [
      '用户名',
      '模块',
      '资源',
      '资源 ID',
      '操作摘要',
      '请求方法',
      '请求 URL',
      'IP 地址',
      '位置',
      '状态',
      '耗时(ms)',
      '错误信息',
      '创建时间',
    ],
  },
  filters: {
    loginTabLabel: '登录日志',
    operationTabLabel: '操作日志',
    clearLogsLabel: '清空操作日志',
    importLabel: '导入',
    exportLabel: '导出',
    searchPlaceholder: '搜索用户名、IP、模块或资源',
    statusAll: '全部状态',
    statusSuccess: '成功',
    statusFailed: '失败',
    loginTabDescription: '查看登录成功、失败与设备环境',
    operationTabDescription: '跟踪配置变更、授权操作与审计记录',
  },
  stats: {
    loginLogs: '登录日志',
    operationLogs: '操作日志',
    currentFilteredResults: '当前筛选结果',
    statusSuccess: '成功',
    statusFailed: '失败',
    completionRate: (rate) => `占比 ${rate}%`,
    needsAttention: '建议优先排查',
    noFailures: '当前无失败',
    loadingHint: '加载中...',
  },
  detail: {
    title: '日志详情',
    description: '查看日志上下文、请求摘要和受影响范围。',
    loginBadge: '登录日志',
    operationBadge: '操作日志',
    idLabel: '编号',
    overviewLabel: '概览',
    statusLabel: '状态',
    targetLabel: '对象',
    requestSummaryLabel: '请求摘要',
    loginSummaryLabel: '登录摘要',
    sections: {
      userEnv: '用户与环境',
      bizAction: '业务动作',
      impactScope: '影响范围',
      detailNote: '详细说明',
    },
    fields: {
      username: '用户名',
      time: '时间',
      ip: 'IP 地址',
      location: '位置',
      module: '模块',
      operation: '操作',
      resource: '资源',
      resourceName: '资源名称',
      resourceId: '资源 ID',
      request: '请求',
      duration: '耗时',
      device: '设备',
      browser: '浏览器',
      logoutTime: '退出时间',
      detail: '详情',
      requestBody: '请求体',
      responseBody: '响应体',
    },
    auditDetailLabels: {
      action: '操作动作',
      status: '当前状态',
      previous_status: '变更前状态',
      affected_users: '影响用户数',
      affected_roles: '影响角色数',
      refresh_strategy: '刷新策略',
      session_strategy: '会话策略',
      permission_count: '权限数量',
      menu_count: '菜单数量',
      code: '编码',
      path: '路径',
      type: '类型',
      department_id: '部门 ID',
      position_id: '岗位 ID',
      before_department: '变更前部门',
      after_department: '变更后部门',
      before_position: '变更前岗位',
      after_position: '变更后岗位',
    },
    impact: {
      users: (count) => `影响用户 ${count}`,
      roles: (count) => `影响角色 ${count}`,
      authRefresh: '需要刷新授权',
      sessionRevoke: '触发会话撤销',
    },
    statusSuccess: '成功',
    statusFailed: '失败',
  },
  table: {
    userColumnLabel: '用户',
    timeColumnLabel: '时间',
    ipColumnLabel: 'IP 地址',
    statusColumnLabel: '状态',
    deviceBrowserColumnLabel: '设备 / 浏览器',
    operationColumnLabel: '操作',
    targetColumnLabel: '操作对象',
    actionColumnLabel: '操作',
    detailActionLabel: '查看详情',
    loginTypeLabel: '登录日志',
    operationTypeLabel: '操作日志',
    loginFeedbackLabel: '登录反馈',
    logoutLabel: '退出时间',
    statusSuccess: '成功',
    statusFailed: '失败',
    errorLabel: '错误',
  },
};

const enCopy: UnifiedLogManagementCopy = {
  entity: {
    zh: '日志',
    en: 'Log',
    enPlural: 'logs',
  },
  page: {
    title: 'Log Management',
    description: 'Review login audits, operation records, failures, and impact scope.',
  },
  index: {
    detail: 'log detail',
    clearLogs: 'clear logs',
    export: 'export',
    tabSummaryTitle: 'Current View',
    tabLoginLogs: 'Login Logs',
    tabOperationLogs: 'Operation Logs',
    clearHint: 'Only operation logs can be cleared.',
    exportHint: 'Export respects the current tab and filters.',
    totalLabel: 'Total',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    onlyOperationCanClear: 'Only operation logs can be cleared.',
    cleared: 'Logs cleared',
    loginHeaders: ['Username', 'IP', 'Location', 'Browser', 'OS', 'Status', 'Message', 'Login Time'],
    operationHeaders: [
      'Username',
      'Module',
      'Resource',
      'Resource ID',
      'Summary',
      'Method',
      'Request URL',
      'IP',
      'Location',
      'Status',
      'Duration',
      'Error Message',
      'Created At',
    ],
  },
  filters: {
    loginTabLabel: 'Login Logs',
    operationTabLabel: 'Operation Logs',
    clearLogsLabel: 'Clear Operation Logs',
    importLabel: 'Import',
    exportLabel: 'Export',
    searchPlaceholder: 'Search username, IP, module, or resource',
    statusAll: 'All Statuses',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    loginTabDescription: 'Review sign-ins, failures, and device context',
    operationTabDescription: 'Track configuration changes, authorization actions, and audits',
  },
  stats: {
    loginLogs: 'Login Logs',
    operationLogs: 'Operation Logs',
    currentFilteredResults: 'Current filtered results',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    completionRate: (rate) => `${rate}% of total`,
    needsAttention: 'Needs attention',
    noFailures: 'No failures currently',
    loadingHint: 'Loading...',
  },
  detail: {
    title: 'Log Detail',
    description: 'Inspect log context, request summaries, and impact scope.',
    loginBadge: 'Login Log',
    operationBadge: 'Operation Log',
    idLabel: 'ID',
    overviewLabel: 'Overview',
    statusLabel: 'Status',
    targetLabel: 'Target',
    requestSummaryLabel: 'Request Summary',
    loginSummaryLabel: 'Login Summary',
    sections: {
      userEnv: 'User & Environment',
      bizAction: 'Business Action',
      impactScope: 'Impact Scope',
      detailNote: 'Detail Notes',
    },
    fields: {
      username: 'Username',
      time: 'Time',
      ip: 'IP',
      location: 'Location',
      module: 'Module',
      operation: 'Operation',
      resource: 'Resource',
      resourceName: 'Resource Name',
      resourceId: 'Resource ID',
      request: 'Request',
      duration: 'Duration',
      device: 'Device',
      browser: 'Browser',
      logoutTime: 'Logout Time',
      detail: 'Detail',
      requestBody: 'Request Body',
      responseBody: 'Response Body',
    },
    auditDetailLabels: {
      action: 'Action',
      status: 'Status',
      previous_status: 'Previous Status',
      affected_users: 'Affected Users',
      affected_roles: 'Affected Roles',
      refresh_strategy: 'Refresh Strategy',
      session_strategy: 'Session Strategy',
      permission_count: 'Permission Count',
      menu_count: 'Menu Count',
      code: 'Code',
      path: 'Path',
      type: 'Type',
      department_id: 'Department ID',
      position_id: 'Position ID',
      before_department: 'Previous Department',
      after_department: 'Current Department',
      before_position: 'Previous Position',
      after_position: 'Current Position',
    },
    impact: {
      users: (count) => `${count} affected users`,
      roles: (count) => `${count} affected roles`,
      authRefresh: 'Authorization refresh required',
      sessionRevoke: 'Session revoke triggered',
    },
    statusSuccess: 'Success',
    statusFailed: 'Failed',
  },
  table: {
    userColumnLabel: 'User',
    timeColumnLabel: 'Time',
    ipColumnLabel: 'IP',
    statusColumnLabel: 'Status',
    deviceBrowserColumnLabel: 'Device / Browser',
    operationColumnLabel: 'Operation',
    targetColumnLabel: 'Target',
    actionColumnLabel: 'Actions',
    detailActionLabel: 'View Detail',
    loginTypeLabel: 'Login Log',
    operationTypeLabel: 'Operation Log',
    loginFeedbackLabel: 'Login Feedback',
    logoutLabel: 'Logout',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    errorLabel: 'Error',
  },
};

export function getUnifiedLogManagementCopy(language: Language): UnifiedLogManagementCopy {
  return language === 'zh' ? zhCopy : enCopy;
}
