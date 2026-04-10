import { useMemo, useState, useCallback } from 'react';
import { usePositions } from '../../hooks/use_positions';
import { useUsers } from '../../hooks/use_users';
import { useDepartments } from '../../hooks/use_departments';
import { Position } from '../../types';
import { useLanguageStore } from '../../../../stores/language_store';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Trash2, Download, Plus, Upload, Power, PowerOff } from 'lucide-react';
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

// 导入拆分后的组件和 Hook
import { PositionTable } from './components/position_table';
import { PositionSearchForm } from './components/position_search_form';
import { PositionDialogManager } from './components/position_dialog_manager';
import { usePositionTable } from './hooks/use_position_table';
import { getPositionManagementCopy } from './position_management_copy';

interface StatusConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: 'warning' | 'success' | 'danger';
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

export function PositionManagement() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getPositionManagementCopy(language);
  const positionMessages = createEntityFeedback(zh, copy.entity);
  const authUser = useAuthStore((state) => state.user);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryPosition = hasPermission(systemPermissions.position.query);
  
  // 1. 数据加载
  const { positions, reload: reloadPositions } = usePositions({ enabled: canQueryPosition });
  const { users, reload: reloadUsers } = useUsers({ enabled: canQueryPosition });
  const { departments } = useDepartments({ enabled: canQueryPosition });
  const flatDepartments = useMemo(() => {
    const result: typeof departments = [];
    const walk = (items: typeof departments) => {
      items.forEach((item) => {
        result.push(item);
        if (item.children?.length) {
          walk(item.children);
        }
      });
    };
    walk(departments);
    return result;
  }, [departments]);

  // 2. 状态管理
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState<Partial<Position>>({});
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmState>(initialStatusConfirmState);
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    delete: false,
    users: false,
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

  const closeStatusConfirm = () => {
    setStatusConfirm(initialStatusConfirmState);
  };

  const resetPositionForm = () => {
    setSelectedPosition(null);
    setFormData({});
  };

  const openAddDialog = () => {
    resetPositionForm();
    setDialogOpen('add', true);
  };

  const getPositionAffectedUserCount = useCallback(
    (positionId: string) =>
      users.filter((user) => String(user.positionId ?? '') === positionId).length,
    [users],
  );

  const isCurrentUserInPositionScope = useCallback((positionIds: string[]) => {
    if (!authUser?.positionId) {
      return false;
    }

    return positionIds.includes(String(authUser.positionId));
  }, [authUser?.positionId]);

  const buildPositionStatusMessages = (positionName: string, enabled: boolean, affectedUsers: number) => {
    return {
      title: copy.messages.statusTitle(enabled),
      description: copy.messages.statusDescription(positionName, enabled, affectedUsers),
      confirmText: copy.messages.statusConfirmText(enabled),
      success: copy.messages.statusSuccess(positionName, enabled, affectedUsers),
    };
  };

  const openPositionStatusConfirm = (
    position: Pick<Position, 'id' | 'name'>,
    enabled: boolean,
    action: () => Promise<void>,
  ) => {
    const affectedUsers = getPositionAffectedUserCount(String(position.id));
    const copy = buildPositionStatusMessages(position.name, enabled, affectedUsers);

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

  const openPositionBatchConfirm = (
    mode: 'enable' | 'disable' | 'delete',
    items: Pick<Position, 'id' | 'name'>[],
    action: () => Promise<void>,
  ) => {
    const affectedUsers = items.reduce((total, item) => total + getPositionAffectedUserCount(String(item.id)), 0);

    setStatusConfirm({
      open: true,
      title: copy.messages.batchTitle(mode),
      description: copy.messages.batchDescription(mode, items.length, affectedUsers),
      confirmText: copy.messages.batchConfirmText(mode),
      variant: mode === 'delete' ? 'danger' : mode === 'enable' ? 'success' : 'warning',
      guard: mode === 'delete' ? 'delete' : 'update',
      action: async () => {
        await action();
        toast.success(copy.messages.batchSuccess(mode, items.length, affectedUsers));
      },
    });
  };

  const buildPositionDeleteDescription = (positionName: string, affectedUsers: number) => {
    return copy.messages.deleteDescription(positionName, affectedUsers);
  };

  // 3. 表格与搜索逻辑 Hook
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedPositions,
    setSelectedPositions,
    page,
    setPage,
    totalPages,
    paginatedData,
  } = usePositionTable(positions);
  const filteredPositions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return positions.filter((position) => {
      const matchesSearch =
        keyword.length === 0 ||
        [position.name, position.code, position.description]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(keyword));
      const matchesDept = filters.departmentId === 'all' || position.departmentId === filters.departmentId;
      const matchesLevel = filters.level === 'all' || String(position.level) === filters.level;
      const matchesStatus = filters.status === 'all' || position.status === filters.status;

      return matchesSearch && matchesDept && matchesLevel && matchesStatus;
    });
  }, [filters.departmentId, filters.level, filters.status, positions, searchQuery]);

  // 4. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.position,
    onDataImported: async (rows) => {
      const existingPositions = new Map(positions.map((position) => [position.code.toLowerCase(), position]));

      const resolveStatus = (value: unknown): Position['status'] => {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'inactive' || normalized === 'disabled' || normalized === '禁用'
          ? 'inactive'
          : 'active';
      };

      const resolveDepartmentId = (row: Record<string, unknown>) => {
        const keywords = [row.departmentId, row.departmentCode, row.departmentName]
          .map((value) => String(value || '').trim().toLowerCase())
          .filter(Boolean);

        if (keywords.length === 0) {
          return null;
        }

        const matchedDepartment = flatDepartments.find((department) =>
          keywords.some((keyword) =>
            [department.id, department.code, department.name]
              .filter(Boolean)
              .some((candidate) => String(candidate).trim().toLowerCase() === keyword),
          ),
        );

        return matchedDepartment ? String(matchedDepartment.id) : null;
      };

      const resolveLevel = (value: unknown) => {
        const raw = String(value || '').trim();
        if (!raw) {
          return 1;
        }

        const numeric = Number(raw.replace(/[^0-9]/g, ''));
        return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
      };

      for (const row of rows) {
        const code = String(row.positionCode || '').trim();
        const name = String(row.positionName || '').trim();
        if (!code || !name) {
          continue;
        }

        const payload: Partial<Position> = {
          name,
          code,
          departmentId: resolveDepartmentId(row),
          category: String(row.category || '').trim(),
          level: resolveLevel(row.positionLevel),
          description: String(row.description || '').trim(),
          responsibilities: String(row.responsibilities || '').trim(),
          requirements: String(row.requirements || '').trim(),
          sort: Number(row.sort) || 0,
          status: resolveStatus(row.status),
        };

        const existing = existingPositions.get(code.toLowerCase());
        if (existing) {
          await api.updatePosition(String(existing.id), payload);
        } else {
          await api.createPosition(payload);
        }
      }

      await reloadPositions();
      if (authUser?.positionId) {
        await refreshCurrentUser();
      }
      toast.success(positionMessages.importSuccess);
    },
    requiredFields: ['positionName', 'positionCode'],
  });

  // 5. 事件处理函数
  const handleAction = (action: string, pos: Position) => {
    setSelectedPosition(pos);
    switch (action) {
      case 'detail': setDialogOpen('users', true); break;
      case 'edit':
        setFormData(pos);
        setDialogOpen('edit', true);
        break;
      case 'delete': setDialogOpen('delete', true); break;
    }
  };

  const normalizePositionFormData = (data: Partial<Position>) => ({
    ...data,
    name: data.name?.trim(),
    code: data.code?.trim(),
    description: data.description?.trim(),
    responsibilities: data.responsibilities?.trim(),
    requirements: data.requirements?.trim(),
  });

  const validatePositionFormData = (data: Partial<Position>) => {
    const normalized = normalizePositionFormData(data);
    const departmentId = normalized.departmentId != null ? String(normalized.departmentId) : '';

    if (!normalized.name) {
      return copy.validation.nameRequired;
    }
    if (!normalized.code) {
      return copy.validation.codeRequired;
    }
    if (!departmentId) {
      return copy.validation.departmentRequired;
    }

    const department = departments.find((item) => String(item.id) === departmentId);
    if (!department) {
      return copy.validation.departmentMissing;
    }
    if (department.status !== 'active') {
      return copy.validation.departmentInactive;
    }

    return null;
  };

  const handlers = {
    onSubmit: async () => {
      if (!ensureActionPermission(dialogs.add ? canCreatePosition : canUpdatePosition, dialogs.add ? copy.actionLabels.add : copy.actionLabels.edit)) return;
      try {
        const normalizedFormData = normalizePositionFormData(formData);
        const validationMessage = validatePositionFormData(normalizedFormData);
        if (validationMessage) {
          toast.error(validationMessage);
          return;
        }

        const nextStatus = normalizedFormData.status;
        if (selectedPosition && nextStatus && nextStatus !== selectedPosition.status) {
          openPositionStatusConfirm(selectedPosition, nextStatus === 'active', async () => {
            await api.updatePosition(String(selectedPosition.id), normalizedFormData);
            setDialogOpen('edit', false);
            resetPositionForm();
            if (isCurrentUserInPositionScope([String(selectedPosition.id)])) {
              await refreshCurrentUser();
            }
            await reloadPositions();
          });
          return;
        }

        if (dialogs.add) {
          await api.createPosition(normalizedFormData);
        } else if (selectedPosition) {
          await api.updatePosition(String(selectedPosition.id), normalizedFormData);
        }
        toast.success(dialogs.add ? positionMessages.createSuccess : positionMessages.updateSuccess);
        setDialogOpen(dialogs.add ? 'add' : 'edit', false);
        resetPositionForm();
        if (selectedPosition && isCurrentUserInPositionScope([String(selectedPosition.id)])) {
          await refreshCurrentUser();
        }
        await reloadPositions();
      } catch {
        toast.error(positionMessages.saveFailed);
      }
    },
    onDelete: async () => {
      if (!selectedPosition) return;
      if (!ensureActionPermission(canDeletePosition, copy.actionLabels.delete)) return;
      try {
        await api.deletePosition(String(selectedPosition.id));
        toast.success(positionMessages.deleteSuccess);
        setDialogOpen('delete', false);
        resetPositionForm();
        await reloadPositions();
      } catch {
        toast.error(positionMessages.deleteFailed);
      }
    },
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreatePosition, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: ExportOptions) => {
      if (!ensureActionPermission(canExportPosition, copy.actionLabels.export)) return;
      const dataToExport = options.scope === 'selected' && selectedPositions.length > 0
        ? selectedPositions
        : filteredPositions;
      await csvHandler.handleExport(dataToExport.map((position) => ({
        positionName: position.name,
        positionCode: position.code,
        departmentId: position.departmentId || '',
        departmentCode:
          flatDepartments.find((department) => String(department.id) === String(position.departmentId ?? ''))?.code || '',
        departmentName:
          flatDepartments.find((department) => String(department.id) === String(position.departmentId ?? ''))?.name
          || position.departmentName
          || '',
        category: position.category || '',
        positionLevel: `P${position.level ?? 1}`,
        responsibilities: position.responsibilities || '',
        requirements: position.requirements || '',
        description: position.description || '',
        sort: position.sort ?? 0,
        status: position.status,
      })), {
        filename: options.scope === 'selected' ? 'PositionManagement_Selected' : 'PositionManagement_Filtered',
      });
      setDialogOpen('export', false);
    },
    onAssignUsers: async (ids: string[]) => {
      if (!selectedPosition) {
        return;
      }
      try {
        await Promise.all(ids.map((id) => api.updateUser(id, { positionId: selectedPosition.id })));
        toast.success(copy.messages.assignSuccess(selectedPosition.name, ids.length));
        if (authUser?.id && ids.some((id) => String(id) === String(authUser.id))) {
          await refreshCurrentUser();
        }
        await Promise.all([reloadUsers(), reloadPositions()]);
      } catch {
        toast.error(positionMessages.assignMembersFailed);
      }
    },
    onUnassignUser: async (userId: string) => {
      if (!selectedPosition) {
        return;
      }
      try {
        await api.updateUser(userId, { positionId: null });
        toast.success(copy.messages.unassignSuccess(selectedPosition.name));
        if (authUser?.id && String(userId) === String(authUser.id)) {
          await refreshCurrentUser();
        }
        await Promise.all([reloadUsers(), reloadPositions()]);
      } catch {
        toast.error(positionMessages.removeMemberFailed);
      }
    },
  };

  const handleBatchDelete = async () => {
    if (!ensureActionPermission(canDeletePosition, copy.actionLabels.batchDelete)) return;
    openPositionBatchConfirm('delete', selectedPositions, async () => {
      try {
        await api.batchDeletePositions(selectedPositions.map((position) => String(position.id)));
        setSelectedPositions([]);
        resetPositionForm();
        await reloadPositions();
      } catch {
        toast.error(positionMessages.batchDeleteFailed);
        throw new Error('position batch delete failed');
      }
    });
  };

  const positionsToEnable = selectedPositions.filter((position) => position.status !== 'active');
  const positionsToDisable = selectedPositions.filter((position) => position.status !== 'inactive');
  const canCreatePosition = hasPermission(systemPermissions.position.create);
  const canUpdatePosition = hasPermission(systemPermissions.position.update);
  const canDeletePosition = hasPermission(systemPermissions.position.delete);
  const canExportPosition = hasPermission(systemPermissions.position.export);
  const { lossDescription: queryLossDescription } = useQueryPermissionDialogGuard({
    canQuery: canQueryPosition,
    pageTitle: copy.page.title,
    dialogs,
    protectedDialogs: {
      users: copy.actionLabels.members,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actionLabels.add, allowed: canCreatePosition },
      edit: { label: copy.actionLabels.edit, allowed: canUpdatePosition },
      delete: { label: copy.actionLabels.delete, allowed: canDeletePosition },
      import: { label: copy.actionLabels.import, allowed: canCreatePosition },
      export: { label: copy.actionLabels.export, allowed: canExportPosition },
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: copy.page.title,
    guards: {
      update: { label: copy.actionLabels.batchUpdate, allowed: canUpdatePosition },
      delete: { label: copy.actionLabels.batchDelete, allowed: canDeletePosition },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchPositionStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdatePosition, enabled ? copy.actionLabels.batchEnable : copy.actionLabels.batchDisable)) return;
    const targetItems = enabled ? positionsToEnable : positionsToDisable;
    if (targetItems.length === 0) {
      return;
    }

    openPositionBatchConfirm(enabled ? 'enable' : 'disable', targetItems, async () => {
      try {
        await api.batchUpdatePositionStatus(
          targetItems.map((position) => String(position.id)),
          enabled ? 'active' : 'inactive',
        );
        setSelectedPositions([]);
        if (isCurrentUserInPositionScope(targetItems.map((position) => String(position.id)))) {
          await refreshCurrentUser();
        }
        await reloadPositions();
      } catch {
        toast.error(positionMessages.batchStatusUpdateFailed);
        throw new Error('position batch status update failed');
      }
    });
  };

  const pageDescription = zh
    ? '统一管理岗位结构、成员归属和状态切换，保持岗位体系与权限链路一致。'
    : 'Manage position structure, member assignments, and status changes with a consistent permission-aware workflow.';
  const positionReviewStats = useMemo(() => {
    const active = filteredPositions.filter((position) => position.status === 'active').length;
    const inactive = filteredPositions.filter((position) => position.status !== 'active').length;
    const highLevel = filteredPositions.filter((position) => Number(position.level ?? 0) >= 3).length;
    const assignedUsers = filteredPositions.reduce(
      (total, position) => total + getPositionAffectedUserCount(String(position.id)),
      0,
    );

    return {
      total: filteredPositions.length,
      active,
      inactive,
      highLevel,
      assignedUsers,
    };
  }, [filteredPositions, getPositionAffectedUserCount]);
  const selectedAffectedUsers = useMemo(() => {
    return selectedPositions.reduce((total, position) => total + getPositionAffectedUserCount(String(position.id)), 0);
  }, [getPositionAffectedUserCount, selectedPositions]);
  const positionFocusSummary = useMemo(() => {
    if (selectedPositions.length > 0) {
      return {
        badge: zh ? '批量操作中' : 'Batch In Progress',
        badgeVariant: 'warning' as const,
        title: zh ? '当前已进入批量岗位处理阶段' : 'A batch position workflow is active',
        description:
          zh
            ? `已选中 ${selectedPositions.length} 个岗位，可继续启停、删除或导出，但建议先复核受影响成员范围。`
            : `${selectedPositions.length} positions are selected. Continue with enable, disable, delete, or export after reviewing the affected users.`,
        nextAction:
          zh ? '先确认受影响成员，再执行批量状态变更或删除。' : 'Review impacted users before running batch status changes or deletion.',
      };
    }
    if (positionReviewStats.inactive > 0) {
      return {
        badge: zh ? '停用复核' : 'Inactive Review',
        badgeVariant: 'mono' as const,
        title: zh ? '当前结果中存在停用岗位需要复核' : 'Inactive positions need follow-up',
        description:
          zh
            ? `当前范围内有 ${positionReviewStats.inactive} 个停用岗位，建议优先检查岗位归属部门与成员承接情况。`
            : `${positionReviewStats.inactive} inactive positions are in scope. Review their owning departments and member coverage first.`,
        nextAction:
          zh ? '优先查看停用岗位详情，确认是否恢复启用。' : 'Review inactive position details before re-enabling them.',
      };
    }
    if (filters.level !== 'all' || filters.departmentId !== 'all' || filters.status !== 'all' || searchQuery.trim()) {
      return {
        badge: zh ? '筛选结果' : 'Filtered Result',
        badgeVariant: 'info' as const,
        title: zh ? '当前处于岗位聚焦筛选模式' : 'You are reviewing a narrowed position scope',
        description:
          zh
            ? `当前范围已缩小到 ${positionReviewStats.total} 个岗位，适合继续检查级别、成员分配和部门归属。`
            : `The current scope is narrowed to ${positionReviewStats.total} positions, which is ideal for reviewing level, assignment, and department ownership.`,
        nextAction:
          zh ? '按筛选结果逐项查看岗位详情或清空条件回到全量视图。' : 'Continue with targeted review, or clear filters to return to the full roster.',
      };
    }

    return {
      badge: zh ? '运行稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前岗位台账整体稳定' : 'The position roster is stable overall',
      description:
        zh
          ? '当前结果以内主要为启用岗位，建议按部门与级别做常规巡检。'
          : 'Most positions in scope are active. Continue with routine checks by department and level.',
      nextAction:
        zh ? '优先抽查高等级岗位和关键部门岗位。' : 'Spot-check higher-level positions and key departments next.',
    };
  }, [filters.departmentId, filters.level, filters.status, positionReviewStats, searchQuery, selectedPositions.length, zh]);

  return (
    <div className="space-y-6">
      {!canQueryPosition ? (
        <QueryAccessBoundary
          viewId="system-positions"
          title={copy.page.title}
          queryPermission={systemPermissions.position.query}
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
                <Badge variant="mono">{copy.entity.en}</Badge>
                <Badge variant="info">{zh ? `岗位总数 ${positions.length}` : `${positions.length} positions`}</Badge>
                {selectedPositions.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedPositions.length} 项` : `${selectedPositions.length} selected`}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <>
          {selectedPositions.length > 0 && (
            <>
              {canUpdatePosition && positionsToEnable.length > 0 ? (
                <Button variant="success" size="pill" onClick={() => handleBatchPositionStatus(true)} className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5">
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(positionsToEnable.length)}
                </Button>
              ) : null}
              {canUpdatePosition && positionsToDisable.length > 0 ? (
                <Button variant="warning" size="pill" onClick={() => handleBatchPositionStatus(false)} className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5">
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(positionsToDisable.length)}
                </Button>
              ) : null}
              {canDeletePosition ? (
                <Button
                  variant="ghost-danger"
                  size="pill"
                  onClick={handleBatchDelete} 
                  className="h-11 gap-2 rounded-full border border-destructive/20 px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedPositions.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreatePosition ? (
            <Button variant="mono" size="pill" onClick={() => setDialogOpen('import', true)} className="h-11 gap-2 rounded-full px-4">
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportPosition ? (
            <Button variant="mono" size="pill" onClick={() => setDialogOpen('export', true)} className="h-11 gap-2 rounded-full px-4">
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreatePosition ? (
            <Button onClick={openAddDialog} size="pill" className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all active:scale-95 hover:-translate-y-0.5">
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
                  description={zh ? '根据当前岗位状态，建议优先处理这些动作。' : 'Based on the current position state, handle these actions first.'}
                >
                  <DetailKeyValueItem
                    label="01"
                    value={
                      selectedPositions.length > 0
                        ? (zh ? '先复核受影响成员范围' : 'Review affected users first')
                        : positionReviewStats.inactive > 0
                          ? (zh ? '先处理停用岗位' : 'Review inactive positions first')
                          : (zh ? '先检查高等级岗位' : 'Review senior-level positions first')
                    }
                  />
                  <DetailKeyValueItem
                    label="02"
                    value={zh ? '再检查岗位级别、部门归属与成员分配' : 'Then inspect level, department ownership, and assignments'}
                  />
                  <DetailKeyValueItem
                    label="03"
                    value={selectedPositions.length === 0 && canCreatePosition ? (zh ? '最后新增或调整岗位' : 'Finally add or adjust positions') : (zh ? '最后恢复常规巡检' : 'Finally return to routine inspection')}
                    className="md:col-span-2"
                  />
                </DetailKeyValueSection>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={positionFocusSummary.badgeVariant}>{positionFocusSummary.badge}</Badge>
                    <Badge variant="mono">
                      {zh ? `当前范围 ${positionReviewStats.total} 个岗位` : `${positionReviewStats.total} positions in scope`}
                    </Badge>
                    {selectedPositions.length > 0 ? (
                      <Badge variant="warning">
                        {zh ? `已选 ${selectedPositions.length} 个` : `${selectedPositions.length} selected`}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{positionFocusSummary.title}</div>
                  <div className="text-xs leading-5 text-slate-600">{positionFocusSummary.description}</div>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '启用中' : 'Active'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{positionReviewStats.active}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前可正常分配成员。' : 'Currently available for assignment.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '停用中' : 'Inactive'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{positionReviewStats.inactive}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '建议优先复核成员影响。' : 'Review member impact first.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '高等级岗位' : 'Senior Levels'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{positionReviewStats.highLevel}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前范围内 Level 3+ 岗位。' : 'Level 3+ positions in scope.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '关联成员' : 'Assigned Users'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{positionReviewStats.assignedUsers}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前结果中的岗位成员总数。' : 'Total assigned users in the current scope.'}</div>
                  </div>
                </div>
              </div>

              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '岗位焦点' : 'Position Focus'}
                description={zh ? '结合当前筛选与选择状态，快速判断岗位管理下一步。' : 'Use the current filters and selection state to decide the next position action.'}
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Current Outcome'}
                  value={positionFocusSummary.title}
                  hint={positionFocusSummary.description}
                  className="md:col-span-2"
                />
                <DetailKeyValueItem
                  label={zh ? '筛选状态' : 'Filter State'}
                  value={filters.status === 'all' ? copy.search.statusAll : filters.status === 'active' ? copy.search.statusActive : copy.search.statusInactive}
                  hint={
                    searchQuery.trim()
                      ? `${zh ? '关键词' : 'Keyword'}: ${searchQuery.trim()}`
                      : zh ? '未设置关键词筛选' : 'No keyword filter applied'
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '下一步动作' : 'Next Action'}
                  value={positionFocusSummary.nextAction}
                />
                <DetailKeyValueItem
                  label={zh ? '批量影响' : 'Batch Impact'}
                  value={
                    selectedPositions.length > 0
                      ? (zh
                        ? `待启用 ${positionsToEnable.length} / 待禁用 ${positionsToDisable.length}`
                        : `${positionsToEnable.length} to enable / ${positionsToDisable.length} to disable`)
                      : (zh ? '当前未选择岗位' : 'No positions selected')
                  }
                  hint={
                    selectedPositions.length > 0
                      ? (zh ? `预计影响 ${selectedAffectedUsers} 名成员` : `${selectedAffectedUsers} users may be affected`)
                      : (zh ? '可先筛选部门或级别后再批量处理。' : 'Filter by department or level before preparing a batch action.')
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '推荐操作' : 'Recommended Actions'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {(searchQuery.trim() || filters.departmentId !== 'all' || filters.level !== 'all' || filters.status !== 'all') ? (
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={() => {
                            setSearchQuery('');
                            setFilters({
                              departmentId: 'all',
                              level: 'all',
                              status: 'all',
                            });
                          }}
                        >
                          {zh ? '清空筛选条件' : 'Clear Filters'}
                        </Button>
                      ) : null}
                      {selectedPositions.length > 0 && canExportPosition ? (
                        <Button type="button" variant="mono" size="pill" onClick={() => setDialogOpen('export', true)}>
                          {zh ? '导出当前选择' : 'Export Selection'}
                        </Button>
                      ) : null}
                      {selectedPositions.length === 0 && canCreatePosition ? (
                        <Button type="button" variant="mono" size="pill" onClick={openAddDialog}>
                          {zh ? '新增岗位' : 'Create Position'}
                        </Button>
                      ) : null}
                    </div>
                  }
                />
              </DetailKeyValueSection>
            </div>
          </ManagementContentCard>

          <PositionSearchForm
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
            departments={departments}
          />

          <ManagementContentCard>
            <PositionTable
              data={paginatedData}
              selectedItems={selectedPositions}
              onSelectionChange={setSelectedPositions}
              onAction={handleAction}
              onStatusChange={async (pos, enabled) => {
                openPositionStatusConfirm(pos, enabled, async () => {
                  try {
                    await api.updatePosition(String(pos.id), { status: enabled ? 'active' : 'inactive' });
                    await reloadPositions();
                  } catch {
                    toast.error(positionMessages.statusUpdateFailed);
                    throw new Error('position status update failed');
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

          <PositionDialogManager
            dialogs={dialogs}
            setDialogOpen={setDialogOpen}
            selectedPosition={selectedPosition}
            formData={formData}
            setFormData={setFormData}
            departments={departments}
            allUsers={users}
            handlers={handlers}
            deleteDescription={
              selectedPosition
                ? buildPositionDeleteDescription(
                    selectedPosition.name,
                    getPositionAffectedUserCount(String(selectedPosition.id)),
                  )
                : ''
            }
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



















