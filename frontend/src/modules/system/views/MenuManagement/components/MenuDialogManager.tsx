import React from 'react';

import { useLanguageStore } from '../../../../../stores/languageStore';
import { DataImportExportDialog } from '../../../../../shared/components/ui/DataImportExportDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import type { Menu } from '../../../types';
import { MenuForm } from './MenuForm';

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
    onExport: (options: any) => void;
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
  const { t } = useLanguageStore();

  return (
    <>
      <FormDialog
        title={`${t.actions.add} ${t.menu.systemMenus}`}
        open={dialogs.add}
      onOpenChange={(open) => setDialogOpen('add', open)}
      onSubmit={handlers.onSubmit}
    >
        <MenuForm data={formData} onChange={setFormData} menus={menus} statusHint={statusHint} />
      </FormDialog>

      <FormDialog
        title={`${t.actions.edit} ${t.menu.systemMenus}`}
        open={dialogs.edit}
      onOpenChange={(open) => setDialogOpen('edit', open)}
      onSubmit={handlers.onSubmit}
    >
        <MenuForm data={formData} onChange={setFormData} menus={menus} isEdit statusHint={statusHint} />
      </FormDialog>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={t.actions.delete}
        description={deleteDescription || (selectedMenu ? `${t.common.confirm} ${t.actions.delete} ${selectedMenu.name}?` : '')}
      />

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={t.menu.systemMenus}
        onImport={handlers.onImport}
        templateHeaders={['Name', 'Code', 'ParentId', 'Type', 'Path', 'Icon', 'Permission', 'Sort']}
      />

      <DataImportExportDialog
        open={dialogs.export}
        onOpenChange={(open) => setDialogOpen('export', open)}
        mode="export"
        resourceName={t.menu.systemMenus}
        onExport={handlers.onExport}
      />
    </>
  );
};
