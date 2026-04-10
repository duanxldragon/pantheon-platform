import { useSyncExternalStore } from 'react';
import {
  Activity,
  AlertTriangle,
  BookKey,
  Building2,
  CheckCircle2,
  ChevronRight,
  Database,
  LayoutDashboard,
  Lock,
  Menu,
  Monitor,
  Settings,
  Shield,
  Users,
  Wrench,
  Briefcase,
} from 'lucide-react';

import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { DetailKeyValueItem, DetailKeyValueSection, ManagementPageHeader } from '../../../../shared/components/ui';
import { useLanguageStore } from '../../../../stores/language_store';
import { useSystemStore } from '../../../../stores/system_store';
import { useAuthStore } from '../../../auth/store/auth_store';
import { systemPermissions } from '../../constants/permissions';
import { getSystemDashboardCopy } from './system_dashboard_copy';
import { useViewManager } from '../../../../shared/components/use_view_manager';

const EMPTY_SYSTEM_STATE = {
  users: [],
  departments: [],
  roles: [],
  menus: [],
  positions: [],
  operationLogs: [],
  loginLogs: [],
  systemSettings: [],
};

export function SystemDashboard() {
  const { language } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const { navigateToView } = useViewManager();
  const systemState = useSyncExternalStore(
    useSystemStore.subscribe,
    useSystemStore.getState,
    useSystemStore.getState,
  ) ?? EMPTY_SYSTEM_STATE;
  const {
    users,
    departments,
    roles,
    menus,
    positions,
  operationLogs,
  loginLogs,
    systemSettings,
  } = systemState;
  const canQueryDashboard = hasPermission(systemPermissions.dashboard.query);
  const dashboardCopy = getSystemDashboardCopy(language);
  const isHighRiskRelated = (value: string) => /delete|remove|revoke|grant|assign|permission|role|tenant|disable|lock/i.test(value);
  const isConfigRelated = (value: string) => /setting|config|menu|dict|dictionary|monitor|parameter/i.test(value);

  if (!canQueryDashboard) {
    return (
      <QueryAccessBoundary
        viewId="system-dashboard"
        title={dashboardCopy.pageTitle}
        queryPermission={systemPermissions.dashboard.query}
      />
    );
  }

  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const statCardClass =
    'border border-slate-200/70 bg-white/88 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm';
  const sectionCardClass =
    'border border-slate-200/70 bg-white/88 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.28)] backdrop-blur-sm';
  const surfaceClass = 'rounded-2xl border border-slate-100 bg-slate-50/85';
  const emptyStateClass =
    'rounded-2xl border border-dashed border-slate-200 bg-slate-50/85 px-4 py-10 text-center text-sm text-muted-foreground';
  const activeUsers = users.filter((user) => user.status === 'active').length;
  const activeRoles = roles.filter((role) => role.status === 'active').length;
  const visibleMenus = menus.filter((menu) => menu.status === 'active' && menu.visible !== false && menu.type !== 'button').length;
  const topLevelMenus = menus.filter((menu) => menu.parentId == null && menu.status === 'active' && menu.visible !== false && menu.type !== 'button').length;
  const editableSettings = systemSettings.filter((setting) => setting.editable).length;
  const lockedUsers = users.filter((user) => user.status === 'locked').length;
  const inactiveRoles = roles.filter((role) => role.status === 'inactive').length;
  const inactiveDepartments = departments.filter((department) => department.status === 'inactive').length;
  const hiddenMenus = menus.filter((menu) => menu.type !== 'button' && (menu.visible === false || menu.status !== 'active')).length;
  const failureToday = operationLogs.filter((log) => {
    if (log.status !== 'failure') {
      return false;
    }

    const createdAt = new Date(log.createdAt);
    const now = new Date();
    return createdAt.toDateString() === now.toDateString();
  }).length;
  const loginFailureToday = loginLogs.filter((log) => {
    if (log.status !== 'failure') {
      return false;
    }

    const loginAt = new Date(log.loginAt);
    const now = new Date();
    return loginAt.toDateString() === now.toDateString();
  }).length;

  const summaryStats = [
    {
      title: dashboardCopy.metrics.users,
      value: users.length,
      detail: `${activeUsers.toLocaleString(locale)} ${dashboardCopy.activeUsers}`,
      icon: Users,
      accent: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: dashboardCopy.metrics.roles,
      value: roles.length,
      detail: `${activeRoles.toLocaleString(locale)} ${dashboardCopy.activeRoles}`,
      icon: Shield,
      accent: 'bg-violet-50 text-violet-600 border-violet-100',
    },
    {
      title: dashboardCopy.metrics.menus,
      value: visibleMenus,
      detail: `${topLevelMenus.toLocaleString(locale)} ${dashboardCopy.topLevelMenus}`,
      icon: Menu,
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: dashboardCopy.metrics.settings,
      value: systemSettings.length,
      detail: `${editableSettings.toLocaleString(locale)} ${dashboardCopy.editableSettings} · ${failureToday.toLocaleString(locale)} ${dashboardCopy.todayFailures}`,
      icon: Wrench,
      accent: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  const quickActions = [
    {
      id: 'system-users',
      title: dashboardCopy.moduleTitles.systemUsers,
      description: dashboardCopy.featureDescriptions.users,
      icon: Users,
      permissions: systemPermissions.user.query,
    },
    {
      id: 'system-roles',
      title: dashboardCopy.moduleTitles.systemRoles,
      description: dashboardCopy.featureDescriptions.roles,
      icon: Shield,
      permissions: systemPermissions.role.query,
    },
    {
      id: 'system-menus',
      title: dashboardCopy.moduleTitles.systemMenus,
      description: dashboardCopy.featureDescriptions.menus,
      icon: Menu,
      permissions: systemPermissions.menu.query,
    },
    {
      id: 'system-permissions',
      title: dashboardCopy.moduleTitles.systemPermissions,
      description: dashboardCopy.featureDescriptions.permissions,
      icon: BookKey,
      permissions: systemPermissions.permission.query,
    },
    {
      id: 'system-logs',
      title: dashboardCopy.moduleTitles.systemLogs,
      description: dashboardCopy.featureDescriptions.logs,
      icon: Activity,
      permissions: systemPermissions.logs.query,
    },
    {
      id: 'system-settings',
      title: dashboardCopy.moduleTitles.systemSettings,
      description: dashboardCopy.featureDescriptions.settings,
      icon: Settings,
      permissions: systemPermissions.settings.query,
    },
  ].filter((item) => hasPermission(item.permissions));

  const governanceSignals = [
    {
      id: 'locked-users',
      title: dashboardCopy.governanceSignals.lockedUsers,
      description: dashboardCopy.governanceDescriptions.lockedUsers,
      count: lockedUsers,
      targetView: 'system-users',
      actionable: hasPermission(systemPermissions.user.query),
      icon: Lock,
      tone: 'bg-rose-50 text-rose-700 border-rose-100',
    },
    {
      id: 'inactive-roles',
      title: dashboardCopy.governanceSignals.inactiveRoles,
      description: dashboardCopy.governanceDescriptions.inactiveRoles,
      count: inactiveRoles,
      targetView: 'system-roles',
      actionable: hasPermission(systemPermissions.role.query),
      icon: Shield,
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      id: 'inactive-departments',
      title: dashboardCopy.governanceSignals.inactiveDepartments,
      description: dashboardCopy.governanceDescriptions.inactiveDepartments,
      count: inactiveDepartments,
      targetView: 'system-departments',
      actionable: hasPermission(systemPermissions.department.query),
      icon: Building2,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      id: 'hidden-menus',
      title: dashboardCopy.governanceSignals.hiddenMenus,
      description: dashboardCopy.governanceDescriptions.hiddenMenus,
      count: hiddenMenus,
      targetView: 'system-menus',
      actionable: hasPermission(systemPermissions.menu.query),
      icon: Menu,
      tone: 'bg-violet-50 text-violet-700 border-violet-100',
    },
    {
      id: 'failed-operations',
      title: dashboardCopy.governanceSignals.failureToday,
      description: dashboardCopy.governanceDescriptions.failureToday,
      count: failureToday,
      targetView: 'system-logs',
      actionable: hasPermission(systemPermissions.logs.query),
      icon: AlertTriangle,
      tone: 'bg-orange-50 text-orange-700 border-orange-100',
    },
  ];

  const visibleGovernanceSignals = governanceSignals.filter((signal) => signal.count > 0);

  const pendingTasks = [
    lockedUsers > 0
      ? {
          id: 'check-locked-users',
          title: dashboardCopy.pendingTasks.checkLockedUsers,
          count: lockedUsers,
          targetView: 'system-users',
          icon: Lock,
          permissions: systemPermissions.user.query,
        }
      : null,
    inactiveRoles > 0
      ? {
          id: 'review-inactive-roles',
          title: dashboardCopy.pendingTasks.reviewInactiveRoles,
          count: inactiveRoles,
          targetView: 'system-roles',
          icon: Shield,
          permissions: systemPermissions.role.query,
        }
      : null,
    inactiveDepartments > 0
      ? {
          id: 'sync-departments',
          title: dashboardCopy.pendingTasks.syncDepartments,
          count: inactiveDepartments,
          targetView: 'system-departments',
          icon: Building2,
          permissions: systemPermissions.department.query,
        }
      : null,
    hiddenMenus > 0
      ? {
          id: 'verify-hidden-menus',
          title: dashboardCopy.pendingTasks.verifyMenuVisibility,
          count: hiddenMenus,
          targetView: 'system-menus',
          icon: Menu,
          permissions: systemPermissions.menu.query,
        }
      : null,
    failureToday > 0
      ? {
          id: 'investigate-failures',
          title: dashboardCopy.pendingTasks.investigateFailures,
          count: failureToday,
          targetView: 'system-logs',
          icon: AlertTriangle,
          permissions: systemPermissions.logs.query,
        }
      : null,
  ]
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => hasPermission(item.permissions));
  const governanceRiskCount = visibleGovernanceSignals.reduce((sum, signal) => sum + signal.count, 0);
  const dashboardReview =
    failureToday > 0 || loginFailureToday > 0 || lockedUsers > 0
      ? {
          variant: 'warning' as const,
          label: dashboardCopy.reviewStates.critical,
          hint:
            language === 'zh'
              ? '今日存在失败操作、登录异常或锁定账号，建议先从日志和用户状态开始核查。'
              : 'Failed operations, login anomalies, or locked accounts exist today. Start with logs and account status.',
          nextAction:
            language === 'zh'
              ? '先处理失败日志、登录异常与锁定账号，再继续角色和菜单巡检。'
              : 'Handle failed logs, login anomalies, and locked accounts first, then continue with role and menu review.',
          focus:
            language === 'zh'
              ? '账号风险、失败请求、会话与登录异常'
              : 'Account risk, failed requests, sessions, and sign-in anomalies',
        }
      : visibleGovernanceSignals.length > 0 || pendingTasks.length > 0
        ? {
            variant: 'info' as const,
            label: dashboardCopy.reviewStates.attention,
            hint:
              language === 'zh'
                ? '当前存在治理信号或待办任务，建议按影响范围依次处理。'
                : 'Governance signals or pending tasks are present. Address them by impact.',
            nextAction:
              language === 'zh'
                ? '先看治理信号，再处理待办任务中的角色、组织和菜单项。'
                : 'Review governance signals first, then work through role, org, and menu tasks.',
            focus:
              language === 'zh'
                ? '权限状态、组织停用节点、导航可见性'
                : 'Authorization state, inactive org nodes, and navigation visibility',
          }
        : {
            variant: 'success' as const,
            label: dashboardCopy.reviewStates.stable,
            hint:
              language === 'zh'
                ? '当前没有明显风险或治理积压，可按模块执行常规巡检。'
                : 'No obvious risks or governance backlog were found. Continue with routine module inspection.',
            nextAction:
              language === 'zh'
                ? '先看状态摘要，再抽查最近活动与高频模块。'
                : 'Start with status summaries, then sample recent activity and high-traffic modules.',
            focus:
              language === 'zh'
                ? '状态稳定性、配置一致性、访问可用性'
                : 'State stability, configuration consistency, and access availability',
          };

  const healthSummaryCards = [
    {
      id: 'account-health',
      title: dashboardCopy.healthSummary.account,
      status: lockedUsers > 0 || failureToday > 0 || loginFailureToday > 0 ? dashboardCopy.attention : dashboardCopy.stable,
      description: lockedUsers > 0 || failureToday > 0 || loginFailureToday > 0 ? dashboardCopy.healthSummary.accountRisk : dashboardCopy.healthSummary.accountStable,
      icon: Users,
      tone: lockedUsers > 0 || failureToday > 0 || loginFailureToday > 0 ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
      ok: lockedUsers === 0 && failureToday === 0 && loginFailureToday === 0,
    },
    {
      id: 'authorization-health',
      title: dashboardCopy.healthSummary.authorization,
      status: inactiveRoles > 0 ? dashboardCopy.attention : dashboardCopy.stable,
      description: inactiveRoles > 0 ? dashboardCopy.healthSummary.authorizationRisk : dashboardCopy.healthSummary.authorizationStable,
      icon: Shield,
      tone: inactiveRoles > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
      ok: inactiveRoles === 0,
    },
    {
      id: 'organization-health',
      title: dashboardCopy.healthSummary.organization,
      status: inactiveDepartments > 0 ? dashboardCopy.attention : dashboardCopy.stable,
      description: inactiveDepartments > 0 ? dashboardCopy.healthSummary.organizationRisk : dashboardCopy.healthSummary.organizationStable,
      icon: Building2,
      tone: inactiveDepartments > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
      ok: inactiveDepartments === 0,
    },
    {
      id: 'navigation-health',
      title: dashboardCopy.healthSummary.navigation,
      status: hiddenMenus > 0 ? dashboardCopy.attention : dashboardCopy.stable,
      description: hiddenMenus > 0 ? dashboardCopy.healthSummary.navigationRisk : dashboardCopy.healthSummary.navigationStable,
      icon: Menu,
      tone: hiddenMenus > 0 ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
      ok: hiddenMenus === 0,
    },
  ];

  const featureCards = [
    {
      id: 'tenant-management',
      title: dashboardCopy.moduleTitles.tenantManagement,
      description: dashboardCopy.featureDescriptions.tenant,
      icon: Building2,
      permissions: ['/api/v1/tenants/*:*', '/api/v1/tenant/*:*'] as const,
    },
    {
      id: 'system-users',
      title: dashboardCopy.moduleTitles.systemUsers,
      description: dashboardCopy.featureDescriptions.users,
      icon: Users,
      permissions: systemPermissions.user.query,
    },
    {
      id: 'system-departments',
      title: dashboardCopy.moduleTitles.systemDepartments,
      description: dashboardCopy.featureDescriptions.departments,
      icon: Building2,
      permissions: systemPermissions.department.query,
    },
    {
      id: 'system-positions',
      title: dashboardCopy.moduleTitles.systemPositions,
      description: dashboardCopy.featureDescriptions.positions,
      icon: Briefcase,
      permissions: systemPermissions.position.query,
    },
    {
      id: 'system-roles',
      title: dashboardCopy.moduleTitles.systemRoles,
      description: dashboardCopy.featureDescriptions.roles,
      icon: Shield,
      permissions: systemPermissions.role.query,
    },
    {
      id: 'system-menus',
      title: dashboardCopy.moduleTitles.systemMenus,
      description: dashboardCopy.featureDescriptions.menus,
      icon: Menu,
      permissions: systemPermissions.menu.query,
    },
    {
      id: 'system-permissions',
      title: dashboardCopy.moduleTitles.systemPermissions,
      description: dashboardCopy.featureDescriptions.permissions,
      icon: BookKey,
      permissions: systemPermissions.permission.query,
    },
    {
      id: 'system-dictionary',
      title: dashboardCopy.moduleTitles.systemDictionary,
      description: dashboardCopy.featureDescriptions.dictionary,
      icon: Database,
      permissions: systemPermissions.dictionary.query,
    },
    {
      id: 'system-logs',
      title: dashboardCopy.moduleTitles.systemLogs,
      description: dashboardCopy.featureDescriptions.logs,
      icon: Activity,
      permissions: systemPermissions.logs.query,
    },
    {
      id: 'system-settings',
      title: dashboardCopy.moduleTitles.systemSettings,
      description: dashboardCopy.featureDescriptions.settings,
      icon: Settings,
      permissions: systemPermissions.settings.query,
    },
    {
      id: 'system-monitor',
      title: dashboardCopy.moduleTitles.systemMonitor,
      description: dashboardCopy.featureDescriptions.monitor,
      icon: Monitor,
      permissions: systemPermissions.monitor.query,
    },
  ];

  const groupedActivities = [
    {
      id: 'login-anomalies',
      title: dashboardCopy.activityGroups.loginAnomalies,
      description: dashboardCopy.activityGroups.loginAnomaliesDesc,
      logs: loginLogs
        .filter((log) => log.status === 'failure')
        .slice(0, 3)
        .map((log) => ({
          id: log.id,
          title: log.message || dashboardCopy.activityGroups.loginAnomalies,
          actor: log.username,
          time: log.loginAt,
          status: log.status,
          context: `${log.ip} · ${log.location || '-'}`,
        })),
      tone: 'bg-rose-50 text-rose-700 border-rose-100',
      icon: Lock,
    },
    {
      id: 'high-risk-changes',
      title: dashboardCopy.activityGroups.highRiskChanges,
      description: dashboardCopy.activityGroups.highRiskChangesDesc,
      logs: operationLogs
        .filter((log) => {
          const searchText = `${log.module} ${log.operation} ${log.summary || ''} ${log.requestUrl}`;
          return isHighRiskRelated(searchText);
        })
        .slice(0, 3)
        .map((log) => ({
          id: log.id,
          title: log.summary || log.operation,
          actor: log.realName || log.username,
          time: log.createdAt,
          status: log.status,
          context: log.requestUrl,
        })),
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: AlertTriangle,
    },
    {
      id: 'config-updates',
      title: dashboardCopy.activityGroups.configUpdates,
      description: dashboardCopy.activityGroups.configUpdatesDesc,
      logs: operationLogs
        .filter((log) => {
          const searchText = `${log.module} ${log.operation} ${log.summary || ''} ${log.requestUrl}`;
          return isConfigRelated(searchText);
        })
        .slice(0, 3)
        .map((log) => ({
          id: log.id,
          title: log.summary || log.operation,
          actor: log.realName || log.username,
          time: log.createdAt,
          status: log.status,
          context: log.requestUrl,
        })),
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: Settings,
    },
  ];
  const recentActivities = [...operationLogs.map((log) => ({
    id: `operation-${log.id}`,
    title: log.summary || log.operation,
    actor: log.realName || log.username,
    time: log.createdAt,
    status: log.status,
    badge: log.module,
    context: `${log.ip} · ${log.requestUrl}`,
  })), ...loginLogs.map((log) => ({
    id: `login-${log.id}`,
    title: log.message || dashboardCopy.activityGroups.loginAnomalies,
    actor: log.username,
    time: log.loginAt,
    status: log.status,
    badge: dashboardCopy.activityGroups.loginAnomalies,
    context: `${log.ip} · ${log.location || '-'}`,
  }))]
    .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        eyebrow="SYSTEM"
        title={dashboardCopy.pageTitle}
        description={dashboardCopy.overviewDescription}
        meta={
          <>
            <Badge variant="mono">Dashboard</Badge>
            <Badge variant="info">
              {users.length.toLocaleString(locale)} {dashboardCopy.moduleTitles.systemUsers}
            </Badge>
            <Badge variant={failureToday > 0 ? 'warning' : 'success'}>
              {failureToday.toLocaleString(locale)} {dashboardCopy.todayFailures}
            </Badge>
          </>
        }
        actions={
          <>
          {hasPermission(systemPermissions.user.query) && (
            <Button
              variant="mono"
              size="pill"
              onClick={() => navigateToView('system-users')}
            >
              <Users className="h-4 w-4" />
              {dashboardCopy.primaryActions.users}
            </Button>
          )}
          {hasPermission(systemPermissions.role.query) && (
            <Button
              variant="mono"
              size="pill"
              onClick={() => navigateToView('system-roles')}
            >
              <Shield className="h-4 w-4" />
              {dashboardCopy.primaryActions.roles}
            </Button>
          )}
          {hasPermission(systemPermissions.settings.query) && (
            <Button
              size="pill"
              onClick={() => navigateToView('system-settings')}
            >
              <Settings className="h-4 w-4" />
              {dashboardCopy.primaryActions.settings}
            </Button>
          )}
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={statCardClass}>
              <CardContent className="flex items-start justify-between p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <div className="text-3xl font-semibold text-foreground">{stat.value.toLocaleString(locale)}</div>
                  <p className="text-xs text-muted-foreground">{stat.detail}</p>
                </div>
                <div className={`rounded-xl border p-3 ${stat.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={sectionCardClass}>
          <CardContent className="p-6">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={dashboardCopy.reviewTitle}
              description={dashboardCopy.reviewDescription}
            >
              <DetailKeyValueItem
                label={dashboardCopy.reviewOutcomeLabel}
                className="md:col-span-2"
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={dashboardReview.variant}>{dashboardReview.label}</Badge>
                    <span>{dashboardReview.hint}</span>
                  </div>
                }
              />
              <DetailKeyValueItem
                label={dashboardCopy.nextActionLabel}
                value={dashboardReview.nextAction}
              />
              <DetailKeyValueItem
                label={dashboardCopy.focusLabel}
                value={dashboardReview.focus}
              />
              <DetailKeyValueItem
                label={dashboardCopy.riskCountLabel}
                value={governanceRiskCount.toLocaleString(locale)}
                hint={
                  language === 'zh'
                    ? '汇总当前治理信号中的风险条目数量。'
                    : 'Aggregates the number of risk items across current governance signals.'
                }
              />
              <DetailKeyValueItem
                label={dashboardCopy.pendingTasksTitle}
                value={pendingTasks.length.toLocaleString(locale)}
              />
            </DetailKeyValueSection>
          </CardContent>
        </Card>

        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle>{language === 'zh' ? '执行优先级' : 'Execution Priority'}</CardTitle>
            <CardDescription>
              {language === 'zh'
                ? '按今天的风险和治理状态，建议依次进入这些模块。'
                : 'Based on today’s risks and governance state, these modules should be reviewed first.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              failureToday > 0 && hasPermission(systemPermissions.logs.query)
                ? { id: 'system-logs', title: dashboardCopy.moduleTitles.systemLogs, detail: dashboardCopy.governanceDescriptions.failureToday }
                : null,
              lockedUsers > 0 && hasPermission(systemPermissions.user.query)
                ? { id: 'system-users', title: dashboardCopy.moduleTitles.systemUsers, detail: dashboardCopy.governanceDescriptions.lockedUsers }
                : null,
              inactiveRoles > 0 && hasPermission(systemPermissions.role.query)
                ? { id: 'system-roles', title: dashboardCopy.moduleTitles.systemRoles, detail: dashboardCopy.governanceDescriptions.inactiveRoles }
                : null,
              hiddenMenus > 0 && hasPermission(systemPermissions.menu.query)
                ? { id: 'system-menus', title: dashboardCopy.moduleTitles.systemMenus, detail: dashboardCopy.governanceDescriptions.hiddenMenus }
                : null,
              pendingTasks.length === 0 && hasPermission(systemPermissions.settings.query)
                ? { id: 'system-settings', title: dashboardCopy.moduleTitles.systemSettings, detail: dashboardCopy.featureDescriptions.settings }
                : null,
            ]
              .filter((item): item is { id: string; title: string; detail: string } => Boolean(item))
              .slice(0, 4)
              .map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToView(item.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'warning' : 'mono'}>{`0${index + 1}`}</Badge>
                      <p className="font-medium text-foreground">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))}
            {((failureToday === 0 && lockedUsers === 0 && inactiveRoles === 0 && hiddenMenus === 0) || ![
              hasPermission(systemPermissions.logs.query),
              hasPermission(systemPermissions.user.query),
              hasPermission(systemPermissions.role.query),
              hasPermission(systemPermissions.menu.query),
              hasPermission(systemPermissions.settings.query),
            ].some(Boolean)) && (
              <div className={emptyStateClass}>
                {language === 'zh'
                  ? '当前没有需要优先跳转的高风险模块，可继续常规巡检。'
                  : 'No high-priority modules require immediate review right now.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={sectionCardClass}>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <CardTitle>{dashboardCopy.moduleCoverage}</CardTitle>
          </div>
          <CardDescription>{dashboardCopy.moduleCoverageDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            dashboardCopy.summaryTags.multiTenant,
            dashboardCopy.summaryTags.organization,
            dashboardCopy.summaryTags.rbac,
            dashboardCopy.summaryTags.menuGovernance,
            dashboardCopy.summaryTags.configuration,
            dashboardCopy.summaryTags.monitoring,
          ].map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full border-slate-200/80 bg-slate-50/90 text-slate-700 shadow-sm shadow-slate-200/30">
              {tag}
            </Badge>
          ))}
          <Badge className="rounded-full bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-100/40">{positions.length.toLocaleString(locale)} {dashboardCopy.moduleTitles.systemPositions}</Badge>
          <Badge className="rounded-full bg-blue-100 text-blue-700 shadow-sm shadow-blue-100/40">{departments.length.toLocaleString(locale)} {dashboardCopy.moduleTitles.systemDepartments}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle>{dashboardCopy.quickActionsTitle}</CardTitle>
            <CardDescription>{dashboardCopy.quickActionsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => navigateToView(action.id)}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-2xl border border-white bg-white p-2.5 text-slate-700 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{action.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle>{dashboardCopy.governanceSignalsTitle}</CardTitle>
            <CardDescription>{dashboardCopy.governanceSignalsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleGovernanceSignals.length === 0 ? (
              <div className={emptyStateClass}>
                {dashboardCopy.noGovernanceRisk}
              </div>
            ) : (
              visibleGovernanceSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.id} className={`${surfaceClass} p-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-xl border p-2 ${signal.tone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{signal.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{signal.description}</p>
                        </div>
                      </div>
                      <Badge className={signal.tone}>{signal.count.toLocaleString(locale)}</Badge>
                    </div>
                    {signal.actionable && (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" onClick={() => navigateToView(signal.targetView)}>
                          {dashboardCopy.handleNow}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle>{dashboardCopy.pendingTasksTitle}</CardTitle>
            <CardDescription>{dashboardCopy.pendingTasksDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className={emptyStateClass}>
                {dashboardCopy.noPendingTasks}
              </div>
            ) : (
              pendingTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-white p-2.5 text-slate-700 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.count.toLocaleString(locale)} {dashboardCopy.tasksCountSuffix}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigateToView(task.targetView)}>
                      {dashboardCopy.handleNow}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className={sectionCardClass}>
          <CardHeader>
            <CardTitle>{dashboardCopy.statusSummaryTitle}</CardTitle>
            <CardDescription>{dashboardCopy.statusSummaryDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {healthSummaryCards.map((item) => {
              const Icon = item.icon;
              const StatusIcon = item.ok ? CheckCircle2 : AlertTriangle;
              return (
                <div key={item.id} className={`${surfaceClass} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-xl border p-2 ${item.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Badge className={item.tone}>
                      <StatusIcon className="h-3 w-3" />
                      {item.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{dashboardCopy.coreFeatures}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{dashboardCopy.coreFeaturesDesc}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            const allowed = hasPermission(feature.permissions);
            return (
              <Card
                key={feature.id}
                className={`${sectionCardClass} transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_64px_-38px_rgba(15,23,42,0.32)]`}
              >
                <CardHeader className="gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription className="mt-1">{feature.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {allowed ? dashboardCopy.accessible : dashboardCopy.unavailable}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant={allowed ? 'outline' : 'secondary'}
                    disabled={!allowed}
                    onClick={() => navigateToView(feature.id)}
                  >
                    {dashboardCopy.enter}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{dashboardCopy.groupedActivityTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{dashboardCopy.groupedActivityDesc}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {groupedActivities.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.id} className={sectionCardClass}>
                <CardHeader className="gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg border p-2 ${group.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle>{group.title}</CardTitle>
                  </div>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.logs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/85 px-4 py-8 text-center text-sm text-muted-foreground">
                      {dashboardCopy.activityGroups.empty}
                    </div>
                  ) : (
                    group.logs.map((log) => (
                      <div key={`${group.id}-${log.id}`} className="rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{log.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {log.actor} · {new Date(log.time).toLocaleString(locale)}
                            </p>
                          </div>
                          <Badge className={group.tone}>{log.status === 'success' ? dashboardCopy.statusSuccess : dashboardCopy.statusFailure}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{log.context}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className={sectionCardClass}>
        <CardHeader>
          <CardTitle>{dashboardCopy.recentActivity}</CardTitle>
          <CardDescription>{dashboardCopy.recentActivityDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/85 px-4 py-8 text-center text-sm text-muted-foreground">
              {dashboardCopy.noActivity}
            </div>
          ) : (
            recentActivities.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{log.title}</span>
                    <Badge variant="outline" className="bg-white text-slate-600">
                      {log.badge}
                    </Badge>
                    <Badge className={log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                      {log.status === 'success' ? dashboardCopy.statusSuccess : dashboardCopy.statusFailure}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.actor} · {new Date(log.time).toLocaleString(locale)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">{log.context}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}








