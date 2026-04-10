/**
 * 部门管理 Hook
 * @description 封装部门数据的获取逻辑
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '../api';
import type { Department } from '../types';

interface UseDepartmentsOptions {
  enabled?: boolean;
}

export function useDepartments(options: UseDepartmentsOptions = {}) {
  const { enabled = true } = options;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(enabled);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      requestIdRef.current += 1;
      setDepartments([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const data = await api.getDepartments();
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setDepartments(data);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      console.error('Failed to load departments:', error);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      requestIdRef.current += 1;
      setDepartments([]);
      setLoading(false);
      return;
    }
    void reload();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [enabled, reload]);

  return {
    departments,
    loading,
    reload,
  };
}
