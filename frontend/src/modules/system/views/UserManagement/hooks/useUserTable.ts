import { useEffect, useMemo, useState } from 'react';

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
    status: 'all',
  });
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredData = useMemo(() => {
    return initialUsers
      .filter((user) => {
        const matchesSearch =
          searchQuery === '' ||
          [user.username, user.realName, user.email, user.phone].some((field) =>
            field?.toLowerCase().includes(searchQuery.toLowerCase()),
          );

        const matchesDept = filters.departmentId === 'all' || user.departmentId === filters.departmentId;
        const matchesRole = filters.roleId === 'all' || user.roleIds.includes(filters.roleId!);
        const matchesStatus = filters.status === 'all' || user.status === filters.status;

        return matchesSearch && matchesDept && matchesRole && matchesStatus;
      })
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });
  }, [filters, initialUsers, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [initialUsers, searchQuery, filters.departmentId, filters.roleId, filters.status]);

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
