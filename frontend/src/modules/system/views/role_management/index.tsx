import { useMemo, useState } from 'react';
import { useRoles } from '../../hooks/use_roles';
import { useMenus } from '../../hooks/use_menus';
import { Role, RoleFormData } from '../../types';
import { useLanguageStore } from '../../../../stores/language_store';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Trash2, Download, Upload, ShieldPlus, Power, PowerOff } from 'lucide-react';
import { ConfirmDialog } from '../../../../shared/components/ui/confirm_dialog';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useCSVImportExport } from '../../../../shared/hooks/use_csv_import_export';
import { csvTemplates } from '../../../../shared/utils/csv_templates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/auth_store';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/use_permission_confirm_guard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/use_query_permission_dialog_guard';
import type { ExportOptions } from '../../../../shared/components/ui/data_import_export_dialog';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getRoleManagementCopy } from './role_management_copy';

// 导入重构后的组件和 Hook
import { RoleTable } from './components/role_table';
import { RoleSearchForm } from './components/role_search_form';
import { RoleDialogManager } from './components/role_dialog_manager';
import { useRoleTable } from './hooks/use_role_table';

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
  const authUser = useAuthStore((state) => state.user);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
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

  const isCurrentUserRole = (roleId?: Role['id']) =>
    roleId != null &&
    (authUser?.roleIds || []).some((item) => String(item) === String(roleId));

  const refreshCurrentUserAuthorizationIfNeeded = async (roleIds: Array<Role['id'] | undefined>) => {
    if (roleIds.some((roleId) => isCurrentUserRole(roleId))) {
      await refreshTenantContext();
    }
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
  const filteredRoles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesSearch =
        keyword.length === 0 ||
        [role.name, role.code, role.description]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(keyword));
      const matchesType = filters.type === 'all' || role.type === filters.type;
      const matchesStatus = filters.status === 'all' || role.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filters.status, filters.type, roles, searchQuery]);

  // 4. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.role,
    onDataImported: async (data) => {
      const existingRoles = new Map(roles.map((role) => [role.code.toLowerCase(), role]));

      for (const row of data) {
        const code = String(row.roleCode || '').trim();
        const name = String(row.roleName || '').trim();
        if (!code || !name) {
          continue;
        }

        const payload: Partial<Role> = {
          code,
          name,
          description: String(row.description || '').trim(),
          status:
            String(row.status || '').trim().toLowerCase() === 'inactive' ||
            String(row.status || '').trim() === '禁用'
              ? 'inactive'
              : 'active',
        };

        const existing = existingRoles.get(code.toLowerCase());
        if (existing) {
          await api.updateRole(String(existing.id), payload);
          await refreshCurrentUserAuthorizationIfNeeded([existing.id]);
        } else {
          await api.createRole({
            ...payload,
            type: 'custom',
          });
        }
      }

      await reload();
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
              await refreshCurrentUserAuthorizationIfNeeded([selectedRole.id]);
              await reload();
            });
            return;
          }

          await api.updateRole(String(selectedRole.id), data);
          await refreshCurrentUserAuthorizationIfNeeded([selectedRole.id]);
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
        : filteredRoles;
      await csvHandler.handleExport(dataToExport.map((role) => ({
        roleName: role.name,
        roleCode: role.code,
        description: role.description || '',
        status: role.status,
        sort: '',
      })), {
        filename: options.scope === 'selected' ? 'RoleManagement_Selected' : 'RoleManagement_Filtered',
      });
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
        await refreshCurrentUserAuthorizationIfNeeded([role.id]);
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
        await refreshCurrentUserAuthorizationIfNeeded(rolesToChange.map((role) => role.id));
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

  const pageDescription = zh
    ? '统一管理角色结构、授权入口和成员关联，确保菜单与权限变更可以稳定生效。'
    : 'Manage roles, authorization entry points, and member bindings with a stable permission-aware workflow.';
  const roleReviewStats = useMemo(() => {
    const active = filteredRoles.filter((role) => role.status === 'active').length;
    const inactive = filteredRoles.filter((role) => role.status !== 'active').length;
    const system = filteredRoles.filter((role) => role.type === 'system').length;
    const affectedUsers = filteredRoles.reduce((total, role) => total + (role.userCount || 0), 0);

    return {
      total: filteredRoles.length,
      active,
      inactive,
      system,
      affectedUsers,
    };
  }, [filteredRoles]);
  const selectedAffectedUsers = useMemo(
    () => selectedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    [selectedRoles],
  );
  const selectedSystemRoles = selectedRoles.filter((role) => role.type === 'system').length;
  const roleFocusSummary = useMemo(() => {
    if (selectedRoles.length > 0) {
      return {
        badge: zh ? '批量操作中' : 'Batch In Progress',
        badgeVariant: 'warning' as const,
        title: zh ? '当前已进入批量角色处理阶段' : 'A batch role workflow is active',
        description:
          zh
            ? `已选中 ${selectedRoles.length} 个角色，可继续启停或删除，但要先确认系统内置角色和成员影响范围。`
            : `${selectedRoles.length} roles are selected. Continue with status changes or deletion after reviewing built-in role restrictions and member impact.`,
        nextAction:
          zh ? '优先检查系统角色与关联成员数，再执行批量操作。' : 'Review built-in roles and linked members before running batch actions.',
      };
    }
    if (roleReviewStats.inactive > 0) {
      return {
        badge: zh ? '停用复核' : 'Inactive Review',
        badgeVariant: 'mono' as const,
        title: zh ? '当前结果中存在停用角色需要复核' : 'Inactive roles need follow-up',
        description:
          zh
            ? `当前范围内有 ${roleReviewStats.inactive} 个停用角色，建议优先核对成员影响与菜单授权恢复策略。`
            : `${roleReviewStats.inactive} inactive roles are in scope. Review member impact and menu restoration strategy first.`,
        nextAction:
          zh ? '优先查看停用角色详情或成员列表。' : 'Review inactive role details or member lists first.',
      };
    }
    if (filters.type === 'system' || roleReviewStats.system > 0) {
      return {
        badge: zh ? '系统角色' : 'Built-in Roles',
        badgeVariant: 'info' as const,
        title: zh ? '当前范围包含系统内置角色' : 'Built-in roles are in scope',
        description:
          zh
            ? `当前范围内有 ${roleReviewStats.system} 个系统角色，删除与部分状态调整会受到额外约束。`
            : `${roleReviewStats.system} built-in roles are in scope. Deletion and some status changes are more restricted.`,
        nextAction:
          zh ? '优先区分系统角色与自定义角色，再进行后续处理。' : 'Differentiate built-in and custom roles before continuing.',
      };
    }

    return {
      badge: zh ? '运行稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前角色授权面整体稳定' : 'The role authorization surface is stable overall',
      description:
        zh
          ? '当前结果以内主要为稳定角色，可继续做菜单权限、成员绑定和授权覆盖面的常规巡检。'
          : 'Most roles in scope are stable. Continue with routine checks on menu permissions, membership, and authorization coverage.',
      nextAction:
        zh ? '优先抽查高成员数角色和关键系统角色。' : 'Spot-check high-member roles and critical built-in roles next.',
    };
  }, [filters.type, roleReviewStats, selectedRoles.length, zh]);

  return (
    <div className="space-y-6">
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
          <ManagementPageHeader
            eyebrow="SYSTEM"
            title={copy.page.title}
            description={pageDescription}
            meta={
              <>
                <Badge variant="mono">Role</Badge>
                <Badge variant="info">{zh ? `角色总数 ${roles.length}` : `${roles.length} roles`}</Badge>
                {selectedRoles.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedRoles.length} 项` : `${selectedRoles.length} selected`}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <>
          {selectedRoles.length > 0 && (
            <>
              {canUpdateRole && rolesToEnable.length > 0 ? (
                <Button
                  variant="success"
                  size="pill"
                  onClick={() => handleBatchRoleStatus(true)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(rolesToEnable.length)}
                </Button>
              ) : null}
              {canUpdateRole && rolesToDisable.length > 0 ? (
                <Button
                  variant="warning"
                  size="pill"
                  onClick={() => handleBatchRoleStatus(false)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(rolesToDisable.length)}
                </Button>
              ) : null}
              {canDeleteRole ? (
                <Button
                  variant="ghost-danger"
                  size="pill"
                  onClick={handleBatchDelete}
                  className="h-11 gap-2 rounded-full border border-destructive/20 px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedRoles.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreateRole ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => setDialogOpen('import', true)}
              className="h-11 gap-2 rounded-full px-4"
            >
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportRole ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-full px-4"
            >
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateRole ? (
            <Button
              size="pill"
              onClick={() => { resetSelectedRole(); setDialogOpen('add', true); }}
              className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <ShieldPlus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
              </>
            }
          />

          <ManagementContentCard className="border-slate-200/70 bg-gradient-to-br from-white via-slate-50/70 to-slate-100/70 p-5">
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <DetailKeyValueSection
                  eyebrow="PRIORITY"
                  title={zh ? '本次处理顺序' : 'Suggested Priority Order'}
                  description={
                    zh
                      ? '根据当前筛选和已选角色，建议优先执行这些动作。'
                      : 'Based on current filters and selection, these actions should be handled first.'
                  }
                >
                  <DetailKeyValueItem
                    label="01"
                    value={
                      selectedRoles.length > 0
                        ? (zh ? '先核对系统角色与成员影响' : 'Review built-in roles and member impact first')
                        : roleReviewStats.inactive > 0
                          ? (zh ? '先处理停用角色' : 'Review inactive roles first')
                          : (zh ? '先确认角色类型范围' : 'Confirm the role type scope first')
                    }
                    hint={
                      selectedRoles.length > 0
                        ? (zh ? '系统角色与高成员数角色需要优先确认。' : 'Built-in roles and high-member roles need priority review.')
                        : roleReviewStats.inactive > 0
                          ? (zh ? '停用角色通常先看成员影响与授权恢复策略。' : 'Inactive roles usually require member-impact and restore-strategy review.')
                          : (zh ? '适合先区分系统角色和自定义角色。' : 'Differentiate built-in and custom roles first.')
                    }
                  />
                  <DetailKeyValueItem
                    label="02"
                    value={selectedRoles.length > 0 ? (zh ? '再执行启停或导出' : 'Then run enable/disable or export') : (zh ? '再检查授权详情或成员列表' : 'Then inspect permission detail or member lists')}
                  />
                  <DetailKeyValueItem
                    label="03"
                    value={selectedRoles.length === 0 && canCreateRole ? (zh ? '最后补充新增角色' : 'Finally add new roles') : (zh ? '最后恢复常规授权巡检' : 'Finally return to routine authorization review')}
                    className="md:col-span-2"
                  />
                </DetailKeyValueSection>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={roleFocusSummary.badgeVariant}>{roleFocusSummary.badge}</Badge>
                    <Badge variant="mono">
                      {zh ? `当前范围 ${roleReviewStats.total} 个角色` : `${roleReviewStats.total} roles in scope`}
                    </Badge>
                    {selectedRoles.length > 0 ? (
                      <Badge variant="warning">
                        {zh ? `已选 ${selectedRoles.length} 个` : `${selectedRoles.length} selected`}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{roleFocusSummary.title}</div>
                  <div className="text-xs leading-5 text-slate-600">{roleFocusSummary.description}</div>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '启用中' : 'Active'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{roleReviewStats.active}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前可正常承载授权快照。' : 'Currently carrying active authorization snapshots.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '停用中' : 'Inactive'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{roleReviewStats.inactive}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '建议结合成员数优先复核。' : 'Review with member counts first.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '系统角色' : 'Built-in'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{roleReviewStats.system}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '删除与变更受额外约束。' : 'Deletion and changes are more restricted.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '关联成员' : 'Linked Users'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{roleReviewStats.affectedUsers}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前结果中的成员总覆盖。' : 'Total member coverage in the current scope.'}</div>
                  </div>
                </div>
              </div>

              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '授权焦点' : 'Authorization Focus'}
                description={zh ? '结合当前筛选与选择状态，快速判断角色管理下一步。' : 'Use the current filters and selection state to decide the next role action.'}
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Current Outcome'}
                  value={roleFocusSummary.title}
                  hint={roleFocusSummary.description}
                  className="md:col-span-2"
                />
                <DetailKeyValueItem
                  label={zh ? '筛选状态' : 'Filter State'}
                  value={filters.status === 'all' ? copy.search.statusAll : filters.status === 'active' ? copy.search.statusEnabled : copy.search.statusDisabled}
                  hint={
                    filters.type === 'all'
                      ? (zh ? '未限制角色类型' : 'No role type filter applied')
                      : filters.type === 'system'
                        ? copy.search.typeSystem
                        : copy.search.typeCustom
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '下一步动作' : 'Next Action'}
                  value={roleFocusSummary.nextAction}
                />
                <DetailKeyValueItem
                  label={zh ? '批量影响' : 'Batch Impact'}
                  value={
                    selectedRoles.length > 0
                      ? (zh
                        ? `待启用 ${rolesToEnable.length} / 待禁用 ${rolesToDisable.length}`
                        : `${rolesToEnable.length} to enable / ${rolesToDisable.length} to disable`)
                      : (zh ? '当前未选择角色' : 'No roles selected')
                  }
                  hint={
                    selectedRoles.length > 0
                      ? (zh
                        ? `预计影响 ${selectedAffectedUsers} 名成员，系统角色 ${selectedSystemRoles} 个`
                        : `${selectedAffectedUsers} members affected, ${selectedSystemRoles} built-in roles in selection`)
                      : (zh ? '可按角色类型或状态继续缩小范围。' : 'Filter by role type or status to narrow the scope.')
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '推荐操作' : 'Recommended Actions'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {(searchQuery.trim() || filters.type !== 'all' || filters.status !== 'all') ? (
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={() => {
                            setSearchQuery('');
                            setFilters({
                              type: 'all',
                              status: 'all',
                            });
                          }}
                        >
                          {zh ? '清空筛选条件' : 'Clear Filters'}
                        </Button>
                      ) : null}
                      {selectedRoles.length > 0 && canExportRole ? (
                        <Button type="button" variant="mono" size="pill" onClick={() => setDialogOpen('export', true)}>
                          {zh ? '导出当前选择' : 'Export Selection'}
                        </Button>
                      ) : null}
                      {selectedRoles.length === 0 && canCreateRole ? (
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={() => {
                            resetSelectedRole();
                            setDialogOpen('add', true);
                          }}
                        >
                          {zh ? '新增角色' : 'Create Role'}
                        </Button>
                      ) : null}
                    </div>
                  }
                />
              </DetailKeyValueSection>
            </div>
          </ManagementContentCard>

          <RoleSearchForm
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
          />

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

          <RoleDialogManager
            dialogs={dialogs}
            setDialogOpen={setDialogOpen}
            selectedRole={selectedRole}
            menus={menus}
            handlers={handlers}
            onPermissionSuccess={async () => {
              await refreshCurrentUserAuthorizationIfNeeded([selectedRole?.id]);
              await reload();
            }}
            onMembersUpdate={async () => {
              await refreshCurrentUserAuthorizationIfNeeded([selectedRole?.id]);
              await reload();
            }}
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
    </div>
  );
}



















