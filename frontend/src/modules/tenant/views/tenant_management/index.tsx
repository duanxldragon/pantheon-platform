import { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Plus, RefreshCw, Search } from 'lucide-react';

import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { ConfirmDialog } from '../../../../shared/components/ui/confirm_dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  DetailDialogWrapper,
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementFocusCard,
  ManagementFilterPanel,
  ManagementMetricCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { exportDataToCSV } from '../../../../shared/utils/csv_export';
import { systemNotification } from '../../../../shared/utils/notification';
import { useAuthStore } from '../../../auth/store/auth_store';
import { useLanguageStore } from '../../../../stores/language_store';
import tenantDatabaseApi from '../../api/tenant_database_api';
import { TenantSetupWizard } from '../../components/tenant_setup_wizard';
import { normalizeTenantCode } from '../../utils/naming';
import { TenantDialogManager } from './components/tenant_dialog_manager';
import { TenantStatsCards } from './components/tenant_stats_cards';
import { TenantTable } from './components/tenant_table';
import type { Tenant } from './hooks/use_tenant_logic';
import { useTenantLogic } from './hooks/use_tenant_logic';

type TenantDialogName = 'add' | 'edit' | 'delete' | 'license';
type SetupTargetTenant = Pick<Tenant, 'id' | 'name' | 'code'>;
type TenantSetupSummary = {
  tenantId: string;
  tenantName: string;
  databaseType?: string;
  database?: string;
  deploymentMode?: string;
  tenantStrategy?: string;
  initializedModules: string[];
  adminUsername?: string;
  adminEmail?: string;
  roleCode?: string;
  menuCount?: number;
  permissionCount?: number;
};

type SetupPromptTarget = Pick<Tenant, 'id' | 'name' | 'code'>;

function TenantOverviewCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function TenantManagement() {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const locale = zh ? 'zh-CN' : 'en-US';

  const copy = zh
    ? {
        pageTitle: '租户管理',
        actions: {
          refresh: '刷新',
          export: '导出',
          addTenant: '新增租户',
        },
        searchPlaceholder: '搜索租户名称、编码或联系人',
        statusPlaceholder: '状态',
        statuses: {
          all: '全部',
          active: '运行中',
          suspended: '已停用',
          pending: '待初始化',
        },
        notifications: {
          confirmSuspend: (name: string) =>
            `确认停用租户“${name}”吗？停用后该租户将无法继续登录和访问业务功能。`,
          suspended: '租户已停用',
          suspendFailed: '停用租户失败',
          activated: '租户已恢复启用',
          activateFailed: '启用租户失败',
          openingOverview: (name: string) => `正在打开租户“${name}”的资源概览`,
          tenantNameRequired: '请输入租户名称',
          tenantCodeRequired: '请输入租户编码',
          userLimitInvalid: '用户上限不能小于 0',
          created: '租户创建成功',
          createFailed: '创建租户失败',
          openSetupConfirm: (name: string) => `租户“${name}”已创建，是否立即进入数据库初始化向导？`,
          updated: '租户资料已更新',
          updateFailed: '更新租户失败',
          expiryRequired: '请选择服务有效期',
          licenseUpdated: '租户授权已更新',
          licenseUpdateFailed: '更新授权失败',
          deleted: '租户已删除',
          deleteFailed: '删除租户失败',
          listRefreshed: '租户列表已刷新',
          exportSuccess: '租户列表导出成功',
          exportEmpty: '当前没有可导出的租户数据',
        },
        source: {
          label: '数据来源',
          remote: '后端接口',
          empty: '后端接口（空列表）',
          unavailable: '后端接口暂不可用',
          refreshedAt: '最近刷新',
        },
        pageDescription: {
          normal: '统一管理租户资料、授权、配额与数据库接入状态。',
          empty: '统一管理租户资料、授权、配额与数据库接入状态。当前租户列表为空，可继续新增租户或检查筛选条件。',
          unavailable: '统一管理租户资料、授权、配额与数据库接入状态。当前无法读取后端租户列表，请先检查接口与登录态。',
        },
        setup: {
          title: '租户数据库初始化',
          description: (name: string) => `为租户“${name}”配置数据库连接并完成初始化。`,
        },
      }
    : {
        pageTitle: 'Tenant Management',
        actions: {
          refresh: 'Refresh',
          export: 'Export',
          addTenant: 'Add Tenant',
        },
        searchPlaceholder: 'Search tenant name, code, or contact',
        statusPlaceholder: 'Status',
        statuses: {
          all: 'All',
          active: 'Active',
          suspended: 'Suspended',
          pending: 'Pending',
        },
        notifications: {
          confirmSuspend: (name: string) =>
            `Suspend tenant "${name}"? The tenant will no longer be able to sign in or access features.`,
          suspended: 'Tenant suspended',
          suspendFailed: 'Failed to suspend tenant',
          activated: 'Tenant activated',
          activateFailed: 'Failed to activate tenant',
          openingOverview: (name: string) => `Opening overview for tenant "${name}"`,
          tenantNameRequired: 'Please enter a tenant name',
          tenantCodeRequired: 'Please enter a tenant code',
          userLimitInvalid: 'User limit cannot be negative',
          created: 'Tenant created',
          createFailed: 'Failed to create tenant',
          openSetupConfirm: (name: string) => `Tenant "${name}" has been created. Open the database setup wizard now?`,
          updated: 'Tenant updated',
          updateFailed: 'Failed to update tenant',
          expiryRequired: 'Please select an expiry date',
          licenseUpdated: 'Tenant license updated',
          licenseUpdateFailed: 'Failed to update license',
          deleted: 'Tenant deleted',
          deleteFailed: 'Failed to delete tenant',
          listRefreshed: 'Tenant list refreshed',
          exportSuccess: 'Tenant list exported successfully',
          exportEmpty: 'There is no tenant data to export right now.',
        },
        source: {
          label: 'Source',
          remote: 'Backend API',
          empty: 'Backend API (empty list)',
          unavailable: 'Backend API unavailable',
          refreshedAt: 'Last refresh',
        },
        pageDescription: {
          normal: 'Manage tenant profiles, licenses, quotas, and database onboarding status.',
          empty: 'Manage tenant profiles, licenses, quotas, and database onboarding status. The current tenant list is empty, so you can add a tenant or review filters next.',
          unavailable: 'Manage tenant profiles, licenses, quotas, and database onboarding status. The tenant list cannot be loaded from the backend right now.',
        },
        setup: {
          title: 'Tenant Database Setup',
          description: (name: string) => `Configure the database connection for tenant "${name}".`,
        },
      };

  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sourceData,
    page,
    setPage,
    loading,
    sourceState,
    lastLoadedAt,
    reloadTenants,
  } = useTenantLogic();

  const currentTenantId = useAuthStore((state) => state.tenantInfo?.id || state.user?.tenantId);
  const currentTenantCode = useAuthStore((state) => state.tenantInfo?.code || state.user?.tenantCode);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);

  const [setupCompletedTenantIds, setSetupCompletedTenantIds] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [submittingLicense, setSubmittingLicense] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupTargetTenant, setSetupTargetTenant] = useState<SetupTargetTenant | null>(null);
  const [setupSummary, setSetupSummary] = useState<TenantSetupSummary | null>(null);
  const [overviewTenant, setOverviewTenant] = useState<Tenant | null>(null);
  const [suspendTargetTenant, setSuspendTargetTenant] = useState<Tenant | null>(null);
  const [postCreateSetupTarget, setPostCreateSetupTarget] = useState<SetupPromptTarget | null>(null);
  const pageSize = 10;
  const effectiveTenants = useMemo(
    () =>
      sourceData.map((tenant) =>
        setupCompletedTenantIds.includes(tenant.id) && tenant.status === 'pending'
          ? { ...tenant, status: 'active' as const }
          : tenant,
      ),
    [setupCompletedTenantIds, sourceData],
  );
  const stats = useMemo(() => {
    return {
      total: effectiveTenants.length,
      active: effectiveTenants.filter((tenant) => tenant.status === 'active').length,
      pending: effectiveTenants.filter((tenant) => tenant.status === 'pending').length,
      suspended: effectiveTenants.filter((tenant) => tenant.status === 'suspended').length,
      warning: effectiveTenants.filter(
        (tenant) => tenant.userLimit > 0 && tenant.userCount / tenant.userLimit > 0.9,
      ).length,
    };
  }, [effectiveTenants]);
  const [dialogs, setDialogs] = useState<Record<TenantDialogName, boolean>>({
    add: false,
    edit: false,
    delete: false,
    license: false,
  });

  const setDialogOpen = (name: TenantDialogName, open: boolean) => {
    setDialogs((prev) => ({ ...prev, [name]: open }));
  };

  const resetTenantDialogState = () => {
    setSelectedTenant(null);
    setFormData({});
  };

  const handleDialogChange = (name: TenantDialogName, open: boolean) => {
    setDialogOpen(name, open);
    if (!open) {
      resetTenantDialogState();
    }
  };

  const openTenantDialog = (name: 'edit' | 'license' | 'delete', tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({ ...tenant });
    setDialogOpen(name, true);
  };

  const openAddDialog = () => {
    setSelectedTenant(null);
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      description: '',
      expireTime: '',
      userLimit: 0,
    });
    setDialogOpen('add', true);
  };

  const openSetupDialog = (tenant: SetupTargetTenant) => {
    setSetupTargetTenant(tenant);
    setSetupDialogOpen(true);
  };

  const closeSetupDialog = () => {
    setSetupDialogOpen(false);
    setSetupTargetTenant(null);
  };

  const closeSuspendConfirm = () => {
    setSuspendTargetTenant(null);
  };

  const closePostCreateSetupConfirm = () => {
    setPostCreateSetupTarget(null);
  };

  const isCurrentTenantAffected = (tenant?: Pick<Tenant, 'id' | 'code'> | null) => {
    if (!tenant) {
      return false;
    }

    if (currentTenantId && tenant.id === currentTenantId) {
      return true;
    }

    return Boolean(currentTenantCode && tenant.code === currentTenantCode);
  };

  const syncCurrentTenantContextIfNeeded = async (tenant?: Pick<Tenant, 'id' | 'code'> | null) => {
    if (!isCurrentTenantAffected(tenant)) {
      return;
    }

    await refreshTenantContext();
  };

  const confirmSuspendTenant = async () => {
    if (!suspendTargetTenant) {
      return;
    }

    try {
      await tenantDatabaseApi.suspendTenant(suspendTargetTenant.id);
      await syncCurrentTenantContextIfNeeded(suspendTargetTenant);
      systemNotification.success(copy.notifications.suspended);
      closeSuspendConfirm();
      await reloadTenants();
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.notifications.suspendFailed;
      systemNotification.error(message);
    }
  };

  const handleAction = (action: string, tenant: Tenant) => {
    switch (action) {
      case 'edit':
        openTenantDialog('edit', tenant);
        break;
      case 'license':
        openTenantDialog('license', tenant);
        break;
      case 'delete':
        openTenantDialog('delete', tenant);
        break;
      case 'suspend':
        setSuspendTargetTenant(tenant);
        break;
      case 'activate':
        void tenantDatabaseApi
          .activateTenant(tenant.id)
          .then(async () => {
            await syncCurrentTenantContextIfNeeded(tenant);
            systemNotification.success(copy.notifications.activated);
            await reloadTenants();
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : copy.notifications.activateFailed;
            systemNotification.error(message);
          });
        break;
      case 'view':
        setOverviewTenant(tenant);
        break;
      case 'database':
        openSetupDialog(tenant);
        break;
      default:
        break;
    }
  };

  const handlers = {
    onCreateSubmit: async () => {
      if (!formData.name?.trim()) {
        systemNotification.error(copy.notifications.tenantNameRequired);
        return;
      }
      if (!formData.code?.trim()) {
        systemNotification.error(copy.notifications.tenantCodeRequired);
        return;
      }
      const normalizedCode = normalizeTenantCode(formData.code);
      if (!normalizedCode) {
        systemNotification.error(copy.notifications.tenantCodeRequired);
        return;
      }
      if ((formData.userLimit ?? 0) < 0) {
        systemNotification.error(copy.notifications.userLimitInvalid);
        return;
      }

      setSubmittingAdd(true);
      try {
        const created = await tenantDatabaseApi.createTenant({
          name: formData.name.trim(),
          code: normalizedCode,
          description: formData.description?.trim() || '',
          contact_person: formData.contactPerson?.trim() || '',
          expire_at: formData.expireTime || '',
        });

        if ((formData.userLimit ?? 0) > 0) {
          await tenantDatabaseApi.updateTenantQuotas(created.id, [
            {
              type: 'users',
              maxValue: Number(formData.userLimit ?? 0),
              unit: 'users',
            },
          ]);
        }

        systemNotification.success(copy.notifications.created);
        handleDialogChange('add', false);
        await reloadTenants();

        setPostCreateSetupTarget({
          id: created.id,
          name: created.name,
          code: created.code,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.notifications.createFailed;
        systemNotification.error(message);
      } finally {
        setSubmittingAdd(false);
      }
    },
    onEditSubmit: async () => {
      if (!selectedTenant) {
        return;
      }
      if (!formData.name?.trim()) {
        systemNotification.error(copy.notifications.tenantNameRequired);
        return;
      }

      setSubmittingEdit(true);
      try {
        await tenantDatabaseApi.updateTenant(selectedTenant.id, {
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          contact_person: formData.contactPerson?.trim() || '',
          expire_at: formData.expireTime || selectedTenant.expireTime || '',
        });
        await syncCurrentTenantContextIfNeeded(selectedTenant);
        systemNotification.success(copy.notifications.updated);
        handleDialogChange('edit', false);
        await reloadTenants();
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.notifications.updateFailed;
        systemNotification.error(message);
      } finally {
        setSubmittingEdit(false);
      }
    },
    onLicenseSubmit: async () => {
      if (!selectedTenant) {
        return;
      }
      if (!formData.expireTime) {
        systemNotification.error(copy.notifications.expiryRequired);
        return;
      }
      if ((formData.userLimit ?? 0) < 0) {
        systemNotification.error(copy.notifications.userLimitInvalid);
        return;
      }

      setSubmittingLicense(true);
      try {
        await tenantDatabaseApi.updateTenant(selectedTenant.id, {
          name: (formData.name || selectedTenant.name).trim(),
          description: formData.description?.trim() || '',
          contact_person: formData.contactPerson?.trim() || '',
          expire_at: formData.expireTime,
        });
        await tenantDatabaseApi.updateTenantQuotas(selectedTenant.id, [
          {
            type: 'users',
            maxValue: Number(formData.userLimit ?? 0),
            unit: 'users',
          },
        ]);
        await syncCurrentTenantContextIfNeeded(selectedTenant);
        systemNotification.success(copy.notifications.licenseUpdated);
        handleDialogChange('license', false);
        await reloadTenants();
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.notifications.licenseUpdateFailed;
        systemNotification.error(message);
      } finally {
        setSubmittingLicense(false);
      }
    },
    onDelete: async () => {
      if (!selectedTenant) {
        return;
      }

      setDeletingTenant(true);
      try {
        await tenantDatabaseApi.deleteTenant(selectedTenant.id);
        systemNotification.success(copy.notifications.deleted);
        handleDialogChange('delete', false);
        await reloadTenants();
      } catch (error) {
        const message = error instanceof Error ? error.message : copy.notifications.deleteFailed;
        systemNotification.error(message);
      } finally {
        setDeletingTenant(false);
      }
    },
  };

  const sourceLabel =
    sourceState === 'error' ? copy.source.unavailable : sourceState === 'empty' ? copy.source.empty : copy.source.remote;
  const dataSourceDescription = `${copy.source.label}: ${sourceLabel}${
    lastLoadedAt ? ` · ${copy.source.refreshedAt}: ${new Date(lastLoadedAt).toLocaleString(locale)}` : ''
  }`;
  const pageDescription =
    sourceState === 'error'
      ? copy.pageDescription.unavailable
      : sourceState === 'empty'
        ? copy.pageDescription.empty
        : copy.pageDescription.normal;
  const filteredTenants = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return effectiveTenants
      .filter((tenant) => {
        const matchesSearch =
          keyword.length === 0 ||
          [tenant.name, tenant.code, tenant.contactPerson]
            .filter(Boolean)
            .some((field) => field?.toLowerCase().includes(keyword));
        const matchesStatus = filterStatus === 'all' || tenant.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
  }, [effectiveTenants, filterStatus, searchQuery]);
  const totalPages = Math.ceil(filteredTenants.length / pageSize) || 1;
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, setPage, totalPages]);
  const displayTenants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, page]);
  const handleExportTenants = () => {
    if (filteredTenants.length === 0) {
      systemNotification.info(copy.notifications.exportEmpty);
      return;
    }

    exportDataToCSV(
      filteredTenants.map((tenant) => ({
        name: tenant.name,
        code: tenant.code,
        status: tenant.status,
        contactPerson: tenant.contactPerson || '',
        dbType: tenant.dbType,
        dbName: tenant.dbName,
        userCount: tenant.userCount,
        userLimit: tenant.userLimit,
        expireTime: tenant.expireTime,
        createdAt: tenant.createdAt,
        description: tenant.description || '',
      })),
      [
        { key: 'name', label: zh ? '租户名称' : 'Tenant Name' },
        { key: 'code', label: zh ? '租户编码' : 'Tenant Code' },
        { key: 'status', label: zh ? '状态' : 'Status' },
        { key: 'contactPerson', label: zh ? '联系人' : 'Contact Person' },
        { key: 'dbType', label: zh ? '数据库类型' : 'Database Type' },
        { key: 'dbName', label: zh ? '数据库名称' : 'Database Name' },
        { key: 'userCount', label: zh ? '当前用户数' : 'Current Users' },
        { key: 'userLimit', label: zh ? '用户上限' : 'User Limit' },
        { key: 'expireTime', label: zh ? '服务有效期' : 'Service Expiry' },
        { key: 'createdAt', label: zh ? '创建时间' : 'Created At' },
        { key: 'description', label: zh ? '说明' : 'Description' },
      ],
      'TenantManagement_Filtered',
    );
    systemNotification.success(copy.notifications.exportSuccess);
  };
  const tenantReviewStats = useMemo(() => {
    const active = filteredTenants.filter((tenant) => tenant.status === 'active').length;
    const pending = filteredTenants.filter((tenant) => tenant.status === 'pending').length;
    const suspended = filteredTenants.filter((tenant) => tenant.status === 'suspended').length;
    const warning = filteredTenants.filter(
      (tenant) => tenant.userLimit > 0 && tenant.userCount / tenant.userLimit >= 0.9,
    ).length;

    return {
      total: filteredTenants.length,
      active,
      pending,
      suspended,
      warning,
    };
  }, [filteredTenants]);
  const tenantFocusSummary = useMemo(() => {
    if (tenantReviewStats.pending > 0) {
      return {
        badge: zh ? '待初始化优先' : 'Pending First',
        badgeVariant: 'warning' as const,
        title: zh ? '当前应优先处理待初始化租户' : 'Prioritize tenants awaiting setup',
        description:
          zh
            ? `当前筛选结果中有 ${tenantReviewStats.pending} 个租户仍未完成数据库初始化，建议先检查初始化向导与默认管理员引导。`
            : `${tenantReviewStats.pending} tenants in the current result still need database onboarding. Review setup and admin bootstrap first.`,
        nextAction:
          zh ? '优先打开待初始化租户，继续数据库接入与基础权限引导。' : 'Open a pending tenant and continue database onboarding first.',
      };
    }
    if (tenantReviewStats.suspended > 0) {
      return {
        badge: zh ? '停用复核' : 'Suspended Review',
        badgeVariant: 'mono' as const,
        title: zh ? '当前列表存在停用租户需要复核' : 'Suspended tenants need follow-up',
        description:
          zh
            ? `当前结果中有 ${tenantReviewStats.suspended} 个停用租户，建议先确认停用原因、授权状态与恢复条件。`
            : `${tenantReviewStats.suspended} suspended tenants are in scope. Review the reason, license state, and recovery readiness first.`,
        nextAction:
          zh ? '先查看停用租户概览，再决定恢复启用或继续停用。' : 'Open suspended tenant overviews before deciding to reactivate them.',
      };
    }
    if (tenantReviewStats.warning > 0) {
      return {
        badge: zh ? '配额预警' : 'Quota Watch',
        badgeVariant: 'info' as const,
        title: zh ? '当前结果中有租户接近配额上限' : 'Some tenants are nearing quota limits',
        description:
          zh
            ? `共有 ${tenantReviewStats.warning} 个租户用户配额接近上限，建议优先检查授权续期与扩容安排。`
            : `${tenantReviewStats.warning} tenants are close to user quota limits. Review licensing and expansion next.`,
        nextAction:
          zh ? '优先查看配额预警租户，确认是否需要调整授权。' : 'Open the quota-warning tenants and review license changes.',
      };
    }
    if (searchQuery.trim()) {
      return {
        badge: zh ? '筛选结果' : 'Filtered Result',
        badgeVariant: 'mono' as const,
        title: zh ? '当前处于聚焦检索模式' : 'You are reviewing a narrowed result set',
        description:
          zh
            ? `当前已将范围缩小到 ${tenantReviewStats.total} 个租户，适合继续逐项查看概览、授权或数据库状态。`
            : `The current scope is narrowed to ${tenantReviewStats.total} tenants, which is ideal for focused review.`,
        nextAction:
          zh ? '继续查看目标租户概览，或清空筛选回到全局视图。' : 'Continue with targeted overviews, or clear filters to return to the full portfolio.',
      };
    }

    return {
      badge: zh ? '运行稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前租户运营面整体稳定' : 'Tenant operations are stable overall',
      description:
        zh
          ? '当前结果以内主要是运行中的租户，建议按配额、有效期和数据库状态做常规巡检。'
          : 'Most tenants in scope are active. Continue with routine checks on quota, expiry, and database health.',
      nextAction:
        zh ? '按租户概览逐项抽查即可。' : 'Continue with overview-based spot checks.',
    };
  }, [searchQuery, tenantReviewStats, zh]);
  const priorityPendingTenant = filteredTenants.find((tenant) => tenant.status === 'pending');
  const prioritySuspendedTenant = filteredTenants.find((tenant) => tenant.status === 'suspended');
  const viewTenant = useMemo(() => {
    const applySetupCompletion = (tenant: Tenant | null) => {
      if (!tenant) {
        return null;
      }
      if (!setupCompletedTenantIds.includes(tenant.id)) {
        return tenant;
      }
      return {
        ...tenant,
        status: 'active' as const,
      };
    };

    if (!overviewTenant) {
      return null;
    }

    const latest = sourceData.find((tenant) => tenant.id === overviewTenant.id) ?? overviewTenant;
    return applySetupCompletion(latest);
  }, [overviewTenant, setupCompletedTenantIds, sourceData]);
  const overviewQuotaUsage = viewTenant && viewTenant.userLimit > 0
    ? Math.round((viewTenant.userCount / viewTenant.userLimit) * 100)
    : 0;
  const overviewStatusBadge = viewTenant ? (
    <Badge variant={viewTenant.status === 'active' ? 'success' : viewTenant.status === 'pending' ? 'mono' : 'warning'}>
      {copy.statuses[viewTenant.status]}
    </Badge>
  ) : null;

  return (
    <div className="space-y-6">
      <ManagementPageHeader
        eyebrow="TENANT"
        title={t.menu.tenantManagement || copy.pageTitle}
        description={pageDescription}
        meta={
          <>
            <Badge variant="mono">Tenant</Badge>
            <Badge variant="info">
              {zh ? `${stats.total} 个租户` : `${stats.total} tenants`}
            </Badge>
            <Badge variant={sourceState === 'error' ? 'warning' : sourceState === 'empty' ? 'mono' : 'success'}>
              {sourceLabel}
            </Badge>
          </>
        }
        actions={
          <>
          <Button
            variant="mono"
            size="pill"
            onClick={() => {
              void reloadTenants().then(() => {
                systemNotification.success(copy.notifications.listRefreshed);
              });
            }}
            className="gap-2 border-slate-200 bg-white"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            {copy.actions.refresh}
          </Button>
          <Button
            variant="mono"
            size="pill"
            className="gap-2"
            onClick={handleExportTenants}
          >
            <Download className="h-4 w-4 text-slate-400" />
            {copy.actions.export}
          </Button>
          <Button
            size="pill"
            onClick={openAddDialog}
            className="shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {copy.actions.addTenant}
          </Button>
          </>
        }
      />
      <TenantStatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          label={zh ? '筛选结果' : 'Filtered Tenants'}
          value={tenantReviewStats.total}
          hint={zh ? '当前筛选条件下的租户总数。' : 'Total tenants under the current filter.'}
        />
        <ManagementMetricCard
          label={zh ? '运行中' : 'Active'}
          value={tenantReviewStats.active}
          hint={zh ? '当前可正常承载业务的租户。' : 'Tenants currently serving business traffic.'}
        />
        <ManagementMetricCard
          label={zh ? '待初始化' : 'Pending Setup'}
          value={tenantReviewStats.pending}
          hint={
            tenantReviewStats.pending > 0
              ? (zh ? '建议优先推进数据库接入与初始化。' : 'Prioritize database onboarding and setup.')
              : (zh ? '当前没有待初始化租户。' : 'No pending tenants are waiting for setup.')
          }
        />
        <ManagementMetricCard
          label={zh ? '配额预警' : 'Quota Warning'}
          value={tenantReviewStats.warning}
          hint={
            tenantReviewStats.warning > 0
              ? (zh ? '存在接近配额上限的租户。' : 'Some tenants are nearing their quota ceiling.')
              : (zh ? '当前没有明显配额压力。' : 'No obvious quota pressure is visible right now.')
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ManagementFocusCard
          icon={Search}
          eyebrow="REVIEW"
          title={zh ? '运营焦点' : 'Operational Focus'}
          value={tenantFocusSummary.title}
          hint={tenantFocusSummary.description}
          badge={<Badge variant={tenantFocusSummary.badgeVariant}>{tenantFocusSummary.badge}</Badge>}
          action={<div className="text-xs leading-5 text-slate-500">{tenantFocusSummary.nextAction}</div>}
        />
        <ManagementFocusCard
          icon={RefreshCw}
          eyebrow="PRIORITY"
          title={zh ? '当前处理顺序' : 'Current Priority Order'}
          value={
            tenantReviewStats.pending > 0
              ? (zh ? '先处理待初始化租户' : 'Handle pending tenants first')
              : tenantReviewStats.suspended > 0
                ? (zh ? '再复核停用租户' : 'Then review suspended tenants')
                : tenantReviewStats.warning > 0
                  ? (zh ? '继续检查配额预警' : 'Continue with quota warnings')
                  : (zh ? '执行常规巡检' : 'Run routine inspection')
          }
          hint={tenantFocusSummary.nextAction}
          badge={<Badge variant={tenantFocusSummary.badgeVariant}>{`01`}</Badge>}
          action={
            <div className="text-xs leading-5 text-slate-500">
              {zh ? '完成首项后，再继续查看概览、授权与数据库状态。' : 'After the first priority, continue with overview, license, and database status.'}
            </div>
          }
        />
      </div>

      {setupSummary ? (
        <ManagementContentCard className="border-emerald-200/70 bg-emerald-50/55 p-5 shadow-[0_18px_40px_-30px_rgba(16,185,129,0.25)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-emerald-900">
                  {zh ? `租户“${setupSummary.tenantName}”初始化已完成` : `Tenant "${setupSummary.tenantName}" setup completed`}
                </div>
                <div className="mt-1 text-xs leading-5 text-emerald-800/80">
                  {zh
                    ? '数据库配置、基础角色与权限模板已完成引导，可继续检查租户概览或进入系统管理。'
                    : 'Database setup and base role/permission bootstrap are complete. You can continue with the tenant overview or system management.'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{zh ? '初始化完成' : 'Setup Complete'}</Badge>
                {setupSummary.databaseType ? <Badge variant="info">{setupSummary.databaseType.toUpperCase()}</Badge> : null}
                {setupSummary.deploymentMode ? <Badge variant="mono">{setupSummary.deploymentMode}</Badge> : null}
                {setupSummary.adminUsername ? <Badge variant="mono">{setupSummary.adminUsername}</Badge> : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <TenantOverviewCard
                label={zh ? '数据库' : 'Database'}
                value={setupSummary.database || '-'}
                hint={zh ? '本次初始化写入的数据库标识。' : 'Database target used by this setup run.'}
              />
              <TenantOverviewCard
                label={zh ? '模块引导' : 'Initialized Modules'}
                value={setupSummary.initializedModules.length}
                hint={setupSummary.initializedModules.length ? setupSummary.initializedModules.join(', ') : '-'}
              />
              <TenantOverviewCard
                label={zh ? '基础菜单' : 'Base Menus'}
                value={setupSummary.menuCount ?? 0}
                hint={zh ? '已写入的默认菜单数量。' : 'Default menus assigned during bootstrap.'}
              />
              <TenantOverviewCard
                label={zh ? '权限模板' : 'Permission Templates'}
                value={setupSummary.permissionCount ?? 0}
                hint={setupSummary.roleCode ? `${zh ? '默认角色' : 'Default role'}: ${setupSummary.roleCode}` : undefined}
              />
              <TenantOverviewCard
                label={zh ? '租户策略' : 'Tenant Strategy'}
                value={setupSummary.tenantStrategy || '-'}
                hint={zh ? '用于标识本次初始化的租户隔离策略。' : 'Isolation strategy used during this setup.'}
              />
              <TenantOverviewCard
                label={zh ? '默认管理员' : 'Admin Bootstrap'}
                value={setupSummary.adminUsername || '-'}
                hint={setupSummary.adminEmail || (zh ? '未返回邮箱信息' : 'No admin email returned')}
              />
            </div>

            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '下一步检查清单' : 'Next Review Checklist'}
              description={
                zh
                  ? '初始化完成后，建议按下面顺序继续核对租户状态、管理员和授权范围。'
                  : 'After setup completes, review tenant state, admin bootstrap, and authorization scope in this order.'
              }
            >
              <DetailKeyValueItem
                label={zh ? '租户状态' : 'Tenant State'}
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">{zh ? '已完成初始化' : 'Setup Complete'}</Badge>
                    <span>
                      {zh
                        ? '建议先打开租户概览，确认状态、配额与数据库接入是否正常。'
                        : 'Open the tenant overview first to confirm status, quota, and database onboarding.'}
                    </span>
                  </div>
                }
                className="md:col-span-2"
              />
              <DetailKeyValueItem
                label={zh ? '管理员引导' : 'Admin Bootstrap'}
                value={setupSummary.adminUsername || '-'}
                hint={
                  setupSummary.adminEmail
                    ? (zh ? `邮箱：${setupSummary.adminEmail}` : `Email: ${setupSummary.adminEmail}`)
                    : (zh ? '建议继续确认管理员邮箱和首次登录信息。' : 'Continue by confirming admin email and first-login details.')
                }
              />
              <DetailKeyValueItem
                label={zh ? '授权范围' : 'Authorization Scope'}
                value={`${setupSummary.menuCount ?? 0} / ${setupSummary.permissionCount ?? 0}`}
                hint={zh ? '基础菜单 / 权限模板' : 'Base menus / permission templates'}
              />
              <DetailKeyValueItem
                label={zh ? '建议动作' : 'Recommended Actions'}
                className="md:col-span-2"
                value={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        const matchedTenant = sourceData.find((tenant) => tenant.id === setupSummary.tenantId);
                        if (matchedTenant) {
                          setOverviewTenant(
                            matchedTenant.status === 'pending'
                              ? { ...matchedTenant, status: 'active' }
                              : matchedTenant,
                          );
                        }
                      }}
                    >
                      {zh ? '先看租户概览' : 'Open Tenant Overview'}
                    </Button>
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        const matchedTenant = sourceData.find((tenant) => tenant.id === setupSummary.tenantId);
                        if (matchedTenant) {
                          openSetupDialog(matchedTenant);
                        }
                      }}
                    >
                      {zh ? '回看初始化向导' : 'Reopen Setup Wizard'}
                    </Button>
                  </div>
                }
              />
            </DetailKeyValueSection>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="mono"
                size="pill"
                onClick={() => {
                  const matchedTenant = sourceData.find((tenant) => tenant.id === setupSummary.tenantId);
                  if (matchedTenant) {
                    setOverviewTenant(
                      matchedTenant.status === 'pending'
                        ? { ...matchedTenant, status: 'active' }
                        : matchedTenant,
                    );
                  }
                }}
              >
                {zh ? '查看租户概览' : 'View Tenant Overview'}
              </Button>
              <Button
                type="button"
                variant="mono"
                size="pill"
                onClick={() => {
                  const matchedTenant = sourceData.find((tenant) => tenant.id === setupSummary.tenantId);
                  if (matchedTenant) {
                    openSetupDialog(matchedTenant);
                  }
                }}
              >
                {zh ? '重新打开初始化向导' : 'Reopen Setup Wizard'}
              </Button>
              <Button
                type="button"
                variant="mono"
                size="pill"
                onClick={() => setSetupSummary(null)}
              >
                {zh ? '收起成功摘要' : 'Dismiss Summary'}
              </Button>
            </div>
          </div>
        </ManagementContentCard>
      ) : null}

      <div className="text-xs text-slate-500">{dataSourceDescription}</div>

      <ManagementContentCard className="border-slate-200/70 bg-gradient-to-br from-white via-slate-50/70 to-slate-100/70 p-5">
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <DetailKeyValueSection
              eyebrow="PRIORITY"
              title={zh ? '本次处理顺序' : 'Suggested Priority Order'}
              description={
                zh
                  ? '根据当前租户状态，建议优先处理这些运营动作。'
                  : 'Based on current tenant state, these operational actions should be handled first.'
              }
            >
              <DetailKeyValueItem
                label="01"
                value={
                  tenantReviewStats.pending > 0
                    ? (zh ? '先推进待初始化租户' : 'Continue pending tenant setup first')
                    : tenantReviewStats.warning > 0
                      ? (zh ? '先处理配额预警租户' : 'Review quota-warning tenants first')
                      : tenantReviewStats.suspended > 0
                        ? (zh ? '先复核停用租户' : 'Review suspended tenants first')
                        : (zh ? '先检查当前筛选结果' : 'Review the current filtered result first')
                }
                hint={
                  tenantReviewStats.pending > 0
                    ? (zh ? '初始化未完成会阻断租户正式交付。' : 'Incomplete setup blocks tenant delivery.')
                    : tenantReviewStats.warning > 0
                      ? (zh ? '配额接近上限时应优先确认授权与扩容。' : 'Quota pressure should be reviewed with licensing or expansion first.')
                      : tenantReviewStats.suspended > 0
                        ? (zh ? '停用租户需要先确认恢复条件和服务影响。' : 'Suspended tenants require recovery-condition and service-impact review.')
                        : (zh ? '可继续按状态或关键字缩小范围。' : 'Continue narrowing the scope by status or keyword.')
                }
              />
              <DetailKeyValueItem
                label="02"
                value={zh ? '再查看租户概览或授权信息' : 'Then inspect tenant overview or license detail'}
              />
              <DetailKeyValueItem
                label="03"
                value={zh ? '最后执行新增、调整授权或导出' : 'Finally add, adjust license, or export'}
                className="md:col-span-2"
              />
            </DetailKeyValueSection>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tenantFocusSummary.badgeVariant}>{tenantFocusSummary.badge}</Badge>
                <Badge variant="mono">
                  {zh ? `当前范围 ${tenantReviewStats.total} 个租户` : `${tenantReviewStats.total} tenants in scope`}
                </Badge>
              </div>
              <div className="text-sm font-semibold text-slate-900">{tenantFocusSummary.title}</div>
              <div className="text-xs leading-5 text-slate-600">{tenantFocusSummary.description}</div>
            </div>
            <div className="grid min-w-[260px] grid-cols-2 gap-2 sm:grid-cols-4">
              <TenantOverviewCard
                label={zh ? '运行中' : 'Active'}
                value={tenantReviewStats.active}
                hint={zh ? '当前筛选结果中的稳定租户。' : 'Stable tenants in the current scope.'}
              />
              <TenantOverviewCard
                label={zh ? '待初始化' : 'Pending'}
                value={tenantReviewStats.pending}
                hint={zh ? '需要继续数据库接入。' : 'Still waiting for database onboarding.'}
              />
              <TenantOverviewCard
                label={zh ? '已停用' : 'Suspended'}
                value={tenantReviewStats.suspended}
                hint={zh ? '建议复核停用原因。' : 'Review suspension reasons first.'}
              />
              <TenantOverviewCard
                label={zh ? '配额预警' : 'Quota Watch'}
                value={tenantReviewStats.warning}
                hint={zh ? '用户配额接近上限。' : 'User quota is nearing the limit.'}
              />
            </div>
          </div>

          <DetailKeyValueSection
            eyebrow="REVIEW"
            title={zh ? '运营焦点' : 'Operational Focus'}
            description={zh ? '按当前筛选结果快速判断先看哪里、先做什么。' : 'Use the current result set to decide what to review next.'}
          >
            <DetailKeyValueItem
              label={zh ? '当前结论' : 'Current Outcome'}
              value={tenantFocusSummary.title}
              hint={tenantFocusSummary.description}
              className="md:col-span-2"
            />
            <DetailKeyValueItem
              label={zh ? '筛选状态' : 'Filter State'}
              value={filterStatus === 'all' ? copy.statuses.all : copy.statuses[filterStatus]}
              hint={searchQuery.trim() ? `${zh ? '关键词' : 'Keyword'}: ${searchQuery.trim()}` : (zh ? '未设置关键词筛选' : 'No keyword filter applied')}
            />
            <DetailKeyValueItem
              label={zh ? '下一步动作' : 'Next Action'}
              value={tenantFocusSummary.nextAction}
            />
            <DetailKeyValueItem
              label={zh ? '推荐操作' : 'Recommended Actions'}
              className="md:col-span-2"
              value={
                <div className="flex flex-wrap gap-2">
                  {priorityPendingTenant ? (
                    <Button type="button" variant="mono" size="pill" onClick={() => openSetupDialog(priorityPendingTenant)}>
                      {zh ? '继续待初始化租户' : 'Continue Pending Setup'}
                    </Button>
                  ) : null}
                  {prioritySuspendedTenant ? (
                    <Button type="button" variant="mono" size="pill" onClick={() => setOverviewTenant(prioritySuspendedTenant)}>
                      {zh ? '查看停用租户概览' : 'Review Suspended Tenant'}
                    </Button>
                  ) : null}
                  {(searchQuery.trim() || filterStatus !== 'all') ? (
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('all');
                      }}
                    >
                      {zh ? '清空筛选条件' : 'Clear Filters'}
                    </Button>
                  ) : null}
                </div>
              }
            />
          </DetailKeyValueSection>
        </div>
      </ManagementContentCard>

      <ManagementFilterPanel className="mb-0 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[350px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
            />
          </div>

          <div className="w-44">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
              <SelectTrigger className="h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder={copy.statusPlaceholder} />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                <SelectItem value="all">{copy.statuses.all}</SelectItem>
                <SelectItem value="active">{copy.statuses.active}</SelectItem>
                <SelectItem value="suspended">{copy.statuses.suspended}</SelectItem>
                <SelectItem value="pending">{copy.statuses.pending}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ManagementFilterPanel>

      <ManagementContentCard>
        <TenantTable
          data={displayTenants}
          onAction={handleAction}
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </ManagementContentCard>

      {viewTenant ? (
        <DetailDialogWrapper
          open={Boolean(viewTenant)}
          onOpenChange={(open) => {
            if (!open) {
              setOverviewTenant(null);
            }
          }}
          title={viewTenant.name}
          description={zh ? '租户概览、配额、数据库与服务状态摘要。' : 'Tenant overview, quota, database, and service summary.'}
          size="xl"
        >
          <div className="space-y-5">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={zh ? '概览摘要' : 'Overview Summary'}
              description={zh ? '帮助快速判断当前租户应先看什么。' : 'Helps decide what to review first for this tenant.'}
            >
              <DetailKeyValueItem
                label={zh ? '当前结论' : 'Current Outcome'}
                value={
                  <Badge variant={overviewQuotaUsage >= 90 ? 'warning' : viewTenant.status === 'active' ? 'success' : 'mono'}>
                    {overviewQuotaUsage >= 90
                      ? (zh ? '配额优先' : 'Quota First')
                      : viewTenant.status === 'pending'
                        ? (zh ? '初始化优先' : 'Setup First')
                        : viewTenant.status === 'suspended'
                          ? (zh ? '停用复核' : 'Suspended Review')
                          : (zh ? '运行稳定' : 'Stable')}
                  </Badge>
                }
                hint={
                  overviewQuotaUsage >= 90
                    ? (zh ? '当前租户接近配额上限，建议优先检查授权。' : 'This tenant is near quota limits. Review licensing first.')
                    : viewTenant.status === 'pending'
                      ? (zh ? '当前租户仍待完成初始化。' : 'This tenant still needs setup completion.')
                      : viewTenant.status === 'suspended'
                        ? (zh ? '当前租户处于停用状态，需要复核恢复条件。' : 'This tenant is suspended and needs recovery review.')
                        : (zh ? '当前租户资料、配额与数据库状态整体稳定。' : 'Profile, quota, and database state look stable overall.')
                }
              />
              <DetailKeyValueItem
                label={zh ? '关键范围' : 'Key Scope'}
                value={`${viewTenant.userCount}/${viewTenant.userLimit}`}
                hint={zh ? '当前用户数 / 用户上限' : 'Current users / user limit'}
              />
              <DetailKeyValueItem
                label={zh ? '下一步动作' : 'Next Action'}
                value={
                  overviewQuotaUsage >= 90
                    ? (zh ? '先调整授权或扩容配额。' : 'Adjust licensing or expand quota first.')
                    : viewTenant.status === 'pending'
                      ? (zh ? '先继续数据库初始化向导。' : 'Continue with the database setup wizard first.')
                      : (zh ? '继续检查数据库接入与服务有效期。' : 'Continue with database and service-expiry review.')
                }
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <TenantOverviewCard
                label={zh ? '租户状态' : 'Tenant Status'}
                value={overviewStatusBadge}
                hint={zh ? '快速判断当前租户是否可继续提供服务。' : 'Quickly shows whether the tenant can continue serving traffic.'}
              />
              <TenantOverviewCard
                label={zh ? '用户配额' : 'User Quota'}
                value={`${viewTenant.userCount}/${viewTenant.userLimit}`}
                hint={zh ? `当前使用率 ${overviewQuotaUsage}%` : `Current usage ${overviewQuotaUsage}%`}
              />
              <TenantOverviewCard
                label={zh ? '数据库' : 'Database'}
                value={viewTenant.dbType.toUpperCase()}
                hint={viewTenant.dbName}
              />
              <TenantOverviewCard
                label={zh ? '服务有效期' : 'Service Expiry'}
                value={viewTenant.expireTime}
                hint={zh ? '用于判断授权是否接近到期。' : 'Used to judge whether the subscription is close to expiry.'}
              />
            </section>

            <DetailKeyValueSection
              eyebrow="TENANT"
              title={viewTenant.name}
              description={viewTenant.description || (zh ? '租户基础资料与服务状态摘要。' : 'Base tenant profile and service status summary.')}
            >
              <DetailKeyValueItem label={zh ? '租户编码' : 'Tenant Code'} value={viewTenant.code} />
              <DetailKeyValueItem label={zh ? '联系人' : 'Contact Person'} value={viewTenant.contactPerson || '-'} />
              <DetailKeyValueItem label={zh ? '创建时间' : 'Created At'} value={viewTenant.createdAt} />
              <DetailKeyValueItem label={zh ? '服务状态' : 'Service Status'} value={overviewStatusBadge} />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="QUOTA"
              title={zh ? '配额与使用情况' : 'Quota & Usage'}
              description={zh ? '用于快速判断租户当前配额压力和资源使用状态。' : 'Used to quickly review quota pressure and current resource usage.'}
            >
              <DetailKeyValueItem
                label={zh ? '当前用户数' : 'Current Users'}
                value={viewTenant.userCount}
              />
              <DetailKeyValueItem
                label={zh ? '用户上限' : 'User Limit'}
                value={viewTenant.userLimit}
              />
              <DetailKeyValueItem
                label={zh ? '配额使用率' : 'Quota Usage'}
                value={`${overviewQuotaUsage}%`}
                hint={overviewQuotaUsage >= 90 ? (zh ? '已接近上限，建议优先检查授权。' : 'Near the quota limit; review licensing first.') : undefined}
              />
              <DetailKeyValueItem
                label={zh ? '风险级别' : 'Risk Level'}
                value={
                  <Badge variant={overviewQuotaUsage >= 90 ? 'warning' : viewTenant.status === 'active' ? 'success' : 'mono'}>
                    {overviewQuotaUsage >= 90 ? (zh ? '配额预警' : 'Quota Warning') : viewTenant.status === 'active' ? (zh ? '运行稳定' : 'Stable') : (zh ? '待跟进' : 'Needs Follow-up')}
                  </Badge>
                }
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="DATABASE"
              title={zh ? '数据库接入' : 'Database Access'}
              description={zh ? '用于确认当前租户的数据库类型与命名落点。' : 'Used to confirm the current database type and naming target.'}
            >
              <DetailKeyValueItem label={zh ? '数据库类型' : 'Database Type'} value={viewTenant.dbType.toUpperCase()} />
              <DetailKeyValueItem label={zh ? '数据库名称' : 'Database Name'} value={viewTenant.dbName} valueClassName="font-mono text-xs" />
              <DetailKeyValueItem
                label={zh ? '初始化状态' : 'Onboarding State'}
                value={
                  <Badge variant={viewTenant.status === 'pending' ? 'warning' : 'info'}>
                    {viewTenant.status === 'pending' ? (zh ? '待完成初始化' : 'Pending Setup') : (zh ? '已接入' : 'Connected')}
                  </Badge>
                }
              />
              <DetailKeyValueItem
                label={zh ? '后续动作' : 'Next Step'}
                value={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        setOverviewTenant(null);
                        openSetupDialog(viewTenant);
                      }}
                    >
                      {zh ? '打开初始化向导' : 'Open Setup Wizard'}
                    </Button>
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        setSelectedTenant(viewTenant);
                        setFormData({ ...viewTenant });
                        setOverviewTenant(null);
                        setDialogOpen('license', true);
                      }}
                    >
                      {zh ? '调整授权' : 'Adjust License'}
                    </Button>
                  </div>
                }
                className="md:col-span-2"
              />
            </DetailKeyValueSection>
          </div>
        </DetailDialogWrapper>
      ) : null}

      <TenantDialogManager
        dialogs={dialogs}
        selectedTenant={selectedTenant}
        formData={formData}
        setFormData={setFormData}
        onDialogChange={handleDialogChange}
        handlers={handlers}
        loading={{
          add: submittingAdd,
          edit: submittingEdit,
          license: submittingLicense,
          delete: deletingTenant,
        }}
      />

      <Dialog open={setupDialogOpen} onOpenChange={(open) => (open ? setSetupDialogOpen(true) : closeSetupDialog())}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{copy.setup.title}</DialogTitle>
            <DialogDescription>{setupTargetTenant ? copy.setup.description(setupTargetTenant.name) : ' '}</DialogDescription>
          </DialogHeader>

          {setupTargetTenant ? (
            <div className="px-6 pb-6">
              <TenantSetupWizard
                embedded
                targetTenantId={setupTargetTenant.id}
                targetTenantName={setupTargetTenant.name}
                targetTenantCode={setupTargetTenant.code}
                onCompleted={async (_tenantId, result) => {
                  setSetupCompletedTenantIds((current) =>
                    current.includes(setupTargetTenant.id) ? current : [...current, setupTargetTenant.id],
                  );
                  if (result) {
                    setSetupSummary({
                      tenantId: setupTargetTenant.id,
                      tenantName: setupTargetTenant.name,
                      databaseType: result.databaseType,
                      database: result.database,
                      initializedModules: result.initializedModules ?? [],
                      deploymentMode: result.deploymentMode,
                      tenantStrategy: result.tenantStrategy,
                      adminUsername: result.bootstrap?.adminUsername,
                      adminEmail: result.bootstrap?.adminEmail,
                      roleCode: result.bootstrap?.roleCode,
                      menuCount: result.bootstrap?.menuCount,
                      permissionCount: result.bootstrap?.permissionCount,
                    });
                  }
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  closeSetupDialog();
                  await syncCurrentTenantContextIfNeeded(setupTargetTenant);
                  const latest = await reloadTenants();
                  const matchedTenant = latest?.find((tenant) => tenant.id === setupTargetTenant.id);
                  if (matchedTenant) {
                    setOverviewTenant(
                      matchedTenant.status === 'pending'
                        ? { ...matchedTenant, status: 'active' }
                        : matchedTenant,
                    );
                  }
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(suspendTargetTenant)}
        onOpenChange={(open) => {
          if (!open) {
            closeSuspendConfirm();
          }
        }}
        onConfirm={() => {
          void confirmSuspendTenant();
        }}
        title={zh ? '确认停用租户' : 'Confirm Tenant Suspension'}
        description={
          suspendTargetTenant
            ? copy.notifications.confirmSuspend(suspendTargetTenant.name)
            : ' '
        }
        confirmText={zh ? '确认停用' : 'Suspend Tenant'}
        cancelText={zh ? '取消' : 'Cancel'}
        variant="warning"
      />

      <ConfirmDialog
        open={Boolean(postCreateSetupTarget)}
        onOpenChange={(open) => {
          if (!open) {
            closePostCreateSetupConfirm();
          }
        }}
        onConfirm={() => {
          if (!postCreateSetupTarget) {
            return;
          }
          openSetupDialog(postCreateSetupTarget);
          closePostCreateSetupConfirm();
        }}
        title={zh ? '继续租户初始化' : 'Continue Tenant Setup'}
        description={
          postCreateSetupTarget
            ? copy.notifications.openSetupConfirm(postCreateSetupTarget.name)
            : ' '
        }
        confirmText={zh ? '打开初始化向导' : 'Open Setup Wizard'}
        cancelText={zh ? '稍后处理' : 'Later'}
        variant="info"
      />
    </div>
  );
}







