/**
 * 导出数据对话框组件
 * 支持多种导出格式和选项配置
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Checkbox } from '../../../components/ui/checkbox';
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react';

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
  title?: string;
  description?: string;
  defaultFileName?: string;
  availableFormats?: ExportFormat[];
  exportColumns?: ExportColumn[];
  loading?: boolean;
}

export interface ExportOptions {
  fileName: string;
  format: ExportFormat;
  selectedColumns?: string[];
  includeHeaders?: boolean;
}

export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'txt';

export interface ExportColumn {
  key: string;
  label: string;
  checked?: boolean;
}

const formatIcons = {
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  json: FileJson,
  txt: FileText,
};

const formatLabels = {
  xlsx: 'Excel 表格 (.xlsx)',
  csv: 'CSV 文件 (.csv)',
  json: 'JSON 文件 (.json)',
  txt: '文本文件 (.txt)',
};

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  title = '导出数据',
  description = '选择导出格式和配置选项',
  defaultFileName = 'export_data',
  availableFormats = ['xlsx', 'csv', 'json'],
  exportColumns = [],
  loading = false,
}: ExportDialogProps) {
  const [fileName, setFileName] = useState(defaultFileName);
  const [format, setFormat] = useState<ExportFormat>(availableFormats[0]);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    exportColumns.map(col => col.key)
  );

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns([...selectedColumns, columnKey]);
    } else {
      setSelectedColumns(selectedColumns.filter(key => key !== columnKey));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedColumns(exportColumns.map(col => col.key));
    } else {
      setSelectedColumns([]);
    }
  };

  const handleExport = () => {
    onExport({
      fileName,
      format,
      selectedColumns: exportColumns.length > 0 ? selectedColumns : undefined,
      includeHeaders,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 文件名 */}
          <div className="space-y-2">
            <Label htmlFor="fileName">文件名</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="请输入文件名"
            />
          </div>

          {/* 导出格式 */}
          <div className="space-y-3">
            <Label>导出格式</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="grid grid-cols-2 gap-3">
                {availableFormats.map((fmt) => {
                  const Icon = formatIcons[fmt];
                  return (
                    <div
                      key={fmt}
                      className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all ${
                        format === fmt
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormat(fmt)}
                    >
                      <RadioGroupItem value={fmt} id={fmt} />
                      <Label
                        htmlFor={fmt}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Icon className={`w-4 h-4 ${format === fmt ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={format === fmt ? 'text-blue-700 font-medium' : ''}>
                          {formatLabels[fmt]}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* 导出选项 */}
          <div className="space-y-3">
            <Label>导出选项</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeaders"
                  checked={includeHeaders}
                  onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                />
                <Label
                  htmlFor="includeHeaders"
                  className="text-sm font-normal cursor-pointer"
                >
                  包含表头
                </Label>
              </div>
            </div>
          </div>

          {/* 选择列 */}
          {exportColumns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>选择导出列</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectAll(selectedColumns.length !== exportColumns.length)}
                >
                  {selectedColumns.length === exportColumns.length ? '取消全选' : '全选'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                {exportColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={(checked) =>
                        handleColumnToggle(column.key, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={column.key}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || !fileName || (exportColumns.length > 0 && selectedColumns.length === 0)}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? '导出中...' : '导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
