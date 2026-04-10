import React from 'react';
import { Badge } from '../../../../../components/ui/badge';

import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { useLanguageStore } from '../../../../../stores/language_store';
import {
  DetailDialogWrapper,
  DetailKeyValueItem,
  DetailKeyValueSection,
} from '../../../../../shared/components/ui';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/delete_confirm_dialog';
import { FormDialogWrapper } from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { getDataDictionaryCopy } from '../data_dictionary_copy';

import type { DictItem } from './dict_data_table';
import type { DictTypeItem } from './dict_type_sidebar';

export interface DictTypeForm {
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface DictDialogManagerProps {
  dialogs: {
    detail: boolean;
    detailType: boolean;
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
  selectedType: DictTypeItem | null;
  currentPage: number;
  totalPages: number;
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
  selectedType,
  currentPage,
  totalPages,
  selectedTypeForm,
  setSelectedTypeForm,
  onSubmitItem,
  onDeleteItem,
  onSubmitType,
  onDeleteType,
  loading,
}) => {
  const { language } = useLanguageStore();
  const copy = getDataDictionaryCopy(language).dialog;
  const zh = language === 'zh';
  const renderSummaryCard = (label: string, value: React.ReactNode, hint?: string) => (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
  const itemStatusVariant = selectedItem?.status === 'active' ? 'success' : 'warning';
  const typeStatusVariant = selectedType?.status === 'active' ? 'success' : 'warning';
  const itemDraftStatus = itemForm.status ?? 'active';
  const typeDraftStatus = selectedTypeForm.status ?? 'active';
  const itemDraftReady = Boolean(selectedTypeCode && itemForm.dictLabel && itemForm.dictValue);
  const typeDraftReady = Boolean(selectedTypeForm.name && selectedTypeForm.code);
  const itemSortValue = itemForm.sort ?? 0;
  const itemValueLength = `${String(itemForm.dictValue ?? '').length}`;
  const typeDescriptionLength = `${String(selectedTypeForm.description ?? '').length}`;

  return (
    <>
      <FormDialogWrapper
        title={dialogs.add ? copy.addItemTitle : copy.editItemTitle}
        open={dialogs.add || dialogs.edit}
        onOpenChange={(open) => setDialogOpen(dialogs.add ? 'add' : 'edit', open)}
        onSubmit={onSubmitItem}
        submitText={copy.save}
        cancelText={copy.cancel}
        loading={!!loading}
        size="lg"
      >
        <div className="space-y-4">
          <DetailKeyValueSection
            eyebrow="CONFIG"
            title={zh ? '字典项配置摘要' : 'Dictionary Item Config'}
            description={
              zh
                ? '先确认当前所属类型、状态和排序，再继续填写标签和值。'
                : 'Confirm parent type, status, and sort order before filling in the label and value.'
            }
          >
            <DetailKeyValueItem label={copy.fields.type} value={selectedTypeName || selectedTypeCode || '-'} />
            <DetailKeyValueItem
              label={copy.fields.status}
              value={<Badge variant={itemDraftStatus === 'active' ? 'success' : 'warning'}>{itemDraftStatus === 'active' ? copy.statusEnabled : copy.statusDisabled}</Badge>}
            />
            <DetailKeyValueItem
              label={copy.fields.sort}
              value={itemSortValue}
              hint={zh ? '数值越小通常越靠前。' : 'Lower values usually appear earlier.'}
            />
            <DetailKeyValueItem
              label={zh ? '填写进度' : 'Draft Status'}
              value={<Badge variant={itemDraftReady ? 'success' : 'info'}>{itemDraftReady ? (zh ? '可提交' : 'Ready') : (zh ? '待补全' : 'Incomplete')}</Badge>}
            />
          </DetailKeyValueSection>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.type} required>
              <Input value={selectedTypeCode} disabled className="bg-slate-50" />
            </FormField>
            <FormField label={copy.fields.sort} required>
              <Input
                type="number"
                value={itemForm.sort ?? 0}
                onChange={(event) => setItemForm({ ...itemForm, sort: Number(event.target.value) })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.label} required>
              <Input
                value={itemForm.dictLabel ?? ''}
                onChange={(event) => setItemForm({ ...itemForm, dictLabel: event.target.value })}
                placeholder={copy.placeholders.label}
              />
            </FormField>
            <FormField label={copy.fields.value} required>
              <Input
                value={itemForm.dictValue ?? ''}
                onChange={(event) => setItemForm({ ...itemForm, dictValue: event.target.value })}
                placeholder={copy.placeholders.value}
              />
            </FormField>
          </div>

          <FormField label={copy.fields.status}>
            <Select
              value={itemForm.status ?? 'active'}
              onValueChange={(val) => setItemForm({ ...itemForm, status: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={copy.fields.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{copy.statusEnabled}</SelectItem>
                <SelectItem value="inactive">{copy.statusDisabled}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={copy.fields.remark}>
            <Textarea
              value={itemForm.remark ?? ''}
              onChange={(event) => setItemForm({ ...itemForm, remark: event.target.value })}
              placeholder={copy.placeholders.remark}
              className="resize-none"
            />
          </FormField>

          <DetailKeyValueSection
            eyebrow="CHECK"
            title={zh ? '提交前复核' : 'Pre-submit Review'}
            description={
              zh
                ? '用于确认标签和值是否清晰稳定，避免后续枚举值被误用。'
                : 'Confirm label and value clarity before saving to avoid unstable enum usage.'
            }
          >
            <DetailKeyValueItem label={copy.fields.label} value={itemForm.dictLabel || '-'} />
            <DetailKeyValueItem label={copy.fields.value} value={itemForm.dictValue || '-'} />
            <DetailKeyValueItem
              label={zh ? '值长度' : 'Value Length'}
              value={itemValueLength}
              hint={zh ? '帮助区分短码值和长文本值。' : 'Helps distinguish short codes from long text values.'}
            />
            <DetailKeyValueItem
              label={copy.fields.remark}
              value={itemForm.remark || (zh ? '暂无备注' : 'No remark yet')}
              className="md:col-span-2"
            />
          </DetailKeyValueSection>
        </div>
      </FormDialogWrapper>

      <DetailDialogWrapper
        open={dialogs.detail}
        onOpenChange={(open) => setDialogOpen('detail', open)}
        title={selectedItem?.dictLabel || copy.addItemTitle}
        description={selectedItem ? `${selectedTypeName || selectedTypeCode || '-'} / ${selectedItem.dictValue}` : undefined}
        size="xl"
      >
        {selectedItem ? (
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {renderSummaryCard(copy.fields.type, selectedTypeName || selectedTypeCode || '-')}
              {renderSummaryCard(copy.fields.value, selectedItem.dictValue)}
              {renderSummaryCard(
                copy.fields.status,
                <Badge variant={itemStatusVariant}>{selectedItem.status === 'active' ? copy.statusEnabled : copy.statusDisabled}</Badge>,
                zh ? '用于快速判断当前字典项是否参与前端/后端枚举流转。' : 'Quickly shows whether this item participates in enum flows.',
              )}
            </section>

            <DetailKeyValueSection
              eyebrow="ITEM"
              title={selectedItem.dictLabel}
              description={selectedItem.remark || (zh ? '字典项详情摘要。' : 'Dictionary item summary.')}
            >
              <DetailKeyValueItem label={copy.fields.type} value={selectedTypeName || selectedTypeCode || '-'} />
              <DetailKeyValueItem label={copy.fields.value} value={selectedItem.dictValue} />
              <DetailKeyValueItem label={copy.fields.sort} value={selectedItem.sort} />
              <DetailKeyValueItem
                label={copy.fields.status}
                value={<Badge variant={itemStatusVariant}>{selectedItem.status === 'active' ? copy.statusEnabled : copy.statusDisabled}</Badge>}
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="STATE"
              title={zh ? '使用状态' : 'Usage State'}
              description={
                zh ? '用于判断当前字典项是否适合作为稳定枚举值继续被引用。' : 'Used to judge whether this item remains safe for stable enum references.'
              }
            >
              <DetailKeyValueItem
                label={zh ? '排序权重' : 'Sort Priority'}
                value={selectedItem.sort}
                hint={zh ? '数值越小通常越靠前。' : 'Lower values usually appear earlier.'}
              />
              <DetailKeyValueItem
                label={zh ? '值长度' : 'Value Length'}
                value={selectedItem.dictValue.length}
                hint={zh ? '用于快速识别短码值或较长文本值。' : 'Helps distinguish short codes from longer values.'}
              />
              <DetailKeyValueItem
                label={zh ? '备注状态' : 'Remark State'}
                value={selectedItem.remark ? (zh ? '已补充说明' : 'Has Notes') : (zh ? '无补充说明' : 'No Notes')}
              />
              <DetailKeyValueItem
                label={zh ? '样式状态' : 'Style State'}
                value={selectedItem.cssClass ? (zh ? '已配置样式类' : 'Style Class Set') : (zh ? '未配置样式类' : 'No Style Class')}
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="META"
              title={zh ? '补充信息' : 'Additional Info'}
              description={zh ? '用于查看样式类和备注。' : 'Used to review style class and remark.'}
            >
              <DetailKeyValueItem label={zh ? '样式类' : 'Style Class'} value={selectedItem.cssClass || '-'} />
              <DetailKeyValueItem label={copy.fields.remark} value={selectedItem.remark || '-'} className="md:col-span-2" />
            </DetailKeyValueSection>
          </div>
        ) : null}
      </DetailDialogWrapper>

      <DetailDialogWrapper
        open={dialogs.detailType}
        onOpenChange={(open) => setDialogOpen('detailType', open)}
        title={selectedType?.name || copy.fields.type}
        description={
          selectedType
            ? `${selectedType.code} · ${selectedType.status === 'active' ? copy.statusEnabled : copy.statusDisabled}`
            : undefined
        }
        size="lg"
      >
        {selectedType ? (
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {renderSummaryCard(copy.fields.typeCode, selectedType.code)}
              {renderSummaryCard(zh ? '条目数量' : 'Items', selectedType.itemCount ?? 0)}
              {renderSummaryCard(
                copy.fields.status,
                <Badge variant={typeStatusVariant}>{selectedType.status === 'active' ? copy.statusEnabled : copy.statusDisabled}</Badge>,
                zh ? '用于判断该类型是否仍作为主线字典参与配置。' : 'Shows whether this type remains part of the active dictionary flow.',
              )}
            </section>

            <DetailKeyValueSection
              eyebrow="TYPE"
              title={selectedType.name}
              description={selectedType.description || (zh ? '字典类型详情摘要。' : 'Dictionary type summary.')}
            >
              <DetailKeyValueItem label={copy.fields.typeCode} value={selectedType.code} />
              <DetailKeyValueItem
                label={copy.fields.status}
                value={<Badge variant={typeStatusVariant}>{selectedType.status === 'active' ? copy.statusEnabled : copy.statusDisabled}</Badge>}
              />
              <DetailKeyValueItem label={zh ? '条目数量' : 'Items'} value={selectedType.itemCount ?? 0} />
              <DetailKeyValueItem label={zh ? '分页位置' : 'Page Position'} value={`${currentPage} / ${totalPages}`} />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="STATE"
              title={zh ? '维护状态' : 'Maintenance State'}
              description={
                zh ? '用于快速判断该类型当前规模、分页位置和维护上下文。' : 'Used to quickly review current scale, pagination, and maintenance context.'
              }
            >
              <DetailKeyValueItem
                label={zh ? '当前页' : 'Current Page'}
                value={`${currentPage} / ${totalPages}`}
                hint={zh ? '对应当前右侧字典项列表位置。' : 'Matches the current item list position on the right.'}
              />
              <DetailKeyValueItem
                label={zh ? '规模判断' : 'Scale'}
                value={
                  (selectedType.itemCount ?? 0) >= 20
                    ? zh ? '大字典' : 'Large'
                    : (selectedType.itemCount ?? 0) >= 8
                      ? zh ? '中字典' : 'Medium'
                      : zh ? '小字典' : 'Small'
                }
              />
              <DetailKeyValueItem
                label={zh ? '编码长度' : 'Code Length'}
                value={selectedType.code.length}
              />
              <DetailKeyValueItem
                label={zh ? '说明状态' : 'Description State'}
                value={selectedType.description ? (zh ? '已补充说明' : 'Has Description') : (zh ? '无说明' : 'No Description')}
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="META"
              title={zh ? '补充说明' : 'Additional Notes'}
              description={zh ? '用于查看当前字典类型的说明和后续维护上下文。' : 'Used to review the description and maintenance context for the current type.'}
            >
              <DetailKeyValueItem label={copy.fields.typeName} value={selectedType.name} />
              <DetailKeyValueItem label={copy.fields.type} value={selectedTypeName || selectedType.code} />
              <DetailKeyValueItem
                label={copy.fields.remark}
                value={selectedType.description || '-'}
                className="md:col-span-2"
              />
            </DetailKeyValueSection>
          </div>
        ) : null}
      </DetailDialogWrapper>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => setDialogOpen('delete', open)}
        onConfirm={onDeleteItem}
        title={copy.deleteTitle}
        itemName={selectedItem?.dictLabel}
        loading={!!loading}
        cancelText={copy.cancel}
        confirmText={copy.delete}
        confirmingText={copy.loading}
      />

      <FormDialogWrapper
        title={dialogs.addType ? copy.addTypeTitle : copy.editTypeTitle}
        open={dialogs.addType || dialogs.editType}
        onOpenChange={(open) => setDialogOpen(dialogs.addType ? 'addType' : 'editType', open)}
        onSubmit={onSubmitType}
        submitText={copy.save}
        cancelText={copy.cancel}
        loading={!!loading}
        size="lg"
      >
        <div className="space-y-4">
          <DetailKeyValueSection
            eyebrow="CONFIG"
            title={zh ? '字典类型配置摘要' : 'Dictionary Type Config'}
            description={
              zh
                ? '先确认类型编码、启用状态和说明完整度，再提交类型变更。'
                : 'Confirm code, status, and description completeness before saving type changes.'
            }
          >
            <DetailKeyValueItem label={copy.fields.typeName} value={selectedTypeForm.name || '-'} />
            <DetailKeyValueItem label={copy.fields.typeCode} value={selectedTypeForm.code || '-'} />
            <DetailKeyValueItem
              label={copy.fields.status}
              value={<Badge variant={typeDraftStatus === 'active' ? 'success' : 'warning'}>{typeDraftStatus === 'active' ? copy.statusEnabled : copy.statusDisabled}</Badge>}
            />
            <DetailKeyValueItem
              label={zh ? '填写进度' : 'Draft Status'}
              value={<Badge variant={typeDraftReady ? 'success' : 'info'}>{typeDraftReady ? (zh ? '可提交' : 'Ready') : (zh ? '待补全' : 'Incomplete')}</Badge>}
            />
          </DetailKeyValueSection>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.typeName} required>
              <Input
                value={selectedTypeForm.name}
                onChange={(e) => setSelectedTypeForm({ ...selectedTypeForm, name: e.target.value })}
                placeholder={copy.placeholders.typeName}
              />
            </FormField>
            <FormField label={copy.fields.typeCode} required>
              <Input
                value={selectedTypeForm.code}
                onChange={(e) => setSelectedTypeForm({ ...selectedTypeForm, code: e.target.value })}
                placeholder={copy.placeholders.typeCode}
                disabled={dialogs.editType}
              />
            </FormField>
          </div>

          <FormField label={copy.fields.status}>
            <Select
              value={selectedTypeForm.status}
              onValueChange={(val) => setSelectedTypeForm({ ...selectedTypeForm, status: val as DictTypeForm['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder={copy.fields.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{copy.statusEnabled}</SelectItem>
                <SelectItem value="inactive">{copy.statusDisabled}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={copy.fields.remark}>
            <Textarea
              value={selectedTypeForm.description ?? ''}
              onChange={(e) => setSelectedTypeForm({ ...selectedTypeForm, description: e.target.value })}
              placeholder={copy.placeholders.typeDesc}
              className="resize-none"
            />
          </FormField>

          {!dialogs.addType ? (
            <div className="text-xs text-slate-400">
              {copy.currentType}: {selectedTypeName || '-'} ({selectedTypeCode || '-'})
            </div>
          ) : null}

          <DetailKeyValueSection
            eyebrow="CHECK"
            title={zh ? '保存前复核' : 'Pre-save Review'}
            description={
              zh
                ? '用于确认类型编码是否稳定，说明是否足够支持后续维护。'
                : 'Verify the code remains stable and the description is clear enough for future maintenance.'
            }
          >
            <DetailKeyValueItem
              label={zh ? '目标类型' : 'Target Type'}
              value={`${selectedTypeForm.name || '-'} / ${selectedTypeForm.code || '-'}`}
            />
            <DetailKeyValueItem
              label={zh ? '说明长度' : 'Description Length'}
              value={typeDescriptionLength}
              hint={zh ? '较长说明更适合表达字典使用边界。' : 'Longer notes better explain usage boundaries.'}
            />
            <DetailKeyValueItem
              label={zh ? '当前上下文' : 'Current Context'}
              value={!dialogs.addType ? `${selectedTypeName || '-'} (${selectedTypeCode || '-'})` : (zh ? '新增类型' : 'New type')}
            />
            <DetailKeyValueItem
              label={copy.fields.remark}
              value={selectedTypeForm.description || (zh ? '暂无说明' : 'No description yet')}
              className="md:col-span-2"
            />
          </DetailKeyValueSection>
        </div>
      </FormDialogWrapper>

      <DeleteConfirmDialog
        open={dialogs.deleteType}
        onOpenChange={(open) => setDialogOpen('deleteType', open)}
        onConfirm={onDeleteType}
        title={copy.deleteTitle}
        itemName={selectedTypeName || selectedTypeCode}
        loading={!!loading}
        cancelText={copy.cancel}
        confirmText={copy.delete}
        confirmingText={copy.loading}
      />
    </>
  );
};














