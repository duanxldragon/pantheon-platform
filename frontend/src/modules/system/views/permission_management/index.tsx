import { useState, useEffect, useMemo } from 'react';
import { Permission, PermissionFormData } from '../../types';
import { useCallback } from 'react';
import { useLanguageStore } from '../../../../stores/language_store';
import { toast } from 'sonner';
import { Badge } from '../../../../components/ui/badge';
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
import { ConfirmDialog } from '../../../../shared/components/ui/confirm_dialog';
import { Input } from '../../../../components/ui/input';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementFilterPanel,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../components/ui/select';

// 导入重构后的子组件和 Hook
import { PermissionStats } from './components/permission_stats';
import { PermissionTable } from './components/permission_table';
import { PermissionDialogManager } from './components/permission_dialog_manager';
import { PermissionGroupView } from './components/permission_group_view';
import { usePermissionLogic } from './hooks/use_permission_logic';
import { useMenus } from '../../hooks/use_menus';
import { useRoles } from '../../hooks/use_roles';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/auth_store';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { useCSVImportExport } from '../../../../shared/hooks/use_csv_import_export';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/use_permission_confirm_guard';
import { csvTemplates } from '../../../../shared/utils/csv_templates';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getPermissionModuleLabel, normalizePermissionModule } from './module_localization';
import { getPermissionManagementCopy } from './permission_management_copy';

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
  const authUser = useAuthStore((state) => state.user);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
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

  const isCurrentUserAffectedByPermissionIds = useCallback((permissionIds: string[]) => {
    if (permissionIds.length === 0) {
      return false;
    }

    const currentRoleIds = new Set((authUser?.roleIds || []).map((roleId) => String(roleId)));
    return roles.some(
      (role) =>
        currentRoleIds.has(String(role.id)) &&
        (role.permissionIds || []).map(String).some((permissionId) => permissionIds.includes(permissionId)),
    );
  }, [authUser?.roleIds, roles]);

  const refreshCurrentUserPermissionContextIfNeeded = useCallback(async (permissionIds: string[]) => {
    if (isCurrentUserAffectedByPermissionIds(permissionIds)) {
      await refreshTenantContext();
    }
  }, [isCurrentUserAffectedByPermissionIds, refreshTenantContext]);

  const loadPermissions = useCallback(async () => {
    try {
      const data = await api.getPermissions();
      setPermissions(data);
    } catch {
      toast.error(copy.feedback.loadFailed);
    }
  }, [copy.feedback.loadFailed]);

  const normalizePermissionType = useCallback((value: unknown): Permission['type'] => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'menu' || normalized === '菜单' || normalized === '菜单权限') {
      return 'menu';
    }
    if (normalized === 'data' || normalized === '数据' || normalized === '数据权限') {
      return 'data';
    }
    if (normalized === 'field' || normalized === '字段' || normalized === '字段权限') {
      return 'field';
    }
    return 'operation';
  }, []);

  const normalizePermissionStatus = useCallback((value: unknown): Permission['status'] => {
    const normalized = String(value || '').trim().toLowerCase();
    if (
      normalized === 'inactive' ||
      normalized === 'disabled' ||
      normalized === '禁用' ||
      normalized === '停用'
    ) {
      return 'inactive';
    }
    return 'active';
  }, []);

  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.permission,
    requiredFields: ['permissionName', 'permissionCode'],
    onDataImported: async (rows) => {
      const existingPermissions = new Map(
        permissions.map((permission) => [permission.code.toLowerCase(), permission]),
      );

      for (const row of rows) {
        const code = String(row.permissionCode || '').trim();
        const name = String(row.permissionName || '').trim();
        if (!code || !name) {
          continue;
        }

        const payload: Partial<Permission> = {
          code,
          name,
          type: normalizePermissionType(row.permissionType),
          module: normalizePermissionModule(String(row.module || '').trim() || undefined) || '系统管理',
          status: normalizePermissionStatus(row.status),
          description: String(row.description || '').trim() || undefined,
        };

        const existing = existingPermissions.get(code.toLowerCase());
        if (existing) {
          await api.updatePermission(String(existing.id), {
            ...existing,
            ...payload,
          });
          await refreshCurrentUserPermissionContextIfNeeded([String(existing.id)]);
        } else {
          await api.createPermission(payload);
        }
      }

      await loadPermissions();
      toast.success(copy.feedback.importSuccess);
    },
  });

  // 3. 数据加载
  useEffect(() => {
    if (!canQueryPermission) {
      setPermissions([]);
      return;
    }
    void loadPermissions();
  }, [canQueryPermission, loadPermissions]);

  useEffect(() => {
    setSelectedPermissions((current) => {
      const next = current
        .map((permission) => permissions.find((item) => String(item.id) === String(permission.id)))
        .filter((permission): permission is Permission => Boolean(permission));

      return next.length === current.length && next.every((permission, index) => permission === current[index])
        ? current
        : next;
    });
  }, [permissions, setSelectedPermissions]);

  useEffect(() => {
    if (!selectedPermission) {
      return;
    }

    const nextSelectedPermission =
      permissions.find((permission) => String(permission.id) === String(selectedPermission.id)) ?? null;

    if (!nextSelectedPermission) {
      setSelectedPermission(null);
      setDialogs((prev) => ({ ...prev, edit: false, delete: false }));
      return;
    }

    if (nextSelectedPermission !== selectedPermission) {
      setSelectedPermission(nextSelectedPermission);
    }
  }, [permissions, selectedPermission]);

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
        await refreshCurrentUserPermissionContextIfNeeded([String(selectedPermission.id)]);
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
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreatePermission, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options?: { scope?: 'all' | 'selected' | 'current' }) => {
      if (!ensureActionPermission(canExportPermission, copy.actionLabels.export)) return;
      const exportSource =
        options?.scope === 'selected'
          ? selectedPermissions
          : options?.scope === 'current'
            ? paginatedData
            : filteredData;

      if (options?.scope === 'selected' && selectedPermissions.length === 0) {
        toast.error(zh ? '请先选择需要导出的权限' : 'Select permissions to export first.');
        return;
      }

      await csvHandler.handleExport(
        exportSource.map((permission) => ({
          permissionName: permission.name,
          permissionCode: permission.code,
          permissionType: permission.type,
          module: normalizePermissionModule(permission.module),
          description: permission.description || '',
          status: permission.status,
        })),
        {
          filename:
            options?.scope === 'selected'
              ? 'PermissionManagement_Selected'
              : options?.scope === 'current'
                ? 'PermissionManagement_Current'
                : 'PermissionManagement_Filtered',
        },
      );
      setDialogOpen('export', false);
    },
  };

  const getPermissionDeleteImpact = useCallback((permissionId: string) => {
    const linkedRoles = roles.filter((role) => (role.permissionIds || []).map(String).includes(permissionId));
    return {
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  }, [roles]);

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
        await refreshCurrentUserPermissionContextIfNeeded([String(permission.id)]);
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
        await refreshCurrentUserPermissionContextIfNeeded(items.map((item) => String(item.id)));
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

  const pageDescription = zh
    ? '统一管理权限点、模块归属和启停状态，支撑角色授权与菜单能力的精确生效。'
    : 'Manage permission points, module ownership, and status with a stable role-authorization workflow.';
  const permissionReviewStats = useMemo(() => {
    const active = filteredData.filter((permission) => permission.status === 'active').length;
    const inactive = filteredData.filter((permission) => permission.status !== 'active').length;
    const operation = filteredData.filter((permission) => permission.type === 'operation').length;
    const dataPermission = filteredData.filter((permission) => permission.type === 'data').length;
    const linkedRoles = new Set<string>();
    let linkedUsers = 0;

    filteredData.forEach((permission) => {
      const permissionId = String(permission.id);
      roles.forEach((role) => {
        if ((role.permissionIds || []).map(String).includes(permissionId)) {
          linkedRoles.add(String(role.id));
        }
      });
    });

    roles.forEach((role) => {
      if (linkedRoles.has(String(role.id))) {
        linkedUsers += role.userCount || 0;
      }
    });

    return {
      total: filteredData.length,
      active,
      inactive,
      operation,
      data: dataPermission,
      linkedRoles: linkedRoles.size,
      linkedUsers,
    };
  }, [filteredData, roles]);
  const selectedBatchImpact = useMemo(() => {
    const permissionIds = new Set(selectedPermissions.map((permission) => String(permission.id)));
    const linkedRoles = roles.filter((role) =>
      (role.permissionIds || []).map(String).some((permissionId) => permissionIds.has(permissionId)),
    );

    return {
      roleCount: linkedRoles.length,
      userCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  }, [roles, selectedPermissions]);
  const selectedDeleteBlockedCount = useMemo(() => {
    return selectedPermissions.filter((permission) => getPermissionDeleteImpact(String(permission.id)).affectedRoleCount > 0).length;
  }, [getPermissionDeleteImpact, selectedPermissions]);
  const permissionFocusSummary = useMemo(() => {
    if (selectedPermissions.length > 0) {
      return {
        badge: zh ? '批量操作中' : 'Batch In Progress',
        badgeVariant: 'warning' as const,
        title: zh ? '当前已进入批量权限处理阶段' : 'A batch permission workflow is active',
        description:
          zh
            ? `已选中 ${selectedPermissions.length} 项权限，可继续启停或删除，但要先复核角色引用和删除阻塞项。`
            : `${selectedPermissions.length} permissions are selected. Continue with status changes or deletion after reviewing role references and delete blockers.`,
        nextAction:
          zh ? '优先检查角色引用范围，再执行批量操作。' : 'Review role references before running batch actions.',
      };
    }
    if (permissionReviewStats.inactive > 0) {
      return {
        badge: zh ? '停用复核' : 'Inactive Review',
        badgeVariant: 'mono' as const,
        title: zh ? '当前结果中存在停用权限需要复核' : 'Inactive permissions need follow-up',
        description:
          zh
            ? `当前范围内有 ${permissionReviewStats.inactive} 项停用权限，建议优先确认角色引用与权限刷新影响。`
            : `${permissionReviewStats.inactive} inactive permissions are in scope. Review role references and refresh impact first.`,
        nextAction:
          zh ? '先查看停用权限的角色引用，再决定是否恢复启用。' : 'Review role references for inactive permissions before re-enabling them.',
      };
    }
    if (filterType !== 'all' || filterModule !== 'all' || searchQuery.trim() || viewMode === 'group') {
      return {
        badge: zh ? '筛选结果' : 'Filtered Result',
        badgeVariant: 'info' as const,
        title: zh ? '当前处于权限聚焦筛选模式' : 'You are reviewing a narrowed permission scope',
        description:
          zh
            ? `当前范围已缩小到 ${permissionReviewStats.total} 项权限，适合继续检查模块归属、类型分布与角色影响。`
            : `The current scope is narrowed to ${permissionReviewStats.total} permissions, which is ideal for reviewing module ownership, type distribution, and role impact.`,
        nextAction:
          zh ? '继续按模块或分组查看细节，或清空筛选回到全量视图。' : 'Continue by module or group detail, or clear filters to return to the full list.',
      };
    }

    return {
      badge: zh ? '运行稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前权限台账整体稳定' : 'The permission roster is stable overall',
      description:
        zh
          ? '当前结果以内主要为稳定权限，可继续做模块归属、编码规范和角色覆盖面的常规巡检。'
          : 'Most permissions in scope are stable. Continue with routine checks on module ownership, code consistency, and role coverage.',
      nextAction:
        zh ? '优先抽查高影响模块和关键操作权限。' : 'Spot-check high-impact modules and critical operation permissions next.',
    };
  }, [filterModule, filterType, permissionReviewStats, searchQuery, selectedPermissions.length, viewMode, zh]);

  return (
    <div className="space-y-6">
      {!canQueryPermission ? (
        <QueryAccessBoundary
          viewId="system-permissions"
          title={copy.page.title}
          queryPermission={systemPermissions.permission.query}
        />
      ) : (
        <>
          <ManagementPageHeader
            eyebrow="SYSTEM"
            title={copy.page.title}
            description={pageDescription}
            meta={
              <>
                <Badge variant="mono">{copy.entity.en}</Badge>
                <Badge variant="info">
                  {zh ? `权限总数 ${permissions.length}` : `${permissions.length} permissions`}
                </Badge>
                {selectedPermissions.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedPermissions.length} 项` : `${selectedPermissions.length} selected`}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <>
          {selectedPermissions.length > 0 && (
            <>
              {canUpdatePermission && permissionsToEnable.length > 0 ? (
                <Button
                  variant="success"
                  size="pill"
                  onClick={() => handleBatchPermissionStatus(true)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(permissionsToEnable.length)}
                </Button>
              ) : null}
              {canUpdatePermission && permissionsToDisable.length > 0 ? (
                <Button
                  variant="warning"
                  size="pill"
                  onClick={() => handleBatchPermissionStatus(false)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(permissionsToDisable.length)}
                </Button>
              ) : null}
              {canDeletePermission ? (
                <Button
                  variant="ghost-danger"
                  size="pill"
                  onClick={handleBatchDelete}
                  className="h-11 gap-2 rounded-full border border-destructive/20 px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedPermissions.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreatePermission ? (
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
          {canExportPermission ? (
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
          {canCreatePermission ? (
            <Button
              size="pill"
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
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
              description={zh ? '根据当前权限状态，建议优先处理这些动作。' : 'Based on the current permission state, handle these actions first.'}
            >
              <DetailKeyValueItem
                label="01"
                value={
                  selectedPermissions.length > 0
                    ? (zh ? '先复核角色引用与删除阻塞' : 'Review role references and delete blockers first')
                    : permissionReviewStats.inactive > 0
                      ? (zh ? '先处理停用权限' : 'Review inactive permissions first')
                      : (zh ? '先检查高影响模块' : 'Review high-impact modules first')
                }
              />
              <DetailKeyValueItem
                label="02"
                value={zh ? '再检查模块归属、权限类型与视图分组' : 'Then inspect module ownership, permission types, and grouped views'}
              />
              <DetailKeyValueItem
                label="03"
                value={selectedPermissions.length === 0 && canCreatePermission ? (zh ? '最后新增或调整权限点' : 'Finally add or adjust permissions') : (zh ? '最后恢复常规巡检' : 'Finally return to routine inspection')}
                className="md:col-span-2"
              />
            </DetailKeyValueSection>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={permissionFocusSummary.badgeVariant}>{permissionFocusSummary.badge}</Badge>
                <Badge variant="mono">
                  {zh ? `当前范围 ${permissionReviewStats.total} 项权限` : `${permissionReviewStats.total} permissions in scope`}
                </Badge>
                <Badge variant="info">{viewMode === 'list' ? (zh ? '列表视图' : 'List View') : (zh ? '分组视图' : 'Group View')}</Badge>
                {selectedPermissions.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedPermissions.length} 项` : `${selectedPermissions.length} selected`}
                  </Badge>
                ) : null}
              </div>
              <div className="text-sm font-semibold text-slate-900">{permissionFocusSummary.title}</div>
              <div className="text-xs leading-5 text-slate-600">{permissionFocusSummary.description}</div>
            </div>
            <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '启用中' : 'Active'}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{permissionReviewStats.active}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前可参与授权快照。' : 'Currently active in authorization snapshots.'}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '停用中' : 'Inactive'}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{permissionReviewStats.inactive}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '建议优先复核角色引用。' : 'Review role references first.'}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '操作权限' : 'Operations'}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{permissionReviewStats.operation}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? `${permissionReviewStats.data} 项数据权限在当前范围内` : `${permissionReviewStats.data} data permissions in scope`}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '角色影响' : 'Role Impact'}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{permissionReviewStats.linkedRoles}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? `${permissionReviewStats.linkedUsers} 名成员受覆盖` : `${permissionReviewStats.linkedUsers} users covered in scope`}</div>
              </div>
            </div>
          </div>

          <DetailKeyValueSection
            eyebrow="REVIEW"
            title={zh ? '权限焦点' : 'Permission Focus'}
            description={zh ? '结合当前筛选、视图模式与选择状态，快速判断下一步。' : 'Use the current filters, view mode, and selection state to decide the next action.'}
          >
            <DetailKeyValueItem
              label={zh ? '当前结论' : 'Current Outcome'}
              value={permissionFocusSummary.title}
              hint={permissionFocusSummary.description}
              className="md:col-span-2"
            />
            <DetailKeyValueItem
              label={zh ? '筛选状态' : 'Filter State'}
              value={filterType === 'all' ? copy.search.typeAll : filterType === 'menu' ? copy.search.typeMenu : filterType === 'operation' ? copy.search.typeOperation : copy.search.typeData}
              hint={
                filterModule === 'all'
                  ? (zh ? '未限制模块' : 'No module filter applied')
                  : getPermissionModuleLabel(filterModule, language)
              }
            />
            <DetailKeyValueItem
              label={zh ? '下一步动作' : 'Next Action'}
              value={permissionFocusSummary.nextAction}
            />
            <DetailKeyValueItem
              label={zh ? '批量影响' : 'Batch Impact'}
              value={
                selectedPermissions.length > 0
                  ? (zh
                    ? `待启用 ${permissionsToEnable.length} / 待禁用 ${permissionsToDisable.length}`
                    : `${permissionsToEnable.length} to enable / ${permissionsToDisable.length} to disable`)
                  : (zh ? '当前未选择权限' : 'No permissions selected')
              }
              hint={
                selectedPermissions.length > 0
                  ? (zh
                    ? `影响 ${selectedBatchImpact.roleCount} 个角色、${selectedBatchImpact.userCount} 名成员；删除阻塞 ${selectedDeleteBlockedCount} 项`
                    : `${selectedBatchImpact.roleCount} roles and ${selectedBatchImpact.userCount} users affected; ${selectedDeleteBlockedCount} delete blockers`)
                  : (zh ? '可按模块或权限类型继续缩小范围。' : 'Filter by module or permission type to narrow the scope.')
              }
            />
            <DetailKeyValueItem
              label={zh ? '推荐操作' : 'Recommended Actions'}
              className="md:col-span-2"
              value={
                <div className="flex flex-wrap gap-2">
                  {(searchQuery.trim() || filterType !== 'all' || filterModule !== 'all' || viewMode !== 'list') ? (
                    <Button
                      type="button"
                      variant="mono"
                      size="pill"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                        setFilterModule('all');
                        setViewMode('list');
                      }}
                    >
                      {zh ? '恢复默认视图' : 'Restore Default View'}
                    </Button>
                  ) : null}
                  {selectedPermissions.length > 0 && canExportPermission ? (
                    <Button type="button" variant="mono" size="pill" onClick={() => setDialogOpen('export', true)}>
                      {zh ? '导出当前选择' : 'Export Selection'}
                    </Button>
                  ) : null}
                  {selectedPermissions.length === 0 && canCreatePermission ? (
                    <Button type="button" variant="mono" size="pill" onClick={openAddDialog}>
                      {zh ? '新增权限' : 'Create Permission'}
                    </Button>
                  ) : null}
                </div>
              }
            />
          </DetailKeyValueSection>
        </div>
      </ManagementContentCard>

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
    </div>
  );
}


















