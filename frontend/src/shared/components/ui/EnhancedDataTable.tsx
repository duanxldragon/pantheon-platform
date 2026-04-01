import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { cn } from '../../../components/ui/utils';
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
  className?: string;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
  };
}

export function EnhancedDataTable<T>({
  columns,
  data,
  rowKey,
  className,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  emptyState,
  loading = false,
  pagination,
}: EnhancedDataTableProps<T>) {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);
  const [scrollState, setScrollState] = useState({
    scrollable: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < data.length;

  const resolveColumnWidth = useCallback((column: Column<T>) => {
    if (column.width) {
      const parsed = Number.parseFloat(column.width);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    if (column.key === 'status') {
      return 112;
    }

    if (column.key === 'actions') {
      return 208;
    }

    return 160;
  }, []);

  const tableMinWidth = useMemo(() => {
    const selectionWidth = selectable ? 56 : 0;
    const total = columns.reduce((sum, column) => sum + resolveColumnWidth(column), selectionWidth);
    return `${Math.max(total, 760)}px`;
  }, [columns, resolveColumnWidth, selectable]);

  const updateScrollState = useCallback(() => {
    const container =
      scrollContainerRef.current ||
      (rootRef.current?.querySelector('[data-slot="table-container"]') as HTMLDivElement | null);

    if (!container) {
      return;
    }

    scrollContainerRef.current = container;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const scrollable = maxScrollLeft > 8;

    setScrollState({
      scrollable,
      canScrollLeft: scrollable && container.scrollLeft > 8,
      canScrollRight: scrollable && container.scrollLeft < maxScrollLeft - 8,
    });
  }, []);

  const scrollHorizontally = useCallback((direction: 'left' | 'right') => {
    const container =
      scrollContainerRef.current ||
      (rootRef.current?.querySelector('[data-slot="table-container"]') as HTMLDivElement | null);

    if (!container) {
      return;
    }

    scrollContainerRef.current = container;
    container.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    const container = rootRef.current?.querySelector('[data-slot="table-container"]') as HTMLDivElement | null;
    if (!container) {
      return;
    }

    scrollContainerRef.current = container;
    updateScrollState();

    const handleScroll = () => updateScrollState();
    container.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(container);

    const table = container.querySelector('[data-slot="table"]');
    if (table instanceof HTMLElement) {
      resizeObserver.observe(table);
    }

    window.addEventListener('resize', updateScrollState);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [columns, data, loading, pagination, updateScrollState]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]);
      return;
    }

    onSelectionChange?.(data);
  };

  const handleSelectRow = (item: T) => {
    const key = rowKey(item);
    const isSelected = selectedItems.some((selected) => rowKey(selected) === key);

    if (isSelected) {
      onSelectionChange?.(selectedItems.filter((selected) => rowKey(selected) !== key));
      return;
    }

    onSelectionChange?.([...selectedItems, item]);
  };

  const isRowSelected = (item: T) => {
    const key = rowKey(item);
    return selectedItems.some((selected) => rowKey(selected) === key);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/88 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-xl',
        className,
      )}
    >
      {scrollState.scrollable ? (
        <>
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white via-white/85 to-transparent transition-opacity duration-300 ${
              scrollState.canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white via-white/85 to-transparent transition-opacity duration-300 ${
              scrollState.canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollHorizontally('left')}
            className={`absolute left-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2 rounded-full border-slate-200 bg-white/95 shadow-md backdrop-blur transition-all ${
              scrollState.canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-label={zh ? '向左滑动表格' : 'Scroll table left'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => scrollHorizontally('right')}
            className={`absolute right-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2 rounded-full border-slate-200 bg-white/95 shadow-md backdrop-blur transition-all ${
              scrollState.canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-label={zh ? '向右滑动表格' : 'Scroll table right'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      ) : null}

      <Table className="min-w-max" style={{ minWidth: tableMinWidth }}>
        <TableHeader>
          <TableRow className="border-b border-slate-200/80 bg-slate-50/90">
            {selectable ? (
              <TableHead
                className="w-12 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                style={{ width: '56px', minWidth: '56px' }}
              >
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label={zh ? '全选当前页' : 'Select all rows'}
                  className={isSomeSelected ? 'data-[state=checked]:bg-blue-600' : ''}
                />
              </TableHead>
            ) : null}
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500',
                  column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : '',
                )}
                style={{
                  width: column.width,
                  minWidth: column.width,
                }}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b-0">
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-sm text-slate-500"
              >
                {t.common.loading}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-12 text-center text-sm text-slate-500"
              >
                {emptyState || t.common.noData}
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
                  className={cn(
                    'cursor-pointer border-slate-100/80 transition-colors duration-200',
                    isSelected ? 'bg-primary/5' : isHovered ? 'bg-slate-50/85' : 'bg-transparent',
                  )}
                  onMouseEnter={() => setHoveredRow(key)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable ? (
                    <TableCell
                      onClick={(event) => event.stopPropagation()}
                      style={{ width: '56px', minWidth: '56px' }}
                      className="py-4"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(item)}
                        aria-label={zh ? '选择当前行' : 'Select row'}
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        'py-4 text-slate-700',
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : '',
                      )}
                      style={{
                        width: column.width,
                        minWidth: column.width,
                      }}
                    >
                      {column.render ? column.render(item) : (item as Record<string, ReactNode>)[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {pagination ? (
        <div className="border-t border-slate-200/80 bg-slate-50/80 px-5 py-4">
          <SimplePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            pageSize={pagination.pageSize}
          />
        </div>
      ) : null}
    </div>
  );
}
