import { useMemo, useState } from 'react';
import { useUsers } from '../../hooks/use_users';
import { useDepartments } from '../../hooks/use_departments';
import { useRoles } from '../../hooks/use_roles';
import { UserFormData, User } from '../../types';
import { useLanguageStore } from '../../../../stores/language_store';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Trash2, Download, UserPlus, Upload } from '../../../../shared/components/ui/icons';
import { useCSVImportExport } from '../../../../shared/hooks/use_csv_import_export';
import { csvTemplates } from '../../../../shared/utils/csv_templates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/auth_store';
import { ConfirmDialog } from '../../../../shared/components/ui/confirm_dialog';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/use_permission_confirm_guard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/use_query_permission_dialog_guard';
import type { ExportOptions } from '../../../../shared/components/ui/data_import_export_dialog';
import { Power, PowerOff } from 'lucide-react';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getUserManagementCopy } from './user_management_copy';

// 导入拆分后的子组件和 Hook
import { UserTable } from './components/user_table';
import { UserSearchForm } from './components/user_search_form';
import { UserDialogManager } from './components/user_dialog_manager';
import { useUserTable } from './hooks/use_user_table';

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

export function UserManagement() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getUserManagementCopy(language);
  const userMessages = createEntityFeedback(zh, copy.entity);
  const authUser = useAuthStore((state) => state.user);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryUser = hasPermission(systemPermissions.user.query);
  
  // 1. 数据加载
  const { users, reload } = useUsers({ enabled: canQueryUser });
  const { departments } = useDepartments({ enabled: canQueryUser });
  const { roles } = useRoles({ enabled: canQueryUser });

  // 2. 表格与搜索逻辑 Hook
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedUsers,
    setSelectedUsers,
    page,
    setPage,
    totalPages,
    filteredData,
    paginatedData,
  } = useUserTable(users);

  // 3. 弹窗与表单状态
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    detail: false,
    delete: false,
    resetPassword: false,
    role: false,
    import: false,
    export: false
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<UserFormData>>({});
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirmState>(initialStatusConfirmState);

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

  const resetUserForm = () => {
    setCurrentUser(null);
    setFormData({});
  };

  const openAddDialog = () => {
    resetUserForm();
    setDialogOpen('add', true);
  };

  const closeStatusConfirm = () => {
    setStatusConfirm(initialStatusConfirmState);
  };

  // 4. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.user,
    onDataImported: async (data) => {
      const existingUsers = new Map(users.map((user) => [user.username.toLowerCase(), user]));
      const touchedCurrentUser = data.some(
        (row) =>
          authUser?.username &&
          String(row.username || '').trim().toLowerCase() === authUser.username.toLowerCase(),
      );

      const resolveDepartmentId = (value: unknown) => {
        const keyword = String(value || '').trim();
        if (!keyword) {
          return '';
        }

        const matchedDepartment = departments.find((department) =>
          [department.id, department.code, department.name]
            .filter(Boolean)
            .some((candidate) => String(candidate).trim().toLowerCase() === keyword.toLowerCase()),
        );

        return matchedDepartment ? String(matchedDepartment.id) : keyword;
      };

      const resolvePositionId = (value: unknown) => {
        const keyword = String(value || '').trim();
        return keyword || undefined;
      };

      const resolveRoleIds = (value: unknown) => {
        const roleKeywords = String(value || '')
          .split(';')
          .map((item) => item.trim())
          .filter(Boolean);

        return Array.from(
          new Set(
            roleKeywords.map((keyword) => {
              const matchedRole = roles.find((role) =>
                [role.id, role.code, role.name]
                  .filter(Boolean)
                  .some((candidate) => String(candidate).trim().toLowerCase() === keyword.toLowerCase()),
              );

              return matchedRole ? String(matchedRole.id) : keyword;
            }),
          ),
        );
      };

      for (const row of data) {
        const username = String(row.username || '').trim();
        const email = String(row.email || '').trim();
        if (!username || !email) {
          continue;
        }

        const payload: Partial<User> & { password?: string } = {
          username,
          realName: String(row.realName || '').trim(),
          email,
          phone: String(row.phone || '').trim(),
          departmentId: resolveDepartmentId(row.departmentId),
          positionId: resolvePositionId(row.positionId),
          roleIds: resolveRoleIds(row.roleIds),
          status:
            String(row.status || '').trim().toLowerCase() === 'inactive' ||
            String(row.status || '').trim() === '禁用'
              ? 'inactive'
              : 'active',
        };

        const existing = existingUsers.get(username.toLowerCase());
        if (existing) {
          await api.updateUser(String(existing.id), payload);
        } else {
          await api.createUser({
            ...payload,
            password: String(row.password || '').trim() || 'ChangeMe123!',
          });
        }
      }

      await reload();
      if (touchedCurrentUser) {
        await refreshTenantContext();
      }
      toast.success(copy.messages.importSuccess(data.length));
    },
    requiredFields: ['username', 'email'],
  });

  // 5. 事件处理函数
  const handleAction = (action: string, user: User) => {
    setCurrentUser(user);
    switch (action) {
      case 'detail': setDialogOpen('detail', true); break;
      case 'edit':
        setFormData({
          username: user.username,
          realName: user.realName,
          email: user.email,
          phone: user.phone,
          departmentId: user.departmentId,
          positionId: user.positionId,
          roleIds: user.roleIds,
          status: user.status === 'locked' ? 'inactive' : user.status,
        });
        setDialogOpen('edit', true);
        break;
      case 'delete': setDialogOpen('delete', true); break;
      case 'reset-password': setDialogOpen('resetPassword', true); break;
      case 'assign-role': setDialogOpen('role', true); break;
    }
  };

  const normalizeUserFormData = (data: Partial<UserFormData>): Partial<UserFormData> => ({
    ...data,
    username: data.username?.trim(),
    realName: data.realName?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    password: data.password?.trim(),
    description: data.description?.trim(),
    roleIds: Array.from(new Set((data.roleIds || []).filter(Boolean))),
  });

  const buildUserUpdatePayload = (
    data: Partial<UserFormData>,
    user: User,
  ): Partial<User> => {
    const normalized = normalizeUserFormData(data) as Partial<User>;

    if (normalized.realName === user.realName) {
      delete normalized.realName;
    }
    if (normalized.email === user.email) {
      delete normalized.email;
    }
    if (normalized.phone === user.phone) {
      delete normalized.phone;
    }

    return normalized;
  };

  const isCurrentLoginUser = (userId?: User['id']) =>
    userId != null && authUser?.id != null && String(userId) === String(authUser.id);

  const hasRoleIdsChanged = (left?: Array<string | number>, right?: Array<string | number>) => {
    const normalizedLeft = Array.from(new Set((left || []).map((item) => String(item)))).sort();
    const normalizedRight = Array.from(new Set((right || []).map((item) => String(item)))).sort();

    if (normalizedLeft.length !== normalizedRight.length) {
      return true;
    }

    return normalizedLeft.some((item, index) => item !== normalizedRight[index]);
  };

  const shouldRefreshCurrentUserProfile = (user: User, data: Partial<UserFormData>) =>
    isCurrentLoginUser(user.id) &&
    Boolean(
      (data.realName != null && data.realName !== user.realName) ||
        (data.email != null && data.email !== user.email) ||
        (data.phone != null && data.phone !== user.phone),
    );

  const shouldRefreshCurrentUserAuthorization = (user: User, data: Partial<UserFormData>) =>
    isCurrentLoginUser(user.id) &&
    Boolean(
      (data.status != null && data.status !== user.status) ||
        (data.departmentId != null && String(data.departmentId) !== String(user.departmentId || '')) ||
        (data.positionId != null && String(data.positionId || '') !== String(user.positionId || '')) ||
        hasRoleIdsChanged(data.roleIds, user.roleIds),
    );

  const syncCurrentUserStateAfterUpdate = async (user: User, data: Partial<UserFormData>) => {
    if (shouldRefreshCurrentUserAuthorization(user, data)) {
      await refreshTenantContext();
      return;
    }

    if (shouldRefreshCurrentUserProfile(user, data)) {
      await refreshCurrentUser();
    }
  };

  const buildUserSelfProtectedMessage = (action: 'delete' | 'disable' | 'batch-delete' | 'batch-disable') => {
    return copy.messages.selfProtected(
      action === 'delete' || action === 'batch-delete' ? 'delete' : 'disable',
    );
  };

  const buildUserDeleteDescription = (user: User) => {
    const roleCount = user.roleNames?.length || 0;

    if (isCurrentLoginUser(user.id)) {
      return buildUserSelfProtectedMessage('delete');
    }

    return copy.messages.deleteDescription(user.realName, roleCount, user.status === 'active');
  };

  const buildUserDeleteBlockedMessage = (items: User[], isBatch = false) => {
    const details = items
      .slice(0, 3)
      .map((item) => item.realName || item.username)
      .join(zh ? '、' : ', ');

    return copy.messages.deleteBlocked(details, isBatch);
  };

  const buildUserBatchDeleteDescription = (items: User[]) => {
    const activeCount = items.filter((user) => user.status === 'active').length;
    const roleBindingCount = items.reduce((total, user) => total + (user.roleNames?.length || 0), 0);

    return copy.messages.batchDeleteDescription(items.length, activeCount, roleBindingCount);
  };

  const buildUserStatusCopy = (user: User, enabled: boolean) => {
    return {
      title: copy.messages.statusTitle(enabled),
      description: copy.messages.statusDescription(user.realName, enabled),
      confirmText: copy.messages.statusConfirmText(enabled),
      success: copy.messages.statusSuccess(user.realName, enabled),
    };
  };

  const openUserStatusConfirm = (user: User, enabled: boolean, action: () => Promise<void>) => {
    if (!enabled && isCurrentLoginUser(user.id)) {
      toast.error(buildUserSelfProtectedMessage('disable'));
      return;
    }

    const copy = buildUserStatusCopy(user, enabled);
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

  const buildUserBatchStatusCopy = (targetUsers: User[], enabled: boolean) => {
    return {
      title: copy.messages.batchStatusTitle(enabled),
      description: copy.messages.batchStatusDescription(targetUsers.length, enabled),
      confirmText: copy.messages.batchStatusConfirmText(enabled),
      success: copy.messages.batchStatusSuccess(targetUsers.length, enabled),
    };
  };

  const openUserBatchStatusConfirm = (
    targetUsers: User[],
    enabled: boolean,
    action: () => Promise<void>,
  ) => {
    if (!enabled && targetUsers.some((user) => isCurrentLoginUser(user.id))) {
      toast.error(buildUserSelfProtectedMessage('batch-disable'));
      return;
    }

    const copy = buildUserBatchStatusCopy(targetUsers, enabled);
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

  const validateUserFormData = (data: Partial<UserFormData>, isEdit = false) => {
    const normalized = normalizeUserFormData(data);
    const departmentId = normalized.departmentId != null ? String(normalized.departmentId) : '';
    const roleIds = (normalized.roleIds || []).map((id) => String(id));

    if (!normalized.username) {
      return copy.validation.usernameRequired;
    }
    if (!normalized.realName) {
      return copy.validation.realNameRequired;
    }
    if (!normalized.email) {
      return copy.validation.emailRequired;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      return copy.validation.emailInvalid;
    }
    if (!normalized.phone) {
      return copy.validation.phoneRequired;
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
    if (roleIds.length === 0) {
      return copy.validation.roleRequired;
    }

    const missingRole = roleIds.find((roleId) => !roles.some((role) => String(role.id) === roleId));
    if (missingRole) {
      return copy.validation.roleInvalid;
    }

    const inactiveRole = roles.find(
      (role) => roleIds.includes(String(role.id)) && role.status !== 'active',
    );
    if (inactiveRole) {
      return copy.validation.inactiveRole(inactiveRole.name);
    }

    if (!isEdit && !normalized.password) {
      return copy.validation.passwordRequired;
    }

    return null;
  };

  const handlers = {
    onAdd: async () => {
      if (!ensureActionPermission(canCreateUser, copy.actionLabels.add)) return;
      try {
        const normalizedFormData = normalizeUserFormData(formData);
        const validationMessage = validateUserFormData(normalizedFormData, false);
        if (validationMessage) {
          toast.error(validationMessage);
          return;
        }

        await api.createUser(normalizedFormData as Partial<User>);
        toast.success(userMessages.createSuccess);
        setDialogOpen('add', false);
        resetUserForm();
        await reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : userMessages.createFailed);
      }
    },
    onEdit: async () => {
      if (!currentUser) return;
      if (!ensureActionPermission(canUpdateUser, copy.actionLabels.edit)) return;
      try {
        const normalizedFormData = normalizeUserFormData(formData);
        const updatePayload = buildUserUpdatePayload(formData, currentUser);
        const validationMessage = validateUserFormData(normalizedFormData, true);
        if (validationMessage) {
          toast.error(validationMessage);
          return;
        }

        const nextStatus = normalizedFormData.status;
        if (nextStatus && nextStatus !== currentUser.status) {
          openUserStatusConfirm(currentUser, nextStatus === 'active', async () => {
            await api.updateUser(String(currentUser.id), updatePayload);
            setDialogOpen('edit', false);
            resetUserForm();
            await syncCurrentUserStateAfterUpdate(currentUser, normalizedFormData);
            await reload();
          });
          return;
        }

        await api.updateUser(String(currentUser.id), updatePayload);
        toast.success(userMessages.updateSuccess);
        setDialogOpen('edit', false);
        resetUserForm();
        await syncCurrentUserStateAfterUpdate(currentUser, normalizedFormData);
        await reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : userMessages.updateFailed);
      }
    },
    onDelete: async () => {
      if (!currentUser) return;
      if (!ensureActionPermission(canDeleteUser, copy.actionLabels.delete)) return;
      if (isCurrentLoginUser(currentUser.id)) {
        toast.error(buildUserDeleteBlockedMessage([currentUser]));
        return;
      }
      try {
        await api.deleteUser(String(currentUser.id));
        toast.success(userMessages.deleteSuccess);
        setDialogOpen('delete', false);
        setCurrentUser(null);
        await reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : userMessages.deleteFailed);
      }
    },
    onResetPassword: async (pwd: string) => {
      if (!currentUser) return;
      if (!ensureActionPermission(canUpdateUser, copy.actionLabels.resetPassword)) return;
      try {
        await api.resetPassword(String(currentUser.id), pwd);
        toast.success(copy.messages.resetPasswordSuccess);
        setDialogOpen('resetPassword', false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.messages.resetPasswordFailed);
      }
    },
    onRoleAssigned: async (roleIds: User['roleIds']) => {
      if (!currentUser) {
        return;
      }
      if (!ensureActionPermission(canUpdateUser, copy.actionLabels.roleAssignment)) return;

      const nextRoleNames = roles
        .filter((role) => roleIds.some((roleId) => String(roleId) === String(role.id)))
        .map((role) => role.name);

      const nextCurrentUser = {
        ...currentUser,
        roleIds,
        roleNames: nextRoleNames,
      };

      setCurrentUser(nextCurrentUser);
      setFormData((prev) => ({
        ...prev,
        roleIds,
      }));

      toast.success(
        copy.messages.roleUpdated(currentUser.realName),
      );

      if (isCurrentLoginUser(currentUser.id)) {
        await refreshTenantContext();
      }
      await reload();
    },
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreateUser, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: ExportOptions) => {
      if (!ensureActionPermission(canExportUser, copy.actionLabels.export)) return;
      const dataToExport = options.scope === 'selected' && selectedUsers.length > 0
        ? selectedUsers
        : filteredData;
      await csvHandler.handleExport(dataToExport.map((user) => ({
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        departmentId: user.departmentName || user.departmentId,
        positionId: user.positionName || user.positionId || '',
        roleIds: (user.roleNames?.length ? user.roleNames : user.roleIds || []).join('; '),
        status: user.status,
      })), {
        filename: options.scope === 'selected' ? 'UserManagement_Selected' : 'UserManagement_Filtered',
      });
      setDialogOpen('export', false);
    }
  };

  const selectedUsersToEnable = selectedUsers.filter((user) => user.status !== 'active');
  const selectedUsersToDisable = selectedUsers.filter((user) => user.status !== 'inactive');
  const canCreateUser = hasPermission(systemPermissions.user.create);
  const canUpdateUser = hasPermission(systemPermissions.user.update);
  const canDeleteUser = hasPermission(systemPermissions.user.delete);
  const canExportUser = hasPermission(systemPermissions.user.export);
  const { lossDescription: queryLossDescription } = useQueryPermissionDialogGuard({
    canQuery: canQueryUser,
    pageTitle: copy.page.title,
    dialogs,
    protectedDialogs: {
      detail: copy.actionLabels.detail,
      role: copy.actionLabels.roleGuard,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actionLabels.add, allowed: canCreateUser },
      edit: { label: copy.actionLabels.edit, allowed: canUpdateUser },
      delete: { label: copy.actionLabels.delete, allowed: canDeleteUser },
      resetPassword: { label: copy.actionLabels.resetPassword, allowed: canUpdateUser },
      role: { label: copy.actionLabels.roleAssignment, allowed: canUpdateUser },
      import: { label: copy.actionLabels.import, allowed: canCreateUser },
      export: { label: copy.actionLabels.export, allowed: canExportUser },
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: statusConfirm.open,
    guard: statusConfirm.guard,
    pageTitle: copy.page.title,
    guards: {
      update: { label: copy.actionLabels.batchStatusUpdate, allowed: canUpdateUser },
      delete: { label: copy.actionLabels.batchDelete, allowed: canDeleteUser },
    },
    closeConfirm: closeStatusConfirm,
  });

  const handleBatchDelete = async () => {
    if (!ensureActionPermission(canDeleteUser, copy.actionLabels.batchDelete)) return;
    const blockedUsers = selectedUsers.filter((user) => isCurrentLoginUser(user.id));
    if (blockedUsers.length > 0) {
      toast.error(buildUserDeleteBlockedMessage(blockedUsers, true));
      return;
    }

    setStatusConfirm({
      open: true,
      title: copy.confirms.batchDeleteTitle,
      description: buildUserBatchDeleteDescription(selectedUsers),
      confirmText: copy.confirms.deleteText,
      variant: 'danger',
      guard: 'delete',
      action: async () => {
        try {
          await Promise.all(selectedUsers.map((user) => api.deleteUser(String(user.id))));
          toast.success(userMessages.batchDeleteSuccess(selectedUsers.length));
          setSelectedUsers([]);
          await reload();
        } catch {
          toast.error(userMessages.batchDeleteFailed);
          throw new Error('user batch delete failed');
        }
      },
    });
  };

  const handleBatchUserStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdateUser, enabled ? copy.actionLabels.batchEnable : copy.actionLabels.batchDisable)) return;
    const targetUsers = enabled ? selectedUsersToEnable : selectedUsersToDisable;
    if (targetUsers.length === 0) {
      return;
    }

    openUserBatchStatusConfirm(targetUsers, enabled, async () => {
      try {
        await api.batchUpdateStatus(
          targetUsers.map((user) => String(user.id)),
          enabled ? 'active' : 'inactive',
        );
        setSelectedUsers([]);
        await reload();
      } catch {
        toast.error(userMessages.batchStatusUpdateFailed);
        throw new Error('user batch status update failed');
      }
    });
  };

  const pageDescription = zh
    ? '统一管理用户账号、部门归属、角色分配与启停状态，保证权限变更链路稳定可追踪。'
    : 'Manage user accounts, department ownership, role assignments, and status changes with a stable permission-aware workflow.';
  const userReviewStats = useMemo(() => {
    const active = filteredData.filter((user) => user.status === 'active').length;
    const inactive = filteredData.filter((user) => user.status === 'inactive').length;
    const locked = filteredData.filter((user) => user.status === 'locked').length;
    const withRoles = filteredData.filter((user) => (user.roleIds?.length || 0) > 0).length;

    return {
      total: filteredData.length,
      active,
      inactive,
      locked,
      withRoles,
    };
  }, [filteredData]);
  const selectedNeedsDisableReview = selectedUsers.filter((user) => user.status === 'active').length;
  const selectedNeedsEnableReview = selectedUsers.filter((user) => user.status !== 'active').length;
  const selectedSelfProtectedCount = selectedUsers.filter((user) => isCurrentLoginUser(user.id)).length;
  const userFocusSummary = useMemo(() => {
    if (selectedUsers.length > 0) {
      return {
        badge: zh ? '批量操作中' : 'Batch In Progress',
        badgeVariant: 'warning' as const,
        title: zh ? '当前已进入批量用户处理阶段' : 'A batch user workflow is currently active',
        description:
          zh
            ? `已选中 ${selectedUsers.length} 个用户，可继续执行启停、删除或导出，但要先确认当前登录账号不在批量禁用/删除范围内。`
            : `${selectedUsers.length} users are selected. Continue with enable, disable, delete, or export after confirming the current signed-in account is excluded from risky actions.`,
        nextAction:
          zh
            ? '优先检查选中用户的启停状态和是否包含当前登录账号。'
            : 'Review selected users for state changes and self-protection first.',
      };
    }
    if (userReviewStats.locked > 0) {
      return {
        badge: zh ? '锁定复核' : 'Locked Review',
        badgeVariant: 'warning' as const,
        title: zh ? '当前结果中存在锁定账号需要处理' : 'Locked accounts need follow-up',
        description:
          zh
            ? `当前筛选结果中有 ${userReviewStats.locked} 个锁定账号，建议优先核对登录安全事件、状态恢复策略和角色影响。`
            : `${userReviewStats.locked} locked accounts are in scope. Review security events, recovery readiness, and role impact first.`,
        nextAction:
          zh ? '先查看锁定账号详情，再决定是否恢复或继续限制。' : 'Open locked account details before restoring access.',
      };
    }
    if (filters.status === 'inactive' || userReviewStats.inactive > 0) {
      return {
        badge: zh ? '停用关注' : 'Inactive Watch',
        badgeVariant: 'mono' as const,
        title: zh ? '当前列表包含停用账号需要复核' : 'Inactive accounts need review',
        description:
          zh
            ? `当前范围内共有 ${userReviewStats.inactive} 个停用账号，适合继续核对部门、角色和启用时机。`
            : `${userReviewStats.inactive} inactive accounts are in scope. Continue by reviewing departments, roles, and re-enable timing.`,
        nextAction:
          zh ? '优先检查停用账号的角色绑定和部门归属。' : 'Review role bindings and department ownership for inactive accounts.',
      };
    }
    if (searchQuery.trim() || filters.departmentId !== 'all' || filters.roleId !== 'all' || filters.status !== 'all') {
      return {
        badge: zh ? '筛选结果' : 'Filtered Result',
        badgeVariant: 'info' as const,
        title: zh ? '当前处于聚焦筛选模式' : 'You are reviewing a narrowed user set',
        description:
          zh
            ? `当前范围已缩小到 ${userReviewStats.total} 个用户，适合继续处理角色绑定、状态调整或导出。`
            : `The current scope is narrowed to ${userReviewStats.total} users, which is ideal for targeted role, status, or export actions.`,
        nextAction:
          zh ? '按筛选结果逐项查看详情或继续批量准备。' : 'Continue with detailed review or prep the next batch action.',
      };
    }

    return {
      badge: zh ? '运行稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前用户台账整体稳定' : 'The current user roster is stable overall',
      description:
        zh
          ? '当前列表以内大多数账号处于启用状态，可按常规巡检方式检查角色、部门和登录状态。'
          : 'Most users in scope are active. Continue with routine checks on roles, departments, and sign-in state.',
      nextAction:
        zh ? '继续按部门或角色维度做抽查。' : 'Continue with spot checks by department or role.',
    };
  }, [filters.departmentId, filters.roleId, filters.status, searchQuery, selectedUsers, userReviewStats, zh]);

  return (
    <div className="space-y-6">
      {!canQueryUser ? (
        <QueryAccessBoundary
          viewId="system-users"
          title={copy.page.title}
          queryPermission={systemPermissions.user.query}
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
                <Badge variant="info">{zh ? `用户总数 ${users.length}` : `${users.length} users`}</Badge>
                {selectedUsers.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedUsers.length} 项` : `${selectedUsers.length} selected`}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <>
          {selectedUsers.length > 0 && (
            <>
              {canUpdateUser && selectedUsersToEnable.length > 0 ? (
                <Button
                  variant="success"
                  size="pill"
                  onClick={() => handleBatchUserStatus(true)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(selectedUsersToEnable.length)}
                </Button>
              ) : null}
              {canUpdateUser && selectedUsersToDisable.length > 0 ? (
                <Button
                  variant="warning"
                  size="pill"
                  onClick={() => handleBatchUserStatus(false)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(selectedUsersToDisable.length)}
                </Button>
              ) : null}
              {canDeleteUser ? (
                <Button 
                  variant="ghost-danger"
                  size="pill"
                  onClick={handleBatchDelete} 
                  className="h-11 gap-2 rounded-full border border-destructive/20 px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedUsers.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreateUser ? (
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
          {canExportUser ? (
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
          {canCreateUser ? (
            <Button
              size="pill"
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
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
                      ? '根据当前筛选和已选用户，建议优先执行这些动作。'
                      : 'Based on current filters and selection, these actions should be handled first.'
                  }
                >
                  <DetailKeyValueItem
                    label="01"
                    value={
                      selectedUsers.length > 0
                        ? (zh ? '先复核批量选择范围' : 'Review the batch selection first')
                        : userReviewStats.locked > 0
                          ? (zh ? '先处理锁定账号' : 'Review locked accounts first')
                          : (zh ? '先检查当前筛选范围' : 'Review the current filtered scope first')
                    }
                    hint={
                      selectedUsers.length > 0
                        ? (zh ? '确认是否包含当前登录账号与高风险启停对象。' : 'Confirm whether the current signed-in account or risky state changes are included.')
                        : userReviewStats.locked > 0
                          ? (zh ? '锁定账号通常需要先看详情与安全上下文。' : 'Locked accounts usually need detail review with security context first.')
                          : (zh ? '适合先按部门、角色或状态继续缩小范围。' : 'Narrow the scope further by department, role, or status.')
                    }
                  />
                  <DetailKeyValueItem
                    label="02"
                    value={
                      selectedUsers.length > 0
                        ? (zh ? '再执行启停或导出' : 'Then run enable/disable or export')
                        : (zh ? '再查看详情或角色绑定' : 'Then inspect details or role bindings')
                    }
                  />
                  <DetailKeyValueItem
                    label="03"
                    value={selectedUsers.length === 0 && canCreateUser ? (zh ? '最后补充新增用户' : 'Finally add new users') : (zh ? '最后恢复常规巡检' : 'Finally return to routine inspection')}
                    className="md:col-span-2"
                  />
                </DetailKeyValueSection>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={userFocusSummary.badgeVariant}>{userFocusSummary.badge}</Badge>
                    <Badge variant="mono">
                      {zh ? `当前范围 ${userReviewStats.total} 个用户` : `${userReviewStats.total} users in scope`}
                    </Badge>
                    {selectedUsers.length > 0 ? (
                      <Badge variant="warning">
                        {zh ? `已选 ${selectedUsers.length} 个` : `${selectedUsers.length} selected`}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{userFocusSummary.title}</div>
                  <div className="text-xs leading-5 text-slate-600">{userFocusSummary.description}</div>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '启用中' : 'Active'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{userReviewStats.active}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '可正常登录并加载权限快照。' : 'Can sign in and load permission snapshots.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '停用中' : 'Inactive'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{userReviewStats.inactive}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '建议复核恢复启用条件。' : 'Review whether they can be re-enabled.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '锁定账号' : 'Locked'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{userReviewStats.locked}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '建议结合安全事件先复核。' : 'Review with security events first.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '已绑角色' : 'Role Bound'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{userReviewStats.withRoles}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '已配置角色的账号数量。' : 'Accounts with at least one assigned role.'}</div>
                  </div>
                </div>
              </div>

              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '操作摘要' : 'Operation Summary'}
                description={zh ? '结合当前筛选和选择状态，快速判断下一步动作。' : 'Use the current filters and selection state to decide the next action.'}
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Current Outcome'}
                  value={userFocusSummary.title}
                  hint={userFocusSummary.description}
                  className="md:col-span-2"
                />
                <DetailKeyValueItem
                  label={zh ? '筛选状态' : 'Filter State'}
                  value={filters.status === 'all' ? copy.search.statusAll : filters.status === 'active' ? copy.search.statusEnabled : copy.search.statusDisabled}
                  hint={
                    searchQuery.trim()
                      ? `${zh ? '关键词' : 'Keyword'}: ${searchQuery.trim()}`
                      : zh ? '未设置关键词筛选' : 'No keyword filter applied'
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '下一步动作' : 'Next Action'}
                  value={userFocusSummary.nextAction}
                />
                <DetailKeyValueItem
                  label={zh ? '批量影响' : 'Batch Impact'}
                  value={
                    selectedUsers.length > 0
                      ? (zh
                        ? `待启用 ${selectedNeedsEnableReview} / 待禁用 ${selectedNeedsDisableReview}`
                        : `${selectedNeedsEnableReview} to enable / ${selectedNeedsDisableReview} to disable`)
                      : (zh ? '当前未选择用户' : 'No users selected')
                  }
                  hint={
                    selectedSelfProtectedCount > 0
                      ? (zh ? `已拦截 ${selectedSelfProtectedCount} 个当前登录账号风险项` : `${selectedSelfProtectedCount} current-account risky selections blocked`)
                      : (zh ? '当前选择未触发自保护限制' : 'No self-protection conflict in the current selection')
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '推荐操作' : 'Recommended Actions'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {(searchQuery.trim() || filters.departmentId !== 'all' || filters.roleId !== 'all' || filters.status !== 'all') ? (
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={() => {
                            setSearchQuery('');
                            setFilters({
                              departmentId: 'all',
                              roleId: 'all',
                              status: 'all',
                            });
                          }}
                        >
                          {zh ? '清空筛选条件' : 'Clear Filters'}
                        </Button>
                      ) : null}
                      {selectedUsers.length > 0 && canExportUser ? (
                        <Button type="button" variant="mono" size="pill" onClick={() => setDialogOpen('export', true)}>
                          {zh ? '导出当前选择' : 'Export Selection'}
                        </Button>
                      ) : null}
                      {selectedUsers.length === 0 && canCreateUser ? (
                        <Button type="button" variant="mono" size="pill" onClick={openAddDialog}>
                          {zh ? '新增用户' : 'Create User'}
                        </Button>
                      ) : null}
                    </div>
                  }
                />
              </DetailKeyValueSection>
            </div>
          </ManagementContentCard>

          <UserSearchForm
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
            departments={departments}
            roles={roles}
          />

          <ManagementContentCard>
            <UserTable
              data={paginatedData}
              selectedItems={selectedUsers}
              onSelectionChange={setSelectedUsers}
              onAction={handleAction}
              onStatusChange={async (user, enabled) => {
                openUserStatusConfirm(user, enabled, async () => {
                  try {
                    await api.batchUpdateStatus([String(user.id)], enabled ? 'active' : 'inactive');
                    await reload();
                  } catch {
                    toast.error(userMessages.statusUpdateFailed);
                    throw new Error('user status update failed');
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

          <UserDialogManager
            dialogs={dialogs}
            setDialogOpen={setDialogOpen}
            currentUser={currentUser}
            formData={formData}
            setFormData={setFormData}
            departments={departments}
            roles={roles}
            deleteDescription={currentUser ? buildUserDeleteDescription(currentUser) : ''}
            handlers={handlers}
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




















