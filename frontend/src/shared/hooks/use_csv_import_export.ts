/**
 * CSV导入导出自定义Hook
 * 提供统一的导入导出功能
 */

import { useState } from 'react';
import { toast } from 'sonner';
import {
  downloadCSVTemplate,
  exportDataToCSV,
  readCSVFile,
  validateCSVData,
  CSVTemplateConfig,
} from '../utils/csv_export';

type ImportedCSVRow = Record<string, unknown>;

export interface UseCSVImportExportOptions {
  templateConfig: CSVTemplateConfig;
  onDataImported?: (data: ImportedCSVRow[]) => void | Promise<void>;
  requiredFields?: string[];
}

export function useCSVImportExport({
  templateConfig,
  onDataImported,
  requiredFields = [],
}: UseCSVImportExportOptions) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * 下载CSV模板
   */
  const handleDownloadTemplate = () => {
    try {
      downloadCSVTemplate(templateConfig);
      toast.success('模板下载成功');
    } catch (error) {
      console.error('Download template failed:', error);
      toast.error('模板下载失败');
    }
  };

  /**
   * 导入CSV文件
   */
  const handleImport = async (file: File): Promise<void> => {
    setIsImporting(true);
    try {
      // 读取CSV文件
      const data = await readCSVFile(file, templateConfig.headers);

      // 验证数据
      if (requiredFields.length > 0) {
        const validation = validateCSVData(data, requiredFields);
        if (!validation.valid) {
          toast.error(`数据验证失败: ${validation.errors.join(', ')}`);
          return;
        }
      }

      // 过滤空行
      const validData = data.filter(row => {
        return Object.values(row).some(val => val !== null && val !== '');
      });

      if (validData.length === 0) {
        toast.error('没有有效数据');
        return;
      }

      // 调用回调函数处理导入的数据
      if (onDataImported) {
        await onDataImported(validData);
      }

      toast.success(`成功导入 ${validData.length} 条数据`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('导入失败，请检查文件格式');
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * 导出数据到CSV
   */
  const handleExport = async (
    data: object[],
    options?: { filename?: string }
  ): Promise<void> => {
    setIsExporting(true);
    try {
      if (data.length === 0) {
        toast.warning('没有数据可导出');
        return;
      }

      const filename = options?.filename || templateConfig.moduleName;
      exportDataToCSV(data, templateConfig.headers, filename);
      toast.success(`成功导出 ${data.length} 条数据`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    handleDownloadTemplate,
    handleImport,
    handleExport,
    isImporting,
    isExporting,
  };
}



