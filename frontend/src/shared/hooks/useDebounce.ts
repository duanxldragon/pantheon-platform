/**
 * 防抖和节流Hooks
 * @description 用于优化搜索、滚动等高频触发的操作
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 防抖Hook
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 * 
 * @example
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearchText = useDebounce(searchText, 500);
 * 
 * useEffect(() => {
 *   // 只有当用户停止输入500ms后才会触发搜索
 *   search(debouncedSearchText);
 * }, [debouncedSearchText]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 防抖函数Hook
 * @param func 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * const handleSearch = useDebounceCallback((text: string) => {
 *   api.search(text);
 * }, 500);
 * 
 * <Input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedFunction;
}

/**
 * 节流Hook
 * @param value 需要节流的值
 * @param interval 节流间隔（毫秒）
 * @returns 节流后的值
 * 
 * @example
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 * 
 * useEffect(() => {
 *   // 每100ms最多触发一次
 *   handleScroll(throttledScrollY);
 * }, [throttledScrollY]);
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - timeSinceLastUpdate);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * 节流函数Hook
 * @param func 需要节流的函数
 * @param interval 节流间隔（毫秒）
 * @returns 节流后的函数
 * 
 * @example
 * const handleScroll = useThrottleCallback((e: Event) => {
 *   console.log('Scrolling:', window.scrollY);
 * }, 100);
 * 
 * window.addEventListener('scroll', handleScroll);
 */
export function useThrottleCallback<T extends (...args: unknown[]) => unknown>(
  func: T,
  interval: number = 500
): (...args: Parameters<T>) => void {
  const lastRan = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRan = now - lastRan.current;

      if (timeSinceLastRan >= interval) {
        func(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          func(...args);
          lastRan.current = Date.now();
        }, interval - timeSinceLastRan);
      }
    },
    [func, interval]
  );

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledFunction;
}

/**
 * 搜索防抖Hook（专门为搜索优化）
 * @param initialValue 初始值
 * @param delay 延迟时间（毫秒）
 * @returns [当前值, 防抖后的值, 设置值函数, 是否正在防抖]
 * 
 * @example
 * const [searchText, debouncedSearchText, setSearchText, isDebouncing] = useSearchDebounce('', 500);
 * 
 * <Input 
 *   value={searchText} 
 *   onChange={(e) => setSearchText(e.target.value)} 
 * />
 * {isDebouncing && <Spinner />}
 * 
 * useEffect(() => {
 *   api.search(debouncedSearchText);
 * }, [debouncedSearchText]);
 */
export function useSearchDebounce<T = string>(
  initialValue: T,
  delay: number = 500
): [T, T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, debouncedValue, setValue, isDebouncing];
}

/**
 * 滚动节流Hook（专门为滚动优化）
 * @param callback 滚动回调函数
 * @param interval 节流间隔（毫秒）
 * 
 * @example
 * useScrollThrottle(() => {
 *   console.log('Scrolled to:', window.scrollY);
 * }, 100);
 */
export function useScrollThrottle(
  callback: (scrollY: number) => void,
  interval: number = 100
) {
  const throttledCallback = useThrottleCallback(callback, interval);

  useEffect(() => {
    const handleScroll = () => {
      throttledCallback(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [throttledCallback]);
}

/**
 * 窗口大小变化节流Hook
 * @param callback 回调函数
 * @param interval 节流间隔（毫秒）
 * 
 * @example
 * useResizeThrottle(() => {
 *   console.log('Window resized:', window.innerWidth, window.innerHeight);
 * }, 200);
 */
export function useResizeThrottle(
  callback: (width: number, height: number) => void,
  interval: number = 200
) {
  const throttledCallback = useThrottleCallback(callback, interval);

  useEffect(() => {
    const handleResize = () => {
      throttledCallback(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [throttledCallback]);
}

/**
 * 输入防抖Hook（专门为输入框优化，带加载状态）
 * @param initialValue 初始值
 * @param onSearch 搜索函数
 * @param delay 延迟时间（毫秒）
 * @returns [当前值, 设置值函数, 是否正在搜索]
 * 
 * @example
 * const [searchText, setSearchText, isSearching] = useInputDebounce('', async (text) => {
 *   const results = await api.search(text);
 *   setResults(results);
 * }, 500);
 * 
 * <Input 
 *   value={searchText} 
 *   onChange={(e) => setSearchText(e.target.value)} 
 * />
 * {isSearching && <Spinner />}
 */
export function useInputDebounce<T = string>(
  initialValue: T,
  onSearch: (value: T) => void | Promise<void>,
  delay: number = 500
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);

    const handler = setTimeout(async () => {
      try {
        await onSearch(value);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, onSearch]);

  return [value, setValue, isSearching];
}

/**
 * 通用防抖Hook（支持立即执行）
 * @param func 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行第一次
 * @returns 防抖后的函数
 * 
 * @example
 * const handleClick = useDebounceImmediate(() => {
 *   console.log('Clicked!');
 * }, 1000, true); // 第一次立即执行，后续点击需等待1秒
 */
export function useDebounceImmediate<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number = 500,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstCallRef = useRef<boolean>(true);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      const callNow = immediate && isFirstCallRef.current;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (callNow) {
        func(...args);
        isFirstCallRef.current = false;
      }

      timerRef.current = setTimeout(() => {
        if (!callNow) {
          func(...args);
        }
        isFirstCallRef.current = true;
      }, delay);
    },
    [func, delay, immediate]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedFunction;
}
