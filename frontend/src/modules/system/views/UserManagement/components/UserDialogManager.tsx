import React from 'react';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/DataImportExportDialog';
import { Department, Role, User, UserFormData } from '../../../types';
import { getUserManagementCopy } from '../userManagementCopy';
import { EnhancedUserDetailDialog } from './EnhancedUserDetailDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { RoleAssignmentDialog } from './RoleAssignmentDialog';
import { UserForm } from './UserForm';

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
    onExport: (options: ExportOptions) => void;
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
  handlers,
}) => {
  const { language } = useLanguageStore();
  const copy = getUserManagementCopy(language).dialog;

  return (
    <>
      <FormDialog
        title={copy.addTitle}
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

      <FormDialog
        title={copy.editTitle}
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

      {currentUser && (
        <EnhancedUserDetailDialog
          user={currentUser}
          open={dialogs.detail}
          onOpenChange={(open) => setDialogOpen('detail', open)}
        />
      )}

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.deleteTitle}
        description={deleteDescription || copy.deleteFallback(currentUser?.realName)}
      />

      {currentUser && (
        <ResetPasswordDialog
          open={dialogs.resetPassword}
          onOpenChange={(open) => setDialogOpen('resetPassword', open)}
          onConfirm={handlers.onResetPassword}
          username={currentUser.username}
          realName={currentUser.realName}
        />
      )}

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

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={copy.resourceName}
        onImport={handlers.onImport}
        templateHeaders={copy.importHeaders}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={copy.resourceName}
        onExport={handlers.onExport}
      />
    </>
  );
};
