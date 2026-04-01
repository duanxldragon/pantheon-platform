import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { useRoles } from '../../hooks/useRoles';
import { UserFormData, User } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Trash2, Download, UserPlus, Upload } from '../../../../shared/components/ui/icons';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { useCSVImportExport } from '../../../../shared/hooks/useCSVImportExport';
import { csvTemplates } from '../../../../shared/utils/csvTemplates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/authStore';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import { Power, PowerOff } from 'lucide-react';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback, createResetPasswordMessages } from '../../utils/feedback';

// 导入拆分后的子组件和 Hook
import { UserTable } from './components/UserTable';
import { UserSearchForm } from './components/UserSearchForm';
import { UserDialogManager } from './components/UserDialogManager';
import { useUserTable } from './hooks/useUserTable';

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
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const userMessages = createEntityFeedback(zh, { zh: '用户', en: 'User', enPlural: 'users' });
  const resetPasswordMessages = createResetPasswordMessages(zh);
  const copy = zh
    ? {
        validation: {
          usernameRequired: '请输入用户名。',
          realNameRequired: '请输入姓名。',
          emailRequired: '请输入邮箱地址。',
          emailInvalid: '请输入正确的邮箱地址。',
          phoneRequired: '请输入手机号。',
          departmentRequired: '请选择所属部门。',
          departmentMissing: '所选部门不存在，请重新选择。',
          departmentInactive: '所属部门已被禁用，请先启用部门。',
          roleRequired: '请至少分配一个角色。',
          roleInvalid: '存在无效角色，请重新选择。',
          passwordRequired: '新建用户时必须设置初始密码。',
        },
        actionLabels: {
          add: '新增',
          edit: '编辑',
          delete: '删除',
          resetPassword: '重置密码',
          roleAssignment: '角色分配',
          import: '导入',
          export: '导出',
          detail: '详情',
          roleGuard: '角色分配授权',
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
        confirms: {
          batchDeleteTitle: '确认批量删除用户',
          deleteText: '确认删除',
        },
      }
    : {
        validation: {
          usernameRequired: 'Please enter the username.',
          realNameRequired: 'Please enter the real name.',
          emailRequired: 'Please enter the email address.',
          emailInvalid: 'Please enter a valid email address.',
          phoneRequired: 'Please enter the phone number.',
          departmentRequired: 'Please select a department.',
          departmentMissing: 'The selected department does not exist.',
          departmentInactive: 'The selected department is inactive.',
          roleRequired: 'Please assign at least one role.',
          roleInvalid: 'One or more selected roles are invalid.',
          passwordRequired: 'An initial password is required when creating a user.',
        },
        actionLabels: {
          add: 'create',
          edit: 'edit',
          delete: 'delete',
          resetPassword: 'reset password',
          roleAssignment: 'role assignment',
          import: 'import',
          export: 'export',
          detail: 'details',
          roleGuard: 'role assignment',
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
        confirms: {
          batchDeleteTitle: 'Confirm batch delete users',
          deleteText: 'Delete',
        },
      };
  const authUser = useAuthStore((state) => state.user);
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
    onDataImported: (data) => {
      toast.success(t.systemManage.importExport.importSuccess.replace('{count}', String(data.length)));
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

  const buildUserSelfProtectedMessage = (action: 'delete' | 'disable' | 'batch-delete' | 'batch-disable') => {
    if (zh) {
      return action === 'delete' || action === 'batch-delete'
        ? '当前登录账号不能删除自己，请使用其他管理员账号操作。'
        : '当前登录账号不能禁用自己，请使用其他管理员账号操作。';
    }

    return action === 'delete' || action === 'batch-delete'
      ? 'You cannot delete the account currently in use.'
      : 'You cannot disable the account currently in use.';
  };

  const buildUserDeleteDescription = (user: User) => {
    const roleCount = user.roleNames?.length || 0;

    if (isCurrentLoginUser(user.id)) {
      return buildUserSelfProtectedMessage('delete');
    }

    if (zh) {
      return user.status === 'active'
        ? `确认删除用户「${user.realName}」？删除后将立即强制其登录会话失效，移除 ${roleCount} 个角色绑定及组织关系，且不可恢复。`
        : `确认删除用户「${user.realName}」？删除后将移除 ${roleCount} 个角色绑定及组织关系，且不可恢复。`;
    }

    return user.status === 'active'
      ? `Delete user "${user.realName}"? This immediately revokes active sessions, removes ${roleCount} role bindings and organization relations, and cannot be undone.`
      : `Delete user "${user.realName}"? This removes ${roleCount} role bindings and organization relations, and cannot be undone.`;
  };

  const buildUserDeleteBlockedMessage = (items: User[], isBatch = false) => {
    const details = items
      .slice(0, 3)
      .map((item) => item.realName || item.username)
      .join(zh ? '、' : ', ');

    if (zh) {
      return `${isBatch ? '批量删除已拦截：' : '删除已拦截：'}${details} 中包含当前登录账号，请使用其他管理员账号操作。`;
    }

    return `${isBatch ? 'Batch delete blocked: ' : 'Delete blocked: '}${details} includes the current signed-in account.`;
  };

  const buildUserBatchDeleteDescription = (items: User[]) => {
    const activeCount = items.filter((user) => user.status === 'active').length;
    const roleBindingCount = items.reduce((total, user) => total + (user.roleNames?.length || 0), 0);

    if (zh) {
      return activeCount > 0
        ? `确认批量删除 ${items.length} 个用户？其中 ${activeCount} 个账号当前处于启用状态，删除后将立即强制其会话失效，并移除共 ${roleBindingCount} 个角色绑定与组织关系。`
        : `确认批量删除 ${items.length} 个用户？删除后将移除共 ${roleBindingCount} 个角色绑定与组织关系，且不可恢复。`;
    }

    return activeCount > 0
      ? `Delete ${items.length} users? ${activeCount} accounts are still active. This immediately revokes their sessions and removes ${roleBindingCount} role bindings and organization relations.`
      : `Delete ${items.length} users? This removes ${roleBindingCount} role bindings and organization relations and cannot be undone.`;
  };

  const buildUserStatusCopy = (user: User, enabled: boolean) => {
    if (zh) {
      return {
        title: enabled ? '确认启用用户' : '确认禁用用户',
        description: enabled
          ? `用户「${user.realName}」启用后将恢复登录能力，并在下次鉴权时重新加载动态菜单与权限快照。`
          : `用户「${user.realName}」禁用后将立即强制其会话失效，并撤销当前动态菜单与权限快照。`,
        confirmText: enabled ? '确认启用' : '确认禁用',
        success: enabled
          ? `已启用用户「${user.realName}」，其登录能力已恢复`
          : `已禁用用户「${user.realName}」，相关会话已强制失效`,
      };
    }

    return {
      title: enabled ? 'Confirm enable user' : 'Confirm disable user',
      description: enabled
        ? `Enabling user "${user.realName}" restores sign-in access and reloads menus and permission snapshots on the next authorization check.`
        : `Disabling user "${user.realName}" immediately revokes active sessions and removes current menu and permission snapshots.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success: enabled
        ? `User "${user.realName}" enabled. Sign-in access was restored.`
        : `User "${user.realName}" disabled. Related sessions were revoked.`,
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
    if (zh) {
      return {
        title: `确认批量${enabled ? '启用' : '禁用'}用户`,
        description: enabled
          ? `将批量启用 ${targetUsers.length} 个用户，并在其后续鉴权时重新加载动态菜单与权限快照。`
          : `将批量禁用 ${targetUsers.length} 个用户，并立即强制这些用户的会话失效。`,
        confirmText: `确认${enabled ? '启用' : '禁用'}`,
        success: enabled
          ? `已批量启用 ${targetUsers.length} 个用户`
          : `已批量禁用 ${targetUsers.length} 个用户，相关会话已强制失效`,
      };
    }

    return {
      title: `Confirm batch ${enabled ? 'enable' : 'disable'} users`,
      description: enabled
        ? `This enables ${targetUsers.length} users and reloads their menus and permission snapshots on the next authorization check.`
        : `This disables ${targetUsers.length} users and immediately revokes their sessions.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success: enabled
        ? `${targetUsers.length} users enabled.`
        : `${targetUsers.length} users disabled. Related sessions were revoked.`,
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
      return zh
        ? `角色「${inactiveRole.name}」已被禁用，请先启用后再分配。`
        : `Role "${inactiveRole.name}" is inactive.`;
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
            await reload();
          });
          return;
        }

        await api.updateUser(String(currentUser.id), updatePayload);
        toast.success(userMessages.updateSuccess);
        setDialogOpen('edit', false);
        resetUserForm();
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
        toast.success(resetPasswordMessages.success);
        setDialogOpen('resetPassword', false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : resetPasswordMessages.failed);
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
        zh
          ? `用户「${currentUser.realName}」角色已更新，动态菜单与权限快照将立即刷新。`
          : `Roles for "${currentUser.realName}" were updated. Menus and permission snapshots will refresh immediately.`,
      );

      await reload();
    },
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreateUser, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (options: any) => {
      if (!ensureActionPermission(canExportUser, copy.actionLabels.export)) return;
      const dataToExport = options.scope === 'selected' && selectedUsers.length > 0
        ? selectedUsers
        : users;
      await csvHandler.handleExport(dataToExport);
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
    pageTitle: t.menu.systemUsers,
    dialogs,
    protectedDialogs: {
      detail: copy.actionLabels.detail,
      role: copy.actionLabels.roleGuard,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: t.menu.systemUsers,
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
    pageTitle: t.menu.systemUsers,
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

  return (
    <PageLayout
      title={t.menu.systemUsers}
      actions={canQueryUser ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
          {selectedUsers.length > 0 && (
            <>
              {canUpdateUser && selectedUsersToEnable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchUserStatus(true)}
                  className="h-11 gap-2 rounded-2xl border-emerald-200/80 bg-emerald-50/80 px-4 text-emerald-700 shadow-sm shadow-emerald-100/60 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(selectedUsersToEnable.length)}
                </Button>
              ) : null}
              {canUpdateUser && selectedUsersToDisable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchUserStatus(false)}
                  className="h-11 gap-2 rounded-2xl border-amber-200/80 bg-amber-50/80 px-4 text-amber-700 shadow-sm shadow-amber-100/60 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(selectedUsersToDisable.length)}
                </Button>
              ) : null}
              {canDeleteUser ? (
                <Button 
                  variant="outline" 
                  onClick={handleBatchDelete} 
                  className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/60 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedUsers.length)}
                </Button>
              ) : null}
            </>
          )}
          {canCreateUser ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('import', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Upload className="w-4 h-4" />
              {t.actions.import}
            </Button>
          ) : null}
          {canExportUser ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {t.actions.export}
            </Button>
          ) : null}
          {canCreateUser ? (
            <Button
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <UserPlus className="w-4 h-4" />
              {t.actions.add}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryUser ? (
        <QueryAccessBoundary
          viewId="system-users"
          title={t.menu.systemUsers}
          queryPermission={systemPermissions.user.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
        <>
      {/* 1. 高级搜索区 */}
      <UserSearchForm
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        departments={departments}
        roles={roles}
      />

      {/* 2. 数据列表展示区 */}
      <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
      </Card>

      {/* 3. 对话框统一管理 */}
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
    </PageLayout>
  );
}






