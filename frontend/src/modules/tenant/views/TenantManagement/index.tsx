import { useState } from 'react';
import { Download, Filter, Plus, RefreshCw, Search } from 'lucide-react';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { systemNotification } from '../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../stores/languageStore';
import tenantDatabaseApi from '../../api/tenantDatabaseApi';
import { TenantSetupWizard } from '../../components/TenantSetupWizard';
import { TenantDialogManager } from './components/TenantDialogManager';
import { TenantStatsCards } from './components/TenantStatsCards';
import { TenantTable } from './components/TenantTable';
import type { Tenant } from './hooks/useTenantLogic';
import { useTenantLogic } from './hooks/useTenantLogic';

const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    name: '阿里云网络科技有限公司',
    code: 'ALIBABA',
    status: 'active',
    dbType: 'mysql',
    dbName: 'pantheon_ali',
    userCount: 850,
    userLimit: 1000,
    expireTime: '2026-12-31',
    createdAt: '2024-01-01',
    contactPerson: '马老师',
    description: '电商与基础云场景示例租户',
  },
  {
    id: '2',
    name: '腾讯科技（深圳）有限公司',
    code: 'TENCENT',
    status: 'active',
    dbType: 'postgres',
    dbName: 'pantheon_tx',
    userCount: 1200,
    userLimit: 5000,
    expireTime: '2027-06-15',
    createdAt: '2024-02-10',
    contactPerson: '马化腾',
    description: '企业协同与开放平台示例租户',
  },
  {
    id: '3',
    name: '字节跳动科技有限公司',
    code: 'BYTEDANCE',
    status: 'pending',
    dbType: 'mysql',
    dbName: 'pantheon_byte',
    userCount: 0,
    userLimit: 2000,
    expireTime: '2026-08-20',
    createdAt: '2026-03-01',
    contactPerson: '张一鸣',
    description: '待完成初始化的测试租户',
  },
  {
    id: '4',
    name: '百度在线网络技术（北京）有限公司',
    code: 'BAIDU',
    status: 'suspended',
    dbType: 'sqlite',
    dbName: 'pantheon_baidu',
    userCount: 450,
    userLimit: 500,
    expireTime: '2025-12-01',
    createdAt: '2023-11-15',
    contactPerson: '李厂长',
    description: '已停用的历史示例租户',
  },
];

type TenantDialogName = 'add' | 'edit' | 'delete' | 'license';
type SetupTargetTenant = Pick<Tenant, 'id' | 'name' | 'code'>;

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
          exportPending: '导出功能后续会接入真实租户数据源。',
        },
        source: {
          label: '数据来源',
          local: '本地兜底数据',
          remote: '后端接口',
          refreshedAt: '最近刷新',
        },
        pageDescription: {
          fallback: '统一管理租户资料、授权、配额与数据库接入状态。当前列表为本地兜底数据。',
          normal: '统一管理租户资料、授权、配额与数据库接入状态。',
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
          exportPending: 'Export will be wired to the real tenant data source later.',
        },
        source: {
          label: 'Source',
          local: 'Local fallback',
          remote: 'Backend API',
          refreshedAt: 'Last refresh',
        },
        pageDescription: {
          fallback: 'Manage tenant profiles, licenses, quotas, and database onboarding status. The current list uses local fallback data.',
          normal: 'Manage tenant profiles, licenses, quotas, and database onboarding status.',
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
    page,
    setPage,
    totalPages,
    paginatedData,
    stats,
    loading,
    usingMockData,
    lastLoadedAt,
    reloadTenants,
  } = useTenantLogic(MOCK_TENANTS);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [submittingLicense, setSubmittingLicense] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [setupTargetTenant, setSetupTargetTenant] = useState<SetupTargetTenant | null>(null);
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
        if (window.confirm(copy.notifications.confirmSuspend(tenant.name))) {
          void tenantDatabaseApi
            .suspendTenant(tenant.id)
            .then(async () => {
              systemNotification.success(copy.notifications.suspended);
              await reloadTenants();
            })
            .catch((error) => {
              const message = error instanceof Error ? error.message : copy.notifications.suspendFailed;
              systemNotification.error(message);
            });
        }
        break;
      case 'activate':
        void tenantDatabaseApi
          .activateTenant(tenant.id)
          .then(async () => {
            systemNotification.success(copy.notifications.activated);
            await reloadTenants();
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : copy.notifications.activateFailed;
            systemNotification.error(message);
          });
        break;
      case 'view':
        systemNotification.info(copy.notifications.openingOverview(tenant.name));
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
      if ((formData.userLimit ?? 0) < 0) {
        systemNotification.error(copy.notifications.userLimitInvalid);
        return;
      }

      setSubmittingAdd(true);
      try {
        const created = await tenantDatabaseApi.createTenant({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
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

        if (window.confirm(copy.notifications.openSetupConfirm(created.name))) {
          openSetupDialog({
            id: created.id,
            name: created.name,
            code: created.code,
          });
        }
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

  const dataSourceDescription = `${copy.source.label}: ${usingMockData ? copy.source.local : copy.source.remote}${
    lastLoadedAt ? ` · ${copy.source.refreshedAt}: ${new Date(lastLoadedAt).toLocaleString(locale)}` : ''
  }`;
  const pageDescription = usingMockData ? copy.pageDescription.fallback : copy.pageDescription.normal;

  return (
    <PageLayout
      title={t.menu.tenantManagement || copy.pageTitle}
      description={pageDescription}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
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
            variant="outline"
            size="sm"
            className="gap-2 border-slate-200 bg-white"
            onClick={() => systemNotification.info(copy.notifications.exportPending)}
          >
            <Download className="h-4 w-4 text-slate-400" />
            {copy.actions.export}
          </Button>
          <Button
            size="sm"
            onClick={openAddDialog}
            className="rounded-xl bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {copy.actions.addTenant}
          </Button>
        </div>
      }
    >
      <TenantStatsCards stats={stats} />

      <div className="mb-4 text-xs text-slate-500">{dataSourceDescription}</div>

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/50 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[350px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 rounded-xl border-slate-200 bg-white pl-10 transition-all focus:ring-primary/20"
            />
          </div>

          <div className="w-44">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder={copy.statusPlaceholder} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.statuses.all}</SelectItem>
                <SelectItem value="active">{copy.statuses.active}</SelectItem>
                <SelectItem value="suspended">{copy.statuses.suspended}</SelectItem>
                <SelectItem value="pending">{copy.statuses.pending}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-none bg-white/80 shadow-sm backdrop-blur-xl">
        <TenantTable
          data={paginatedData}
          onAction={handleAction}
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      </Card>

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
                onCompleted={async () => {
                  closeSetupDialog();
                  await reloadTenants();
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
