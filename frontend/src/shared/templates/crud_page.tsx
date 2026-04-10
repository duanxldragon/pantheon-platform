import { ReactNode, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Download, Plus, Upload, Trash2 } from '../components/ui/icons';
import { ThemedSearchBar } from '../components/ui/themed_search_bar';
import { PageLayout } from '../../components/layouts/page_layout';
import { EnhancedDataTable, Column } from '../components/ui/enhanced_data_table';
import { DataImportExportDialog, ExportOptions } from '../components/ui/data_import_export_dialog';

export interface CrudPageConfig<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  actions?: {
    onAdd?: () => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onView?: (item: T) => void;
    onImport?: (file: File) => Promise<void>;
    onExport?: (options: ExportOptions) => Promise<void>;
    onBatchDelete?: (items: T[]) => void;
    customActions?: ReactNode[];
  };
  filters?: ReactNode;
  tableActions?: (item: T) => ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
}

export function CrudPage<T>({
  title,
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  pagination,
  actions,
  filters,
  tableActions: _tableActions,
  emptyState,
  loading = false,
}: CrudPageConfig<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Filter data based on search query
  const filteredData = searchable && searchQuery
    ? data.filter((item) => {
        // Simple search implementation - can be customized
        const searchStr = searchQuery.toLowerCase();
        return JSON.stringify(item).toLowerCase().includes(searchStr);
      })
    : data;

  const handleImport = async (file: File) => {
    await actions?.onImport?.(file);
    setIsImportDialogOpen(false);
  };

  const handleExport = async (options: ExportOptions) => {
    void (options.scope === 'selected' && selectedItems.length > 0
      ? selectedItems
      : filteredData);
    await actions?.onExport?.(options);
    setIsExportDialogOpen(false);
  };

  const handleBatchDelete = () => {
    if (selectedItems.length > 0) {
      actions?.onBatchDelete?.(selectedItems);
    }
  };

  const renderHeaderActions = () => {
    const actionButtons = [];

    // Batch delete button
    if (selectable && selectedItems.length > 0 && actions?.onBatchDelete) {
      actionButtons.push(
        <Button key="batch-delete" variant="outline" onClick={handleBatchDelete} className="gap-2">
          <Trash2 className="w-4 h-4" />
          删除 ({selectedItems.length})
        </Button>
      );
    }

    // Import button
    if (actions?.onImport) {
      actionButtons.push(
        <Button key="import" variant="outline" onClick={() => setIsImportDialogOpen(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          导入
        </Button>
      );
    }

    // Export button
    if (actions?.onExport) {
      actionButtons.push(
        <Button key="export" variant="outline" onClick={() => setIsExportDialogOpen(true)} className="gap-2">
          <Download className="w-4 h-4" />
          导出
        </Button>
      );
    }

    // Custom actions
    if (actions?.customActions) {
      actionButtons.push(...actions.customActions.map((action, index) => (
        <div key={`custom-${index}`}>{action}</div>
      )));
    }

    // Add button
    if (actions?.onAdd) {
      actionButtons.push(
        <Button key="add" onClick={actions.onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          新增
        </Button>
      );
    }

    return actionButtons;
  };

  return (
    <PageLayout
      title={title}
      actions={
        <div className="flex items-center gap-3">
          {searchable && (
            <ThemedSearchBar
              placeholder={searchPlaceholder || "搜索..."}
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-64"
            />
          )}
          {filters}
          <div className="flex items-center gap-2">
            {renderHeaderActions()}
          </div>
        </div>
      }
    >
      <Card className="p-6">
        <EnhancedDataTable
          columns={columns}
          data={filteredData}
          rowKey={rowKey}
          selectable={selectable}
          selectedItems={selectedItems}
          onSelectionChange={onSelectionChange}
          onRowClick={onRowClick}
          pagination={pagination}
          emptyState={emptyState}
          loading={loading}
        />
      </Card>

      {actions?.onImport && (
        <DataImportExportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          mode="import"
          resourceName={title}
          onImport={handleImport}
        />
      )}

      {actions?.onExport && (
        <DataImportExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          mode="export"
          resourceName={title}
          onExport={handleExport}
        />
      )}
    </PageLayout>
  );
}






