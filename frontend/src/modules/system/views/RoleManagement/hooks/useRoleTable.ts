import { useEffect, useMemo, useState } from 'react';
import { Role } from '../../../types';

interface Filters {
  type?: string;
  status?: string;
}

export function useRoleTable(initialRoles: Role[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    status: 'all'
  });
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 综合过滤逻辑
  const filteredData = useMemo(() => {
    return initialRoles.filter((role) => {
      // 1. 关键字搜索 (角色名、编码)
      const matchesSearch = searchQuery === '' || 
        [role.name, role.code]
          .some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. 类型过滤
      const matchesType = filters.type === 'all' || role.type === filters.type;

      // 3. 状态过滤
      const matchesStatus = filters.status === 'all' || role.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [initialRoles, searchQuery, filters]);

  // 分页计算
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  useEffect(() => {
    setPage(1);
  }, [initialRoles, searchQuery, filters.type, filters.status]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedRoles,
    setSelectedRoles,
    page,
    setPage,
    totalPages,
    paginatedData,
  };
}
