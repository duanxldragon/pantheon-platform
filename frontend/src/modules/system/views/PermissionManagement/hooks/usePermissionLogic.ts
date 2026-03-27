import { useState, useMemo } from 'react';
import { Permission } from '../../../types';

export function usePermissionLogic(initialPermissions: Permission[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1. 综合过滤
  const filteredData = useMemo(() => {
    return initialPermissions.filter((p) => {
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || p.type === filterType;
      const matchesModule = filterModule === 'all' || p.module === filterModule;

      return matchesSearch && matchesType && matchesModule;
    });
  }, [initialPermissions, searchQuery, filterType, filterModule]);

  // 2. 统计计算
  const stats = useMemo(() => {
    return {
      total: initialPermissions.length,
      operation: initialPermissions.filter(p => p.type === 'operation').length,
      data: initialPermissions.filter(p => p.type === 'data').length,
      menu: initialPermissions.filter(p => p.type === 'menu').length,
    };
  }, [initialPermissions]);

  // 3. 分页
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  // 4. 模块提取
  const modules = useMemo(() => {
    return Array.from(new Set(initialPermissions.map(p => p.module)));
  }, [initialPermissions]);

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterModule,
    setFilterModule,
    viewMode,
    setViewMode,
    selectedPermissions,
    setSelectedPermissions,
    page,
    setPage,
    totalPages,
    paginatedData,
    stats,
    modules,
    filteredData
  };
}
