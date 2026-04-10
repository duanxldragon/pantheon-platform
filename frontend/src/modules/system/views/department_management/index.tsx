import { useState, useMemo, useCallback } from 'react';
import { useDepartments } from '../../hooks/use_departments';
import { useUsers } from '../../hooks/use_users';
import { Department } from '../../types';
import { useLanguageStore } from '../../../../stores/language_store';
import { toast } from 'sonner';
import { api } from '../../api';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Plus, Upload, Download, Search, ChevronRight, ChevronDown, Trash2, Power, PowerOff } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { ConfirmDialog } from '../../../../shared/components/ui/confirm_dialog';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useCSVImportExport } from '../../../../shared/hooks/use_csv_import_export';
import { csvTemplates } from '../../../../shared/utils/csv_templates';
import { useAuthStore } from '../../../auth/store/auth_store';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/use_permission_confirm_guard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/use_query_permission_dialog_guard';
import type { ExportOptions } from '../../../../shared/components/ui/data_import_export_dialog';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

// 导入重构后的子组件和 Hook
import { DepartmentTreeTable } from './components/department_tree_table';
import { DepartmentDialogManager } from './components/department_dialog_manager';
import { useDepartmentTree, DepartmentNode } from './hooks/use_department_tree';
import { getDepartmentManagementCopy } from './department_management_copy';

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
  const authUser = useAuthStore((state) => state.user);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryDepartment = hasPermission(systemPermissions.department.query);
  
  // 1. 数据加载
  const { departments, reload: reloadDepartments } = useDepartments({ enabled: canQueryDepartment });
  const { users, reload: reloadUsers } = useUsers({ enabled: canQueryDepartment });
  const flatDepartments = useMemo(() => {
    const result: Department[] = [];
    const walk = (items: Department[]) => {
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

  const collectDepartmentScopeIds = useCallback((departmentIds: string[]) => {
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
  }, [departments]);

  const isCurrentUserInDepartmentScope = useCallback((departmentIds: string[]) => {
    if (!authUser?.departmentId) {
      return false;
    }

    const affectedDepartmentIds = collectDepartmentScopeIds(departmentIds);
    return affectedDepartmentIds.has(String(authUser.departmentId));
  }, [authUser?.departmentId, collectDepartmentScopeIds]);

  const getDepartmentAffectedUserCount = useCallback((departmentId: string) => {
    const affectedDepartmentIds = collectDepartmentScopeIds([departmentId]);
    return users.filter((user) => affectedDepartmentIds.has(String(user.departmentId ?? ''))).length;
  }, [collectDepartmentScopeIds, users]);

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

  const getDepartmentDeleteBlockers = useCallback((departmentId: string) => {
    const childCount = departments.filter((department) => String(department.parentId ?? '') === departmentId).length;
    const directUserCount = users.filter((user) => String(user.departmentId ?? '') === departmentId).length;

    return {
      childCount,
      directUserCount,
      blocked: childCount > 0 || directUserCount > 0,
    };
  }, [departments, users]);

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
    onDataImported: async (rows) => {
      const existingDepartments = new Map(flatDepartments.map((department) => [department.code.toLowerCase(), department]));

      const resolveStatus = (value: unknown): Department['status'] => {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'inactive' || normalized === 'disabled' || normalized === '禁用'
          ? 'inactive'
          : 'active';
      };

      const resolveParentId = (value: unknown) => {
        const keyword = String(value || '').trim().toLowerCase();
        if (!keyword) {
          return null;
        }

        const matchedDepartment = flatDepartments.find((department) =>
          [department.id, department.code, department.name]
            .filter(Boolean)
            .some((candidate) => String(candidate).trim().toLowerCase() === keyword),
        );

        return matchedDepartment ? String(matchedDepartment.id) : null;
      };

      const resolveLeader = (value: unknown) => {
        const keyword = String(value || '').trim().toLowerCase();
        if (!keyword) {
          return { leaderId: undefined, leader: '' };
        }

        const matchedUser = users.find((user) =>
          [user.id, user.username, user.realName]
            .filter(Boolean)
            .some((candidate) => String(candidate).trim().toLowerCase() === keyword),
        );

        return {
          leaderId: matchedUser ? String(matchedUser.id) : undefined,
          leader: matchedUser?.realName || matchedUser?.username || String(value || '').trim(),
        };
      };

      for (const row of rows) {
        const code = String(row.departmentCode || '').trim();
        const name = String(row.departmentName || '').trim();
        if (!code || !name) {
          continue;
        }

        const leader = resolveLeader(row.leader);
        const payload: Partial<Department> = {
          name,
          code,
          parentId: resolveParentId(row.parentDepartment),
          leaderId: leader.leaderId,
          leader: leader.leader,
          phone: String(row.phone || '').trim(),
          email: String(row.email || '').trim(),
          sort: Number(row.sort) || 0,
          status: resolveStatus(row.status),
        };

        const existing = existingDepartments.get(code.toLowerCase());
        if (existing) {
          await api.updateDepartment(String(existing.id), payload);
        } else {
          await api.createDepartment(payload);
        }
      }

      await reloadDepartments();
      if (authUser?.departmentId) {
        await refreshCurrentUser();
      }
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
            if (isCurrentUserInDepartmentScope([String(selectedDepartment.id)])) {
              await refreshCurrentUser();
            }
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
        if (selectedDepartment && isCurrentUserInDepartmentScope([String(selectedDepartment.id)])) {
          await refreshCurrentUser();
        }
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
        : filteredDepartments;
      await csvHandler.handleExport(dataToExport.map((department) => ({
        departmentName: department.name,
        departmentCode: department.code,
        parentDepartment:
          flatDepartments.find((item) => String(item.id) === String(department.parentId ?? ''))?.name
          || department.parentName
          || '',
        leader: department.leader || '',
        phone: department.phone || '',
        email: department.email || '',
        sort: department.sort ?? 0,
        status: department.status,
      })), {
        filename: options.scope === 'selected' ? 'DepartmentManagement_Selected' : 'DepartmentManagement_Filtered',
      });
      setDialogOpen('export', false);
    },
    onAddMembers: async (userIds: string[]) => {
      if (!selectedDepartment) {
        return;
      }
      try {
        await Promise.all(userIds.map((id) => api.updateUser(id, { departmentId: selectedDepartment.id })));
        toast.success(copy.messages.addMembersSuccess(selectedDepartment.name, userIds.length));
        if (authUser?.id && userIds.some((id) => String(id) === String(authUser.id))) {
          await refreshCurrentUser();
        }
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
        if (authUser?.id && String(userId) === String(authUser.id)) {
          await refreshCurrentUser();
        }
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
        if (isCurrentUserInDepartmentScope(targetItems.map((department) => String(department.id)))) {
          await refreshCurrentUser();
        }
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

  const pageDescription = zh
    ? '统一管理部门层级、成员归属和启停状态，保持组织结构与权限链路一致。'
    : 'Manage department hierarchy, member ownership, and status changes with a stable organization-aware workflow.';
  const departmentReviewStats = useMemo(() => {
    const active = filteredDepartments.filter((department) => department.status === 'active').length;
    const inactive = filteredDepartments.filter((department) => department.status !== 'active').length;
    const roots = filteredDepartments.filter((department) => !department.parentId || String(department.parentId) === '0').length;
    const withLeader = filteredDepartments.filter((department) => Boolean(department.leaderId || department.leader)).length;

    return {
      total: filteredDepartments.length,
      active,
      inactive,
      roots,
      withLeader,
    };
  }, [filteredDepartments]);
  const selectedAffectedUsers = useMemo(() => {
    return selectedDepartments.reduce((total, department) => total + getDepartmentAffectedUserCount(String(department.id)), 0);
  }, [getDepartmentAffectedUserCount, selectedDepartments]);
  const selectedBlockedDeleteCount = useMemo(() => {
    return selectedDepartments.filter((department) => getDepartmentDeleteBlockers(String(department.id)).blocked).length;
  }, [getDepartmentDeleteBlockers, selectedDepartments]);
  const departmentFocusSummary = useMemo(() => {
    if (selectedDepartments.length > 0) {
      return {
        badge: zh ? '批量操作中' : 'Batch In Progress',
        badgeVariant: 'warning' as const,
        title: zh ? '当前已进入批量部门处理阶段' : 'A batch department workflow is active',
        description:
          zh
            ? `已选中 ${selectedDepartments.length} 个部门，可继续启停或删除，但建议先复核受影响成员与直属下级约束。`
            : `${selectedDepartments.length} departments are selected. Continue with status changes or deletion after reviewing member impact and direct-child constraints.`,
        nextAction:
          zh ? '先确认受影响成员范围，再执行批量启停或删除。' : 'Review affected members before running batch actions.',
      };
    }
    if (departmentReviewStats.inactive > 0) {
      return {
        badge: zh ? '停用复核' : 'Inactive Review',
        badgeVariant: 'mono' as const,
        title: zh ? '当前结果中存在停用部门需要复核' : 'Inactive departments need follow-up',
        description:
          zh
            ? `当前范围内有 ${departmentReviewStats.inactive} 个部门未启用，建议优先确认组织层级、负责人和成员影响。`
            : `${departmentReviewStats.inactive} departments in scope are inactive. Review hierarchy, leaders, and member impact first.`,
        nextAction:
          zh ? '先展开组织树查看停用部门上下级关系。' : 'Expand the tree and review inactive branches first.',
      };
    }
    if (searchQuery.trim()) {
      return {
        badge: zh ? '筛选结果' : 'Filtered Result',
        badgeVariant: 'info' as const,
        title: zh ? '当前处于组织聚焦检索模式' : 'You are reviewing a narrowed organization scope',
        description:
          zh
            ? `当前范围已缩小到 ${departmentReviewStats.total} 个部门，适合继续检查成员归属、负责人和树形关系。`
            : `The current scope is narrowed to ${departmentReviewStats.total} departments, which is ideal for member, leader, and tree review.`,
        nextAction:
          zh ? '继续按树形结构查看目标部门，或清空搜索回到全局视图。' : 'Continue with the targeted tree branch, or clear search to return to the full structure.',
      };
    }

    return {
      badge: zh ? '结构稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前组织结构整体稳定' : 'The organization structure is stable overall',
      description:
        zh
          ? '当前结果以内主要为启用部门，适合继续做常规组织巡检与成员归属检查。'
          : 'Most departments in scope are active. Continue with routine hierarchy and member ownership checks.',
      nextAction:
        zh ? '优先抽查关键根部门及其成员分布。' : 'Spot-check major root departments and their members next.',
    };
  }, [departmentReviewStats, searchQuery, selectedDepartments.length, zh]);

  return (
    <div className="space-y-6">
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
          <ManagementPageHeader
            eyebrow="SYSTEM"
            title={copy.page.title}
            description={pageDescription}
            meta={
              <>
                <Badge variant="mono">{copy.entity.en}</Badge>
                <Badge variant="info">
                  {zh ? `部门总数 ${departments.length}` : `${departments.length} departments`}
                </Badge>
                {selectedDepartments.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedDepartments.length} 项` : `${selectedDepartments.length} selected`}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <>
          {selectedDepartments.length > 0 && (
            <>
              {canUpdateDepartment && departmentsToEnable.length > 0 ? (
                <Button variant="success" size="pill" onClick={() => handleBatchDepartmentStatus(true)} className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5">
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(departmentsToEnable.length)}
                </Button>
              ) : null}
              {canUpdateDepartment && departmentsToDisable.length > 0 ? (
                <Button variant="warning" size="pill" onClick={() => handleBatchDepartmentStatus(false)} className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5">
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(departmentsToDisable.length)}
                </Button>
              ) : null}
              {canDeleteDepartment ? (
                <Button variant="ghost-danger" size="pill" onClick={handleBatchDepartmentDelete} className="h-11 gap-2 rounded-full border border-destructive/20 px-4 shadow-sm transition-all hover:-translate-y-0.5">
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedDepartments.length)}
                </Button>
              ) : null}
            </>
          )}
          <div className="relative mr-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={copy.page.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-full border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
            />
          </div>
          
          <Button
            variant="mono"
            size="icon-sm"
            onClick={expandAll}
            className="h-11 w-11 rounded-full text-slate-500"
            title={copy.titles.expandAll}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="mono"
            size="icon-sm"
            onClick={collapseAll}
            className="mr-1 h-11 w-11 rounded-full text-slate-500"
            title={copy.titles.collapseAll}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {canCreateDepartment ? (
            <Button variant="mono" size="pill" onClick={() => setDialogOpen('import', true)} className="h-11 gap-2 rounded-full px-4">
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportDepartment ? (
            <Button variant="mono" size="pill" onClick={() => setDialogOpen('export', true)} className="h-11 gap-2 rounded-full px-4">
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateDepartment ? (
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
                  description={zh ? '根据当前组织状态，建议优先处理这些动作。' : 'Based on the current org state, handle these actions first.'}
                >
                  <DetailKeyValueItem
                    label="01"
                    value={
                      selectedDepartments.length > 0
                        ? (zh ? '先复核成员影响与删除阻塞' : 'Review member impact and delete blockers first')
                        : departmentReviewStats.inactive > 0
                          ? (zh ? '先处理停用部门' : 'Review inactive departments first')
                          : (zh ? '先展开关键组织分支' : 'Expand key branches first')
                    }
                  />
                  <DetailKeyValueItem
                    label="02"
                    value={zh ? '再查看负责人、成员与上下级关系' : 'Then inspect leaders, members, and parent-child relations'}
                  />
                  <DetailKeyValueItem
                    label="03"
                    value={selectedDepartments.length === 0 && canCreateDepartment ? (zh ? '最后新增或调整部门' : 'Finally add or adjust departments') : (zh ? '最后恢复常规巡检' : 'Finally return to routine inspection')}
                    className="md:col-span-2"
                  />
                </DetailKeyValueSection>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={departmentFocusSummary.badgeVariant}>{departmentFocusSummary.badge}</Badge>
                    <Badge variant="mono">
                      {zh ? `当前范围 ${departmentReviewStats.total} 个部门` : `${departmentReviewStats.total} departments in scope`}
                    </Badge>
                    {selectedDepartments.length > 0 ? (
                      <Badge variant="warning">
                        {zh ? `已选 ${selectedDepartments.length} 个` : `${selectedDepartments.length} selected`}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{departmentFocusSummary.title}</div>
                  <div className="text-xs leading-5 text-slate-600">{departmentFocusSummary.description}</div>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '启用中' : 'Active'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{departmentReviewStats.active}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '组织链路当前可用。' : 'Organization branches currently available.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '停用中' : 'Inactive'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{departmentReviewStats.inactive}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '建议结合成员影响优先复核。' : 'Review with member impact first.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '根部门' : 'Root Nodes'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{departmentReviewStats.roots}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前组织树的顶层节点。' : 'Top-level nodes in the current tree.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '已设负责人' : 'Leaders Set'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{departmentReviewStats.withLeader}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '已配置负责人部门数量。' : 'Departments with an assigned leader.'}</div>
                  </div>
                </div>
              </div>

              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '组织焦点' : 'Organization Focus'}
                description={zh ? '结合当前搜索和选择状态，快速判断组织管理下一步。' : 'Use the current search and selection state to decide the next organization action.'}
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Current Outcome'}
                  value={departmentFocusSummary.title}
                  hint={departmentFocusSummary.description}
                  className="md:col-span-2"
                />
                <DetailKeyValueItem
                  label={zh ? '搜索状态' : 'Search State'}
                  value={searchQuery.trim() ? (zh ? '已聚焦检索' : 'Focused Search') : (zh ? '全量视图' : 'Full Scope')}
                  hint={searchQuery.trim() ? `${zh ? '关键词' : 'Keyword'}: ${searchQuery.trim()}` : (zh ? '未设置检索关键词' : 'No search keyword applied')}
                />
                <DetailKeyValueItem
                  label={zh ? '下一步动作' : 'Next Action'}
                  value={departmentFocusSummary.nextAction}
                />
                <DetailKeyValueItem
                  label={zh ? '批量影响' : 'Batch Impact'}
                  value={
                    selectedDepartments.length > 0
                      ? (zh
                        ? `影响成员 ${selectedAffectedUsers} / 删除受阻 ${selectedBlockedDeleteCount}`
                        : `${selectedAffectedUsers} members affected / ${selectedBlockedDeleteCount} delete blockers`)
                      : (zh ? '当前未选择部门' : 'No departments selected')
                  }
                  hint={
                    selectedDepartments.length > 0
                      ? (zh ? '批量删除前会校验直属下级和直属成员。' : 'Batch delete is blocked by direct children or direct members.')
                      : (zh ? '可先按树形结构展开后再选择。' : 'Expand the tree first before selecting branches.')
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '推荐操作' : 'Recommended Actions'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {searchQuery.trim() ? (
                        <Button type="button" variant="mono" size="pill" onClick={() => setSearchQuery('')}>
                          {zh ? '清空搜索' : 'Clear Search'}
                        </Button>
                      ) : null}
                      <Button type="button" variant="mono" size="pill" onClick={expandAll}>
                        {zh ? '展开组织树' : 'Expand Tree'}
                      </Button>
                      {selectedDepartments.length === 0 && canCreateDepartment ? (
                        <Button type="button" variant="mono" size="pill" onClick={openAddDialog}>
                          {zh ? '新增部门' : 'Create Department'}
                        </Button>
                      ) : null}
                    </div>
                  }
                />
              </DetailKeyValueSection>
            </div>
          </ManagementContentCard>

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
    </div>
  );
}



















