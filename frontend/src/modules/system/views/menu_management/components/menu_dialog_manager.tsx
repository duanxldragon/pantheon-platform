import React from 'react';

import { useLanguageStore } from '../../../../../stores/language_store';
import { DataImportExportDialog, type ExportOptions } from '../../../../../shared/components/ui/data_import_export_dialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/delete_confirm_dialog';
import { FormDialogWrapper } from '../../../../../shared/components/ui';
import type { Menu } from '../../../types';
import { MenuForm } from './menu_form';
import { getMenuManagementCopy } from '../menu_management_copy';

interface MenuStatusHint {
  fieldDescription: string;
  title?: string;
  description?: string;
  tone?: 'info' | 'warning' | 'success';
}

interface MenuDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    import: boolean;
    export: boolean;
  };
  setDialogOpen: (name: string, open: boolean) => void;
  selectedMenu: Menu | null;
  formData: Partial<Menu>;
  setFormData: (data: Partial<Menu>) => void;
  menus: Menu[];
  handlers: {
    onSubmit: () => void;
    onDelete: () => void;
    onImport: (file: File) => void;
    onExport: (options: ExportOptions) => void;
  };
  deleteDescription?: string;
  statusHint?: MenuStatusHint;
}

export const MenuDialogManager: React.FC<MenuDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedMenu,
  formData,
  setFormData,
  menus,
  handlers,
  deleteDescription,
  statusHint,
}) => {
  const { language } = useLanguageStore();
  const copy = getMenuManagementCopy(language);

  return (
    <>
      <FormDialogWrapper
        title={copy.dialog.addTitle}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onSubmit}
        size="lg"
      >
        <MenuForm data={formData} onChange={setFormData} menus={menus} statusHint={statusHint} />
      </FormDialogWrapper>

      <FormDialogWrapper
        title={copy.dialog.editTitle}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onSubmit}
        size="lg"
      >
        <MenuForm data={formData} onChange={setFormData} menus={menus} isEdit statusHint={statusHint} />
      </FormDialogWrapper>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.dialog.deleteTitle}
        description={deleteDescription || copy.dialog.deleteFallback(selectedMenu?.name)}
      />

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={copy.dialog.resourceName}
        onImport={handlers.onImport}
        templateHeaders={copy.templateHeaders}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={copy.dialog.resourceName}
        onExport={handlers.onExport}
      />
    </>
  );
};














