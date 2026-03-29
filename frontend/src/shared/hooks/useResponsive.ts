/**
 * 响应式设计Hooks
 * @description 提供屏幕尺寸检测、断点判断、移动端适配等功能
 */

import { useState, useEffect, useMemo } from 'react';
import { useResizeThrottle } from './useDebounce';

/**
 * 断点配置
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * 屏幕尺寸类型
 */
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 使用窗口尺寸Hook
 * @returns { width, height }
 * 
 * @example
 * const { width, height } = useWindowSize();
 * console.log(`Window size: ${width}x${height}`);
 */
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useResizeThrottle((width, height) => {
    setSize({ width, height });
  }, 200);

  return size;
}

/**
 * 使用媒体查询Hook
 * @param query 媒体查询字符串
 * @returns 是否匹配
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // 现代浏览器使用addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // 旧版浏览器使用addListener
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * 使用断点Hook
 * @returns 当前断点
 * 
 * @example
 * const breakpoint = useBreakpoint();
 * console.log(`Current breakpoint: ${breakpoint}`); // 'sm', 'md', 'lg', etc.
 */
export function useBreakpoint(): ScreenSize {
  const { width } = useWindowSize();

  return useMemo(() => {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }, [width]);
}

/**
 * 使用移动端检测Hook
 * @returns 是否为移动端
 * 
 * @example
 * const isMobile = useMobile();
 * 
 * return (
 *   <div>
 *     {isMobile ? <MobileView /> : <DesktopView />}
 *   </div>
 * );
 */
export function useMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * 使用平板检测Hook
 * @returns 是否为平板
 * 
 * @example
 * const isTablet = useTablet();
 */
export function useTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
}

/**
 * 使用桌面端检测Hook
 * @returns 是否为桌面端
 * 
 * @example
 * const isDesktop = useDesktop();
 */
export function useDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * 使用触摸屏检测Hook
 * @returns 是否为触摸屏
 * 
 * @example
 * const isTouchDevice = useTouchDevice();
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * 使用设备方向Hook
 * @returns 'portrait' | 'landscape'
 * 
 * @example
 * const orientation = useOrientation();
 * console.log(`Device orientation: ${orientation}`);
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}

/**
 * 使用响应式值Hook
 * @param values 不同断点的值
 * @returns 当前断点对应的值
 * 
 * @example
 * const columns = useResponsiveValue({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 *   xl: 5,
 * });
 * 
 * return <Grid columns={columns}>...</Grid>;
 */
export function useResponsiveValue<T>(values: Partial<Record<ScreenSize, T>>): T | undefined {
  const breakpoint = useBreakpoint();

  return useMemo(() => {
    // 按优先级查找值
    const breakpointOrder: ScreenSize[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    // 从当前断点往下查找第一个有值的断点
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp];
      }
    }

    return undefined;
  }, [breakpoint, values]);
}

/**
 * 使用容器查询Hook（检测容器尺寸而非视口尺寸）
 * @param ref 容器引用
 * @returns { width, height }
 * 
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { width, height } = useContainerSize(containerRef);
 * 
 * return (
 *   <div ref={containerRef}>
 *     Container size: {width}x{height}
 *   </div>
 * );
 */
export function useContainerSize<T extends HTMLElement = HTMLDivElement>(
  ref: React.RefObject<T>
) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return size;
}

/**
 * 使用响应式样式Hook
 * @param baseStyles 基础样式
 * @param responsiveStyles 响应式样式
 * @returns 合并后的样式
 * 
 * @example
 * const styles = useResponsiveStyles(
 *   { padding: '1rem' },
 *   {
 *     sm: { padding: '1.5rem' },
 *     md: { padding: '2rem' },
 *     lg: { padding: '3rem' },
 *   }
 * );
 */
export function useResponsiveStyles<T extends React.CSSProperties>(
  baseStyles: T,
  responsiveStyles: Partial<Record<ScreenSize, Partial<T>>>
): T {
  const breakpoint = useBreakpoint();

  return useMemo(() => {
    const breakpointOrder: ScreenSize[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    let mergedStyles = { ...baseStyles };

    // 从xs到当前断点，依次合并样式
    for (let i = breakpointOrder.length - 1; i >= currentIndex; i--) {
      const bp = breakpointOrder[i];
      if (responsiveStyles[bp]) {
        mergedStyles = { ...mergedStyles, ...responsiveStyles[bp] };
      }
    }

    return mergedStyles;
  }, [breakpoint, baseStyles, responsiveStyles]);
}

/**
 * 使用网络状态Hook
 * @returns { online, effectiveType, downlink, rtt }
 * 
 * @example
 * const { online, effectiveType } = useNetworkStatus();
 * console.log(`Network: ${online ? 'Online' : 'Offline'}, Type: ${effectiveType}`);
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: 'unknown' as string,
    downlink: 0,
    rtt: 0,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, online: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, online: false }));
    };

    const updateConnectionInfo = () => {
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setStatus(prev => ({
          ...prev,
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return status;
}

/**
 * 使用屏幕方向锁定Hook
 * @param orientation 要锁定的方向
 * 
 * @example
 * useLockOrientation('portrait'); // 锁定为竖屏
 */
export function useLockOrientation(
  orientation: 'portrait' | 'landscape' | 'any' = 'any'
) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.screen?.orientation) return;

    const screenOrientation = window.screen.orientation as ScreenOrientation & {
      lock?: (
        orientation:
          | 'any'
          | 'natural'
          | 'landscape'
          | 'portrait'
          | 'portrait-primary'
          | 'portrait-secondary'
          | 'landscape-primary'
          | 'landscape-secondary'
      ) => Promise<void>;
      unlock?: () => void;
    };

    const lock = async () => {
      try {
        if (orientation === 'any') {
          screenOrientation.unlock?.();
        } else {
          await screenOrientation.lock?.(orientation);
        }
      } catch (error) {
        console.warn('Screen orientation lock not supported:', error);
      }
    };

    lock();

    return () => {
      try {
        screenOrientation.unlock?.();
      } catch (error) {
        // Ignore
      }
    };
  }, [orientation]);
}

/**
 * 使用暗黑模式检测Hook
 * @returns 是否为暗黑模式
 * 
 * @example
 * const isDarkMode = useDarkMode();
 */
export function useDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * 使用高对比度模式检测Hook
 * @returns 是否为高对比度模式
 */
export function useHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

/**
 * 使用减少动画检测Hook
 * @returns 是否偏好减少动画
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
