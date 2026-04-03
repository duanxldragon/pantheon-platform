import React from 'react';

import { useLanguageStore } from '../../../../../stores/languageStore';
import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/DataImportExportDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import type { Department, Position, User } from '../../../types';
import { PositionForm } from './PositionForm';
import { PositionUsersDialog } from './PositionUsersDialog';
import { getPositionManagementCopy } from '../positionManagementCopy';

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
      <FormDialog
        title={copy.dialog.addTitle}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onSubmit}
      >
        <PositionForm data={formData} onChange={setFormData} departments={departments} />
      </FormDialog>

      <FormDialog
        title={copy.dialog.editTitle}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onSubmit}
      >
        <PositionForm data={formData} onChange={setFormData} departments={departments} isEdit />
      </FormDialog>

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
