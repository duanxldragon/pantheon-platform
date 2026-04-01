import React from 'react';

import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { FormField } from '../../../../../shared/components/ui/FormField';

import type { DictItem } from './DictDataTable';

export interface DictTypeForm {
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface DictDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    addType: boolean;
    editType: boolean;
    deleteType: boolean;
  };
  setDialogOpen: (name: keyof DictDialogManagerProps['dialogs'], open: boolean) => void;
  selectedItem: DictItem | null;
  itemForm: Partial<DictItem>;
  setItemForm: (data: Partial<DictItem>) => void;
  selectedTypeCode: string;
  selectedTypeName?: string;
  selectedTypeForm: DictTypeForm;
  setSelectedTypeForm: (data: DictTypeForm) => void;
  onSubmitItem: () => void;
  onDeleteItem: () => void;
  onSubmitType: () => void;
  onDeleteType: () => void;
  loading?: boolean;
}

export const DictDialogManager: React.FC<DictDialogManagerProps> = ({
  dialogs,
  setDialogOpen,
  selectedItem,
  itemForm,
  setItemForm,
  selectedTypeCode,
  selectedTypeName,
  selectedTypeForm,
  setSelectedTypeForm,
  onSubmitItem,
  onDeleteItem,
  onSubmitType,
  onDeleteType,
  loading,
}) => {
  const { t } = useLanguageStore();

  return (
    <>
      <FormDialog
        title={dialogs.add ? t.systemManagement.dictionary.dialogs.addItemTitle : t.systemManagement.dictionary.dialogs.editItemTitle}
        open={dialogs.add || dialogs.edit}
        onOpenChange={(open) => setDialogOpen(dialogs.add ? 'add' : 'edit', open)}
        onSubmit={onSubmitItem}
        submitText={t.common.save}
        cancelText={t.common.cancel}
        submittingText={t.common.loading}
        loading={!!loading}
        width="sm:max-w-[720px]"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.systemManagement.dictionary.fields.type} required>
              <Input value={selectedTypeCode} disabled className="bg-slate-50" />
            </FormField>
            <FormField label={t.systemManagement.dictionary.fields.sort} required>
              <Input
                type="number"
                value={itemForm.sort ?? 0}
                onChange={(event) => setItemForm({ ...itemForm, sort: Number(event.target.value) })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.systemManagement.dictionary.fields.label} required>
              <Input
                value={itemForm.dictLabel ?? ''}
                onChange={(event) => setItemForm({ ...itemForm, dictLabel: event.target.value })}
                placeholder={t.systemManagement.dictionary.placeholders.label}
              />
            </FormField>
            <FormField label={t.systemManagement.dictionary.fields.value} required>
              <Input
                value={itemForm.dictValue ?? ''}
                onChange={(event) => setItemForm({ ...itemForm, dictValue: event.target.value })}
                placeholder={t.systemManagement.dictionary.placeholders.value}
              />
            </FormField>
          </div>

          <FormField label={t.systemManagement.dictionary.fields.status}>
            <Select
              value={itemForm.status ?? 'active'}
              onValueChange={(val) => setItemForm({ ...itemForm, status: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.systemManagement.dictionary.fields.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t.status.enabled}</SelectItem>
                <SelectItem value="inactive">{t.status.disabled}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t.systemManagement.dictionary.fields.remark}>
            <Textarea
              value={itemForm.remark ?? ''}
              onChange={(event) => setItemForm({ ...itemForm, remark: event.target.value })}
              placeholder={t.systemManagement.dictionary.placeholders.remark}
              className="resize-none"
            />
          </FormField>
        </div>
      </FormDialog>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={onDeleteItem}
        title={t.actions.delete}
        itemName={selectedItem?.dictLabel}
        loading={!!loading}
        cancelText={t.common.cancel}
        confirmText={t.common.delete}
        confirmingText={t.common.loading}
      />

      <FormDialog
        title={dialogs.addType ? t.systemManagement.dictionary.dialogs.addTypeTitle : t.systemManagement.dictionary.dialogs.editTypeTitle}
        open={dialogs.addType || dialogs.editType}
        onOpenChange={(open) => setDialogOpen(dialogs.addType ? 'addType' : 'editType', open)}
        onSubmit={onSubmitType}
        submitText={t.common.save}
        cancelText={t.common.cancel}
        submittingText={t.common.loading}
        loading={!!loading}
        width="sm:max-w-[720px]"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t.systemManagement.dictionary.fields.typeName} required>
              <Input
                value={selectedTypeForm.name}
                onChange={(e) => setSelectedTypeForm({ ...selectedTypeForm, name: e.target.value })}
                placeholder={t.systemManagement.dictionary.placeholders.typeName}
              />
            </FormField>
            <FormField label={t.systemManagement.dictionary.fields.typeCode} required>
              <Input
                value={selectedTypeForm.code}
                onChange={(e) => setSelectedTypeForm({ ...selectedTypeForm, code: e.target.value })}
                placeholder={t.systemManagement.dictionary.placeholders.typeCode}
                disabled={dialogs.editType}
              />
            </FormField>
          </div>

          <FormField label={t.systemManagement.dictionary.fields.status}>
            <Select
              value={selectedTypeForm.status}
              onValueChange={(val) => setSelectedTypeForm({ ...selectedTypeForm, status: val as DictTypeForm['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.systemManagement.dictionary.fields.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t.status.enabled}</SelectItem>
                <SelectItem value="inactive">{t.status.disabled}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t.systemManagement.dictionary.fields.remark}>
            <Textarea
              value={selectedTypeForm.description ?? ''}
              onChange={(e) => setSelectedTypeForm({ ...selectedTypeForm, description: e.target.value })}
              placeholder={t.systemManagement.dictionary.placeholders.typeDesc}
              className="resize-none"
            />
          </FormField>

          {!dialogs.addType ? (
            <div className="text-xs text-slate-400">
              {t.systemManagement.dictionary.currentType}: {selectedTypeName || '-'} ({selectedTypeCode || '-'})
            </div>
          ) : null}
        </div>
      </FormDialog>

      <DeleteConfirmDialog
        open={dialogs.deleteType}
        onOpenChange={(open) => setDialogOpen('deleteType', open)}
        onConfirm={onDeleteType}
        title={t.actions.delete}
        itemName={selectedTypeName || selectedTypeCode}
        loading={!!loading}
        cancelText={t.common.cancel}
        confirmText={t.common.delete}
        confirmingText={t.common.loading}
      />
    </>
  );
};

