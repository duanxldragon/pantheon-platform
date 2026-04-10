import type { Language } from '../../../../stores/language_store';

export interface SystemDashboardCopy {
  pageTitle: string;
  overviewDescription: string;
  moduleTitles: {
    tenantManagement: string;
    systemUsers: string;
    systemDepartments: string;
    systemPositions: string;
    systemRoles: string;
    systemMenus: string;
    systemPermissions: string;
    systemDictionary: string;
    systemLogs: string;
    systemSettings: string;
    systemMonitor: string;
  };
  primaryActions: {
    users: string;
    roles: string;
    settings: string;
  };
  metrics: {
    users: string;
    roles: string;
    menus: string;
    settings: string;
  };
  reviewTitle: string;
  reviewDescription: string;
  reviewOutcomeLabel: string;
  nextActionLabel: string;
  focusLabel: string;
  riskCountLabel: string;
  reviewStates: {
    stable: string;
    attention: string;
    critical: string;
  };
  activeUsers: string;
  activeRoles: string;
  topLevelMenus: string;
  editableSettings: string;
  todayFailures: string;
  moduleCoverage: string;
  moduleCoverageDesc: string;
  summaryTags: {
    multiTenant: string;
    organization: string;
    rbac: string;
    menuGovernance: string;
    configuration: string;
    monitoring: string;
  };
  quickActionsTitle: string;
  quickActionsDesc: string;
  governanceSignalsTitle: string;
  governanceSignalsDesc: string;
  governanceSignals: {
    lockedUsers: string;
    inactiveRoles: string;
    inactiveDepartments: string;
    hiddenMenus: string;
    failureToday: string;
  };
  governanceDescriptions: {
    lockedUsers: string;
    inactiveRoles: string;
    inactiveDepartments: string;
    hiddenMenus: string;
    failureToday: string;
  };
  noGovernanceRisk: string;
  handleNow: string;
  pendingTasksTitle: string;
  pendingTasksDesc: string;
  pendingTasks: {
    checkLockedUsers: string;
    reviewInactiveRoles: string;
    syncDepartments: string;
    verifyMenuVisibility: string;
    investigateFailures: string;
  };
  noPendingTasks: string;
  tasksCountSuffix: string;
  statusSummaryTitle: string;
  statusSummaryDesc: string;
  healthSummary: {
    account: string;
    accountRisk: string;
    accountStable: string;
    authorization: string;
    authorizationRisk: string;
    authorizationStable: string;
    organization: string;
    organizationRisk: string;
    organizationStable: string;
    navigation: string;
    navigationRisk: string;
    navigationStable: string;
  };
  attention: string;
  stable: string;
  coreFeatures: string;
  coreFeaturesDesc: string;
  featureDescriptions: {
    tenant: string;
    users: string;
    departments: string;
    positions: string;
    roles: string;
    menus: string;
    permissions: string;
    dictionary: string;
    logs: string;
    settings: string;
    monitor: string;
  };
  accessible: string;
  unavailable: string;
  enter: string;
  groupedActivityTitle: string;
  groupedActivityDesc: string;
  activityGroups: {
    loginAnomalies: string;
    loginAnomaliesDesc: string;
    highRiskChanges: string;
    highRiskChangesDesc: string;
    configUpdates: string;
    configUpdatesDesc: string;
    empty: string;
  };
  statusSuccess: string;
  statusFailure: string;
  recentActivity: string;
  recentActivityDesc: string;
  noActivity: string;
}

