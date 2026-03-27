/**
 * 部门管理 Hook
 * @description 封装部门数据的获取逻辑
 */

import { useEffect, useState } from 'react';

import { api } from '../api';
import type { Department } from '../types';

interface UseDepartmentsOptions {
  enabled?: boolean;
}

export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { enabled = true } = options;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = async () => {
    if (!enabled) {
      setDepartments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setDepartments([]);
      setLoading(false);
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    departments,
    loading,
    reload,
  };
}
