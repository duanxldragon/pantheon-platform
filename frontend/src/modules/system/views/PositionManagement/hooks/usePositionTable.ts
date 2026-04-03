import { useEffect, useMemo, useState } from 'react';
import { Position } from '../../../types';

interface Filters {
  departmentId?: string;
  level?: string;
  status?: string;
}

export function usePositionTable(initialPositions: Position[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    departmentId: 'all',
    level: 'all',
    status: 'all'
  });
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 综合过滤逻辑
  const filteredData = useMemo(() => {
    return initialPositions.filter((pos) => {
      // 1. 关键字搜索 (岗位名、编码)
      const matchesSearch = searchQuery === '' || 
        [pos.name, pos.code]
          .some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. 部门过滤
      const matchesDept = filters.departmentId === 'all' || pos.departmentId === filters.departmentId;

      // 3. 职级过滤
      const matchesLevel = filters.level === 'all' || String(pos.level) === filters.level;

      // 4. 状态过滤
      const matchesStatus = filters.status === 'all' || pos.status === filters.status;

      return matchesSearch && matchesDept && matchesLevel && matchesStatus;
    });
  }, [initialPositions, searchQuery, filters]);

  // 分页计算
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  useEffect(() => {
    setPage(1);
  }, [initialPositions, searchQuery, filters.departmentId, filters.level, filters.status]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedPositions,
    setSelectedPositions,
    page,
    setPage,
    totalPages,
    paginatedData,
  };
}
