import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { useRoles } from '../../hooks/useRoles';
import { UserFormData, User } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
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
import type { ExportOptions } from '../../../../shared/components/ui/DataImportExportDialog';
import { Power, PowerOff } from 'lucide-react';
import { ManagementActionBar, ManagementContentCard } from '../../../../shared/components/ui';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { getUserManagementCopy } from './userManagementCopy';

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
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getUserManagementCopy(language);
  const userMessages = createEntityFeedback(zh, copy.entity);
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

  return (
    <PageLayout
      title={copy.page.title}
      actions={canQueryUser ? (
        <ManagementActionBar>
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
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportUser ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateUser ? (
            <Button
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <UserPlus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
        </ManagementActionBar>
      ) : undefined}
    >
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






