import { useState } from 'react';
import { usePositions } from '../../hooks/usePositions';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { Position } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Trash2, Download, Plus, Upload, Power, PowerOff } from 'lucide-react';
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

// 导入拆分后的组件和 Hook
import { PositionTable } from './components/PositionTable';
import { PositionSearchForm } from './components/PositionSearchForm';
import { PositionDialogManager } from './components/PositionDialogManager';
import { usePositionTable } from './hooks/usePositionTable';

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
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const positionMessages = createEntityFeedback(zh, { zh: '岗位', en: 'Position', enPlural: 'positions' });
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryPosition = hasPermission(systemPermissions.position.query);
  
  // 1. 数据加载
  const { positions, reload: reloadPositions } = usePositions({ enabled: canQueryPosition });
  const { users, reload: reloadUsers } = useUsers({ enabled: canQueryPosition });
  const { departments } = useDepartments({ enabled: canQueryPosition });

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

  const getPositionAffectedUserCount = (positionId: string) =>
    users.filter((user) => String(user.positionId ?? '') === positionId).length;

  const buildPositionStatusMessages = (positionName: string, enabled: boolean, affectedUsers: number) => {
    if (zh) {
      return {
        title: enabled ? '确认启用岗位' : '确认禁用岗位',
        description:
          affectedUsers > 0
            ? `岗位「${positionName}」状态变更后，将影响 ${affectedUsers} 名用户，并触发权限刷新。请确认后继续。`
            : `岗位「${positionName}」状态变更后，不会影响现有成员权限，但会立即生效。请确认后继续。`,
        confirmText: enabled ? '确认启用' : '确认禁用',
        success:
          affectedUsers > 0
            ? `已将岗位「${positionName}」${enabled ? '启用' : '禁用'}，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
            : `已将岗位「${positionName}」${enabled ? '启用' : '禁用'}`,
      };
    }

    return {
      title: enabled ? 'Confirm enable position' : 'Confirm disable position',
      description:
        affectedUsers > 0
          ? `Changing the status of position "${positionName}" will affect ${affectedUsers} users and refresh their auth snapshot.`
          : `Changing the status of position "${positionName}" takes effect immediately and does not affect existing users.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success:
        affectedUsers > 0
          ? `Position "${positionName}" has been ${enabled ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and their auth was refreshed.`
          : `Position "${positionName}" has been ${enabled ? 'enabled' : 'disabled'}.`,
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
    const enableAction = mode === 'enable';
    const isDelete = mode === 'delete';

    const title = zh
      ? isDelete
        ? '确认批量删除岗位'
        : `确认批量${enableAction ? '启用' : '禁用'}岗位`
      : isDelete
        ? 'Confirm batch delete positions'
        : `Confirm batch ${enableAction ? 'enable' : 'disable'} positions`;

    const description = zh
      ? isDelete
        ? `将删除 ${items.length} 个岗位，预计影响 ${affectedUsers} 名关联用户，并触发权限刷新。请确认后继续。`
        : `将${enableAction ? '启用' : '禁用'} ${items.length} 个岗位，预计影响 ${affectedUsers} 名用户，并触发权限刷新。请确认后继续。`
      : isDelete
        ? `This will delete ${items.length} positions, affect ${affectedUsers} users, and refresh their auth snapshot.`
        : `This will ${enableAction ? 'enable' : 'disable'} ${items.length} positions, affect ${affectedUsers} users, and refresh their auth snapshot.`;

    const confirmText = zh
      ? isDelete
        ? '确认删除'
        : `确认${enableAction ? '启用' : '禁用'}`
      : isDelete
        ? 'Delete'
        : enableAction
          ? 'Enable'
          : 'Disable';

    const success = zh
      ? isDelete
        ? `已删除 ${items.length} 个岗位，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
        : `已${enableAction ? '启用' : '禁用'} ${items.length} 个岗位，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
      : isDelete
        ? `Deleted ${items.length} positions. ${affectedUsers} users were affected and refreshed.`
        : `${items.length} positions have been ${enableAction ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and refreshed.`;

    setStatusConfirm({
      open: true,
      title,
      description,
      confirmText,
      variant: isDelete ? 'danger' : enableAction ? 'success' : 'warning',
      guard: isDelete ? 'delete' : 'update',
      action: async () => {
        await action();
        toast.success(success);
      },
    });
  };

  const buildPositionDeleteDescription = (positionName: string, affectedUsers: number) => {
    if (zh) {
      return affectedUsers > 0
        ? `确认删除岗位「${positionName}」？删除后将影响 ${affectedUsers} 名用户，并触发权限刷新。该操作不可恢复。`
        : `确认删除岗位「${positionName}」？当前岗位无关联成员，删除后立即生效且不可恢复。`;
    }

    return affectedUsers > 0
      ? `Delete position "${positionName}"? This will affect ${affectedUsers} users and refresh their auth snapshot.`
      : `Delete position "${positionName}"? It currently has no related users. This action cannot be undone.`;
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

  // 4. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.position,
    onDataImported: () => {
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
      return zh ? '请输入岗位名称。' : 'Please enter the position name.';
    }
    if (!normalized.code) {
      return zh ? '请输入岗位编码。' : 'Please enter the position code.';
    }
    if (!departmentId) {
      return zh ? '请选择所属部门。' : 'Please select a department.';
    }

    const department = departments.find((item) => String(item.id) === departmentId);
    if (!department) {
      return zh ? '所选部门不存在，请重新选择。' : 'The selected department does not exist.';
    }
    if (department.status !== 'active') {
      return zh ? '所属部门已被禁用，请先启用部门。' : 'The selected department is inactive.';
    }

    return null;
  };

  const handlers = {
    onSubmit: async () => {
      if (!ensureActionPermission(dialogs.add ? canCreatePosition : canUpdatePosition, dialogs.add ? (zh ? '新增' : 'create') : (zh ? '编辑' : 'edit'))) return;
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
        await reloadPositions();
      } catch {
        toast.error(positionMessages.saveFailed);
      }
    },
    onDelete: async () => {
      if (!selectedPosition) return;
      if (!ensureActionPermission(canDeletePosition, zh ? '删除' : 'delete')) return;
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
      if (!ensureActionPermission(canCreatePosition, zh ? '导入' : 'import')) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: any) => {
      if (!ensureActionPermission(canExportPosition, zh ? '导出' : 'export')) return;
      const dataToExport = options.scope === 'selected' && selectedPositions.length > 0
        ? selectedPositions
        : positions;
      await csvHandler.handleExport(dataToExport);
      setDialogOpen('export', false);
    },
    onAssignUsers: async (ids: string[]) => {
      if (!selectedPosition) {
        return;
      }
      try {
        await Promise.all(ids.map((id) => api.updateUser(id, { positionId: selectedPosition.id })));
        toast.success(
          zh
            ? `已为岗位「${selectedPosition.name}」分配 ${ids.length} 名成员，相关用户权限已刷新`
            : `Assigned ${ids.length} members to position "${selectedPosition.name}". User auth has been refreshed.`,
        );
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
        toast.success(
          zh
            ? `已从岗位「${selectedPosition.name}」移除成员，相关用户权限已刷新`
            : `Removed a member from position "${selectedPosition.name}". User auth has been refreshed.`,
        );
        await Promise.all([reloadUsers(), reloadPositions()]);
      } catch {
        toast.error(positionMessages.removeMemberFailed);
      }
    },
  };

  const handleBatchDelete = async () => {
    if (!ensureActionPermission(canDeletePosition, zh ? '批量删除' : 'batch delete')) return;
    openPositionBatchConfirm('delete', selectedPositions, async () => {
      try {
        await Promise.all(selectedPositions.map(p => api.deletePosition(String(p.id))));
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
    pageTitle: t.menu.systemPositions,
    dialogs,
    protectedDialogs: {
      users: zh ? '成员分配' : 'member assignment',
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t.menu.systemPositions,
    dialogs,
    guardedDialogs: {
      add: { label: zh ? '新增' : 'create', allowed: canCreatePosition },
      edit: { label: zh ? '编辑' : 'edit', allowed: canUpdatePosition },
      delete: { label: zh ? '删除' : 'delete', allowed: canDeletePosition },
      import: { label: zh ? '导入' : 'import', allowed: canCreatePosition },
      export: { label: zh ? '导出' : 'export', allowed: canExportPosition },
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: t.menu.systemPositions,
    guards: {
      update: { label: zh ? '批量状态变更' : 'batch status update', allowed: canUpdatePosition },
      delete: { label: zh ? '批量删除' : 'batch delete', allowed: canDeletePosition },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchPositionStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdatePosition, zh ? `批量${enabled ? '启用' : '禁用'}` : `batch ${enabled ? 'enable' : 'disable'}`)) return;
    const targetItems = enabled ? positionsToEnable : positionsToDisable;
    if (targetItems.length === 0) {
      return;
    }

    openPositionBatchConfirm(enabled ? 'enable' : 'disable', targetItems, async () => {
      try {
        await Promise.all(
          targetItems.map((position) =>
            api.updatePosition(String(position.id), { status: enabled ? 'active' : 'inactive' }),
          ),
        );
        setSelectedPositions([]);
        await reloadPositions();
      } catch {
        toast.error(positionMessages.batchStatusUpdateFailed);
        throw new Error('position batch status update failed');
      }
    });
  };

  return (
    <PageLayout
      title={t.menu.systemPositions}
      actions={canQueryPosition ? (
        <div className="flex items-center gap-2">
          {selectedPositions.length > 0 && (
            <>
              {canUpdatePosition && positionsToEnable.length > 0 ? (
                <Button variant="outline" onClick={() => handleBatchPositionStatus(true)} className="gap-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50">
                  <Power className="w-4 h-4" />
                  {zh ? `批量启用 (${positionsToEnable.length})` : `Enable (${positionsToEnable.length})`}
                </Button>
              ) : null}
              {canUpdatePosition && positionsToDisable.length > 0 ? (
                <Button variant="outline" onClick={() => handleBatchPositionStatus(false)} className="gap-2 border-amber-100 text-amber-700 hover:bg-amber-50">
                  <PowerOff className="w-4 h-4" />
                  {zh ? `批量禁用 (${positionsToDisable.length})` : `Disable (${positionsToDisable.length})`}
                </Button>
              ) : null}
              {canDeletePosition ? (
                <Button 
                  variant="outline" 
                  onClick={handleBatchDelete} 
                  className="gap-2 border-red-100 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.actions.delete} ({selectedPositions.length})
                </Button>
              ) : null}
            </>
          )}
          {canCreatePosition ? (
            <Button variant="outline" onClick={() => setDialogOpen('import', true)} className="gap-2 border-gray-200">
              <Upload className="w-4 h-4" />
              {t.actions.import}
            </Button>
          ) : null}
          {canExportPosition ? (
            <Button variant="outline" onClick={() => setDialogOpen('export', true)} className="gap-2 border-gray-200">
              <Download className="w-4 h-4" />
              {t.actions.export}
            </Button>
          ) : null}
          {canCreatePosition ? (
            <Button onClick={openAddDialog} className="gap-2 shadow-sm bg-primary hover:bg-primary/90 transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              {t.actions.add}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryPosition ? (
        <QueryAccessBoundary
          viewId="system-positions"
          title={t.menu.systemPositions}
          queryPermission={systemPermissions.position.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
      {/* 1. 高级搜索区 */}
      <PositionSearchForm
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        departments={departments}
      />

      {/* 2. 数据列表展示区 */}
      <Card className="border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm">
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
      </Card>

      {/* 3. 对话框统一管理 */}
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
    </PageLayout>
  );
}




