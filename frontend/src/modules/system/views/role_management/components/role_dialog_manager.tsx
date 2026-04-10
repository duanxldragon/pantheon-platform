import React from 'react';

import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/data_import_export_dialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/delete_confirm_dialog';
import { useLanguageStore } from '../../../../../stores/language_store';
import { Menu, Role, RoleFormData } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';
import { AddRoleDialog } from './add_role_dialog';
import { PermissionConfigDialog } from './permission_config_dialog';
import { RoleDetailDialog } from './role_detail_dialog';
import { RoleUsersDialog } from './role_users_dialog';

interface RoleDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    detail: boolean;
    delete: boolean;
    permission: boolean;
    members: boolean;
    import: boolean;
    export: boolean;
  };
  setDialogOpen: (name: string, open: boolean) => void;
  selectedRole: Role | null;
  menus: Menu[];
  handlers: {
    onSubmit: (data: RoleFormData) => void;
    onDelete: () => void;
    onImport: (file: File) => void;
    onExport: (options: ExportOptions) => void;
  };
  onPermissionSuccess?: () => void;
  onMembersUpdate?: () => void;
  deleteDescription?: string;
}

export const RoleDialogManager: React.FC<RoleDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedRole,
  menus,
  handlers,
  onPermissionSuccess,
  onMembersUpdate,
  deleteDescription,
}) => {
  const { language } = useLanguageStore();
  const copy = getRoleManagementCopy(language).dialog;

  return (
    <>
      <AddRoleDialog
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onSubmit}
        menus={menus}
      />

      {selectedRole && (
        <AddRoleDialog
          open={dialogs.edit}
          onOpenChange={(open) => setDialogOpen('edit', open)}
          onSubmit={handlers.onSubmit}
          menus={menus}
          initialData={selectedRole}
        />
      )}

      {selectedRole && (
        <RoleDetailDialog
          role={selectedRole}
          open={dialogs.detail}
          onOpenChange={(open) => setDialogOpen('detail', open)}
        />
      )}

      {selectedRole && (
        <PermissionConfigDialog
          role={selectedRole}
          open={dialogs.permission}
          onOpenChange={(open) => setDialogOpen('permission', open)}
          menus={menus}
          onSuccess={onPermissionSuccess}
        />
      )}

      {selectedRole && (
        <RoleUsersDialog
          role={selectedRole}
          open={dialogs.members}
          onOpenChange={(open) => setDialogOpen('members', open)}
          onUpdate={onMembersUpdate}
        />
      )}

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.deleteTitle}
        description={deleteDescription || copy.deleteFallback(selectedRole?.name)}
      />

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









