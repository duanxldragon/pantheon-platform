import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Pencil, Plus, RefreshCcw, Search, Trash2, Upload } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementFocusCard,
  ManagementMetricCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useLanguageStore } from '../../../../stores/language_store';
import { useAuthStore } from '../../../auth/store/auth_store';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/use_query_permission_dialog_guard';
import { dictApi, type DictData, type DictType } from '../../api/dict_api';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { DictDataTable, type DictItem } from './components/dict_data_table';
import { DictDialogManager, type DictTypeForm } from './components/dict_dialog_manager';
import { DictTypeSidebar, type DictTypeItem } from './components/dict_type_sidebar';
import { getDataDictionaryCopy } from './data_dictionary_copy';

type ExportedDict = {
  version: string;
  exportedAt: string;
  types: Array<{
    name: string;
    code: string;
    description?: string;
    status: 'active' | 'inactive';
    items: Array<{
      label: string;
      value: string;
      description?: string;
      sort: number;
      status: 'active' | 'inactive';
    }>;
  }>;
};

type DialogState = {
  detail: boolean;
  detailType: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  addType: boolean;
  editType: boolean;
  deleteType: boolean;
};

const defaultDialogs: DialogState = {
  detail: false,
  detailType: false,
  add: false,
  edit: false,
  delete: false,
  addType: false,
  editType: false,
  deleteType: false,
};

const defaultTypeForm: DictTypeForm = {
  name: '',
  code: '',
  description: '',
  status: 'active',
};

function mapTypeItem(item: DictType, count = 0): DictTypeItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    status: item.status,
    itemCount: count,
  };
}

function mapDictItem(item: DictData): DictItem {
  return {
    id: item.id,
    dictLabel: item.label,
    dictValue: item.value,
    sort: item.sort,
    status: item.status,
    remark: item.description,
  };
}

function DictionarySummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function DataDictionary() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getDataDictionaryCopy(language);
  const dictionaryMessages = createEntityFeedback(zh, copy.entity.dictionary);
  const dictionaryItemMessages = createEntityFeedback(zh, copy.entity.item);
  const dictionaryTypeMessages = createEntityFeedback(zh, copy.entity.type);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryDictionary = hasPermission(systemPermissions.dictionary.query);
  const canCreateDictionary = hasPermission(systemPermissions.dictionary.create);
  const canUpdateDictionary = hasPermission(systemPermissions.dictionary.update);
  const canDeleteDictionary = hasPermission(systemPermissions.dictionary.delete);
  const canImportDictionary = hasPermission(systemPermissions.dictionary.import);
  const canExportDictionary = hasPermission(systemPermissions.dictionary.export);

  const [types, setTypes] = useState<DictTypeItem[]>([]);
  const [selectedTypeCode, setSelectedTypeCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<DictItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DictItem | null>(null);
  const [itemForm, setItemForm] = useState<Partial<DictItem>>({ status: 'active', sort: 0 });
  const [selectedTypeForm, setSelectedTypeForm] = useState<DictTypeForm>(defaultTypeForm);
  const [dialogs, setDialogs] = useState<DialogState>(defaultDialogs);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectedType = useMemo(() => types.find((item) => item.code === selectedTypeCode), [types, selectedTypeCode]);
  const selectedTypeItemCount = selectedType?.itemCount ?? items.length;
  const activeItemCount = items.filter((item) => item.status === 'active').length;
  const inactiveItemCount = Math.max(0, items.length - activeItemCount);
  const hasSearchFilter = searchTerm.trim().length > 0;
  const typeScaleLabel = selectedType
    ? selectedTypeItemCount >= 20
      ? zh ? '大字典' : 'Large'
      : selectedTypeItemCount >= 8
        ? zh ? '中字典' : 'Medium'
        : zh ? '小字典' : 'Small'
    : '-';
  const maintenanceFocus = selectedType
    ? selectedType.status === 'inactive'
      ? {
          variant: 'warning' as const,
          label: zh ? '优先确认类型状态' : 'Review type status first',
          hint: zh
            ? '当前类型已禁用，建议先确认是否仍需继续维护或重新启用。'
            : 'The type is currently disabled. Confirm whether it should remain in maintenance or be enabled again.',
        }
      : inactiveItemCount > 0
        ? {
            variant: 'warning' as const,
            label: zh ? '优先检查禁用项' : 'Review disabled items first',
            hint: zh
              ? `当前页有 ${inactiveItemCount} 个禁用字典项，建议先核对状态与备注。`
              : `${inactiveItemCount} disabled items appear on this page. Review status and notes first.`,
          }
        : hasSearchFilter
          ? {
              variant: 'info' as const,
              label: zh ? '当前处于筛选结果' : 'Filtered result in focus',
              hint: zh
                ? '当前结果受到搜索词影响，适合继续核对标签、值和备注。'
                : 'The current result set is filtered. Continue reviewing labels, values, and remarks.',
            }
          : {
              variant: 'success' as const,
              label: zh ? '当前维护状态稳定' : 'Current maintenance flow is stable',
              hint: zh
                ? '当前类型和列表结果整体稳定，可继续新增或查看详情。'
                : 'The current type and listed items look stable. Continue adding items or reviewing details.',
            }
    : null;
  const dictionaryPriorities = selectedType
    ? [
        selectedType.status === 'inactive'
          ? {
              id: 'type-status',
              title: zh ? '类型状态' : 'Type Status',
              detail: zh ? '先确认当前字典类型是否仍应启用或继续维护。' : 'Confirm whether the current dictionary type should remain enabled or maintained.',
            }
          : null,
        inactiveItemCount > 0
          ? {
              id: 'disabled-items',
              title: zh ? '禁用项复核' : 'Disabled Item Review',
              detail: zh ? '优先核对禁用项状态、备注和是否仍被引用。' : 'Review disabled items, notes, and whether they are still referenced.',
            }
          : null,
        hasSearchFilter
          ? {
              id: 'filtered-items',
              title: zh ? '筛选结果' : 'Filtered Results',
              detail: zh ? '当前列表受搜索词影响，适合继续核对标签和值。' : 'The current list is filtered, which is ideal for reviewing labels and values.',
            }
          : {
              id: 'full-list',
              title: zh ? '全量巡检' : 'Full Inspection',
              detail: zh ? '当前列表稳定，可按分页顺序抽查字典项详情。' : 'The list is stable. Sample item details by page order.',
            },
        canCreateDictionary
          ? {
              id: 'add-item',
              title: zh ? '新增字典项' : 'Add Item',
              detail: zh ? '核对完成后，可继续补充新项或维护枚举边界。' : 'After review, continue adding items or refining enum boundaries.',
            }
          : null,
      ].filter((item): item is { id: string; title: string; detail: string } => Boolean(item))
    : [];

  const setDialogOpen = (name: keyof DialogState, open: boolean) => {
    setDialogs((current) => ({ ...current, [name]: open }));
  };
  const closeProtectedDialogs = (names: Array<keyof DialogState>) => {
    setDialogs((current) => {
      const next = { ...current };
      names.forEach((name) => {
        next[name] = false;
      });
      return next;
    });
  };

  const loadTypes = useCallback(async (preferCode?: string) => {
    if (!canQueryDictionary) {
      setTypes([]);
      setSelectedTypeCode('');
      return [];
    }
    const resp = await dictApi.listTypes({ page: 1, pageSize: 200, search: '' });
    const mapped = resp.items.map((item) => mapTypeItem(item));
    setTypes(mapped);

    const nextCode = preferCode || selectedTypeCode;
    const target = mapped.find((item) => item.code === nextCode) || mapped[0];
    setSelectedTypeCode(target?.code || '');
    return mapped;
  }, [canQueryDictionary, selectedTypeCode]);

  const loadItems = useCallback(async (typeCode?: string, availableTypes?: DictTypeItem[]) => {
    if (!canQueryDictionary) {
      setItems([]);
      setTotalPages(1);
      return;
    }
    const currentTypeCode = typeCode || selectedTypeCode;
    const sourceTypes = availableTypes || types;
    const currentType = sourceTypes.find((item) => item.code === currentTypeCode);
    if (!currentType) {
      setItems([]);
      setTotalPages(1);
      return;
    }

    const resp = await dictApi.listData({
      typeId: currentType.id,
      page,
      pageSize,
      search: searchTerm.trim(),
    });

    const resolvedTotalPages =
      Math.max(1, Math.ceil((resp.total || 0) / pageSize)) ||
      1;

    setTotalPages(resolvedTotalPages);
    if (page > resolvedTotalPages) {
      setPage(resolvedTotalPages);
      return;
    }

    setItems(resp.items.map(mapDictItem));
    setTypes((current) => current.map((item) => (item.id === currentType.id ? { ...item, itemCount: resp.total || resp.items.length } : item)));
  }, [canQueryDictionary, page, pageSize, searchTerm, selectedTypeCode, types]);

  const refreshAll = useCallback(async (preferCode?: string) => {
    if (!canQueryDictionary) {
      setTypes([]);
      setItems([]);
      setSelectedTypeCode('');
      setTotalPages(1);
      return;
    }
    try {
      setLoading(true);
      const latestTypes = await loadTypes(preferCode);
      const target = latestTypes.find((item) => item.code === (preferCode || selectedTypeCode)) || latestTypes[0];
      const codeToLoad = target?.code;
      if (codeToLoad) {
        await loadItems(codeToLoad, latestTypes);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryMessages.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [canQueryDictionary, dictionaryMessages.loadFailed, loadItems, loadTypes, selectedTypeCode]);

  useEffect(() => {
    if (!canQueryDictionary) {
      setTypes([]);
      setItems([]);
      setSelectedTypeCode('');
      setTotalPages(1);
      return;
    }
    void refreshAll();
  }, [canQueryDictionary, refreshAll]);

  useEffect(() => {
    if (canQueryDictionary && selectedTypeCode) {
      void loadItems(selectedTypeCode);
    }
  }, [canQueryDictionary, loadItems, page, searchTerm, selectedTypeCode]);

  useEffect(() => {
    setSelectedItem(null);
    closeProtectedDialogs(['detail', 'edit', 'delete', 'add']);
  }, [selectedTypeCode]);

  useEffect(() => {
    if (selectedType) {
      return;
    }

    setSelectedTypeForm(defaultTypeForm);
    closeProtectedDialogs(['detailType', 'editType', 'deleteType']);
  }, [selectedType]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const nextSelectedItem = items.find((item) => item.id === selectedItem.id) ?? null;
    if (!nextSelectedItem) {
      setSelectedItem(null);
      closeProtectedDialogs(['detail', 'edit', 'delete']);
      return;
    }

    if (nextSelectedItem !== selectedItem) {
      setSelectedItem(nextSelectedItem);
    }
  }, [items, selectedItem]);

  const openAddItem = () => {
    if (!ensureActionPermission(canCreateDictionary, copy.permissionLabels.addItem)) return;
    if (!selectedType) {
      toast.info(copy.messages.selectTypeFirst);
      return;
    }
    setSelectedItem(null);
    setItemForm({ dictLabel: '', dictValue: '', sort: 0, status: 'active', remark: '' });
    setDialogOpen('add', true);
  };

  const openEditItem = (item: DictItem) => {
    if (!ensureActionPermission(canUpdateDictionary, copy.permissionLabels.editItem)) return;
    setSelectedItem(item);
    setItemForm(item);
    setDialogOpen('edit', true);
  };

  const openDeleteItem = (item: DictItem) => {
    if (!ensureActionPermission(canDeleteDictionary, copy.permissionLabels.deleteItem)) return;
    setSelectedItem(item);
    setDialogOpen('delete', true);
  };

  const openAddType = () => {
    if (!ensureActionPermission(canCreateDictionary, copy.permissionLabels.addType)) return;
    setSelectedTypeForm(defaultTypeForm);
    setDialogOpen('addType', true);
  };

  const openEditType = () => {
    if (!ensureActionPermission(canUpdateDictionary, copy.permissionLabels.editType)) return;
    if (!selectedType) {
      toast.info(copy.messages.selectTypeFirst);
      return;
    }
    setSelectedTypeForm({
      name: selectedType.name,
      code: selectedType.code,
      description: selectedType.description || '',
      status: selectedType.status,
    });
    setDialogOpen('editType', true);
  };

  const openDeleteType = () => {
    if (!ensureActionPermission(canDeleteDictionary, copy.permissionLabels.deleteType)) return;
    if (!selectedType) {
      toast.info(copy.messages.selectTypeFirst);
      return;
    }
    setDialogOpen('deleteType', true);
  };

  const openTypeDetail = () => {
    if (!selectedType) {
      toast.info(copy.messages.selectTypeFirst);
      return;
    }
    setDialogOpen('detailType', true);
  };

  const handleItemAction = (action: string, item: DictItem) => {
    if (action === 'detail') {
      setSelectedItem(item);
      setDialogOpen('detail', true);
    }
    if (action === 'edit') openEditItem(item);
    if (action === 'delete') openDeleteItem(item);
  };

  const handleSubmitItem = async () => {
    if (!ensureActionPermission(dialogs.add ? canCreateDictionary : canUpdateDictionary, dialogs.add ? copy.permissionLabels.addItem : copy.permissionLabels.editItem)) return;
    if (!selectedType) {
      toast.error(copy.messages.typeRequired);
      return;
    }
    if (!itemForm.dictLabel || !itemForm.dictValue) {
      toast.error(copy.messages.itemRequired);
      return;
    }

    try {
      setLoading(true);
      if (dialogs.add) {
        await dictApi.createData({
          typeId: selectedType.id,
          label: itemForm.dictLabel,
          value: itemForm.dictValue,
          description: itemForm.remark,
          sort: Number(itemForm.sort || 0),
          status: (itemForm.status as 'active' | 'inactive') || 'active',
        });
      } else if (selectedItem) {
        await dictApi.updateData(selectedItem.id, {
          label: itemForm.dictLabel!,
          value: itemForm.dictValue!,
          description: itemForm.remark,
          sort: Number(itemForm.sort || 0),
          status: (itemForm.status as 'active' | 'inactive') || 'active',
        });
      }

      setDialogOpen(dialogs.add ? 'add' : 'edit', false);
      toast.success(dialogs.add ? dictionaryItemMessages.createSuccess : dictionaryItemMessages.updateSuccess);
      await refreshAll(selectedType.code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryItemMessages.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (!ensureActionPermission(canDeleteDictionary, copy.permissionLabels.deleteItem)) return;
    try {
      setLoading(true);
      await dictApi.deleteData(selectedItem.id);
      setDialogOpen('delete', false);
      toast.success(dictionaryItemMessages.deleteSuccess);
      await refreshAll(selectedTypeCode);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryItemMessages.deleteFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitType = async () => {
    if (!ensureActionPermission(dialogs.addType ? canCreateDictionary : canUpdateDictionary, dialogs.addType ? copy.permissionLabels.addType : copy.permissionLabels.editType)) return;
    if (!selectedTypeForm.name || !selectedTypeForm.code) {
      toast.error(copy.messages.typeFormRequired);
      return;
    }

    try {
      setLoading(true);
      let code = selectedTypeForm.code;
      if (dialogs.addType) {
        const created = await dictApi.createType(selectedTypeForm);
        code = created.code;
      } else if (selectedType) {
        const updated = await dictApi.updateType(selectedType.id, selectedTypeForm);
        code = updated.code;
      }

      setDialogOpen(dialogs.addType ? 'addType' : 'editType', false);
      toast.success(dialogs.addType ? dictionaryTypeMessages.createSuccess : dictionaryTypeMessages.updateSuccess);
      await refreshAll(code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryTypeMessages.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async () => {
    if (!selectedType) return;
    if (!ensureActionPermission(canDeleteDictionary, copy.permissionLabels.deleteType)) return;
    try {
      setLoading(true);
      await dictApi.deleteType(selectedType.id);
      setDialogOpen('deleteType', false);
      toast.success(dictionaryTypeMessages.deleteSuccess);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryTypeMessages.deleteFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleItemStatusChange = async (item: DictItem, enabled: boolean) => {
    if (!selectedType) return;
    if (!ensureActionPermission(canUpdateDictionary, enabled ? copy.permissionLabels.enableItem : copy.permissionLabels.disableItem)) return;
    try {
      await dictApi.updateData(item.id, {
        label: item.dictLabel,
        value: item.dictValue,
        description: item.remark,
        sort: item.sort,
        status: enabled ? 'active' : 'inactive',
      });
      toast.success(copy.messages.itemStatusUpdated);
      await loadItems(selectedType.code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryItemMessages.statusUpdateFailed);
    }
  };

  const handleExport = async () => {
    if (!ensureActionPermission(canExportDictionary, copy.permissionLabels.export)) return;
    try {
      setExporting(true);
      const latestTypes = await dictApi.listTypes({ page: 1, pageSize: 200, search: '' });
      const exportedTypes = await Promise.all(
        latestTypes.items.map(async (type) => {
          const data = await dictApi.listData({ typeId: type.id, page: 1, pageSize: 500, search: '' });
          return {
            name: type.name,
            code: type.code,
            description: type.description,
            status: type.status,
            items: data.items.map((item) => ({
              label: item.label,
              value: item.value,
              description: item.description,
              sort: item.sort,
              status: item.status,
            })),
          };
        }),
      );

      const payload: ExportedDict = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        types: exportedTypes,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-dictionary-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(dictionaryMessages.exportSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryMessages.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!ensureActionPermission(canImportDictionary, copy.permissionLabels.import)) return;
    try {
      setImporting(true);
      const text = await file.text();
      const payload = JSON.parse(text) as ExportedDict;
      if (!Array.isArray(payload.types)) {
        toast.error(copy.messages.invalidFile);
        return;
      }

      const latestTypes = await dictApi.listTypes({ page: 1, pageSize: 200, search: '' });
      const existingTypes = new Map(latestTypes.items.map((type) => [type.code.toLowerCase(), type]));

      for (const type of payload.types) {
        const normalizedTypeCode = String(type.code || '').trim().toLowerCase();
        const existingType = existingTypes.get(normalizedTypeCode);
        const targetType = existingType
          ? await dictApi.updateType(existingType.id, {
              name: type.name,
              code: type.code,
              description: type.description,
              status: type.status,
            })
          : await dictApi.createType({
              name: type.name,
              code: type.code,
              description: type.description,
              status: type.status,
            });

        existingTypes.set(normalizedTypeCode, targetType);
        const latestItems = await dictApi.listData({ typeId: targetType.id, page: 1, pageSize: 500, search: '' });
        const existingItems = new Map(
          latestItems.items.map((item) => [`${String(item.value).toLowerCase()}::${String(item.label).toLowerCase()}`, item]),
        );

        for (const item of type.items || []) {
          const itemKey = `${String(item.value || '').trim().toLowerCase()}::${String(item.label || '').trim().toLowerCase()}`;
          const existingItem = existingItems.get(itemKey);
          if (existingItem) {
            await dictApi.updateData(existingItem.id, {
              label: item.label,
              value: item.value,
              description: item.description,
              sort: item.sort,
              status: item.status,
            });
          } else {
            const createdItem = await dictApi.createData({
              typeId: targetType.id,
              label: item.label,
              value: item.value,
              description: item.description,
              sort: item.sort,
              status: item.status,
            });
            existingItems.set(itemKey, createdItem);
          }
        }
      }

      toast.success(dictionaryMessages.importSuccess);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryMessages.importFailed);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const { lossDescription: queryLossDescription } = useQueryPermissionDialogGuard({
    canQuery: canQueryDictionary,
    pageTitle: copy.pageTitle,
    dialogs,
    protectedDialogs: {
      detail: zh ? '查看字典项详情' : 'View dictionary item detail',
      detailType: zh ? '查看字典类型详情' : 'View dictionary type detail',
      add: copy.permissionLabels.addItem,
      edit: copy.permissionLabels.editItem,
      delete: copy.permissionLabels.deleteItem,
      addType: copy.permissionLabels.addType,
      editType: copy.permissionLabels.editType,
      deleteType: copy.permissionLabels.deleteType,
    },
    closeDialogs: closeProtectedDialogs,
  });
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.pageTitle,
    dialogs,
    guardedDialogs: {
      add: { label: copy.permissionLabels.addItem, allowed: canCreateDictionary },
      edit: { label: copy.permissionLabels.editItem, allowed: canUpdateDictionary },
      delete: { label: copy.permissionLabels.deleteItem, allowed: canDeleteDictionary },
      addType: { label: copy.permissionLabels.addType, allowed: canCreateDictionary },
      editType: { label: copy.permissionLabels.editType, allowed: canUpdateDictionary },
      deleteType: { label: copy.permissionLabels.deleteType, allowed: canDeleteDictionary },
    },
    closeDialogs: closeProtectedDialogs,
  });

  return (
    <div className="space-y-6">
      {canQueryDictionary ? (
        <ManagementPageHeader
          eyebrow="SYSTEM"
          title={copy.pageTitle}
          description={copy.pageDescription}
          meta={
            <>
              <Badge variant="mono">Dictionary</Badge>
              <Badge variant="info">
                {zh ? `${types.length} 个字典类型` : `${types.length} types`}
              </Badge>
              {selectedType ? (
                <Badge variant="warning">
                  {zh ? `${selectedType.name} · ${items.length} 项` : `${selectedType.name} · ${items.length} items`}
                </Badge>
              ) : null}
            </>
          }
          actions={
            <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImport(file);
              }
            }}
          />
          <Button
            variant="mono"
            size="pill"
            onClick={() => void refreshAll(selectedTypeCode)}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
            {copy.actions.refresh}
          </Button>
          {canImportDictionary ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {copy.actions.import}
            </Button>
          ) : null}
          {canExportDictionary ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => void handleExport()}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {copy.actions.export}
            </Button>
          ) : null}
          {canCreateDictionary ? (
            <Button
              variant="mono"
              size="pill"
              onClick={openAddType}
            >
              <Plus className="h-4 w-4" />
              {copy.actions.addType}
            </Button>
          ) : null}
          {canCreateDictionary ? (
            <Button
              size="pill"
              onClick={openAddItem}
              disabled={!selectedType}
            >
              <Plus className="h-4 w-4" />
              {copy.actions.addItem}
            </Button>
          ) : null}
            </>
          }
        />
      ) : null}
      {!canQueryDictionary ? (
        <QueryAccessBoundary
          viewId="system-dictionary"
          title={copy.pageTitle}
          queryPermission={systemPermissions.dictionary.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
      <>
      <ManagementContentCard className="p-6">
        <div className="flex min-h-[680px] gap-6">
          <DictTypeSidebar
            types={types}
            selectedCode={selectedTypeCode}
            onSelect={(code) => { setSelectedTypeCode(code); setPage(1); }}
            onAddType={openAddType}
            canAddType={canCreateDictionary}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200/70 bg-slate-50/85 p-5 shadow-inner shadow-slate-100/80">
              <div>
                <div className="text-lg font-semibold text-slate-900">{selectedType?.name || copy.fields.selectType}</div>
                <div className="text-sm text-slate-500">{selectedType?.description || copy.fields.typeHint}</div>
              </div>
              <div className="flex items-center gap-2">
                {canUpdateDictionary ? (
                <Button
                  variant="mono"
                  size="pill"
                  onClick={openTypeDetail}
                  disabled={!selectedType}
                >
                  {copy.actions.viewTypeDetail}
                </Button>
                ) : null}
                {canUpdateDictionary ? (
                <Button
                  variant="outline"
                  onClick={openEditType}
                  disabled={!selectedType}
                  className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                >
                  <Pencil className="h-4 w-4" />
                  {copy.actions.editType}
                </Button>
                ) : null}
                {canDeleteDictionary ? (
                <Button
                  variant="outline"
                  onClick={openDeleteType}
                  disabled={!selectedType}
                  className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/50 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  {copy.actions.deleteType}
                </Button>
                ) : null}
              </div>
            </div>

            {selectedType ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ManagementMetricCard
                    label={zh ? '字典类型' : 'Dictionary Type'}
                    value={selectedType.name}
                    hint={selectedType.description || (zh ? '当前焦点字典类型。' : 'Current focused dictionary type.')}
                  />
                  <ManagementMetricCard
                    label={zh ? '类型规模' : 'Type Scale'}
                    value={typeScaleLabel}
                    hint={
                      zh
                        ? `${selectedTypeItemCount} 项，适合按分页节奏维护。`
                        : `${selectedTypeItemCount} items, suitable for page-by-page maintenance.`
                    }
                  />
                  <ManagementMetricCard
                    label={zh ? '禁用项' : 'Disabled Items'}
                    value={inactiveItemCount}
                    hint={
                      inactiveItemCount > 0
                        ? zh
                          ? '建议优先核对禁用项状态和备注。'
                          : 'Review disabled item state and notes first.'
                        : zh
                          ? '当前页没有禁用项。'
                          : 'No disabled items appear on this page.'
                    }
                  />
                  <ManagementMetricCard
                    label={zh ? '搜索状态' : 'Search State'}
                    value={hasSearchFilter ? (zh ? '已启用' : 'Enabled') : (zh ? '未启用' : 'Disabled')}
                    hint={
                      hasSearchFilter
                        ? (zh ? '当前列表处于筛选结果上下文。' : 'The current list is under a filtered-result context.')
                        : (zh ? '当前正在查看默认列表结果。' : 'The current list shows the default result set.')
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <ManagementFocusCard
                    icon={Search}
                    eyebrow="REVIEW"
                    title={zh ? '字典维护结论' : 'Dictionary Review'}
                    value={maintenanceFocus?.label ?? (zh ? '当前维护状态稳定' : 'Current maintenance flow is stable')}
                    hint={maintenanceFocus?.hint ?? (zh ? '可以继续按分页抽查字典项详情。' : 'Continue sampling dictionary item details by page.')}
                    badge={<Badge variant={maintenanceFocus?.variant ?? 'success'}>{selectedType.name}</Badge>}
                    action={
                      <div className="text-xs leading-5 text-slate-500">
                        {selectedType.status === 'inactive'
                          ? (zh ? '先确认类型状态，再决定是否编辑或启用。' : 'Confirm the type state first, then decide whether to edit or enable it.')
                          : inactiveItemCount > 0
                            ? (zh ? '优先查看禁用项详情与备注。' : 'Review disabled item details and notes first.')
                            : hasSearchFilter
                              ? (zh ? '完成当前搜索核对后再回到全量列表。' : 'Finish the current filtered review before returning to the full list.')
                              : (zh ? '按当前分页继续抽查字典项与详情。' : 'Continue sampling items and details in the current page flow.')}
                      </div>
                    }
                  />
                  <ManagementFocusCard
                    icon={RefreshCcw}
                    eyebrow="PRIORITY"
                    title={zh ? '本次维护顺序' : 'Suggested Maintenance Order'}
                    value={dictionaryPriorities[0]?.title ?? (zh ? '当前无优先事项' : 'No priority item right now')}
                    hint={dictionaryPriorities[0]?.detail ?? (zh ? '当前可继续常规维护。' : 'Continue with routine maintenance now.')}
                    badge={
                      dictionaryPriorities[0] ? (
                        <Badge variant={maintenanceFocus?.variant ?? 'mono'}>{`01`}</Badge>
                      ) : (
                        <Badge variant="success">{zh ? '稳定' : 'Stable'}</Badge>
                      )
                    }
                    action={
                      dictionaryPriorities.length > 1 ? (
                        <div className="text-xs leading-5 text-slate-500">
                          {zh ? `后续还可继续处理 ${dictionaryPriorities.length - 1} 项建议。` : `${dictionaryPriorities.length - 1} more suggested items remain after this.`}
                        </div>
                      ) : undefined
                    }
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <ManagementContentCard className="p-6">
                    <DetailKeyValueSection
                      eyebrow="REVIEW"
                      title={zh ? '字典维护结论' : 'Dictionary Review'}
                      description={
                        zh
                          ? '先判断当前类型是要处理状态、筛选结果，还是继续常规维护。'
                          : 'Decide whether the current type needs state review, filtered-result review, or routine maintenance.'
                      }
                    >
                      <DetailKeyValueItem
                        label={zh ? '当前结论' : 'Outcome'}
                        className="md:col-span-2"
                        value={
                          maintenanceFocus ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={maintenanceFocus.variant}>{maintenanceFocus.label}</Badge>
                              <span>{maintenanceFocus.hint}</span>
                            </div>
                          ) : '-'
                        }
                      />
                      <DetailKeyValueItem
                        label={zh ? '下一步动作' : 'Next Action'}
                        value={
                          selectedType.status === 'inactive'
                            ? zh ? '先确认类型状态，再决定是否编辑或启用。' : 'Confirm the type state first, then decide whether to edit or enable it.'
                            : inactiveItemCount > 0
                              ? zh ? '优先查看禁用项详情与备注。' : 'Review disabled item details and notes first.'
                              : hasSearchFilter
                                ? zh ? '完成当前搜索核对后再回到全量列表。' : 'Finish the current filtered review before returning to the full list.'
                                : zh ? '按当前分页继续抽查字典项与详情。' : 'Continue sampling items and details in the current page flow.'
                        }
                      />
                      <DetailKeyValueItem label={zh ? '维护焦点' : 'Focus'} value={selectedType.name} />
                      <DetailKeyValueItem
                        label={zh ? '风险项' : 'Risk Items'}
                        value={(selectedType.status === 'inactive' ? 1 : 0) + inactiveItemCount}
                        hint={zh ? '包含类型禁用与当前页禁用项数量。' : 'Includes inactive type state and disabled items on the current page.'}
                      />
                      <DetailKeyValueItem label={zh ? '搜索状态' : 'Search State'} value={hasSearchFilter ? (zh ? '已启用' : 'Enabled') : (zh ? '未启用' : 'Disabled')} />
                    </DetailKeyValueSection>
                  </ManagementContentCard>

                  <ManagementContentCard className="p-6">
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">PRIORITY</div>
                        <div className="mt-2 text-base font-semibold text-slate-900">
                          {zh ? '本次维护顺序' : 'Suggested Maintenance Order'}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {zh ? '按当前类型状态和列表结果，建议优先处理这些动作。' : 'Based on the current type state and result set, handle these actions first.'}
                        </div>
                      </div>
                      {dictionaryPriorities.map((item, index) => (
                        <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? 'warning' : 'mono'}>{`0${index + 1}`}</Badge>
                            <div className="font-medium text-slate-900">{item.title}</div>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </ManagementContentCard>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <DictionarySummaryCard
                    label={zh ? '类型编码' : 'Type Code'}
                    value={selectedType.code}
                    hint={zh ? '用于前后端枚举与配置引用。' : 'Used by frontend and backend enum/config references.'}
                  />
                  <DictionarySummaryCard
                    label={zh ? '类型状态' : 'Type Status'}
                    value={
                      <Badge variant={selectedType.status === 'active' ? 'success' : 'warning'}>
                        {selectedType.status === 'active' ? (zh ? '启用' : 'Enabled') : (zh ? '禁用' : 'Disabled')}
                      </Badge>
                    }
                    hint={zh ? '决定该类型是否继续作为主线字典参与维护。' : 'Controls whether the type remains in the active maintenance flow.'}
                  />
                  <DictionarySummaryCard
                    label={zh ? '类型规模' : 'Type Scale'}
                    value={typeScaleLabel}
                    hint={zh ? `当前约 ${selectedTypeItemCount} 项字典项。` : `About ${selectedTypeItemCount} items in this type.`}
                  />
                  <DictionarySummaryCard
                    label={zh ? '分页位置' : 'Page Position'}
                    value={`${page} / ${totalPages}`}
                    hint={zh ? '对应右侧当前列表页。' : 'Matches the current list page on the right.'}
                  />
                </div>

                <DetailKeyValueSection
                  eyebrow="TYPE"
                  title={selectedType.name}
                  description={selectedType.description || copy.fields.typeHint}
                >
                  <DetailKeyValueItem label={zh ? '类型编码' : 'Type Code'} value={selectedType.code} />
                  <DetailKeyValueItem
                    label={zh ? '状态' : 'Status'}
                    value={
                      <Badge variant={selectedType.status === 'active' ? 'success' : 'warning'}>
                        {selectedType.status === 'active' ? (zh ? '启用' : 'Enabled') : (zh ? '禁用' : 'Disabled')}
                      </Badge>
                    }
                  />
                  <DetailKeyValueItem
                    label={copy.fields.page}
                    value={`${page} / ${totalPages}`}
                    hint={zh ? '当前列表分页位置' : 'Current list pagination'}
                  />
                  <DetailKeyValueItem
                    label={zh ? '条目数量' : 'Items'}
                    value={selectedTypeItemCount}
                    hint={zh ? '用于快速判断字典规模' : 'Quick size indicator for this type'}
                  />
                </DetailKeyValueSection>

                <DetailKeyValueSection
                  eyebrow="REVIEW"
                  title={zh ? '维护焦点' : 'Maintenance Focus'}
                  description={
                    zh
                      ? '先确认当前类型状态、筛选范围和下一步维护动作。'
                      : 'Review the current type state, filter scope, and next maintenance action.'
                  }
                >
                  <DetailKeyValueItem
                    label={zh ? '当前结论' : 'Current Outcome'}
                    value={
                      maintenanceFocus ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={maintenanceFocus.variant}>{maintenanceFocus.label}</Badge>
                          <span>{maintenanceFocus.hint}</span>
                        </div>
                      ) : '-'
                    }
                    className="md:col-span-2"
                  />
                  <DetailKeyValueItem
                    label={zh ? '搜索状态' : 'Search State'}
                    value={hasSearchFilter ? (zh ? '已启用筛选' : 'Filtered') : (zh ? '查看全部' : 'Viewing all')}
                    hint={hasSearchFilter ? searchTerm : (zh ? '当前未输入搜索条件。' : 'No search filter is applied.')}
                  />
                  <DetailKeyValueItem
                    label={zh ? '状态分布' : 'State Split'}
                    value={`${activeItemCount} / ${inactiveItemCount}`}
                    hint={zh ? '启用项 / 禁用项' : 'Enabled / disabled items'}
                  />
                  <DetailKeyValueItem
                    label={zh ? '下一步动作' : 'Next Actions'}
                    className="md:col-span-2"
                    value={
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={openTypeDetail}
                          disabled={!selectedType}
                        >
                          {copy.actions.viewTypeDetail}
                        </Button>
                        {canCreateDictionary ? (
                          <Button
                            type="button"
                            variant="mono"
                            size="pill"
                            onClick={openAddItem}
                            disabled={!selectedType}
                          >
                            {copy.actions.addItem}
                          </Button>
                        ) : null}
                        {hasSearchFilter ? (
                          <Button
                            type="button"
                            variant="mono"
                            size="pill"
                            onClick={() => {
                              setSearchTerm('');
                              setPage(1);
                            }}
                          >
                            {zh ? '清除筛选' : 'Clear Filter'}
                          </Button>
                        ) : null}
                      </div>
                    }
                  />
                </DetailKeyValueSection>
              </>
            ) : null}

            <div className="rounded-[28px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)]">
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <DictionarySummaryCard
                  label={zh ? '当前结果' : 'Current Results'}
                  value={items.length}
                  hint={zh ? '当前筛选与分页返回的字典项数量。' : 'Items returned by the current filter and pagination.'}
                />
                <DictionarySummaryCard
                  label={zh ? '启用项' : 'Enabled Items'}
                  value={activeItemCount}
                  hint={zh ? '当前页内处于启用状态的字典项。' : 'Enabled items within the current page.'}
                />
                <DictionarySummaryCard
                  label={zh ? '禁用项' : 'Disabled Items'}
                  value={inactiveItemCount}
                  hint={zh ? '当前页内处于禁用状态的字典项。' : 'Disabled items within the current page.'}
                />
              </div>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }}
                  placeholder={copy.fields.searchPlaceholder}
                  className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 rounded-[28px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)]">
              <DictDataTable
                data={items}
                loading={loading}
                onAction={handleItemAction}
                onStatusChange={handleItemStatusChange}
                canUpdate={canUpdateDictionary}
                canDelete={canDeleteDictionary}
              />
            </div>

            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/85 px-4 py-3">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="h-10 rounded-2xl border-slate-200/80 bg-white/90 px-4 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                {copy.fields.prev}
              </Button>
              <span className="text-sm text-slate-500">
                {copy.fields.page} {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || loading}
                className="h-10 rounded-2xl border-slate-200/80 bg-white/90 px-4 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                {copy.fields.next}
              </Button>
            </div>
          </div>
        </div>
      </ManagementContentCard>

      <DictDialogManager
        dialogs={dialogs}
        setDialogOpen={setDialogOpen}
        selectedItem={selectedItem}
        itemForm={itemForm}
        setItemForm={setItemForm}
        selectedTypeCode={selectedTypeCode}
        selectedTypeName={selectedType?.name}
        selectedType={selectedType || null}
        currentPage={page}
        totalPages={totalPages}
        selectedTypeForm={selectedTypeForm}
        setSelectedTypeForm={setSelectedTypeForm}
        onSubmitItem={() => void handleSubmitItem()}
        onDeleteItem={() => void handleDeleteItem()}
        onSubmitType={() => void handleSubmitType()}
        onDeleteType={() => void handleDeleteType()}
        loading={loading}
      />
      </>
      )}
    </div>
  );
}









