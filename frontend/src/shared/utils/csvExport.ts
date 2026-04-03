/**
 * CSV导入导出工具类
 * 提供CSV文件的生成、下载、解析等功能
 */

/**
 * CSV模板配置接口
 */
export interface CSVTemplateConfig {
  /** 模块名称 */
  moduleName: string;
  /** 列头定义 */
  headers: {
    /** 字段键名 */
    key: string;
    /** 显示标签 */
    label: string;
    /** 示例值 */
    example?: string;
    /** 字段说明 */
    description?: string;
  }[];
  /** 示例数据行（可选） */
  exampleData?: Record<string, any>[];
}

/**
 * 将数据转换为CSV字符串
 */
export function convertToCSV(
  data: Record<string, any>[],
  headers: { key: string; label: string }[]
): string {
  if (data.length === 0) return '';

  // CSV Header
  const headerRow = headers.map(h => escapeCSVField(h.label)).join(',');
  
  // CSV Data Rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      const value = row[h.key];
      return escapeCSVField(formatValue(value));
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * 转义CSV字段（处理逗号、引号、换行符）
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '';
  
  const str = String(field);
  
  // 如果包含逗号、引号或换行符，需要用引号包裹，并将引号转义为双引号
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * 格式化值
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('; ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * 下载CSV文件
 */
export function downloadCSV(content: string, filename: string): void {
  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const legacyNavigator = navigator as Navigator & {
    msSaveBlob?: (blob: Blob, defaultName?: string) => boolean;
  };

  if (legacyNavigator.msSaveBlob) {
    // IE 10+
    legacyNavigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * 生成CSV模板文件
 */
export function generateCSVTemplate(config: CSVTemplateConfig): string {
  const { headers, exampleData } = config;
  
  // 如果有示例数据，直接使用
  if (exampleData && exampleData.length > 0) {
    return convertToCSV(exampleData, headers);
  }
  
  // 否则生成带说明的模板
  const headerRow = headers.map(h => escapeCSVField(h.label)).join(',');
  const exampleRow = headers.map(h => escapeCSVField(h.example || '')).join(',');
  const descriptionRow = headers.map(h => 
    escapeCSVField(h.description ? `(${h.description})` : '')
  ).join(',');
  
  return [headerRow, exampleRow, descriptionRow].join('\r\n');
}

/**
 * 下载CSV模板
 */
export function downloadCSVTemplate(config: CSVTemplateConfig): void {
  const content = generateCSVTemplate(config);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${config.moduleName}_template_${timestamp}.csv`;
  downloadCSV(content, filename);
}

/**
 * 解析CSV文件
 */
export function parseCSV(
  csvText: string,
  headers: { key: string; label: string }[]
): Record<string, any>[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // 跳过第一行（标题行）
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      if (index < values.length) {
        row[header.key] = parseValue(values[index]);
      }
    });
    
    return row;
  });
}

/**
 * 解析CSV行（考虑引号和转义）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 双引号转义
        current += '"';
        i++; // 跳过下一个引号
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // 添加最后一个字段
  result.push(current);
  
  return result;
}

/**
 * 解析值
 */
function parseValue(value: string): any {
  if (!value || value.trim() === '') return null;
  
  const trimmed = value.trim();
  
  // 尝试解析为数字
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }
  
  // 尝试解析为布尔值
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  
  // 返回字符串
  return trimmed;
}

/**
 * 导出数据到CSV
 */
export function exportDataToCSV(
  data: Record<string, any>[],
  headers: { key: string; label: string }[],
  filename: string
): void {
  const csv = convertToCSV(data, headers);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fullFilename = `${filename}_${timestamp}.csv`;
  downloadCSV(csv, fullFilename);
}

/**
 * 读取CSV文件
 */
export function readCSVFile(
  file: File,
  headers: { key: string; label: string }[]
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as ArrayBuffer;
        const text = decodeCSVText(raw);
        const data = parseCSV(text, headers);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function decodeCSVText(raw: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(raw);
  if (!looksMojibake(utf8)) {
    return utf8;
  }

  try {
    return new TextDecoder('gb18030').decode(raw);
  } catch {
    return utf8;
  }
}

function looksMojibake(text: string): boolean {
  if (!text) return false;
  const replacementCount = (text.match(/�/g) || []).length;
  const suspiciousCount = (text.match(/[Ãâ]/g) || []).length;
  return replacementCount > 0 || suspiciousCount > Math.max(3, text.length / 200);
}

/**
 * 验证CSV数据
 */
export function validateCSVData(
  data: Record<string, any>[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field] === '') {
        errors.push(`Row ${index + 2}: Missing required field "${field}"`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