const zhCopy: SystemDashboardCopy = {
  pageTitle: '系统概览',
  overviewDescription: '从用户、组织、权限、菜单和审计角度快速掌握系统当前状态。',
  moduleTitles: {
    tenantManagement: '租户管理',
    systemUsers: '用户管理',
    systemDepartments: '部门管理',
    systemPositions: '岗位管理',
    systemRoles: '角色管理',
    systemMenus: '菜单管理',
    systemPermissions: '权限管理',
    systemDictionary: '数据字典',
    systemLogs: '日志管理',
    systemSettings: '系统设置',
    systemMonitor: '系统监控',
  },
  primaryActions: {
    users: '查看用户',
    roles: '查看角色',
    settings: '进入设置',
  },
  metrics: {
    users: '用户总数',
    roles: '角色总数',
    menus: '启用菜单',
    settings: '系统设置',
  },
  reviewTitle: '当前审阅结论',
  reviewDescription: '先判断今天应优先处理风险、治理待办，还是常规巡检。',
  reviewOutcomeLabel: '当前结论',
  nextActionLabel: '建议动作',
  focusLabel: '巡检焦点',
  riskCountLabel: '风险数量',
  reviewStates: {
    stable: '常规巡检',
    attention: '优先处理治理项',
    critical: '优先处理失败与账号风险',
  },
  activeUsers: '启用用户',
  activeRoles: '启用角色',
  topLevelMenus: '顶级菜单',
  editableSettings: '可编辑项',
  todayFailures: '今日失败',
  moduleCoverage: '模块覆盖',
  moduleCoverageDesc: '系统管理核心能力已经覆盖组织、权限、菜单、配置和监控链路。',
  summaryTags: {
    multiTenant: '多租户',
    organization: '组织架构',
    rbac: 'RBAC',
    menuGovernance: '菜单治理',
    configuration: '配置中心',
    monitoring: '运行监控',
  },
  quickActionsTitle: '快捷入口',
  quickActionsDesc: '快速进入最常用的系统治理模块。',
  governanceSignalsTitle: '治理信号',
  governanceSignalsDesc: '优先关注影响权限、组织和操作安全的异常项。',
  governanceSignals: {
    lockedUsers: '锁定用户',
    inactiveRoles: '停用角色',
    inactiveDepartments: '停用部门',
    hiddenMenus: '隐藏菜单',
    failureToday: '今日失败操作',
  },
  governanceDescriptions: {
    lockedUsers: '存在被锁定账号，建议核查登录异常和处置状态。',
    inactiveRoles: '部分角色被停用，可能影响成员访问范围。',
    inactiveDepartments: '组织节点处于停用状态，需确认是否仍被业务引用。',
    hiddenMenus: '菜单可见性或状态异常，建议核对导航配置。',
    failureToday: '今日出现失败操作，需要及时定位异常请求。',
  },
  noGovernanceRisk: '当前没有待处理的治理风险。',
  handleNow: '立即处理',
  pendingTasksTitle: '待办任务',
  pendingTasksDesc: '按影响面优先处理用户、角色、组织和日志问题。',
  pendingTasks: {
    checkLockedUsers: '核查锁定用户',
    reviewInactiveRoles: '复核停用角色',
    syncDepartments: '同步部门状态',
    verifyMenuVisibility: '校验菜单可见性',
    investigateFailures: '排查失败操作',
  },
  noPendingTasks: '当前没有待办任务。',
  tasksCountSuffix: '项待处理',
  statusSummaryTitle: '状态摘要',
  statusSummaryDesc: '从账号、授权、组织和导航四个维度查看整体健康度。',
  healthSummary: {
    account: '账号健康',
    accountRisk: '存在锁定用户或失败操作，建议优先核查账号风险。',
    accountStable: '当前未发现明显账号风险。',
    authorization: '授权健康',
    authorizationRisk: '存在停用角色，建议确认授权策略是否一致。',
    authorizationStable: '角色状态稳定，授权链路正常。',
    organization: '组织健康',
    organizationRisk: '存在停用部门，需检查组织结构是否仍被引用。',
    organizationStable: '部门状态正常，组织结构稳定。',
    navigation: '导航健康',
    navigationRisk: '存在隐藏或停用菜单，建议检查导航可见性配置。',
    navigationStable: '菜单导航状态正常。',
  },
  attention: '需关注',
  stable: '稳定',
  coreFeatures: '核心能力',
  coreFeaturesDesc: '按模块查看系统管理底座的关键能力和当前可访问性。',
  featureDescriptions: {
    tenant: '管理租户开通、初始化与生命周期。',
    users: '维护用户账号、状态、角色与组织归属。',
    departments: '维护组织架构、负责人和部门层级。',
    positions: '管理岗位定义、人员绑定和职责分配。',
    roles: '配置角色、菜单权限与成员范围。',
    menus: '维护导航结构、可见性和路由挂载。',
    permissions: '治理权限标识、模块范围和接口能力。',
    dictionary: '维护字典项、业务枚举和前后端展示值。',
    logs: '查看登录审计、操作记录和失败行为。',
    settings: '统一维护系统基础与安全配置。',
    monitor: '查看运行状态、服务健康和资源指标。',
  },
  accessible: '可访问',
  unavailable: '不可访问',
  enter: '进入模块',
  groupedActivityTitle: '分类活动',
  groupedActivityDesc: '按风险类型聚合最近操作，便于快速排查。',
  activityGroups: {
    loginAnomalies: '登录异常',
    loginAnomaliesDesc: '关注登录失败、认证异常和会话问题。',
    highRiskChanges: '高风险变更',
    highRiskChangesDesc: '关注删除、授权、撤销和停用类操作。',
    configUpdates: '配置变更',
    configUpdatesDesc: '关注菜单、设置、参数和监控配置更新。',
    empty: '当前没有相关活动。',
  },
  statusSuccess: '成功',
  statusFailure: '失败',
  recentActivity: '最近活动',
  recentActivityDesc: '展示最近的系统操作记录与访问行为。',
  noActivity: '当前暂无最近活动。',
};

