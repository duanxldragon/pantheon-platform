import { useState } from 'react';
import { useRoles } from '../../hooks/useRoles';
import { useMenus } from '../../hooks/useMenus';
import { Role, RoleFormData } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Trash2, Download, Upload, ShieldPlus, Power, PowerOff } from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { useCSVImportExport } from '../../../../shared/hooks/useCSVImportExport';
import { csvTemplates } from '../../../../shared/utils/csvTemplates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

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
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const roleMessages = createEntityFeedback(zh, { zh: '角色', en: 'Role', enPlural: 'roles' });
  const copy = zh
    ? {
        actionLabels: {
          add: '新增',
          edit: '编辑',
          delete: '删除',
          permission: '权限授权',
          detail: '详情',
          members: '成员列表',
          import: '导入',
          export: '导出',
          batchEnable: '批量启用',
          batchDisable: '批量禁用',
          batchDelete: '批量删除',
          batchStatusUpdate: '批量状态变更',
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
          permission: 'permission authorization',
          detail: 'details',
          members: 'member list',
          import: 'import',
          export: 'export',
          batchEnable: 'batch enable',
          batchDisable: 'batch disable',
          batchDelete: 'batch delete',
          batchStatusUpdate: 'batch status update',
        },
        buttons: {
          batchEnable: (count: number) => `Enable (${count})`,
          batchDisable: (count: number) => `Disable (${count})`,
          batchDelete: (count: number) => `Delete (${count})`,
        },
      };
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
    onExport: async (options: any) => {
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
      .map((item) => `${item.name}（${zh ? `${item.userCount} 名成员` : `${item.userCount} members`}）`)
      .join(zh ? '；' : '; ');

    if (zh) {
      return `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${items.length > 3 ? '；其余角色也仍存在成员' : ''}`;
    }

    return `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${items.length > 3 ? '; other roles also still have members' : ''}`;
  };

  const buildSystemRoleDeleteBlockedMessage = (items: Role[], isBatch = false) => {
    const details = items
      .slice(0, 3)
      .map((item) => item.name)
      .join(zh ? '；' : '; ');

    if (zh) {
      return `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${items.length > 3 ? '；其余系统内置角色也不可删除' : ' 为系统内置角色，不允许删除'}`;
    }

    return `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${items.length > 3 ? '; other built-in roles also cannot be deleted' : ' is a built-in system role and cannot be deleted'}`;
  };

  const buildRoleDeleteDescription = (role: Role) => {
    if (zh) {
      return role.userCount > 0
        ? `角色「${role.name}」当前仍有 ${role.userCount} 名成员，后端会拒绝删除，请先解除成员绑定。`
        : `确认删除角色「${role.name}」？当前无成员绑定，删除后角色授权关系会一并移除，且不可恢复。`;
    }

    return role.userCount > 0
      ? `Role "${role.name}" still has ${role.userCount} members. The backend will reject deletion until members are unbound.`
      : `Delete role "${role.name}"? It currently has no members. Role authorization relations will be removed and cannot be restored.`;
  };

  const buildRoleStatusCopy = (role: Role, enabled: boolean) => {
    const affectedUsers = role.userCount || 0;
    if (zh) {
      return {
        title: enabled ? '确认启用角色' : '确认禁用角色',
        description: enabled
          ? `角色「${role.name}」启用后，将恢复 ${affectedUsers} 名成员的授权快照并刷新权限。`
          : `角色「${role.name}」禁用后，将影响 ${affectedUsers} 名成员，并强制其相关会话失效。`,
        confirmText: enabled ? '确认启用' : '确认禁用',
        success: enabled
          ? `已启用角色「${role.name}」，恢复 ${affectedUsers} 名成员的授权快照`
          : `已禁用角色「${role.name}」，影响 ${affectedUsers} 名成员并强制其会话失效`,
      };
    }

    return {
      title: enabled ? 'Confirm enable role' : 'Confirm disable role',
      description: enabled
        ? `Enabling role "${role.name}" will restore authorization snapshots for ${affectedUsers} members and refresh their permissions.`
        : `Disabling role "${role.name}" will affect ${affectedUsers} members and revoke their related sessions.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success: enabled
        ? `Role "${role.name}" enabled. Authorization snapshots for ${affectedUsers} members were restored.`
        : `Role "${role.name}" disabled. ${affectedUsers} members were affected and their sessions were revoked.`,
    };
  };

  const openRoleStatusConfirm = (role: Role, enabled: boolean, action: () => Promise<void>) => {
    const copy = buildRoleStatusCopy(role, enabled);
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

  const isRoleStatusLocked = (role: Role) => role.type === 'system' && role.code === 'super_admin';

  const buildRoleBatchStatusCopy = (rolesToChange: Role[], enabled: boolean) => {
    const affectedUsers = rolesToChange.reduce((total, role) => total + (role.userCount || 0), 0);
    if (zh) {
      return {
        title: `确认批量${enabled ? '启用' : '禁用'}角色`,
        description: enabled
          ? `将批量启用 ${rolesToChange.length} 个角色，恢复 ${affectedUsers} 名成员的授权快照并刷新权限。`
          : `将批量禁用 ${rolesToChange.length} 个角色，影响 ${affectedUsers} 名成员，并强制相关会话失效。`,
        confirmText: `确认${enabled ? '启用' : '禁用'}`,
        success: enabled
          ? `已批量启用 ${rolesToChange.length} 个角色，恢复 ${affectedUsers} 名成员的授权快照`
          : `已批量禁用 ${rolesToChange.length} 个角色，影响 ${affectedUsers} 名成员并强制其会话失效`,
      };
    }

    return {
      title: `Confirm batch ${enabled ? 'enable' : 'disable'} roles`,
      description: enabled
        ? `This will enable ${rolesToChange.length} roles, restore authorization snapshots for ${affectedUsers} members, and refresh their permissions.`
        : `This will disable ${rolesToChange.length} roles, affect ${affectedUsers} members, and revoke related sessions.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success: enabled
        ? `${rolesToChange.length} roles enabled. Authorization snapshots for ${affectedUsers} members were restored.`
        : `${rolesToChange.length} roles disabled. ${affectedUsers} members were affected and their sessions were revoked.`,
    };
  };

  const openRoleBatchStatusConfirm = (rolesToChange: Role[], enabled: boolean, action: () => Promise<void>) => {
    const copy = buildRoleBatchStatusCopy(rolesToChange, enabled);
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
    pageTitle: t.menu.systemRoles,
    dialogs,
    protectedDialogs: {
      detail: copy.actionLabels.detail,
      permission: copy.actionLabels.permission,
      members: copy.actionLabels.members,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t.menu.systemRoles,
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
    pageTitle: t.menu.systemRoles,
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
      title={t.menu.systemRoles}
      actions={canQueryRole ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
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
              {t.actions.import}
            </Button>
          ) : null}
          {canExportRole ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {t.actions.export}
            </Button>
          ) : null}
          {canCreateRole ? (
            <Button
              onClick={() => { resetSelectedRole(); setDialogOpen('add', true); }}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <ShieldPlus className="w-4 h-4" />
              {t.actions.add}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryRole ? (
        <QueryAccessBoundary
          viewId="system-roles"
          title={t.menu.systemRoles}
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
      <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
      </Card>

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





