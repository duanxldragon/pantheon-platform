/**
 * 懒加载组件
 * @description 提供组件懒加载、路由懒加载、图片懒加载等功能
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * 加载状态组件
 */
export function LoadingFallback({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * 骨架屏加载组件
 */
export function SkeletonFallback({ type = 'list' }: { type?: 'list' | 'card' | 'form' }) {
  if (type === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="space-y-6 max-w-2xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // 默认列表样式
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 错误边界组件
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">加载失败</p>
          <p className="text-sm">{error.message}</p>
          <button
            onClick={resetError}
            className="text-sm underline hover:no-underline"
          >
            重试
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * 懒加载包装器
 */
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
}

export function LazyLoad({ children, fallback, error }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
}

/**
 * 创建懒加载组件
 * @param importFunc 动态导入函数
 * @param fallback 加载时的占位组件
 * @returns 懒加载组件
 * 
 * @example
 * const UserManagement = createLazyComponent(
 *   () => import('./modules/system/views/UserManagement')
 * );
 * 
 * function App() {
 *   return <UserManagement />;
 * }
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * 预加载组件
 * @param importFunc 动态导入函数
 * 
 * @example
 * const UserManagement = createLazyComponent(() => import('./UserManagement'));
 * 
 * // 鼠标悬停时预加载
 * <button
 *   onMouseEnter={() => preloadComponent(() => import('./UserManagement'))}
 *   onClick={() => navigate('/users')}
 * >
 *   用户管理
 * </button>
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  importFunc();
}

/**
 * 图片懒加载组件
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  if (error) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <Skeleton
          className={className}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  );
}

/**
 * 延迟加载组件（等待一定时间后再显示）
 */
interface DelayedLoadProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

export function DelayedLoad({ children, delay = 200, fallback }: DelayedLoadProps) {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}

/**
 * 条件懒加载组件
 * @param condition 加载条件
 * @param importFunc 动态导入函数
 * @param fallback 加载时的占位组件
 * 
 * @example
 * // 只有在用户有权限时才加载组件
 * <ConditionalLazyLoad
 *   condition={hasPermission('user:view')}
 *   importFunc={() => import('./UserManagement')}
 * />
 */
interface ConditionalLazyLoadProps<T extends ComponentType<any>> {
  condition: boolean;
  importFunc: () => Promise<{ default: T }>;
  fallback?: React.ReactNode;
  props?: React.ComponentProps<T>;
}

export function ConditionalLazyLoad<T extends ComponentType<any>>({
  condition,
  importFunc,
  fallback,
  props,
}: ConditionalLazyLoadProps<T>) {
  const [Component, setComponent] = React.useState<T | null>(null);

  React.useEffect(() => {
    if (condition) {
      importFunc().then((module) => {
        setComponent(() => module.default);
      });
    }
  }, [condition, importFunc]);

  if (!condition) {
    return null;
  }

  if (!Component) {
    return <>{fallback || <LoadingFallback />}</>;
  }

  return <Component {...(props as any)} />;
}

/**
 * 路由懒加载辅助函数
 * 
 * @example
 * import { createLazyRoute } from './LazyLoad';
 * 
 * const routes = [
 *   {
 *     path: '/users',
 *     element: createLazyRoute(() => import('./views/UserManagement')),
 *   },
 *   {
 *     path: '/roles',
 *     element: createLazyRoute(() => import('./views/RoleManagement')),
 *   },
 * ];
 */
export function createLazyRoute(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (
    <Suspense fallback={fallback || <LoadingFallback message="加载页面中..." />}>
      <LazyComponent />
    </Suspense>
  );
}

/**
 * 模块懒加载Hook
 * @param importFunc 动态导入函数
 * @returns [module, loading, error]
 * 
 * @example
 * const [utils, loading, error] = useLazyModule(() => import('./utils'));
 * 
 * if (loading) return <LoadingFallback />;
 * if (error) return <ErrorFallback error={error} />;
 * 
 * // 使用模块
 * utils.someFunction();
 */
export function useLazyModule<T>(
  importFunc: () => Promise<T>
): [T | null, boolean, Error | null] {
  const [module, setModule] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    importFunc()
      .then((mod) => {
        setModule(mod);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [importFunc]);

  return [module, loading, error];
}
