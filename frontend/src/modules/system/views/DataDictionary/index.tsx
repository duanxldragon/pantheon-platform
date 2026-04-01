import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Pencil, Plus, RefreshCcw, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { PageLayout } from '../../../../components/layouts/PageLayout';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { useLanguageStore } from '../../../../stores/languageStore';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { useQueryPermissionDialogGuard } from '../../../../shared/hooks/useQueryPermissionDialogGuard';
import { dictApi, type DictDataDTO, type DictTypeDTO } from '../../api/dictApi';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';
import { DictDataTable, type DictItem } from './components/DictDataTable';
import { DictDialogManager, type DictTypeForm } from './components/DictDialogManager';
import { DictTypeSidebar, type DictTypeItem } from './components/DictTypeSidebar';

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
  add: boolean;
  edit: boolean;
  delete: boolean;
  addType: boolean;
  editType: boolean;
  deleteType: boolean;
};

const defaultDialogs: DialogState = {
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

function mapTypeItem(item: DictTypeDTO, count = 0): DictTypeItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    status: item.status,
    itemCount: count,
  };
}

function mapDictItem(item: DictDataDTO): DictItem {
  return {
    id: item.id,
    dictLabel: item.label,
    dictValue: item.value,
    sort: item.sort,
    status: item.status,
    remark: item.description,
  };
}

