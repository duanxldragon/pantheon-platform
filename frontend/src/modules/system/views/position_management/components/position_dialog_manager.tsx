import React from 'react';

import { useLanguageStore } from '../../../../../stores/language_store';
import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/data_import_export_dialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/delete_confirm_dialog';
import { FormDialogWrapper } from '../../../../../shared/components/ui';
import type { Department, Position, User } from '../../../types';
import { PositionForm } from './position_form';
import { PositionUsersDialog } from './position_users_dialog';
import { getPositionManagementCopy } from '../position_management_copy';

interface PositionDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    users: boolean;
    import: boolean;
    export: boolean;
  };
  setDialogOpen: (name: string, open: boolean) => void;
  selectedPosition: Position | null;
  formData: Partial<Position>;
  setFormData: (data: Partial<Position>) => void;
  departments: Department[];
  allUsers: User[];
  handlers: {
    onSubmit: () => void;
    onDelete: () => void;
    onImport: (file: File) => void;
    onExport: (options: ExportOptions) => void;
    onAssignUsers: (userIds: string[]) => void | Promise<void>;
    onUnassignUser: (userId: string) => void | Promise<void>;
  };
  deleteDescription?: string;
}

export const PositionDialogManager: React.FC<PositionDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedPosition,
  formData,
  setFormData,
  departments,
  allUsers,
  handlers,
  deleteDescription,
}) => {
  const { language } = useLanguageStore();
  const copy = getPositionManagementCopy(language);
  const resourceName = language === 'zh' ? copy.entity.zh : copy.entity.en;

  return (
    <>
      <FormDialogWrapper
        title={copy.dialog.addTitle}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onSubmit}
        size="lg"
      >
        <PositionForm data={formData} onChange={setFormData} departments={departments} />
      </FormDialogWrapper>

      <FormDialogWrapper
        title={copy.dialog.editTitle}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onSubmit}
        size="lg"
      >
        <PositionForm data={formData} onChange={setFormData} departments={departments} isEdit />
      </FormDialogWrapper>

      {selectedPosition && (
        <PositionUsersDialog
          position={selectedPosition}
          open={dialogs.users}
          onOpenChange={(open) => setDialogOpen('users', open)}
          allUsers={allUsers}
          currentUsers={allUsers.filter((user) => String(user.positionId ?? '') === String(selectedPosition.id))}
          onAssignUsers={handlers.onAssignUsers}
          onUnassignUser={handlers.onUnassignUser}
        />
      )}

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.actionLabels.delete}
        description={deleteDescription || copy.dialog.deleteFallback(selectedPosition?.name)}
      />

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={resourceName}
        onImport={handlers.onImport}
        templateHeaders={copy.dialog.importHeaders}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={resourceName}
        onExport={handlers.onExport}
      />
    </>
  );
};














