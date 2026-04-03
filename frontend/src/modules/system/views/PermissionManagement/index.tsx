import { useState, useEffect } from 'react';
import { Permission, PermissionFormData } from '../../types';
import { useCallback } from 'react';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
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
  ManagementActionBar,
  ManagementContentCard,
  ManagementFilterPanel,
} from '../../../../shared/components/ui';
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
import { getPermissionManagementCopy } from './permissionManagementCopy';

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
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getPermissionManagementCopy(language);
  const permissionMessages = createEntityFeedback(zh, copy.entity);
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

  const loadPermissions = useCallback(async () => {
    try {
      const data = await api.getPermissions();
      setPermissions(data);
    } catch {
      toast.error(copy.feedback.loadFailed);
    }
  }, [copy.feedback.loadFailed]);

  // 3. 数据加载
  useEffect(() => {
    if (!canQueryPermission) {
      setPermissions([]);
      return;
    }
    void loadPermissions();
  }, [canQueryPermission, loadPermissions]);

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
      toast.success(copy.feedback.importSuccess);
      setDialogOpen('import', false);
      await loadPermissions();
    },
    onExport: async () => {
      if (!ensureActionPermission(canExportPermission, copy.actionLabels.export)) return;
      toast.success(copy.feedback.exporting);
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
        copy.messages.deleteBlockedItem(
          item.name,
          item.affectedRoleCount,
          item.affectedUserCount,
        ),
      )
      .join(copy.messages.separator);

    return `${copy.messages.deleteBlockedSummaryPrefix(isBatch)}${details}${copy.messages.deleteBlockedSummarySuffix(items.length > 3)}`;
  };

  const buildPermissionDeleteDescription = (permission: Permission) => {
    const impact = getPermissionDeleteImpact(String(permission.id));
    return impact.affectedRoleCount > 0
      ? copy.messages.deleteDescriptionAffected(
          permission.name,
          impact.affectedRoleCount,
          impact.affectedUserCount,
        )
      : copy.messages.deleteDescriptionStandalone(permission.name);
  };

  const buildPermissionStatusCopy = (permission: Permission, enabled: boolean) => {
    const impact = getPermissionDeleteImpact(String(permission.id));
    return {
      title: copy.messages.statusTitle(enabled),
      description:
        impact.affectedRoleCount > 0
          ? copy.messages.statusDescriptionAffected(
              permission.name,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.statusDescriptionStandalone(permission.name),
      confirmText: copy.messages.statusConfirmText(enabled),
      success:
        impact.affectedRoleCount > 0
          ? copy.messages.statusSuccessAffected(
              permission.name,
              enabled,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.statusSuccessStandalone(permission.name, enabled),
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
    return {
      title: copy.messages.batchStatusTitle(enabled),
      description:
        impact.affectedRoleCount > 0
          ? copy.messages.batchStatusDescriptionAffected(
              items.length,
              enabled,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.batchStatusDescriptionStandalone(items.length, enabled),
      confirmText: copy.messages.batchStatusConfirmText(enabled),
      success:
        impact.affectedRoleCount > 0
          ? copy.messages.batchStatusSuccessAffected(
              items.length,
              enabled,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.batchStatusSuccessStandalone(items.length, enabled),
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
    pageTitle: copy.page.title,
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
    pageTitle: copy.page.title,
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
      title={copy.page.title}
      description={copy.page.description}
      actions={canQueryPermission ? (
        <ManagementActionBar>
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
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportPermission ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreatePermission ? (
            <Button
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <Plus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
        </ManagementActionBar>
      ) : undefined}
    >
      {!canQueryPermission ? (
        <QueryAccessBoundary
          viewId="system-permissions"
          title={copy.page.title}
          queryPermission={systemPermissions.permission.query}
        />
      ) : (
        <>
      {/* 1. 统计卡片 */}
      <PermissionStats stats={stats} />

      {/* 2. 搜索过滤栏 */}
      <ManagementFilterPanel className="mb-6 flex flex-col gap-4">
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
              placeholder={copy.search.searchPlaceholder}
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
                      <SelectValue placeholder={copy.search.typePlaceholder} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                    <SelectItem value="all">{copy.search.typeAll}</SelectItem>
                    <SelectItem value="menu">{copy.search.typeMenu}</SelectItem>
                    <SelectItem value="operation">{copy.search.typeOperation}</SelectItem>
                    <SelectItem value="data">{copy.search.typeData}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {viewMode === 'list' && (
              <div className="w-44">
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50">
                    <SelectValue placeholder={copy.search.modulePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
                    <SelectItem value="all">{copy.search.moduleAll}</SelectItem>
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
      </ManagementFilterPanel>

      {/* 3. 数据展示区 */}
      <ManagementContentCard>
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
      </ManagementContentCard>

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





