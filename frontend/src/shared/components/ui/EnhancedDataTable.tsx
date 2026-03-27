import { ReactNode, useState } from 'react';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { useThemeStore } from '../../../stores/themeStore';
import { useLanguageStore } from '../../../stores/languageStore';
import { SimplePagination } from './SimplePagination';

export interface Column<T> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => ReactNode;
}

interface EnhancedDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string | number;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  onRowClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function EnhancedDataTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  pagination,
}: EnhancedDataTableProps<T>) {
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data);
    }
  };

  const handleSelectRow = (item: T) => {
    const key = rowKey(item);
    const isSelected = selectedItems.some((selected) => rowKey(selected) === key);

    if (isSelected) {
      onSelectionChange?.(selectedItems.filter((selected) => rowKey(selected) !== key));
    } else {
      onSelectionChange?.([...selectedItems, item]);
    }
  };

  const isRowSelected = (item: T) => {
    const key = rowKey(item);
    return selectedItems.some((selected) => rowKey(selected) === key);
  };

  return (
    <div className="rounded-lg border" style={{ borderColor: theme.colors.border }}>
      <Table>
        <TableHeader>
          <TableRow style={{ backgroundColor: theme.colors.hover }}>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="全选"
                  className={isSomeSelected ? 'data-[state=checked]:bg-blue-600' : ''}
                />
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.align === 'right' ? 'text-right' : ''}
                style={{
                  width: column.width,
                  color: theme.colors.text,
                }}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="text-center py-8"
                style={{ color: theme.colors.textSecondary }}
              >
                {t.common.noData}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => {
              const key = rowKey(item);
              const isSelected = isRowSelected(item);
              const isHovered = hoveredRow === key;

              return (
                <TableRow
                  key={key}
                  className="transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isSelected
                      ? theme.colors.primaryLight
                      : isHovered
                      ? theme.colors.hover
                      : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(key)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(item)}
                        aria-label="选择行"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.align === 'right' ? 'text-right' : ''}
                      style={{ color: theme.colors.text }}
                    >
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {pagination && (
        <div className="py-4 border-t" style={{ borderColor: theme.colors.border }}>
          <SimplePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}