/**
 * 虚拟滚动表格组件
 * @description 用于大数据量表格的性能优化，只渲染可见区域的行
 */

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/skeleton';
import { useLanguageStore } from '../../../stores/languageStore';

/**
 * 列定义
 */
export interface VirtualTableColumn<T = any> {
  key: string;
  title: string;
  width?: number | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

/**
 * 组件属性
 */
export interface VirtualizedTableProps<T = any> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  containerHeight?: number;
  overscan?: number;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: T, index: number) => void;
  rowClassName?: (record: T, index: number) => string;
  getRowKey?: (record: T, index: number) => string | number;
}

/**
 * 虚拟滚动表格组件
 */
export function VirtualizedTable<T = any>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 600,
  overscan = 5,
  loading = false,
  emptyText,
  onRowClick,
  rowClassName,
  getRowKey,
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const t = useLanguageStore((state) => state.t);
  const resolvedEmptyText = emptyText ?? t.common.noData;

  // 计算总高度
  const totalHeight = data.length * rowHeight;

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / rowHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / rowHeight);

    // 添加overscan以平滑滚动
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(data.length, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, rowHeight, containerHeight, data.length, overscan]);

  // 可见数据
  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  // 偏移量
  const offsetY = visibleRange.start * rowHeight;

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // 获取行的key
  const getKey = useCallback(
    (record: T, index: number) => {
      if (getRowKey) {
        return getRowKey(record, index);
      }
      return (record as any).id || index;
    },
    [getRowKey]
  );

  // 渲染加载状态
  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  className={col.align ? `text-${col.align}` : ''}
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // 渲染空状态
  if (data.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  className={col.align ? `text-${col.align}` : ''}
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                {resolvedEmptyText}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: containerHeight,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* 占位容器，撑开滚动高度 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 可见区域的表格 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetY}px)`,
            }}
          >
            <Table>
              {/* 表头固定 */}
              <TableHeader
                style={{
                  position: 'sticky',
                  top: -offsetY,
                  zIndex: 10,
                  backgroundColor: 'var(--background)',
                }}
              >
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      style={{ width: col.width }}
                      className={col.align ? `text-${col.align}` : ''}
                    >
                      {col.title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              {/* 表体 */}
              <TableBody>
                {visibleData.map((record, relativeIndex) => {
                  const absoluteIndex = visibleRange.start + relativeIndex;
                  const rowKey = getKey(record, absoluteIndex);
                  const className = rowClassName
                    ? rowClassName(record, absoluteIndex)
                    : '';

                  return (
                    <TableRow
                      key={rowKey}
                      onClick={() => onRowClick?.(record, absoluteIndex)}
                      className={`${
                        onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                      } ${className}`}
                      style={{ height: rowHeight }}
                    >
                      {columns.map((col) => {
                        const value = (record as any)[col.key];
                        const content = col.render
                          ? col.render(value, record, absoluteIndex)
                          : value;

                        return (
                          <TableCell
                            key={col.key}
                            className={col.align ? `text-${col.align}` : ''}
                          >
                            {content}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * React.memo优化的表格行组件
 */
export const VirtualTableRow = React.memo(
  function VirtualTableRow<T>({
    record,
    index,
    columns,
    rowHeight,
    onClick,
    className,
  }: {
    record: T;
    index: number;
    columns: VirtualTableColumn<T>[];
    rowHeight: number;
    onClick?: (record: T, index: number) => void;
    className?: string;
  }) {
    return (
      <TableRow
        onClick={() => onClick?.(record, index)}
        className={`${onClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${className || ''}`}
        style={{ height: rowHeight }}
      >
        {columns.map((col) => {
          const value = (record as any)[col.key];
          const content = col.render ? col.render(value, record, index) : value;

          return (
            <TableCell key={col.key} className={col.align ? `text-${col.align}` : ''}>
              {content}
            </TableCell>
          );
        })}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑，只有数据变化时才重新渲染
    return (
      prevProps.record === nextProps.record &&
      prevProps.index === nextProps.index &&
      prevProps.className === nextProps.className
    );
  }
);

/**
 * 使用虚拟滚动的Hook
 */
export function useVirtualScroll<T>({
  data,
  rowHeight = 48,
  containerHeight = 600,
  overscan = 5,
}: {
  data: T[];
  rowHeight?: number;
  containerHeight?: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / rowHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / rowHeight);

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(data.length, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, rowHeight, containerHeight, data.length, overscan]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange]);

  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.start * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleData,
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  };
}
