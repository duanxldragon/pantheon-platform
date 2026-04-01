import React from 'react';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { DataImportExportDialog } from '../../../../../shared/components/ui/DataImportExportDialog';
import { UserForm } from './UserForm';
import { EnhancedUserDetailDialog } from './EnhancedUserDetailDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { RoleAssignmentDialog } from './RoleAssignmentDialog';
import { User, UserFormData, Department, Role } from '../../../types';

interface UserDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    detail: boolean;
    delete: boolean;
    resetPassword: boolean;
    role: boolean;
    import: boolean;
    export: boolean;
  };
  setDialogOpen: (name: string, open: boolean) => void;
  currentUser: User | null;
  formData: Partial<UserFormData>;
  setFormData: (data: Partial<UserFormData>) => void;
  departments: Department[];
  roles: Role[];
  deleteDescription?: string;
  handlers: {
    onAdd: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onResetPassword: (pwd: string) => void;
    onRoleAssigned: (roleIds: User['roleIds']) => void | Promise<void>;
    onImport: (file: File) => void;
    onExport: (options: any) => void;
  };
}

export const UserDialogManager: React.FC<UserDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  currentUser,
  formData,
  setFormData,
  departments,
  roles,
  deleteDescription,
  handlers
}) => {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = {
    importHeaders: zh
      ? ['用户名', '姓名', '邮箱', '手机号', '部门', '岗位', '角色']
      : ['Username', 'RealName', 'Email', 'Phone', 'Department', 'Position', 'Roles'],
  };

  return (
    <>
      {/* Add User */}
      <FormDialog
        title={`${t.actions.add} ${t.menu.systemUsers}`}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onAdd}
      >
        <UserForm 
          data={formData} 
          onChange={setFormData}
          departments={departments}
          roles={roles}
        />
      </FormDialog>

      {/* Edit User */}
      <FormDialog
        title={`${t.actions.edit} ${t.menu.systemUsers}`}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onEdit}
      >
        <UserForm 
          data={formData} 
          onChange={setFormData}
          departments={departments}
          roles={roles}
          isEdit 
        />
      </FormDialog>

      {/* User Detail */}
      {currentUser && (
        <EnhancedUserDetailDialog
          user={currentUser}
          open={dialogs.detail}
          onOpenChange={(open) => setDialogOpen('detail', open)}
        />
      )}

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={t.actions.delete}
        description={
          deleteDescription ||
          (currentUser
            ? `${t.common.confirm} ${t.actions.delete} ${currentUser.realName}?`
            : '')
        }
      />

      {/* Reset Password */}
      {currentUser && (
        <ResetPasswordDialog
          open={dialogs.resetPassword}
          onOpenChange={(open) => setDialogOpen('resetPassword', open)}
          onConfirm={handlers.onResetPassword}
          username={currentUser.username}
          realName={currentUser.realName}
        />
      )}

      {/* Assign Roles */}
      {currentUser && (
        <RoleAssignmentDialog
          open={dialogs.role}
          onOpenChange={(open) => setDialogOpen('role', open)}
          userId={currentUser.id}
          userName={currentUser.realName}
          currentRoleIds={currentUser.roleIds}
          onConfirm={handlers.onRoleAssigned}
        />
      )}

      {/* 导入导出 */}
      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={t.menu.systemUsers}
        onImport={handlers.onImport}
        templateHeaders={copy.importHeaders}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={t.menu.systemUsers}
        onExport={handlers.onExport}
      />
    </>
  );
};

