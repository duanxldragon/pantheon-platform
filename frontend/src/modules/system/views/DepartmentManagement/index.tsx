import { useState, useMemo } from 'react';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { Department } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { api } from '../../api';
import { Button } from '../../../../components/ui/button';
import { Plus, Upload, Download, Search, ChevronRight, ChevronDown, Trash2, Power, PowerOff } from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Input } from '../../../../components/ui/input';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { ManagementActionBar, ManagementContentCard } from '../../../../shared/components/ui';
import { useCSVImportExport } from '../../../../shared/hooks/useCSVImportExport';
import { csvTemplates } from '../../../../shared/utils/csvTemplates';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import type { ExportOptions } from '../../../../shared/components/ui/DataImportExportDialog';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

// 导入重构后的子组件和 Hook
import { DepartmentTreeTable } from './components/DepartmentTreeTable';
import { DepartmentDialogManager } from './components/DepartmentDialogManager';
import { useDepartmentTree, DepartmentNode } from './hooks/useDepartmentTree';
import { getDepartmentManagementCopy } from './departmentManagementCopy';

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

export function DepartmentManagement() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getDepartmentManagementCopy(language);
  const departmentMessages = createEntityFeedback(zh, copy.entity);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryDepartment = hasPermission(systemPermissions.department.query);
  
  // 1. 数据加载
  const { departments, reload: reloadDepartments } = useDepartments({ enabled: canQueryDepartment });
  const { users, reload: reloadUsers } = useUsers({ enabled: canQueryDepartment });

  // 2. 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentNode[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmState>(initialStatusConfirmState);
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    delete: false,
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

  const closeStatusConfirm = () => {
    setStatusConfirm(initialStatusConfirmState);
  };

  const resetDepartmentForm = (nextFormData: Partial<Department> = {}) => {
    setSelectedDepartment(null);
    setFormData(nextFormData);
  };

  const openAddDialog = () => {
    resetDepartmentForm();
    setDialogOpen('add', true);
  };

  // 3. 搜索过滤逻辑
  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    return departments.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.leader && d.leader.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [departments, searchQuery]);

  const getDepartmentAffectedUserCount = (departmentId: string) => {
    const affectedDepartmentIds = collectDepartmentScopeIds([departmentId]);
    return users.filter((user) => affectedDepartmentIds.has(String(user.departmentId ?? ''))).length;
  };

  const collectDepartmentScopeIds = (departmentIds: string[]) => {
    const visited = new Set<string>();
    const queue = [...departmentIds];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      departments.forEach((department) => {
        if (String(department.parentId ?? '') === currentId) {
          queue.push(String(department.id));
        }
      });
    }

    return visited;
  };

  const getDepartmentBatchDeleteImpact = (departmentIds: string[]) => {
    const uniqueSelectedIds = Array.from(new Set(departmentIds));
    const affectedDepartmentIds = collectDepartmentScopeIds(uniqueSelectedIds);
    const directChildrenCount = departments.filter((department) => uniqueSelectedIds.includes(String(department.parentId ?? ''))).length;
    const affectedUsers = users.filter((user) => affectedDepartmentIds.has(String(user.departmentId ?? ''))).length;

    return {
      selectedCount: uniqueSelectedIds.length,
      descendantCount: Math.max(affectedDepartmentIds.size - uniqueSelectedIds.length, 0),
      directChildrenCount,
      affectedUsers,
    };
  };

  const buildDepartmentStatusMessages = (departmentName: string, enabled: boolean, affectedUsers: number) => {
    return {
      title: copy.messages.statusTitle(enabled),
      description: copy.messages.statusDescription(departmentName, enabled, affectedUsers),
      confirmText: copy.messages.statusConfirmText(enabled),
      success: copy.messages.statusSuccess(departmentName, enabled, affectedUsers),
    };
  };

  const openDepartmentStatusConfirm = (
    department: Pick<Department, 'id' | 'name'>,
    enabled: boolean,
    action: () => Promise<void>,
  ) => {
    const affectedUsers = getDepartmentAffectedUserCount(String(department.id));
    const copy = buildDepartmentStatusMessages(department.name, enabled, affectedUsers);

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

  const getDepartmentDeleteBlockers = (departmentId: string) => {
    const childCount = departments.filter((department) => String(department.parentId ?? '') === departmentId).length;
    const directUserCount = users.filter((user) => String(user.departmentId ?? '') === departmentId).length;

    return {
      childCount,
      directUserCount,
      blocked: childCount > 0 || directUserCount > 0,
    };
  };

  const buildDepartmentDeleteDescription = (departmentName: string) =>
    copy.messages.deleteDescription(departmentName);

  const buildDepartmentDeleteBlockedMessage = (
    items: Array<{ name: string; childCount: number; directUserCount: number }>,
    isBatch = false,
  ) => {
    const details = items
      .slice(0, 3)
      .map((item) => {
        const parts: string[] = [];
        if (item.childCount > 0) {
          parts.push(copy.messages.directChildrenLabel(item.childCount));
        }
        if (item.directUserCount > 0) {
          parts.push(copy.messages.directMembersLabel(item.directUserCount));
        }
        return copy.messages.deleteBlockedItem(item.name, parts.join(copy.messages.namesSeparator));
      })
      .join(copy.messages.detailSeparator);

    return copy.messages.deleteBlockedSummary(details, isBatch, items.length > 3);
  };

  const openDepartmentBatchConfirm = (
    mode: 'enable' | 'disable' | 'delete',
    items: Pick<DepartmentNode, 'id' | 'name'>[],
    action: () => Promise<void>,
  ) => {
    const ids = items.map((item) => String(item.id));
    const namesPreview = items
      .slice(0, 3)
      .map((item) => item.name)
      .join(copy.messages.namesSeparator);

    if (mode === 'delete') {
      const impact = getDepartmentBatchDeleteImpact(ids);
      const preview = namesPreview
        ? `${namesPreview}${items.length > 3 ? copy.messages.moreSuffix : ''}`
        : '';

      setStatusConfirm({
        open: true,
        title: copy.messages.batchDeleteTitle,
        description: copy.messages.batchDeleteDescription(
          impact.selectedCount,
          impact.descendantCount,
          impact.affectedUsers,
        ),
        confirmText: copy.actionLabels.delete,
        variant: 'danger',
        guard: 'delete',
        action: async () => {
          await action();
          toast.success(copy.messages.batchDeleteSuccess(impact.selectedCount, preview));
        },
      });
      return;
    }

    const affectedDepartmentIds = collectDepartmentScopeIds(ids);
    const affectedUsers = users.filter((user) => affectedDepartmentIds.has(String(user.departmentId ?? ''))).length;
    const enableAction = mode === 'enable';

    setStatusConfirm({
      open: true,
      title: copy.messages.batchStatusTitle(enableAction),
      description: copy.messages.batchStatusDescription(items.length, enableAction, affectedUsers),
      confirmText: copy.messages.batchStatusConfirmText(enableAction),
      variant: enableAction ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        toast.success(copy.messages.batchStatusSuccess(items.length, enableAction, affectedUsers));
      },
    });
  };

  // 4. 树形逻辑 Hook
  const {
    flattenedDisplayData,
    expandedKeys,
    toggleExpand,
    expandAll,
    collapseAll
  } = useDepartmentTree(filteredDepartments);

  // 5. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.department,
    onDataImported: () => {
      toast.success(departmentMessages.importSuccess);
    },
    requiredFields: ['departmentName', 'departmentCode'],
  });

  // 6. 事件处理
  const handleAction = (action: string, dept: DepartmentNode) => {
    switch (action) {
      case 'add-sub':
        resetDepartmentForm({ parentId: dept.id });
        setDialogOpen('add', true);
        break;
      case 'edit':
        setSelectedDepartment(dept);
        setFormData(dept);
        setDialogOpen('edit', true);
        break;
      case 'delete':
        {
          const blockers = getDepartmentDeleteBlockers(String(dept.id));
          if (blockers.blocked) {
            toast.error(
              buildDepartmentDeleteBlockedMessage([
                { name: dept.name, childCount: blockers.childCount, directUserCount: blockers.directUserCount },
              ]),
            );
            return;
          }
        }
        setSelectedDepartment(dept);
        setDialogOpen('delete', true);
        break;
      case 'members':
        setSelectedDepartment(dept);
        setDialogOpen('members', true);
        break;
    }
  };

  const normalizeDepartmentFormData = (data: Partial<Department>) => ({
    ...data,
    name: data.name?.trim(),
    code: data.code?.trim(),
    leader: data.leader?.trim(),
    phone: data.phone?.trim(),
    email: data.email?.trim(),
    description: data.description?.trim(),
  });

  const validateDepartmentFormData = (data: Partial<Department>, currentDepartment?: Department | null) => {
    const normalized = normalizeDepartmentFormData(data);
    const parentId = normalized.parentId != null ? String(normalized.parentId) : '';
    const currentId = currentDepartment ? String(currentDepartment.id) : '';

    if (!normalized.name) {
      return copy.validation.nameRequired;
    }
    if (!normalized.code) {
      return copy.validation.codeRequired;
    }
    if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      return copy.validation.emailInvalid;
    }

    if (!parentId) {
      if (normalized.leaderId != null) {
        const leaderUser = users.find((user) => String(user.id) === String(normalized.leaderId));
        if (!leaderUser) {
          return copy.validation.leaderMissing;
        }
      }
      return null;
    }

    const parentDepartment = departments.find((department) => String(department.id) === parentId);
    if (!parentDepartment) {
      return copy.validation.parentMissing;
    }
    if (parentDepartment.status !== 'active') {
      return copy.validation.parentInactive;
    }
    if (currentId && currentId === parentId) {
      return copy.validation.parentSelf;
    }
    if (currentId) {
      const currentScopeIds = collectDepartmentScopeIds([currentId]);
      if (currentScopeIds.has(parentId)) {
        return copy.validation.parentDescendant;
      }
    }

    if (normalized.leaderId != null) {
      const leaderUser = users.find((user) => String(user.id) === String(normalized.leaderId));
      if (!leaderUser) {
        return copy.validation.leaderMissing;
      }
    }

    return null;
  };

  const handlers = {
    onSubmit: async () => {
      if (!ensureActionPermission(dialogs.add ? canCreateDepartment : canUpdateDepartment, dialogs.add ? copy.actionLabels.add : copy.actionLabels.edit)) return;
      try {
        const normalizedFormData = normalizeDepartmentFormData(formData);
        const validationMessage = validateDepartmentFormData(normalizedFormData, selectedDepartment);
        if (validationMessage) {
          toast.error(validationMessage);
          return;
        }

        const nextStatus = normalizedFormData.status;
        if (selectedDepartment && nextStatus && nextStatus !== selectedDepartment.status) {
          openDepartmentStatusConfirm(selectedDepartment, nextStatus === 'active', async () => {
            await api.updateDepartment(String(selectedDepartment.id), normalizedFormData);
            setDialogOpen('edit', false);
            resetDepartmentForm();
            await reloadDepartments();
          });
          return;
        }

        if (dialogs.add) {
          await api.createDepartment(normalizedFormData);
        } else if (selectedDepartment) {
          await api.updateDepartment(String(selectedDepartment.id), normalizedFormData);
        }
        toast.success(dialogs.add ? departmentMessages.createSuccess : departmentMessages.updateSuccess);
        setDialogOpen(dialogs.add ? 'add' : 'edit', false);
        resetDepartmentForm();
        await reloadDepartments();
      } catch {
        toast.error(departmentMessages.saveFailed);
      }
    },
    onDelete: async () => {
      if (!selectedDepartment) return;
      if (!ensureActionPermission(canDeleteDepartment, copy.actionLabels.delete)) return;
      try {
        await api.deleteDepartment(String(selectedDepartment.id));
        toast.success(departmentMessages.deleteSuccess);
        setDialogOpen('delete', false);
        resetDepartmentForm();
        await reloadDepartments();
      } catch {
        toast.error(departmentMessages.deleteFailed);
      }
    },
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreateDepartment, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: ExportOptions) => {
      if (!ensureActionPermission(canExportDepartment, copy.actionLabels.export)) return;
      const dataToExport = options.scope === 'selected' && selectedDepartments.length > 0
        ? selectedDepartments
        : departments;
      await csvHandler.handleExport(dataToExport);
      setDialogOpen('export', false);
    },
    onAddMembers: async (userIds: string[]) => {
      if (!selectedDepartment) {
        return;
      }
      try {
        await Promise.all(userIds.map((id) => api.updateUser(id, { departmentId: selectedDepartment.id })));
        toast.success(copy.messages.addMembersSuccess(selectedDepartment.name, userIds.length));
        await Promise.all([reloadUsers(), reloadDepartments()]);
      } catch {
        toast.error(departmentMessages.addMembersFailed);
      }
    },
    onRemoveMember: async (userId: string) => {
      if (!selectedDepartment) {
        return;
      }
      try {
        await api.updateUser(userId, { departmentId: null });
        toast.success(copy.messages.removeMemberSuccess(selectedDepartment.name));
        await Promise.all([reloadUsers(), reloadDepartments()]);
      } catch {
        toast.error(departmentMessages.removeMemberFailed);
      }
    },
  };

  const selectedDepartmentIds = Array.from(new Set(selectedDepartments.map((department) => String(department.id))));
  const departmentsToEnable = selectedDepartments.filter((department) => department.status !== 'active');
  const departmentsToDisable = selectedDepartments.filter((department) => department.status !== 'inactive');
  const canCreateDepartment = hasPermission(systemPermissions.department.create);
  const canUpdateDepartment = hasPermission(systemPermissions.department.update);
  const canDeleteDepartment = hasPermission(systemPermissions.department.delete);
  const canExportDepartment = hasPermission(systemPermissions.department.export);
  const { lossDescription: queryLossDescription } = useQueryPermissionDialogGuard({
    canQuery: canQueryDepartment,
    pageTitle: copy.page.title,
    dialogs,
    protectedDialogs: {
      members: copy.actionLabels.memberAssign,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actionLabels.add, allowed: canCreateDepartment },
      edit: { label: copy.actionLabels.edit, allowed: canUpdateDepartment },
      delete: { label: copy.actionLabels.delete, allowed: canDeleteDepartment },
      import: { label: copy.actionLabels.import, allowed: canCreateDepartment },
      export: { label: copy.actionLabels.export, allowed: canExportDepartment },
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: copy.page.title,
    guards: {
      update: { label: copy.actionLabels.batchStatusUpdate, allowed: canUpdateDepartment },
      delete: { label: copy.actionLabels.batchDelete, allowed: canDeleteDepartment },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchDepartmentStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdateDepartment, enabled ? copy.actionLabels.batchEnable : copy.actionLabels.batchDisable)) return;
    const targetItems = enabled ? departmentsToEnable : departmentsToDisable;
    if (targetItems.length === 0) {
      return;
    }

    openDepartmentBatchConfirm(enabled ? 'enable' : 'disable', targetItems, async () => {
      try {
        await api.batchUpdateDepartmentStatus(
          targetItems.map((department) => String(department.id)),
          enabled ? 'active' : 'inactive',
        );
        setSelectedDepartments([]);
        await reloadDepartments();
      } catch {
        toast.error(departmentMessages.batchStatusUpdateFailed);
        throw new Error('department batch status update failed');
      }
    });
  };

  const handleBatchDepartmentDelete = () => {
    if (!ensureActionPermission(canDeleteDepartment, copy.actionLabels.batchDelete)) return;
    if (selectedDepartmentIds.length === 0) {
      return;
    }

    const blockedDepartments = selectedDepartments
      .map((department) => {
        const blockers = getDepartmentDeleteBlockers(String(department.id));
        return {
          name: department.name,
          childCount: blockers.childCount,
          directUserCount: blockers.directUserCount,
          blocked: blockers.blocked,
        };
      })
      .filter((item) => item.blocked);

    if (blockedDepartments.length > 0) {
      toast.error(buildDepartmentDeleteBlockedMessage(blockedDepartments, true));
      return;
    }

    openDepartmentBatchConfirm('delete', selectedDepartments, async () => {
      try {
        await api.batchDeleteDepartments(selectedDepartmentIds);
        setSelectedDepartments([]);
        await reloadDepartments();
      } catch {
        toast.error(departmentMessages.batchDeleteFailed);
        throw new Error('department batch delete failed');
      }
    });
  };

  return (
    <PageLayout
      title={copy.page.title}
      actions={canQueryDepartment ? (
        <ManagementActionBar>
          {selectedDepartments.length > 0 && (
            <>
              {canUpdateDepartment && departmentsToEnable.length > 0 ? (
                <Button variant="outline" onClick={() => handleBatchDepartmentStatus(true)} className="h-11 gap-2 rounded-2xl border-emerald-200/80 bg-emerald-50/80 px-4 text-emerald-700 shadow-sm shadow-emerald-100/60 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50">
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(departmentsToEnable.length)}
                </Button>
              ) : null}
              {canUpdateDepartment && departmentsToDisable.length > 0 ? (
                <Button variant="outline" onClick={() => handleBatchDepartmentStatus(false)} className="h-11 gap-2 rounded-2xl border-amber-200/80 bg-amber-50/80 px-4 text-amber-700 shadow-sm shadow-amber-100/60 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50">
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(departmentsToDisable.length)}
                </Button>
              ) : null}
              {canDeleteDepartment ? (
                <Button variant="outline" onClick={handleBatchDepartmentDelete} className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/60 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedDepartments.length)}
                </Button>
              ) : null}
            </>
          )}
          <div className="relative mr-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={copy.page.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-64 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={expandAll}
            className="h-11 w-11 rounded-2xl border-slate-200/80 bg-white/90 text-slate-500 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
            title={copy.titles.expandAll}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={collapseAll}
            className="mr-1 h-11 w-11 rounded-2xl border-slate-200/80 bg-white/90 text-slate-500 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
            title={copy.titles.collapseAll}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {canCreateDepartment ? (
            <Button variant="outline" onClick={() => setDialogOpen('import', true)} className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportDepartment ? (
            <Button variant="outline" onClick={() => setDialogOpen('export', true)} className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateDepartment ? (
            <Button onClick={openAddDialog} className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]">
              <Plus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
        </ManagementActionBar>
      ) : undefined}
    >
      {!canQueryDepartment ? (
        <QueryAccessBoundary
          viewId="system-departments"
          title={copy.page.title}
          queryPermission={systemPermissions.department.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
      <ManagementContentCard className="p-0">
        <DepartmentTreeTable
          data={flattenedDisplayData}
          expandedKeys={expandedKeys}
          onToggleExpand={toggleExpand}
          onAction={handleAction}
          onStatusChange={async (dept, enabled) => {
            openDepartmentStatusConfirm(dept, enabled, async () => {
              try {
                await api.updateDepartment(String(dept.id), { status: enabled ? 'active' : 'inactive' });
                await reloadDepartments();
              } catch {
                toast.error(departmentMessages.statusUpdateFailed);
                throw new Error('department status update failed');
              }
            });
          }}
          selectedItems={selectedDepartments}
          onSelectionChange={setSelectedDepartments}
        />
      </ManagementContentCard>

      <DepartmentDialogManager
        dialogs={dialogs}
        setDialogOpen={setDialogOpen}
        selectedDepartment={selectedDepartment}
        formData={formData}
        setFormData={setFormData}
        departments={departments}
        users={users}
        handlers={handlers}
        deleteDescription={selectedDepartment ? buildDepartmentDeleteDescription(selectedDepartment.name) : ''}
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





