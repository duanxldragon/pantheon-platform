import { ReactNode, useState } from 'react';
import { useThemeStore } from '../../../stores/themeStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

// 支持两种列定义格式
export interface FlexColumn<T> {
  key?: string;
  label?: string;
  header?: string;
  accessor?: keyof T | string;
  render?: (item: T) => ReactNode;
  cell?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface ThemedDataTableProps<T> {
  columns: FlexColumn<T>[];
  data: T[];
  rowKey?: ((item: T) => string | number) | string;
  emptyMessage?: string;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export function ThemedDataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  emptyMessage = '暂无数据',
  searchable = false,
  pagination = false,
  pageSize = 10,
}: ThemedDataTableProps<T>) {
  const { theme } = useThemeStore();
  const [currentPage, setCurrentPage] = useState(1);

  // 标准化列定义
  const normalizedColumns = columns.map((col) => ({
    key: col.key || (col.accessor as string) || '',
    label: col.label || col.header || '',
    render: col.render || col.cell,
    align: col.align || 'left',
  }));

  // 获取行的key
  const getRowKey = (item: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(item);
    }
    return item[rowKey] || index;
  };

  // 分页逻辑
  const totalPages = pagination ? Math.ceil(data.length / pageSize) : 1;
  const startIndex = pagination ? (currentPage - 1) * pageSize : 0;
  const endIndex = pagination ? startIndex + pageSize : data.length;
  const displayData = data.slice(startIndex, endIndex);

  return (
    <div>
      <div
        className="rounded-lg overflow-hidden border"
        style={{
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: theme.colors.hover }}>
              {normalizedColumns.map((column, index) => (
                <TableHead
                  key={column.key || `col-${index}`}
                  className={column.align === 'right' ? 'text-right' : ''}
                  style={{ color: theme.colors.text }}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={normalizedColumns.length}
                  className="text-center py-12"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((item, index) => (
                <TableRow key={getRowKey(item, index)}>
                  {normalizedColumns.map((column, colIndex) => (
                    <TableCell
                      key={column.key || `cell-${colIndex}`}
                      className={column.align === 'right' ? 'text-right' : ''}
                      style={{ color: theme.colors.text }}
                    >
                      {column.render
                        ? column.render(item)
                        : item[column.key as keyof T]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控件 */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
            共 {data.length} 条，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
            >
              上一页
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
              }}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}