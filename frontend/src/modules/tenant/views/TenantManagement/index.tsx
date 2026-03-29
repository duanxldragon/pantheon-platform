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
    contactPerson: '马总',
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
        if (
          window.confirm(
            zh
              ? `确认停用租户「${tenant.name}」吗？停用后该租户将无法继续登录和访问业务功能。`
              : `Suspend tenant "${tenant.name}"? The tenant will no longer be able to sign in or access features.`,
          )
        ) {
          void tenantDatabaseApi
            .suspendTenant(tenant.id)
            .then(async () => {
              systemNotification.success(zh ? '租户已停用' : 'Tenant suspended');
              await reloadTenants();
            })
            .catch((error) => {
              const message =
                error instanceof Error ? error.message : zh ? '停用租户失败' : 'Failed to suspend tenant';
              systemNotification.error(message);
            });
        }
        break;
      case 'activate':
        void tenantDatabaseApi
          .activateTenant(tenant.id)
          .then(async () => {
            systemNotification.success(zh ? '租户已恢复启用' : 'Tenant activated');
            await reloadTenants();
          })
          .catch((error) => {
            const message =
              error instanceof Error ? error.message : zh ? '启用租户失败' : 'Failed to activate tenant';
            systemNotification.error(message);
          });
        break;
      case 'view':
        systemNotification.info(
          zh ? `正在打开租户「${tenant.name}」的资源概览` : `Opening overview for tenant "${tenant.name}"`,
        );
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
        systemNotification.error(zh ? '请输入租户名称' : 'Please enter a tenant name');
        return;
      }
      if (!formData.code?.trim()) {
        systemNotification.error(zh ? '请输入租户编码' : 'Please enter a tenant code');
        return;
      }
      if ((formData.userLimit ?? 0) < 0) {
        systemNotification.error(zh ? '用户上限不能小于 0' : 'User limit cannot be negative');
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

        systemNotification.success(zh ? '租户创建成功' : 'Tenant created');
        handleDialogChange('add', false);
        await reloadTenants();

        if (
          window.confirm(
            zh
              ? `租户「${created.name}」已创建，是否立即进入数据库初始化向导？`
              : `Tenant "${created.name}" has been created. Open the database setup wizard now?`,
          )
        ) {
          openSetupDialog({
            id: created.id,
            name: created.name,
            code: created.code,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : zh ? '创建租户失败' : 'Failed to create tenant';
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
        systemNotification.error(zh ? '请输入租户名称' : 'Please enter a tenant name');
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
        systemNotification.success(zh ? '租户资料已更新' : 'Tenant updated');
        handleDialogChange('edit', false);
        await reloadTenants();
      } catch (error) {
        const message = error instanceof Error ? error.message : zh ? '更新租户失败' : 'Failed to update tenant';
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
        systemNotification.error(zh ? '请选择服务有效期' : 'Please select an expiry date');
        return;
      }
      if ((formData.userLimit ?? 0) < 0) {
        systemNotification.error(zh ? '用户上限不能小于 0' : 'User limit cannot be negative');
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
        systemNotification.success(zh ? '租户授权已更新' : 'Tenant license updated');
        handleDialogChange('license', false);
        await reloadTenants();
      } catch (error) {
        const message = error instanceof Error ? error.message : zh ? '更新授权失败' : 'Failed to update license';
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
        systemNotification.success(zh ? '租户已删除' : 'Tenant deleted');
        handleDialogChange('delete', false);
        await reloadTenants();
      } catch (error) {
        const message = error instanceof Error ? error.message : zh ? '删除租户失败' : 'Failed to delete tenant';
        systemNotification.error(message);
      } finally {
        setDeletingTenant(false);
      }
    },
  };

  const dataSourceDescription = zh
    ? `数据来源：${usingMockData ? '本地兜底' : '后端接口'}${
        lastLoadedAt ? ` · 最近刷新：${new Date(lastLoadedAt).toLocaleString('zh-CN')}` : ''
      }`
    : `Source: ${usingMockData ? 'Local fallback' : 'Backend API'}${
        lastLoadedAt ? ` · Last refresh: ${new Date(lastLoadedAt).toLocaleString('en-US')}` : ''
      }`;

  const pageDescription = zh
    ? usingMockData
      ? '统一管理租户资料、授权、配额与数据库接入状态。当前列表为本地兜底数据。'
      : '统一管理租户资料、授权、配额与数据库接入状态。'
    : 'Manage tenant profiles, licenses, quotas, and database onboarding status.';

  return (
    <PageLayout
      title={t.menu.tenantManagement}
      description={pageDescription}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void reloadTenants().then(() => {
                systemNotification.success(zh ? '租户列表已刷新' : 'Tenant list refreshed');
              });
            }}
            className="gap-2 border-slate-200 bg-white"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            {t.actions.refresh}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-200 bg-white"
            onClick={() =>
              systemNotification.info(
                zh ? '导出能力后续会接入真实租户数据源。' : 'Export will be wired to the real tenant data source later.',
              )
            }
          >
            <Download className="h-4 w-4 text-slate-400" />
            {t.actions.export}
          </Button>
          <Button
            size="sm"
            onClick={openAddDialog}
            className="rounded-xl bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {zh ? '新增租户' : 'Add Tenant'}
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
              placeholder={zh ? '搜索租户名称、编码或联系人' : 'Search tenant name, code, or contact'}
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
                  <SelectValue placeholder={zh ? '状态' : 'Status'} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{zh ? '全部' : 'All'}</SelectItem>
                <SelectItem value="active">{zh ? '运行中' : 'Active'}</SelectItem>
                <SelectItem value="suspended">{zh ? '已停用' : 'Suspended'}</SelectItem>
                <SelectItem value="pending">{zh ? '待初始化' : 'Pending'}</SelectItem>
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
            <DialogTitle>{zh ? '租户数据库初始化' : 'Tenant Database Setup'}</DialogTitle>
            <DialogDescription>
              {setupTargetTenant
                ? zh
                  ? `为租户「${setupTargetTenant.name}」配置数据库连接并完成初始化。`
                  : `Configure the database connection for tenant "${setupTargetTenant.name}".`
                : ' '}
            </DialogDescription>
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
