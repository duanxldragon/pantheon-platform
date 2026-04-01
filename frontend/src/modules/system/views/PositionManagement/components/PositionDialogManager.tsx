import React from 'react';

import { useLanguageStore } from '../../../../../stores/languageStore';
import { DataImportExportDialog } from '../../../../../shared/components/ui/DataImportExportDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import type { Department, Position, User } from '../../../types';
import { PositionForm } from './PositionForm';
import { PositionUsersDialog } from './PositionUsersDialog';

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
    onExport: (options: any) => void;
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
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const templateHeaders = zh
    ? ['名称', '编码', '部门ID', '级别', '排序', '说明']
    : ['Name', 'Code', 'DepartmentId', 'Level', 'Sort', 'Description'];

  return (
    <>
      <FormDialog
        title={`${t.actions.add} ${t.menu.systemPositions}`}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onSubmit}
      >
        <PositionForm data={formData} onChange={setFormData} departments={departments} />
      </FormDialog>

      <FormDialog
        title={`${t.actions.edit} ${t.menu.systemPositions}`}
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
        title={t.actions.delete}
        description={
          deleteDescription ||
          (selectedPosition ? `${t.common.confirm} ${t.actions.delete} ${selectedPosition.name}?` : '')
        }
      />

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={t.menu.systemPositions}
        onImport={handlers.onImport}
        templateHeaders={templateHeaders}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={t.menu.systemPositions}
        onExport={handlers.onExport}
      />
    </>
  );
};
