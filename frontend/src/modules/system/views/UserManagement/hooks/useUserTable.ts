import { useState, useMemo } from 'react';
import { User } from '../../../types';

interface Filters {
  departmentId?: string;
  roleId?: string;
  status?: string;
}

export function useUserTable(initialUsers: User[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    departmentId: 'all',
    roleId: 'all',
    status: 'all'
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 综合过滤逻辑
  const filteredData = useMemo(() => {
    return initialUsers.filter((user) => {
      // 1. 关键字搜索 (用户名、姓名、邮箱、手机)
      const matchesSearch = searchQuery === '' || 
        [user.username, user.realName, user.email, user.phone]
          .some(field => field?.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. 部门过滤
      const matchesDept = filters.departmentId === 'all' || user.departmentId === filters.departmentId;

      // 3. 角色过滤
      const matchesRole = filters.roleId === 'all' || user.roleIds.includes(filters.roleId!);

      // 4. 状态过滤
      const matchesStatus = filters.status === 'all' || user.status === filters.status;

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });
  }, [initialUsers, searchQuery, filters]);

  // 分页计算
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedUsers,
    setSelectedUsers,
    page,
    setPage,
    totalPages,
    filteredData,
    paginatedData,
  };
}
