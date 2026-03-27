/**
 * 数据缓存Hooks
 * @description 提供数据缓存、SWR模式、请求去重等功能
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 缓存项
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * 缓存管理器
 */
class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 请求去重：如果相同的请求正在进行中，返回该请求的Promise
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // 检查是否有相同的请求正在进行
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // 发起新请求
    const promise = fetcher().finally(() => {
      // 请求完成后，从pending列表中删除
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// 全局缓存管理器实例
const cacheManager = new CacheManager();

/**
 * 使用缓存Hook
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param options 配置选项
 * @returns [data, loading, error, mutate, refetch]
 * 
 * @example
 * const [users, loading, error, mutate, refetch] = useCache(
 *   'users',
 *   () => api.get('/users'),
 *   { cacheTime: 5 * 60 * 1000 }
 * );
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheTime?: number; // 缓存时间（毫秒）
    revalidateOnFocus?: boolean; // 窗口聚焦时重新验证
    revalidateOnReconnect?: boolean; // 网络重连时重新验证
    dedupe?: boolean; // 请求去重
  } = {}
): [T | null, boolean, Error | null, (data: T) => void, () => Promise<void>] {
  const {
    cacheTime = 5 * 60 * 1000,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    dedupe = true,
  } = options;

  const [data, setData] = useState<T | null>(() => cacheManager.get<T>(key));
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let result: T;
      if (dedupe) {
        result = await cacheManager.dedupe(key, fetcher);
      } else {
        result = await fetcher();
      }

      setData(result);
      cacheManager.set(key, result, cacheTime);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cacheTime, dedupe]);

  // 手动更新数据（乐观更新）
  const mutate = useCallback(
    (newData: T) => {
      setData(newData);
      cacheManager.set(key, newData, cacheTime);
    },
    [key, cacheTime]
  );

  // 重新获取数据
  const refetch = useCallback(async () => {
    cacheManager.delete(key);
    await fetchData();
  }, [key, fetchData]);

  // 初始化和缓存检查
  useEffect(() => {
    const cachedData = cacheManager.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [key, fetchData]);

  // 窗口聚焦时重新验证
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, refetch]);

  // 网络重连时重新验证
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      refetch();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, refetch]);

  return [data, loading, error, mutate, refetch];
}

/**
 * SWR (Stale-While-Revalidate) Hook
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param options 配置选项
 * @returns { data, loading, error, mutate, isValidating }
 * 
 * @example
 * const { data: users, loading, error, mutate, isValidating } = useSWR(
 *   'users',
 *   () => api.get('/users'),
 *   { refreshInterval: 30000 }
 * );
 */
export function useSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cacheTime?: number;
    refreshInterval?: number; // 定时刷新间隔（毫秒）
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    dedupe?: boolean;
  } = {}
) {
  const {
    cacheTime = 5 * 60 * 1000,
    refreshInterval,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupe = true,
  } = options;

  const [data, setData] = useState<T | null>(() => cacheManager.get<T>(key));
  const [loading, setLoading] = useState<boolean>(!data);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // 获取数据
  const fetchData = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setIsValidating(true);
        setError(null);

        let result: T;
        if (dedupe) {
          result = await cacheManager.dedupe(key, fetcher);
        } else {
          result = await fetcher();
        }

        setData(result);
        cacheManager.set(key, result, cacheTime);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
        setIsValidating(false);
      }
    },
    [key, fetcher, cacheTime, dedupe]
  );

  // 手动更新数据
  const mutate = useCallback(
    (newData: T) => {
      setData(newData);
      cacheManager.set(key, newData, cacheTime);
    },
    [key, cacheTime]
  );

  // 初始化
  useEffect(() => {
    const cachedData = cacheManager.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      // 后台重新验证
      fetchData(true);
    } else {
      fetchData();
    }
  }, [key, fetchData]);

  // 定时刷新
  useEffect(() => {
    if (!refreshInterval) return;

    const timer = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, fetchData]);

  // 窗口聚焦时重新验证
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // 网络重连时重新验证
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  return {
    data,
    loading,
    error,
    mutate,
    isValidating,
  };
}

/**
 * 分页缓存Hook
 * @param key 缓存键前缀
 * @param fetcher 数据获取函数
 * @param page 当前页码
 * @param pageSize 每页数量
 * @returns [data, loading, error, refetch]
 * 
 * @example
 * const [users, loading, error, refetch] = usePaginatedCache(
 *   'users',
 *   (page, size) => api.get(`/users?page=${page}&size=${size}`),
 *   currentPage,
 *   10
 * );
 */
export function usePaginatedCache<T>(
  key: string,
  fetcher: (page: number, pageSize: number) => Promise<T>,
  page: number,
  pageSize: number
): [T | null, boolean, Error | null, () => Promise<void>] {
  const cacheKey = `${key}:page:${page}:size:${pageSize}`;
  
  return useCache(
    cacheKey,
    () => fetcher(page, pageSize),
    { cacheTime: 2 * 60 * 1000 } // 分页数据缓存2分钟
  );
}

/**
 * 无限滚动缓存Hook
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param initialPage 初始页码
 * @returns { data, loading, error, loadMore, hasMore, reset }
 * 
 * @example
 * const { data: users, loading, loadMore, hasMore } = useInfiniteCache(
 *   'users',
 *   (page) => api.get(`/users?page=${page}`)
 * );
 */
export function useInfiniteCache<T>(
  key: string,
  fetcher: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  initialPage: number = 1
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const result = await fetcher(page);
      
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);

      // 缓存当前页数据
      cacheManager.set(`${key}:page:${page}`, result, 2 * 60 * 1000);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, page, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  // 初始加载
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    loadMore,
    hasMore,
    reset,
  };
}

/**
 * 清除缓存
 */
export function clearCache(key?: string): void {
  if (key) {
    cacheManager.delete(key);
  } else {
    cacheManager.clear();
  }
}

/**
 * 清除所有匹配前缀的缓存
 */
export function clearCacheByPrefix(prefix: string): void {
  const keys = cacheManager.keys();
  keys.forEach(key => {
    if (key.startsWith(prefix)) {
      cacheManager.delete(key);
    }
  });
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cacheManager.size(),
    keys: cacheManager.keys(),
  };
}