export function DataDictionary() {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const dictionaryMessages = createEntityFeedback(zh, { zh: '数据字典', en: 'Dictionary' });
  const dictionaryItemMessages = createEntityFeedback(zh, { zh: '字典项', en: 'Dictionary item', enPlural: 'dictionary items' });
  const dictionaryTypeMessages = createEntityFeedback(zh, { zh: '字典类型', en: 'Dictionary type', enPlural: 'dictionary types' });
  const copy = zh
    ? {
        pageTitle: '数据字典',
        pageDescription: '维护系统字典类型和字典项，支撑菜单、状态、枚举等基础配置。',
        actions: {
          refresh: '刷新',
          import: '导入',
          export: '导出',
          addType: '新增类型',
          addItem: '新增字典项',
          editType: '编辑类型',
          deleteType: '删除类型',
        },
        fields: {
          selectType: '请选择字典类型',
          typeHint: '选择左侧类型后即可管理对应字典项。',
          searchPlaceholder: '搜索字典标签、值或备注',
          prev: '上一页',
          next: '下一页',
          page: '第',
        },
        messages: {
          selectTypeFirst: '请先选择一个字典类型',
          typeRequired: '未选择字典类型',
          itemRequired: '请填写完整的字典项信息',
          typeFormRequired: '请填写完整的字典类型信息',
          invalidFile: '无效的数据字典文件格式',
          itemStatusUpdated: '字典项状态更新成功',
        },
        permissionLabels: {
          addItem: '新增字典项',
          editItem: '编辑字典项',
          deleteItem: '删除字典项',
          addType: '新增字典类型',
          editType: '编辑字典类型',
          deleteType: '删除字典类型',
          export: '导出',
          import: '导入',
          enableItem: '字典项启用',
          disableItem: '字典项禁用',
        },
      }
    : {
        pageTitle: 'Data Dictionary',
        pageDescription: 'Manage dictionary types and items used by statuses, enums, and base metadata.',
        actions: {
          refresh: 'Refresh',
          import: 'Import',
          export: 'Export',
          addType: 'Add Type',
          addItem: 'Add Item',
          editType: 'Edit Type',
          deleteType: 'Delete Type',
        },
        fields: {
          selectType: 'Select a dictionary type',
          typeHint: 'Choose a type from the left to manage dictionary items.',
          searchPlaceholder: 'Search label, value, or remark',
          prev: 'Previous',
          next: 'Next',
          page: 'Page',
        },
        messages: {
          selectTypeFirst: 'Please select a dictionary type first',
          typeRequired: 'Dictionary type is required',
          itemRequired: 'Please complete dictionary item fields',
          typeFormRequired: 'Please complete dictionary type fields',
          invalidFile: 'Invalid data dictionary file format',
          itemStatusUpdated: 'Dictionary item status updated',
        },
        permissionLabels: {
          addItem: 'add item',
          editItem: 'edit item',
          deleteItem: 'delete item',
          addType: 'add type',
          editType: 'edit type',
          deleteType: 'delete type',
          export: 'export',
          import: 'import',
          enableItem: 'item enable',
          disableItem: 'item disable',
        },
      };
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

  const loadTypes = async (preferCode?: string) => {
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
  };

  const loadItems = async (typeCode?: string) => {
    if (!canQueryDictionary) {
      setItems([]);
      setTotalPages(1);
      return;
    }
    const currentTypeCode = typeCode || selectedTypeCode;
    const currentType = types.find((item) => item.code === currentTypeCode);
    if (!currentType) {
      setItems([]);
      return;
    }

    const resp = await dictApi.listData({
      typeId: currentType.id,
      page,
      pageSize,
      search: searchTerm.trim(),
    });

    setItems(resp.items.map(mapDictItem));
    setTotalPages(resp.pagination?.total_pages || Math.max(1, Math.ceil((resp.pagination?.total || 0) / pageSize)) || 1);
    setTypes((current) => current.map((item) => (item.id === currentType.id ? { ...item, itemCount: resp.pagination?.total || resp.items.length } : item)));
  };

  const refreshAll = async (preferCode?: string) => {
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
      const codeToLoad = preferCode || latestTypes[0]?.code;
      if (codeToLoad) {
        await loadItems(codeToLoad);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dictionaryMessages.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canQueryDictionary) {
      setTypes([]);
      setItems([]);
      setSelectedTypeCode('');
      setTotalPages(1);
      return;
    }
    void refreshAll();
  }, [canQueryDictionary]);

  useEffect(() => {
    if (canQueryDictionary && selectedTypeCode) {
      void loadItems(selectedTypeCode);
    }
  }, [canQueryDictionary, selectedTypeCode, page, searchTerm]);

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

  const handleItemAction = (action: string, item: DictItem) => {
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
          typeId: selectedType.id,
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
        typeId: selectedType.id,
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

      for (const type of payload.types) {
        const createdType = await dictApi.createType({
          name: type.name,
          code: type.code,
          description: type.description,
          status: type.status,
        });

        for (const item of type.items || []) {
          await dictApi.createData({
            typeId: createdType.id,
            label: item.label,
            value: item.value,
            description: item.description,
            sort: item.sort,
            status: item.status,
          });
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
    pageTitle: t?.menu?.systemDictionary || copy.pageTitle,
    dialogs,
    protectedDialogs: {
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
    pageTitle: t?.menu?.systemDictionary || copy.pageTitle,
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
    <PageLayout
      title={t?.menu?.systemDictionary || copy.pageTitle}
      description={copy.pageDescription}
      actions={canQueryDictionary ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
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
            variant="outline"
            onClick={() => void refreshAll(selectedTypeCode)}
            disabled={loading}
            className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
          >
            <RefreshCcw className="h-4 w-4" />
            {copy.actions.refresh}
          </Button>
          {canImportDictionary ? (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {copy.actions.import}
            </Button>
          ) : null}
          {canExportDictionary ? (
            <Button
              variant="outline"
              onClick={() => void handleExport()}
              disabled={exporting}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {copy.actions.export}
            </Button>
          ) : null}
          {canCreateDictionary ? (
            <Button
              variant="outline"
              onClick={openAddType}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              {copy.actions.addType}
            </Button>
          ) : null}
          {canCreateDictionary ? (
            <Button
              onClick={openAddItem}
              disabled={!selectedType}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <Plus className="h-4 w-4" />
              {copy.actions.addItem}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryDictionary ? (
        <QueryAccessBoundary
          viewId="system-dictionary"
          title={t?.menu?.systemDictionary || copy.pageTitle}
          queryPermission={systemPermissions.dictionary.query}
          description={queryLossDescription}
          notificationDescription={queryLossDescription}
        />
      ) : (
      <>
      <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 p-6 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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

            <div className="rounded-2xl border border-slate-200/70 bg-white/72 p-3 shadow-sm backdrop-blur-sm">
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
      </Card>

      <DictDialogManager
        dialogs={dialogs}
        setDialogOpen={setDialogOpen}
        selectedItem={selectedItem}
        itemForm={itemForm}
        setItemForm={setItemForm}
        selectedTypeCode={selectedTypeCode}
        selectedTypeName={selectedType?.name}
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
    </PageLayout>
  );
}
