import React from 'react';

import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/data_import_export_dialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/delete_confirm_dialog';
import { FormDialogWrapper } from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { Menu, Permission, PermissionFormData } from '../../../types';
import { PermissionForm } from './permission_form';
import { getPermissionManagementCopy } from '../permission_management_copy';

interface PermissionDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    import: boolean;
    export: boolean;
  };
  setDialogOpen: (name: string, open: boolean) => void;
  selectedPermission: Permission | null;
  formData: Partial<PermissionFormData>;
  setFormData: (data: Partial<PermissionFormData>) => void;
  menus: Menu[];
  handlers: {
    onAdd: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onImport: (file: File) => void;
    onExport: (options: ExportOptions) => void;
  };
  deleteDescription?: string;
}

export const PermissionDialogManager: React.FC<PermissionDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedPermission,
  formData,
  setFormData,
  menus,
  handlers,
  deleteDescription,
}) => {
  const { language } = useLanguageStore();
  const copy = getPermissionManagementCopy(language).dialog;

  return (
    <>
      <FormDialogWrapper
        title={copy.addTitle}
        description={copy.addDescription}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onAdd}
        submitText={copy.submitText}
        cancelText={copy.cancelText}
        size="lg"
      >
        <PermissionForm data={formData} onChange={setFormData} menus={menus} />
      </FormDialogWrapper>

      <FormDialogWrapper
        title={copy.editTitle}
        description={copy.editDescription}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onEdit}
        submitText={copy.submitText}
        cancelText={copy.cancelText}
        size="lg"
      >
        <PermissionForm data={formData} onChange={setFormData} menus={menus} isEdit />
      </FormDialogWrapper>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.deleteTitle}
        description={deleteDescription || copy.deleteFallback(selectedPermission?.name)}
        cancelText={copy.cancelText}
        confirmText={copy.confirmDeleteText}
        confirmingText={copy.confirmingDeleteText}
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














