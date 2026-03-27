import React from 'react';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { DataImportExportDialog } from '../../../../../shared/components/ui/DataImportExportDialog';
import { AddRoleDialog } from './AddRoleDialog';
import { RoleDetailDialog } from './RoleDetailDialog';
import { PermissionConfigDialog } from './PermissionConfigDialog';
import { RoleUsersDialog } from './RoleUsersDialog';
import { Role, Menu, RoleFormData } from '../../../types';

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
    onExport: (options: any) => void;
  };
  onPermissionSuccess?: () => void;
  deleteDescription?: string;
}

export const RoleDialogManager: React.FC<RoleDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedRole,
  menus,
  handlers,
  onPermissionSuccess,
  deleteDescription,
}) => {
  const { t } = useLanguageStore();

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
        />
      )}

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={t.actions.delete}
        description={
          deleteDescription ||
          (selectedRole
            ? `${t.common.confirm} ${t.actions.delete} ${selectedRole.name}?`
            : '')
        }
      />

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={t.menu.systemRoles}
        onImport={handlers.onImport}
        templateHeaders={['Name', 'Code', 'Description', 'Status', 'Type', 'Sort']}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={t.menu.systemRoles}
        onExport={handlers.onExport}
      />
    </>
  );
};

