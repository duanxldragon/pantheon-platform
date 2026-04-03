import { useState } from 'react';
import { useRoles } from '../../hooks/useRoles';
import { useMenus } from '../../hooks/useMenus';
import { Role, RoleFormData } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Trash2, Download, Upload, ShieldPlus, Power, PowerOff } from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { ManagementActionBar, ManagementContentCard } from '../../../../shared/components/ui';
import { useCSVImportExport } from '../../../../shared/hooks/useCSVImportExport';
import { csvTemplates } from '../../../../shared/utils/csvTemplates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import type { ExportOptions } from '../../../../shared/components/ui/DataImportExportDialog';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getRoleManagementCopy } from './roleManagementCopy';

// 导入重构后的组件和 Hook
import { RoleTable } from './components/RoleTable';
import { RoleSearchForm } from './components/RoleSearchForm';
import { RoleDialogManager } from './components/RoleDialogManager';
import { useRoleTable } from './hooks/useRoleTable';

interface StatusConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: 'warning' | 'success';
  guard?: 'update' | null;
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

export function RoleManagement() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getRoleManagementCopy(language);
  const roleMessages = createEntityFeedback(zh, copy.entity);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryRole = hasPermission(systemPermissions.role.query);

  // 1. 数据加载
  const { roles, reload } = useRoles({ enabled: canQueryRole });
  const { menus } = useMenus({ enabled: canQueryRole });

  // 2. 状态管理
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmState>(initialStatusConfirmState);
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    detail: false,
    delete: false,
    permission: false,
    members: false,
    import: false,
    export: false
  });

  const setDialogOpen = (name: string, open: boolean) => {
    setDialogs(prev => ({ ...prev, [name]: open }));
  };
  const closeProtectedDialogs = (names: Array<keyof typeof dialogs>) => {
    setDialogs((prev) => {
      const next = { ...prev };
      names.forEach((name) => {
        next[name] = false;
      });
      return next;
    });
  };

  const resetSelectedRole = () => {
    setSelectedRole(null);
  };

  const closeStatusConfirm = () => {
    setStatusConfirm(initialStatusConfirmState);
  };

  // 3. 表格与搜索逻辑 Hook
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedRoles,
    setSelectedRoles,
    page,
    setPage,
    totalPages,
    paginatedData,
  } = useRoleTable(roles);

  // 4. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.role,
    onDataImported: () => {
      toast.success(roleMessages.importSuccess);
    },
    requiredFields: ['roleName', 'roleCode'],
  });

  // 5. 事件处理函数
  const handleAction = (action: string, role: Role) => {
    setSelectedRole(role);
    switch (action) {
      case 'detail': setDialogOpen('detail', true); break;
      case 'edit': setDialogOpen('edit', true); break;
      case 'permission': setDialogOpen('permission', true); break;
      case 'members': setDialogOpen('members', true); break;
      case 'delete': setDialogOpen('delete', true); break;
    }
  };

  const handlers = {
    onSubmit: async (data: RoleFormData) => {
      if (!ensureActionPermission(selectedRole ? canUpdateRole : canCreateRole, selectedRole ? copy.actionLabels.edit : copy.actionLabels.add)) return;
      try {
        if (selectedRole) {
          if (data.status && data.status !== selectedRole.status) {
            openRoleStatusConfirm(selectedRole, data.status === 'active', async () => {
              await api.updateRole(String(selectedRole.id), data);
              setDialogOpen('edit', false);
              resetSelectedRole();
              await reload();
            });
            return;
          }

          await api.updateRole(String(selectedRole.id), data);
          toast.success(roleMessages.updateSuccess);
          setDialogOpen('edit', false);
        } else {
          await api.createRole(data);
          toast.success(roleMessages.createSuccess);
          setDialogOpen('add', false);
        }
        resetSelectedRole();
        await reload();
      } catch {
        toast.error(roleMessages.saveFailed);
      }
    },
    onDelete: async () => {
      if (!selectedRole) return;
      if (!ensureActionPermission(canDeleteRole, copy.actionLabels.delete)) return;
      if (selectedRole.type === 'system') {
        toast.error(buildSystemRoleDeleteBlockedMessage([selectedRole]));
        return;
      }
      if (selectedRole.userCount > 0) {
        toast.error(buildRoleDeleteBlockedMessage([{ name: selectedRole.name, userCount: selectedRole.userCount }]));
        return;
      }
      try {
        await api.deleteRole(String(selectedRole.id));
        toast.success(roleMessages.deleteSuccess);
        setDialogOpen('delete', false);
        resetSelectedRole();
        await reload();
      } catch {
        toast.error(roleMessages.deleteFailed);
      }
    },
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreateRole, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: ExportOptions) => {
      if (!ensureActionPermission(canExportRole, copy.actionLabels.export)) return;
      const dataToExport = options.scope === 'selected' && selectedRoles.length > 0
        ? selectedRoles
        : roles;
      await csvHandler.handleExport(dataToExport);
      setDialogOpen('export', false);
    }
  };

  const buildRoleDeleteBlockedMessage = (
    items: Array<{ name: string; userCount: number }>,
    isBatch = false,
  ) => {
    const details = items
      .slice(0, 3)
      .map((item) => copy.messages.roleDeleteBlockedItem(item.name, item.userCount))
      .join(copy.messages.separator);

    return copy.messages.roleDeleteBlockedSummary(details, isBatch, items.length > 3);
  };

  const buildSystemRoleDeleteBlockedMessage = (items: Role[], isBatch = false) => {
    const details = items
      .slice(0, 3)
      .map((item) => item.name)
      .join(copy.messages.separator);

    return copy.messages.systemRoleDeleteBlocked(details, isBatch, items.length > 3);
  };

  const buildRoleDeleteDescription = (role: Role) => {
    return role.userCount > 0
      ? copy.messages.deleteDescriptionBlocked(role.name, role.userCount)
      : copy.messages.deleteDescriptionStandalone(role.name);
  };

  const buildRoleStatusCopy = (role: Role, enabled: boolean) => {
    const affectedUsers = role.userCount || 0;
    return {
      title: copy.messages.statusTitle(enabled),
      description: copy.messages.statusDescription(role.name, enabled, affectedUsers),
      confirmText: copy.messages.statusConfirmText(enabled),
      success: copy.messages.statusSuccess(role.name, enabled, affectedUsers),
    };
  };

  const openRoleStatusConfirm = (role: Role, enabled: boolean, action: () => Promise<void>) => {
    const statusCopy = buildRoleStatusCopy(role, enabled);
    setStatusConfirm({
      open: true,
      title: statusCopy.title,
      description: statusCopy.description,
      confirmText: statusCopy.confirmText,
      variant: enabled ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        toast.success(statusCopy.success);
      },
    });
  };

  const isRoleStatusLocked = (role: Role) => role.type === 'system' && role.code === 'super_admin';

  const buildRoleBatchStatusCopy = (rolesToChange: Role[], enabled: boolean) => {
    const affectedUsers = rolesToChange.reduce((total, role) => total + (role.userCount || 0), 0);
    return {
      title: copy.messages.batchStatusTitle(enabled),
      description: copy.messages.batchStatusDescription(rolesToChange.length, enabled, affectedUsers),
      confirmText: copy.messages.batchStatusConfirmText(enabled),
      success: copy.messages.batchStatusSuccess(rolesToChange.length, enabled, affectedUsers),
    };
  };

  const openRoleBatchStatusConfirm = (rolesToChange: Role[], enabled: boolean, action: () => Promise<void>) => {
    const statusCopy = buildRoleBatchStatusCopy(rolesToChange, enabled);
    setStatusConfirm({
      open: true,
      title: statusCopy.title,
      description: statusCopy.description,
      confirmText: statusCopy.confirmText,
      variant: enabled ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        toast.success(statusCopy.success);
      },
    });
  };

  const handleBatchDelete = async () => {
    if (!ensureActionPermission(canDeleteRole, copy.actionLabels.batchDelete)) return;
    const systemRoles = selectedRoles.filter((role) => role.type === 'system');
    if (systemRoles.length > 0) {
      toast.error(buildSystemRoleDeleteBlockedMessage(systemRoles, true));
      return;
    }

    const blockedRoles = selectedRoles
      .filter((role) => role.userCount > 0)
      .map((role) => ({ name: role.name, userCount: role.userCount }));

    if (blockedRoles.length > 0) {
      toast.error(buildRoleDeleteBlockedMessage(blockedRoles, true));
      return;
    }

    try {
      await api.batchDeleteRoles(selectedRoles.map((role) => String(role.id)));
      toast.success(roleMessages.batchDeleteSuccess(selectedRoles.length));
      setSelectedRoles([]);
      await reload();
    } catch {
      toast.error(roleMessages.batchDeleteFailed);
    }
  };

  const rolesToEnable = selectedRoles.filter((role) => role.status !== 'active' && !isRoleStatusLocked(role));
  const rolesToDisable = selectedRoles.filter((role) => role.status !== 'inactive' && !isRoleStatusLocked(role));
  const canCreateRole = hasPermission(systemPermissions.role.create);
  const canUpdateRole = hasPermission(systemPermissions.role.update);
  const canDeleteRole = hasPermission(systemPermissions.role.delete);
  const canAssignRolePermission = hasPermission(systemPermissions.role.assignPermission);
  const canExportRole = hasPermission(systemPermissions.role.export);
  const { lossDescription: queryLossDescription } = useQueryPermissionDialogGuard({
    canQuery: canQueryRole,
    pageTitle: copy.page.title,
    dialogs,
    protectedDialogs: {
      detail: copy.actionLabels.detail,
      permission: copy.actionLabels.permission,
      members: copy.actionLabels.members,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actionLabels.add, allowed: canCreateRole },
      edit: { label: copy.actionLabels.edit, allowed: canUpdateRole },
      delete: { label: copy.actionLabels.delete, allowed: canDeleteRole },
      permission: { label: copy.actionLabels.permission, allowed: canAssignRolePermission },
      import: { label: copy.actionLabels.import, allowed: canCreateRole },
      export: { label: copy.actionLabels.export, allowed: canExportRole },
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: copy.page.title,
    guards: {
      update: { label: copy.actionLabels.batchStatusUpdate, allowed: canUpdateRole },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchRoleStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdateRole, enabled ? copy.actionLabels.batchEnable : copy.actionLabels.batchDisable)) return;
    const targetRoles = enabled ? rolesToEnable : rolesToDisable;
    if (targetRoles.length === 0) {
      return;
    }

    openRoleBatchStatusConfirm(targetRoles, enabled, async () => {
      try {
        await api.batchUpdateRoleStatus(
          targetRoles.map((role) => String(role.id)),
          enabled ? 'active' : 'inactive',
        );
        setSelectedRoles([]);
        await reload();
      } catch {
        toast.error(roleMessages.batchStatusUpdateFailed);
        throw new Error('role batch status update failed');
      }
    });
  };

  return (
    <PageLayout
      title={copy.page.title}
      actions={canQueryRole ? (
        <ManagementActionBar>
          {selectedRoles.length > 0 && (
            <>
              {canUpdateRole && rolesToEnable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchRoleStatus(true)}
                  className="h-11 gap-2 rounded-2xl border-emerald-200/80 bg-emerald-50/80 px-4 text-emerald-700 shadow-sm shadow-emerald-100/60 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(rolesToEnable.length)}
                </Button>
              ) : null}
              {canUpdateRole && rolesToDisable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchRoleStatus(false)}
                  className="h-11 gap-2 rounded-2xl border-amber-200/80 bg-amber-50/80 px-4 text-amber-700 shadow-sm shadow-amber-100/60 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(rolesToDisable.length)}
                </Button>
              ) : null}
              {canDeleteRole ? (
                <Button
                  variant="outline"
                  onClick={handleBatchDelete}
                  className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/60 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedRoles.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreateRole ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('import', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportRole ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateRole ? (
            <Button
              onClick={() => { resetSelectedRole(); setDialogOpen('add', true); }}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <ShieldPlus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
        </ManagementActionBar>
      ) : undefined}
    >
      {!canQueryRole ? (
        <QueryAccessBoundary
          viewId="system-roles"
          title={copy.page.title}
          queryPermission={systemPermissions.role.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
      {/* 1. 高级搜索区 */}
      <RoleSearchForm
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* 2. 数据列表展示区 */}
      <ManagementContentCard>
        <RoleTable
          data={paginatedData}
          selectedItems={selectedRoles}
          onSelectionChange={setSelectedRoles}
          onAction={handleAction}
          onStatusChange={async (role, enabled) => {
            openRoleStatusConfirm(role, enabled, async () => {
              try {
                await api.updateRole(String(role.id), { ...role, status: enabled ? 'active' : 'inactive' });
                await reload();
              } catch {
                toast.error(roleMessages.statusUpdateFailed);
                throw new Error('role status update failed');
              }
            });
          }}
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: setPage,
          }}
        />
      </ManagementContentCard>

      {/* 3. 对话框统一管理 */}
      <RoleDialogManager
        dialogs={dialogs}
        setDialogOpen={setDialogOpen}
        selectedRole={selectedRole}
        menus={menus}
        handlers={handlers}
        onPermissionSuccess={reload}
        deleteDescription={selectedRole ? buildRoleDeleteDescription(selectedRole) : ''}
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





