import { useState } from 'react';
import { usePositions } from '../../hooks/usePositions';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { Position } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Trash2, Download, Plus, Upload, Power, PowerOff } from 'lucide-react';
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

// 导入拆分后的组件和 Hook
import { PositionTable } from './components/PositionTable';
import { PositionSearchForm } from './components/PositionSearchForm';
import { PositionDialogManager } from './components/PositionDialogManager';
import { usePositionTable } from './hooks/usePositionTable';
import { getPositionManagementCopy } from './positionManagementCopy';

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
        toast.success(copy.messages.assignSuccess(selectedPosition.name, ids.length));
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
        await reloadPositions();
      } catch {
        toast.error(positionMessages.batchStatusUpdateFailed);
        throw new Error('position batch status update failed');
      }
    });
  };

  return (
    <PageLayout
      title={copy.page.title}
      actions={canQueryPosition ? (
        <ManagementActionBar>
          {selectedPositions.length > 0 && (
            <>
              {canUpdatePosition && positionsToEnable.length > 0 ? (
                <Button variant="outline" onClick={() => handleBatchPositionStatus(true)} className="h-11 gap-2 rounded-2xl border-emerald-200/80 bg-emerald-50/80 px-4 text-emerald-700 shadow-sm shadow-emerald-100/60 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50">
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(positionsToEnable.length)}
                </Button>
              ) : null}
              {canUpdatePosition && positionsToDisable.length > 0 ? (
                <Button variant="outline" onClick={() => handleBatchPositionStatus(false)} className="h-11 gap-2 rounded-2xl border-amber-200/80 bg-amber-50/80 px-4 text-amber-700 shadow-sm shadow-amber-100/60 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50">
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(positionsToDisable.length)}
                </Button>
              ) : null}
              {canDeletePosition ? (
                <Button 
                  variant="outline" 
                  onClick={handleBatchDelete} 
                  className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/60 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedPositions.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreatePosition ? (
            <Button variant="outline" onClick={() => setDialogOpen('import', true)} className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportPosition ? (
            <Button variant="outline" onClick={() => setDialogOpen('export', true)} className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreatePosition ? (
            <Button onClick={openAddDialog} className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]">
              <Plus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
        </ManagementActionBar>
      ) : undefined}
    >
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
      {/* 1. 高级搜索区 */}
      <PositionSearchForm
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        departments={departments}
      />

      {/* 2. 数据列表展示区 */}
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





