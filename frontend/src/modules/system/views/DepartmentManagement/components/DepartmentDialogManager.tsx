import React from 'react';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/DataImportExportDialog';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentMembersDialog } from './DepartmentMembersDialog';
import { Department, User } from '../../../types';
import { getDepartmentManagementCopy } from '../departmentManagementCopy';

interface DepartmentDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    members: boolean;
    import: boolean;
    export: boolean;
  };
  setDialogOpen: (name: string, open: boolean) => void;
  selectedDepartment: Department | null;
  formData: Partial<Department>;
  setFormData: (data: Partial<Department>) => void;
  departments: Department[];
  users: User[];
  handlers: {
    onSubmit: () => void;
    onDelete: () => void;
    onImport: (file: File) => void;
    onExport: (options: ExportOptions) => void;
    onAddMembers: (userIds: string[]) => void | Promise<void>;
    onRemoveMember: (userId: string) => void | Promise<void>;
  };
  deleteDescription?: string;
}

export const DepartmentDialogManager: React.FC<DepartmentDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedDepartment,
  formData,
  setFormData,
  departments,
  users,
  handlers,
  deleteDescription,
}) => {
  const { language } = useLanguageStore();
  const copy = getDepartmentManagementCopy(language);
  const resourceName = language === 'zh' ? copy.entity.zh : copy.entity.en;

  const getCurrentMembers = () => {
    if (!selectedDepartment) return [];
    return users.filter((user) => String(user.departmentId ?? '') === String(selectedDepartment.id));
  };

  return (
    <>
      <FormDialog
        title={copy.titles.addDialog}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onSubmit}
      >
        <DepartmentForm
          data={formData}
          onChange={setFormData}
          departments={departments}
          users={users}
        />
      </FormDialog>

      <FormDialog
        title={copy.titles.editDialog}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onSubmit}
      >
        <DepartmentForm
          data={formData}
          onChange={setFormData}
          departments={departments}
          users={users}
          isEdit
        />
      </FormDialog>

      {selectedDepartment && (
        <DepartmentMembersDialog
          department={selectedDepartment}
          open={dialogs.members}
          onOpenChange={(open) => setDialogOpen('members', open)}
          allUsers={users}
          currentMembers={getCurrentMembers()}
          onAddMembers={handlers.onAddMembers}
          onRemoveMember={handlers.onRemoveMember}
        />
      )}

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.actionLabels.delete}
        description={
          deleteDescription || copy.dialog.deleteFallback(selectedDepartment?.name)
        }
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