const enCopy: SystemDashboardCopy = {
  pageTitle: 'System Overview',
  overviewDescription: 'Quickly assess the current system state across users, organization, permissions, menus, and audit activity.',
  moduleTitles: {
    tenantManagement: 'Tenant Management',
    systemUsers: 'User Management',
    systemDepartments: 'Department Management',
    systemPositions: 'Position Management',
    systemRoles: 'Role Management',
    systemMenus: 'Menu Management',
    systemPermissions: 'Permission Management',
    systemDictionary: 'Data Dictionary',
    systemLogs: 'Log Management',
    systemSettings: 'System Settings',
    systemMonitor: 'System Monitor',
  },
  primaryActions: {
    users: 'View Users',
    roles: 'View Roles',
    settings: 'Open Settings',
  },
  metrics: {
    users: 'Total Users',
    roles: 'Total Roles',
    menus: 'Active Menus',
    settings: 'System Settings',
  },
  reviewTitle: 'Current Review',
  reviewDescription: 'First determine whether today requires risk handling, governance follow-up, or routine inspection.',
  reviewOutcomeLabel: 'Outcome',
  nextActionLabel: 'Next Action',
  focusLabel: 'Inspection Focus',
  riskCountLabel: 'Risk Count',
  reviewStates: {
    stable: 'Routine Inspection',
    attention: 'Prioritize Governance Items',
    critical: 'Prioritize Failures and Account Risks',
  },
  activeUsers: 'active users',
  activeRoles: 'active roles',
  topLevelMenus: 'top-level menus',
  editableSettings: 'editable items',
  todayFailures: 'failures today',
  moduleCoverage: 'Module Coverage',
  moduleCoverageDesc: 'System management already covers organization, permissions, menu governance, configuration, and monitoring flows.',
  summaryTags: {
    multiTenant: 'Multi-tenant',
    organization: 'Organization',
    rbac: 'RBAC',
    menuGovernance: 'Menu Governance',
    configuration: 'Configuration',
    monitoring: 'Monitoring',
  },
  quickActionsTitle: 'Quick Actions',
  quickActionsDesc: 'Jump directly into the most frequently used governance modules.',
  governanceSignalsTitle: 'Governance Signals',
  governanceSignalsDesc: 'Prioritize abnormal items that affect authorization, organization, and operational safety.',
  governanceSignals: {
    lockedUsers: 'Locked Users',
    inactiveRoles: 'Inactive Roles',
    inactiveDepartments: 'Inactive Departments',
    hiddenMenus: 'Hidden Menus',
    failureToday: 'Failed Operations Today',
  },
  governanceDescriptions: {
    lockedUsers: 'Locked accounts exist. Review sign-in anomalies and remediation status.',
    inactiveRoles: 'Some roles are inactive and may affect member access scope.',
    inactiveDepartments: 'Some organization nodes are inactive. Confirm whether they are still referenced.',
    hiddenMenus: 'Menu visibility or status is abnormal. Review navigation configuration.',
    failureToday: 'Failed operations occurred today and should be investigated promptly.',
  },
  noGovernanceRisk: 'There are no governance risks to handle right now.',
  handleNow: 'Handle Now',
  pendingTasksTitle: 'Pending Tasks',
  pendingTasksDesc: 'Prioritize user, role, organization, and log issues by impact.',
  pendingTasks: {
    checkLockedUsers: 'Review Locked Users',
    reviewInactiveRoles: 'Review Inactive Roles',
    syncDepartments: 'Sync Department Status',
    verifyMenuVisibility: 'Verify Menu Visibility',
    investigateFailures: 'Investigate Failed Operations',
  },
  noPendingTasks: 'There are no pending tasks right now.',
  tasksCountSuffix: 'items pending',
  statusSummaryTitle: 'Status Summary',
  statusSummaryDesc: 'Review health across accounts, authorization, organization, and navigation.',
  healthSummary: {
    account: 'Account Health',
    accountRisk: 'Locked users or failed operations were detected. Review account risks first.',
    accountStable: 'No obvious account risks detected.',
    authorization: 'Authorization Health',
    authorizationRisk: 'Inactive roles exist. Review whether authorization policy is still aligned.',
    authorizationStable: 'Role states are stable and authorization flow is healthy.',
    organization: 'Organization Health',
    organizationRisk: 'Inactive departments exist. Check whether the org structure is still referenced.',
    organizationStable: 'Department states are healthy and the org structure is stable.',
    navigation: 'Navigation Health',
    navigationRisk: 'Hidden or inactive menus exist. Review menu visibility configuration.',
    navigationStable: 'Menu navigation is healthy.',
  },
  attention: 'Attention',
  stable: 'Stable',
  coreFeatures: 'Core Capabilities',
  coreFeaturesDesc: 'Review key platform capabilities and their current accessibility by module.',
  featureDescriptions: {
    tenant: 'Manage tenant provisioning, initialization, and lifecycle.',
    users: 'Maintain user accounts, status, roles, and organization links.',
    departments: 'Maintain organization structure, leaders, and department hierarchy.',
    positions: 'Manage positions, assignments, and responsibility mapping.',
    roles: 'Configure roles, menu permissions, and member scope.',
    menus: 'Maintain navigation structure, visibility, and route mounting.',
    permissions: 'Govern permission codes, module scope, and API capability.',
    dictionary: 'Maintain dictionaries, business enums, and display values.',
    logs: 'Review sign-in audits, operation records, and failures.',
    settings: 'Maintain base system and security settings centrally.',
    monitor: 'Review runtime status, service health, and resource metrics.',
  },
  accessible: 'Accessible',
  unavailable: 'Unavailable',
  enter: 'Enter Module',
  groupedActivityTitle: 'Grouped Activity',
  groupedActivityDesc: 'Cluster recent operations by risk type for faster investigation.',
  activityGroups: {
    loginAnomalies: 'Login Anomalies',
    loginAnomaliesDesc: 'Focus on sign-in failures, auth anomalies, and session issues.',
    highRiskChanges: 'High-Risk Changes',
    highRiskChangesDesc: 'Focus on delete, grant, revoke, and disable operations.',
    configUpdates: 'Configuration Updates',
    configUpdatesDesc: 'Focus on menu, setting, parameter, and monitoring changes.',
    empty: 'No related activity right now.',
  },
  statusSuccess: 'Success',
  statusFailure: 'Failure',
  recentActivity: 'Recent Activity',
  recentActivityDesc: 'Shows the latest system operations and access behavior.',
  noActivity: 'No recent activity yet.',
};

export function getSystemDashboardCopy(language: Language): SystemDashboardCopy {
  return language === 'zh' ? zhCopy : enCopy;
}

