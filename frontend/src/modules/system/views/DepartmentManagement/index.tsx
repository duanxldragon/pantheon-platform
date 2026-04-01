import { useState, useMemo } from 'react';
import { useDepartments } from '../../hooks/useDepartments';
import { useUsers } from '../../hooks/useUsers';
import { Department } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { api } from '../../api';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Plus, Upload, Download, Search, ChevronRight, ChevronDown, Trash2, Power, PowerOff } from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Input } from '../../../../components/ui/input';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { useCSVImportExport } from '../../../../shared/hooks/useCSVImportExport';
import { csvTemplates } from '../../../../shared/utils/csvTemplates';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

// 导入重构后的子组件和 Hook
import { DepartmentTreeTable } from './components/DepartmentTreeTable';
import { DepartmentDialogManager } from './components/DepartmentDialogManager';
import { useDepartmentTree, DepartmentNode } from './hooks/useDepartmentTree';

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
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const departmentMessages = createEntityFeedback(zh, { zh: '部门', en: 'Department', enPlural: 'departments' });
  const copy = zh
    ? {
        actions: {
          add: '新增',
          edit: '编辑',
          delete: '删除',
          import: '导入',
          export: '导出',
          memberAssign: '成员分配',
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
        titles: {
          expandAll: '全部展开',
          collapseAll: '全部收起',
        },
      }
    : {
        actions: {
          add: 'create',
          edit: 'edit',
          delete: 'delete',
          import: 'import',
          export: 'export',
          memberAssign: 'member assignment',
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
        titles: {
          expandAll: 'Expand all',
          collapseAll: 'Collapse all',
        },
      };
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
    if (zh) {
      return {
        title: enabled ? '确认启用部门' : '确认禁用部门',
        description:
          affectedUsers > 0
            ? `部门「${departmentName}」状态变更后，将影响 ${affectedUsers} 名用户，并触发权限刷新。请确认后继续。`
            : `部门「${departmentName}」状态变更后，不会影响现有成员权限，但会立即生效。请确认后继续。`,
        confirmText: enabled ? '确认启用' : '确认禁用',
        success:
          affectedUsers > 0
            ? `已将部门「${departmentName}」${enabled ? '启用' : '禁用'}，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
            : `已将部门「${departmentName}」${enabled ? '启用' : '禁用'}`,
      };
    }

    return {
      title: enabled ? 'Confirm enable department' : 'Confirm disable department',
      description:
        affectedUsers > 0
          ? `Changing the status of department "${departmentName}" will affect ${affectedUsers} users and refresh their auth snapshot.`
          : `Changing the status of department "${departmentName}" takes effect immediately and does not affect existing users.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success:
        affectedUsers > 0
          ? `Department "${departmentName}" has been ${enabled ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and their auth was refreshed.`
          : `Department "${departmentName}" has been ${enabled ? 'enabled' : 'disabled'}.`,
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
    zh
      ? `确认删除部门「${departmentName}」？当前部门无直属下级部门、无直属成员，删除后立即生效且不可恢复。`
      : `Delete department "${departmentName}"? It currently has no direct child departments or direct members. This action takes effect immediately and cannot be undone.`;

  const buildDepartmentDeleteBlockedMessage = (
    items: Array<{ name: string; childCount: number; directUserCount: number }>,
    isBatch = false,
  ) => {
    const details = items
      .slice(0, 3)
      .map((item) => {
        const parts: string[] = [];
        if (item.childCount > 0) {
          parts.push(zh ? `${item.childCount} 个直属下级部门` : `${item.childCount} direct child departments`);
        }
        if (item.directUserCount > 0) {
          parts.push(zh ? `${item.directUserCount} 名直属成员` : `${item.directUserCount} direct members`);
        }
        return `${item.name}（${parts.join('，')}）`;
      })
      .join(zh ? '；' : '; ');

    if (zh) {
      return `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details}${items.length > 3 ? '；其余部门也存在直属下级或直属成员' : ''}`;
    }

    return `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details}${items.length > 3 ? '; other departments also still have child departments or direct members' : ''}`;
  };

  const openDepartmentBatchConfirm = (
    mode: 'enable' | 'disable' | 'delete',
    items: Pick<DepartmentNode, 'id' | 'name'>[],
    action: () => Promise<void>,
  ) => {
    const ids = items.map((item) => String(item.id));
    const namesPreview = items.slice(0, 3).map((item) => item.name).join('、');

    if (mode === 'delete') {
      const impact = getDepartmentBatchDeleteImpact(ids);
      const description = zh
        ? `将删除 ${impact.selectedCount} 个部门，涉及 ${impact.descendantCount} 个下级部门、${impact.affectedUsers} 名关联用户。若所选部门仍有直属下级或直属成员，后端会拒绝删除。`
        : `This will delete ${impact.selectedCount} departments, involving ${impact.descendantCount} child departments and ${impact.affectedUsers} related users. The backend will reject deletion when a selected department still has direct children or direct members.`;
      const success = zh
        ? `已提交删除 ${impact.selectedCount} 个部门${namesPreview ? `（${namesPreview}${items.length > 3 ? ' 等' : ''}）` : ''}`
        : `Deleted ${impact.selectedCount} departments${namesPreview ? ` (${namesPreview}${items.length > 3 ? ' and more' : ''})` : ''}.`;

      setStatusConfirm({
        open: true,
        title: zh ? '确认批量删除部门' : 'Confirm batch delete departments',
        description,
        confirmText: zh ? '确认删除' : 'Delete',
        variant: 'danger',
        guard: 'delete',
        action: async () => {
          await action();
          toast.success(success);
        },
      });
      return;
    }

    const affectedDepartmentIds = collectDepartmentScopeIds(ids);
    const affectedUsers = users.filter((user) => affectedDepartmentIds.has(String(user.departmentId ?? ''))).length;
    const enableAction = mode === 'enable';
    const description = zh
      ? `将${enableAction ? '启用' : '禁用'} ${items.length} 个部门，预计影响 ${affectedUsers} 名用户，并触发权限刷新。`
      : `This will ${enableAction ? 'enable' : 'disable'} ${items.length} departments, affect ${affectedUsers} users, and refresh their auth snapshot.`;
    const success = zh
      ? `已${enableAction ? '启用' : '禁用'} ${items.length} 个部门，影响 ${affectedUsers} 名用户，相关用户权限已刷新`
      : `${items.length} departments have been ${enableAction ? 'enabled' : 'disabled'}. ${affectedUsers} users were affected and refreshed.`;

    setStatusConfirm({
      open: true,
      title: zh ? `确认批量${enableAction ? '启用' : '禁用'}部门` : `Confirm batch ${enableAction ? 'enable' : 'disable'} departments`,
      description,
      confirmText: zh ? `确认${enableAction ? '启用' : '禁用'}` : enableAction ? 'Enable' : 'Disable',
      variant: enableAction ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        toast.success(success);
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
      return zh ? '请输入部门名称。' : 'Please enter the department name.';
    }
    if (!normalized.code) {
      return zh ? '请输入部门编码。' : 'Please enter the department code.';
    }
    if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      return zh ? '请输入正确的邮箱地址。' : 'Please enter a valid email address.';
    }

    if (!parentId) {
      if (normalized.leaderId != null) {
        const leaderUser = users.find((user) => String(user.id) === String(normalized.leaderId));
        if (!leaderUser) {
          return zh ? '所选负责人不存在，请重新选择。' : 'The selected leader does not exist.';
        }
      }
      return null;
    }

    const parentDepartment = departments.find((department) => String(department.id) === parentId);
    if (!parentDepartment) {
      return zh ? '所选上级部门不存在，请重新选择。' : 'The selected parent department does not exist.';
    }
    if (parentDepartment.status !== 'active') {
      return zh ? '上级部门已被禁用，请先启用上级部门。' : 'The selected parent department is inactive.';
    }
    if (currentId && currentId === parentId) {
      return zh ? '上级部门不能选择自己。' : 'The parent department cannot be itself.';
    }
    if (currentId) {
      const currentScopeIds = collectDepartmentScopeIds([currentId]);
      if (currentScopeIds.has(parentId)) {
        return zh ? '上级部门不能选择当前部门或其下级部门。' : 'The parent department cannot be the current department or one of its descendants.';
      }
    }

    if (normalized.leaderId != null) {
      const leaderUser = users.find((user) => String(user.id) === String(normalized.leaderId));
      if (!leaderUser) {
        return zh ? '所选负责人不存在，请重新选择。' : 'The selected leader does not exist.';
      }
    }

    return null;
  };

  const handlers = {
    onSubmit: async () => {
      if (!ensureActionPermission(dialogs.add ? canCreateDepartment : canUpdateDepartment, dialogs.add ? (zh ? '新增' : 'create') : (zh ? '编辑' : 'edit'))) return;
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
      if (!ensureActionPermission(canDeleteDepartment, zh ? '删除' : 'delete')) return;
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
      if (!ensureActionPermission(canCreateDepartment, zh ? '导入' : 'import')) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: any) => {
      if (!ensureActionPermission(canExportDepartment, zh ? '导出' : 'export')) return;
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
        toast.success(
          zh
            ? `已为部门「${selectedDepartment.name}」添加 ${userIds.length} 名成员，相关用户权限已刷新`
            : `Added ${userIds.length} members to department "${selectedDepartment.name}". User auth has been refreshed.`,
        );
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
        toast.success(
          zh
            ? `已从部门「${selectedDepartment.name}」移除成员，相关用户权限已刷新`
            : `Removed a member from department "${selectedDepartment.name}". User auth has been refreshed.`,
        );
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
    pageTitle: t.menu.systemDepartments,
    dialogs,
    protectedDialogs: {
      members: copy.actions.memberAssign,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t.menu.systemDepartments,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actions.add, allowed: canCreateDepartment },
      edit: { label: copy.actions.edit, allowed: canUpdateDepartment },
      delete: { label: copy.actions.delete, allowed: canDeleteDepartment },
      import: { label: copy.actions.import, allowed: canCreateDepartment },
      export: { label: copy.actions.export, allowed: canExportDepartment },
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: t.menu.systemDepartments,
    guards: {
      update: { label: copy.actions.batchStatusUpdate, allowed: canUpdateDepartment },
      delete: { label: copy.actions.batchDelete, allowed: canDeleteDepartment },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchDepartmentStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdateDepartment, enabled ? copy.actions.batchEnable : copy.actions.batchDisable)) return;
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
    if (!ensureActionPermission(canDeleteDepartment, copy.actions.batchDelete)) return;
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
      title={t.menu.systemDepartments}
      actions={canQueryDepartment ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
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
              placeholder={t.topBar.searchPlaceholder}
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
              {t.actions.import}
            </Button>
          ) : null}
          {canExportDepartment ? (
            <Button variant="outline" onClick={() => setDialogOpen('export', true)} className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
              <Download className="w-4 h-4" />
              {t.actions.export}
            </Button>
          ) : null}
          {canCreateDepartment ? (
            <Button onClick={openAddDialog} className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]">
              <Plus className="w-4 h-4" />
              {t.actions.add}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryDepartment ? (
        <QueryAccessBoundary
          viewId="system-departments"
          title={t.menu.systemDepartments}
          queryPermission={systemPermissions.department.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
      <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 p-0 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
      </Card>

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





