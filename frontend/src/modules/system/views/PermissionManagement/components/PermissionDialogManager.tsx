import React from 'react';

import { DataImportExportDialog } from '../../../../../shared/components/ui/DataImportExportDialog';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, Permission, PermissionFormData } from '../../../types';
import { PermissionForm } from './PermissionForm';

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
    onExport: (options: any) => void;
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
  const zh = language === 'zh';
  const resourceName = zh ? '权限' : 'Permission';
  const copy = {
    addTitle: zh ? '新增权限' : 'Add Permission',
    editTitle: zh ? '编辑权限' : 'Edit Permission',
    addDescription: zh
      ? '创建权限后，可在角色授权中分配，并影响登录后的动态权限快照。'
      : 'New permissions can be assigned to roles and affect dynamic authorization snapshots after login.',
    editDescription: zh
      ? '修改权限配置后，相关角色与在线用户的权限快照会按策略刷新。'
      : 'Changes affect related roles and online user authorization snapshots according to refresh strategy.',
    deleteTitle: zh ? '删除权限' : 'Delete Permission',
    deleteFallback: selectedPermission
      ? zh
        ? `确认删除权限「${selectedPermission.name}」？`
        : `Are you sure you want to delete permission "${selectedPermission.name}"?`
      : '',
    cancelText: zh ? '取消' : 'Cancel',
    submitText: zh ? '确认提交' : 'Submit',
    submittingText: zh ? '提交中...' : 'Submitting...',
    importHeaders: ['Name', 'Code', 'Type', 'Module', 'Description'],
  };

  return (
    <>
      <FormDialog
        title={copy.addTitle}
        description={copy.addDescription}
        open={dialogs.add}
        onOpenChange={(open) => setDialogOpen('add', open)}
        onSubmit={handlers.onAdd}
        submitText={copy.submitText}
        cancelText={copy.cancelText}
        submittingText={copy.submittingText}
      >
        <PermissionForm data={formData} onChange={setFormData} menus={menus} />
      </FormDialog>

      <FormDialog
        title={copy.editTitle}
        description={copy.editDescription}
        open={dialogs.edit}
        onOpenChange={(open) => setDialogOpen('edit', open)}
        onSubmit={handlers.onEdit}
        submitText={copy.submitText}
        cancelText={copy.cancelText}
        submittingText={copy.submittingText}
      >
        <PermissionForm data={formData} onChange={setFormData} menus={menus} isEdit />
      </FormDialog>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.deleteTitle}
        description={deleteDescription || copy.deleteFallback}
        cancelText={copy.cancelText}
        confirmText={zh ? '确认删除' : 'Delete'}
        confirmingText={zh ? '删除中...' : 'Deleting...'}
      />

      <DataImportExportDialog
        open={dialogs.import}
        onOpenChange={(open) => setDialogOpen('import', open)}
        mode="import"
        resourceName={resourceName}
        onImport={handlers.onImport}
        templateHeaders={copy.importHeaders}
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
