import { useState, useEffect } from 'react';
import { Permission, PermissionFormData } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import {
  Trash2,
  Download,
  Plus,
  Upload,
  Power,
  PowerOff,
  LayoutGrid,
  List,
  Search,
  Filter,
} from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { Input } from '../../../../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../components/ui/select';

// 导入重构后的子组件和 Hook
import { PermissionStats } from './components/PermissionStats';
import { PermissionTable } from './components/PermissionTable';
import { PermissionDialogManager } from './components/PermissionDialogManager';
import { PermissionGroupView } from './components/PermissionGroupView';
import { usePermissionLogic } from './hooks/usePermissionLogic';
import { useMenus } from '../../hooks/useMenus';
import { useRoles } from '../../hooks/useRoles';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getPermissionModuleLabel } from './moduleLocalization';

interface StatusConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: 'warning' | 'success';
  guard?: 'update' | 'delete' | null;
  action: null | (() => Promise<void>);
}

const initialStatusConfirmState: StatusConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmText: '',
  variant: 'warning',
  guard: null,
  action: null,
};

export function PermissionManagement() {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const permissionMessages = createEntityFeedback(zh, { zh: '权限', en: 'Permission', enPlural: 'permissions' });
  const copy = zh
    ? {
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
        buttons: {
          batchEnable: (count: number) => `批量启用 (${count})`,
          batchDisable: (count: number) => `批量禁用 (${count})`,
          batchDelete: (count: number) => `批量删除 (${count})`,
        },
      }
    : {
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
        buttons: {
          batchEnable: (count: number) => `Enable (${count})`,
          batchDisable: (count: number) => `Disable (${count})`,
          batchDelete: (count: number) => `Delete (${count})`,
        },
      };
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryPermission = hasPermission(systemPermissions.permission.query);
  const { menus } = useMenus({ enabled: canQueryPermission });
  const { roles } = useRoles({ enabled: canQueryPermission });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmState>(initialStatusConfirmState);

  // 1. 逻辑 Hook
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterModule,
    setFilterModule,
    viewMode,
    setViewMode,
    selectedPermissions,
    setSelectedPermissions,
    page,
    setPage,
    totalPages,
    paginatedData,
    stats,
    modules,
    filteredData
  } = usePermissionLogic(permissions);

  // 状态管理
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState<Partial<PermissionFormData>>({});
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    delete: false,
    import: false,
    export: false
  });

  const setDialogOpen = (name: string, open: boolean) => {
    setDialogs(prev => ({ ...prev, [name]: open }));
  };

  const resetPermissionForm = () => {
    setSelectedPermission(null);
    setFormData({});
  };

  const openAddDialog = () => {
    resetPermissionForm();
    setDialogOpen('add', true);
  };

  const closeStatusConfirm = () => {
    setStatusConfirm(initialStatusConfirmState);
  };

  // 3. 数据加载
  useEffect(() => {
    if (!canQueryPermission) {
      setPermissions([]);
      return;
    }
    loadPermissions();
  }, [canQueryPermission]);

  const loadPermissions = async () => {
    try {
      const data = await api.getPermissions();
      setPermissions(data);
    } catch {
      toast.error(t.systemManagement.permissionManagement.loadFailed);
    }
  };

  // 4. 事件处理
  const handleAction = (action: string, permission: Permission) => {
    setSelectedPermission(permission);
    switch (action) {
      case 'edit':
        setFormData(permission);
        setDialogOpen('edit', true);
        break;
      case 'delete':
        setDialogOpen('delete', true);
        break;
    }
  };

  const handlers = {
    onAdd: async () => {
      if (!ensureActionPermission(canCreatePermission, copy.actionLabels.add)) return;
      try {
        await api.createPermission(formData as Partial<Permission>);
        toast.success(permissionMessages.createSuccess);
        setDialogOpen('add', false);
        resetPermissionForm();
        await loadPermissions();
      } catch {
        toast.error(permissionMessages.createFailed);
      }
    },
    onEdit: async () => {
      if (!selectedPermission) return;
      if (!ensureActionPermission(canUpdatePermission, copy.actionLabels.edit)) return;
      try {
        await api.updatePermission(String(selectedPermission.id), formData as Partial<Permission>);
        toast.success(permissionMessages.updateSuccess);
        setDialogOpen('edit', false);
        resetPermissionForm();
        await loadPermissions();
      } catch {
        toast.error(permissionMessages.updateFailed);
      }
    },
    onDelete: async () => {
      if (!selectedPermission) return;
      if (!ensureActionPermission(canDeletePermission, copy.actionLabels.delete)) return;
      const impact = getPermissionDeleteImpact(String(selectedPermission.id));
      if (impact.affectedRoleCount > 0) {
        toast.error(buildPermissionDeleteBlockedMessage([{ name: selectedPermission.name, ...impact }]));
        return;
      }
      try {
        await api.deletePermission(String(selectedPermission.id));
        toast.success(permissionMessages.deleteSuccess);
        setDialogOpen('delete', false);
        resetPermissionForm();
        await loadPermissions();
      } catch {
        toast.error(permissionMessages.deleteFailed);
      }
    },
    onImport: async () => {
      if (!ensureActionPermission(canCreatePermission, copy.actionLabels.import)) return;
      toast.success(t.systemManagement.permissionManagement.importSuccess);
      setDialogOpen('import', false);
      await loadPermissions();
    },
    onExport: async () => {
      if (!ensureActionPermission(canExportPermission, copy.actionLabels.export)) return;
      toast.success(t.systemManagement.permissionManagement.exporting);
      setDialogOpen('export', false);
    }
  };

  const getPermissionDeleteImpact = (permissionId: string) => {
    const linkedRoles = roles.filter((role) => (role.permissionIds || []).map(String).includes(permissionId));
    return {
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  };

  const buildPermissionDeleteBlockedMessage = (
    items: Array<{ name: string; affectedRoleCount: number; affectedUserCount: number }>,
    isBatch = false,
  ) => {
    const details = items
      .slice(0, 3)
      .map((item) =>
        zh
          ? `${item.name}（${item.affectedRoleCount} 个角色，${item.affectedUserCount} 名角色成员）`
          : `${item.name} (${item.affectedRoleCount} roles, ${item.affectedUserCount} role members)`,
      )
      .join(zh ? '；' : '; ');

    if (zh) {
      return `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${items.length > 3 ? '；其余权限也仍被角色引用' : ''}`;
    }

    return `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${items.length > 3 ? '; other permissions are also still referenced by roles' : ''}`;
  };

  const buildPermissionDeleteDescription = (permission: Permission) => {
    const impact = getPermissionDeleteImpact(String(permission.id));
    if (zh) {
      return impact.affectedRoleCount > 0
        ? `权限「${permission.name}」当前仍被 ${impact.affectedRoleCount} 个角色引用，影响 ${impact.affectedUserCount} 名角色成员，后端会拒绝删除。`
        : `确认删除权限「${permission.name}」？当前未被角色引用，删除后立即生效且不可恢复。`;
    }

    return impact.affectedRoleCount > 0
      ? `Permission "${permission.name}" is still referenced by ${impact.affectedRoleCount} roles and affects ${impact.affectedUserCount} role members. The backend will reject deletion.`
      : `Delete permission "${permission.name}"? It is not referenced by any role and the action cannot be undone.`;
  };

  const buildPermissionStatusCopy = (permission: Permission, enabled: boolean) => {
    const impact = getPermissionDeleteImpact(String(permission.id));
    if (zh) {
      return {
        title: enabled ? '确认启用权限' : '确认禁用权限',
        description:
          impact.affectedRoleCount > 0
            ? `权限「${permission.name}」状态变更将影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员，并触发权限刷新。`
            : `权限「${permission.name}」状态变更将立即生效。当前未被角色引用。`,
        confirmText: enabled ? '确认启用' : '确认禁用',
        success:
          impact.affectedRoleCount > 0
            ? `已${enabled ? '启用' : '禁用'}权限「${permission.name}」，影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员`
            : `已${enabled ? '启用' : '禁用'}权限「${permission.name}」`,
      };
    }

    return {
      title: enabled ? 'Confirm enable permission' : 'Confirm disable permission',
      description:
        impact.affectedRoleCount > 0
          ? `Changing permission "${permission.name}" will affect ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members, and refresh their authorization snapshot.`
          : `Changing permission "${permission.name}" takes effect immediately. It is not referenced by any role.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success:
        impact.affectedRoleCount > 0
          ? `Permission "${permission.name}" ${enabled ? 'enabled' : 'disabled'}. ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members were affected.`
          : `Permission "${permission.name}" ${enabled ? 'enabled' : 'disabled'}.`,
    };
  };

  const openPermissionStatusConfirm = (permission: Permission, enabled: boolean, action: () => Promise<void>) => {
    const copy = buildPermissionStatusCopy(permission, enabled);
    setStatusConfirm({
      open: true,
      title: copy.title,
      description: copy.description,
      confirmText: copy.confirmText,
      variant: enabled ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        toast.success(copy.success);
      },
    });
  };

  const getPermissionBatchStatusImpact = (items: Permission[]) => {
    const permissionIds = new Set(items.map((permission) => String(permission.id)));
    const linkedRoles = roles.filter((role) =>
      (role.permissionIds || []).map(String).some((permissionId) => permissionIds.has(permissionId)),
    );
    return {
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  };

  const buildPermissionBatchStatusCopy = (items: Permission[], enabled: boolean) => {
    const impact = getPermissionBatchStatusImpact(items);
    if (zh) {
      return {
        title: `确认批量${enabled ? '启用' : '禁用'}权限`,
        description:
          impact.affectedRoleCount > 0
            ? `将批量${enabled ? '启用' : '禁用'} ${items.length} 项权限，影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员，并触发权限刷新。`
            : `将批量${enabled ? '启用' : '禁用'} ${items.length} 项权限，当前未影响任何角色。`,
        confirmText: `确认${enabled ? '启用' : '禁用'}`,
        success:
          impact.affectedRoleCount > 0
            ? `已批量${enabled ? '启用' : '禁用'} ${items.length} 项权限，影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员`
            : `已批量${enabled ? '启用' : '禁用'} ${items.length} 项权限`,
      };
    }

    return {
      title: `Confirm batch ${enabled ? 'enable' : 'disable'} permissions`,
      description:
        impact.affectedRoleCount > 0
          ? `This will ${enabled ? 'enable' : 'disable'} ${items.length} permissions, affect ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members, and refresh authorization snapshots.`
          : `This will ${enabled ? 'enable' : 'disable'} ${items.length} permissions and currently affects no roles.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success:
        impact.affectedRoleCount > 0
          ? `${items.length} permissions ${enabled ? 'enabled' : 'disabled'}. ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members were affected.`
          : `${items.length} permissions ${enabled ? 'enabled' : 'disabled'}.`,
    };
  };

  const openPermissionBatchStatusConfirm = (items: Permission[], enabled: boolean, action: () => Promise<void>) => {
    const copy = buildPermissionBatchStatusCopy(items, enabled);
    setStatusConfirm({
      open: true,
      title: copy.title,
      description: copy.description,
      confirmText: copy.confirmText,
      variant: enabled ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        toast.success(copy.success);
      },
    });
  };

  const handleBatchDelete = async () => {
    if (!ensureActionPermission(canDeletePermission, copy.actionLabels.batchDelete)) return;
    const blockedPermissions = selectedPermissions
      .map((permission) => ({
        name: permission.name,
        ...getPermissionDeleteImpact(String(permission.id)),
      }))
      .filter((permission) => permission.affectedRoleCount > 0);

    if (blockedPermissions.length > 0) {
      toast.error(buildPermissionDeleteBlockedMessage(blockedPermissions, true));
      return;
    }

    try {
      await api.batchDeletePermissions(selectedPermissions.map((permission) => String(permission.id)));
      toast.success(permissionMessages.batchDeleteSuccess(selectedPermissions.length));
      setSelectedPermissions([]);
      resetPermissionForm();
      await loadPermissions();
    } catch {
      toast.error(permissionMessages.batchDeleteFailed);
    }
  };

  const permissionsToEnable = selectedPermissions.filter((permission) => permission.status !== 'active');
  const permissionsToDisable = selectedPermissions.filter((permission) => permission.status !== 'inactive');
  const canCreatePermission = hasPermission(systemPermissions.permission.create);
  const canUpdatePermission = hasPermission(systemPermissions.permission.update);
  const canDeletePermission = hasPermission(systemPermissions.permission.delete);
  const canExportPermission = hasPermission(systemPermissions.permission.export);
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t.menu.systemPermissions,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actionLabels.add, allowed: canCreatePermission },
      edit: { label: copy.actionLabels.edit, allowed: canUpdatePermission },
      delete: { label: copy.actionLabels.delete, allowed: canDeletePermission },
      import: { label: copy.actionLabels.import, allowed: canCreatePermission },
      export: { label: copy.actionLabels.export, allowed: canExportPermission },
    },
    closeDialogs: (names) => {
      setDialogs((prev) => {
        const next = { ...prev };
        names.forEach((name) => {
          next[name] = false;
        });
        return next;
      });
    },
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: t.menu.systemPermissions,
    guards: {
      update: { label: copy.actionLabels.batchStatusUpdate, allowed: canUpdatePermission },
      delete: { label: copy.actionLabels.batchDelete, allowed: canDeletePermission },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchPermissionStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdatePermission, enabled ? copy.actionLabels.batchEnable : copy.actionLabels.batchDisable)) return;
    const targetPermissions = enabled ? permissionsToEnable : permissionsToDisable;
    if (targetPermissions.length === 0) {
      return;
    }

    openPermissionBatchStatusConfirm(targetPermissions, enabled, async () => {
      try {
        await api.batchUpdatePermissionStatus(
          targetPermissions.map((permission) => String(permission.id)),
          enabled ? 'active' : 'inactive',
        );
        setSelectedPermissions([]);
        await loadPermissions();
      } catch {
        toast.error(permissionMessages.batchStatusUpdateFailed);
        throw new Error('permission batch status update failed');
      }
    });
  };

  return (
    <PageLayout
      title={t.menu.systemPermissions}
      description={t.systemManagement.permissionManagement.pageDescription}
      actions={canQueryPermission ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
          {selectedPermissions.length > 0 && (
            <>
              {canUpdatePermission && permissionsToEnable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchPermissionStatus(true)}
                  className="h-11 gap-2 rounded-2xl border-emerald-200/80 bg-emerald-50/80 px-4 text-emerald-700 shadow-sm shadow-emerald-100/60 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(permissionsToEnable.length)}
                </Button>
              ) : null}
              {canUpdatePermission && permissionsToDisable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchPermissionStatus(false)}
                  className="h-11 gap-2 rounded-2xl border-amber-200/80 bg-amber-50/80 px-4 text-amber-700 shadow-sm shadow-amber-100/60 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(permissionsToDisable.length)}
                </Button>
              ) : null}
              {canDeletePermission ? (
                <Button
                  variant="outline"
                  onClick={handleBatchDelete}
                  className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/60 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedPermissions.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreatePermission ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('import', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Upload className="w-4 h-4" />
              {t.actions.import}
            </Button>
          ) : null}
          {canExportPermission ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {t.actions.export}
            </Button>
          ) : null}
          {canCreatePermission ? (
            <Button
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <Plus className="w-4 h-4" />
              {t.actions.add}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryPermission ? (
        <QueryAccessBoundary
          viewId="system-permissions"
          title={t.menu.systemPermissions}
          queryPermission={systemPermissions.permission.query}
        />
      ) : (
        <>
      {/* 1. 统计卡片 */}
      <PermissionStats stats={stats} />

      {/* 2. 搜索过滤栏 */}
      <div className="mb-6 flex flex-col gap-4 rounded-[26px] border border-slate-200/70 bg-white/72 p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-100/85 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:bg-white/70 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('group')}
              className={`rounded-xl p-2 transition-all ${viewMode === 'group' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:bg-white/70 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t.systemManagement.permissionManagement.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-40">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50">
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <SelectValue placeholder={t.systemManagement.permissionManagement.typePlaceholder} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                    <SelectItem value="all">{t.systemManagement.permissionManagement.typeAll}</SelectItem>
                    <SelectItem value="menu">{t.systemManagement.permissionManagement.typeMenu}</SelectItem>
                    <SelectItem value="operation">{t.systemManagement.permissionManagement.typeOperation}</SelectItem>
                    <SelectItem value="data">{t.systemManagement.permissionManagement.typeData}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {viewMode === 'list' && (
              <div className="w-44">
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50">
                    <SelectValue placeholder={t.systemManagement.permissionManagement.modulePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                    <SelectItem value="all">{t.systemManagement.permissionManagement.moduleAll}</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {getPermissionModuleLabel(module, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 数据展示区 */}
      <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
        {viewMode === 'list' ? (
          <PermissionTable
            data={paginatedData}
            selectedItems={selectedPermissions}
            onSelectionChange={setSelectedPermissions}
            onAction={handleAction}
            onStatusChange={async (permission, enabled) => {
              openPermissionStatusConfirm(permission, enabled, async () => {
                try {
                  await api.updatePermission(String(permission.id), {
                    ...permission,
                    status: enabled ? 'active' : 'inactive',
                  });
                  await loadPermissions();
                } catch {
                  toast.error(permissionMessages.statusUpdateFailed);
                  throw new Error('permission status update failed');
                }
              });
            }}
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              onPageChange: setPage,
            }}
          />
        ) : (
          <div className="p-6">
            <PermissionGroupView
              permissions={filteredData}
              onEdit={(p) => handleAction('edit', p)}
              onDelete={(p) => handleAction('delete', p)}
            />
          </div>
        )}
      </Card>

      {/* 4. 对话框统一管理 */}
      <PermissionDialogManager
        dialogs={dialogs}
        setDialogOpen={setDialogOpen}
        selectedPermission={selectedPermission}
        formData={formData}
        setFormData={setFormData}
        menus={menus}
        handlers={handlers}
        deleteDescription={selectedPermission ? buildPermissionDeleteDescription(selectedPermission) : ''}
      />

      <ConfirmDialog
        open={statusConfirm.open}
        onOpenChange={(open) => {
          if (!open) {
            closeStatusConfirm();
          }
        }}
        onConfirm={() => {
          if (!ensureConfirmPermission(statusConfirm.guard)) {
            closeStatusConfirm();
            return;
          }
          const action = statusConfirm.action;
          closeStatusConfirm();
          void action?.().catch(() => undefined);
        }}
        title={statusConfirm.title}
        description={statusConfirm.description}
        confirmText={statusConfirm.confirmText}
        variant={statusConfirm.variant}
      />
        </>
      )}
    </PageLayout>
  );
}





