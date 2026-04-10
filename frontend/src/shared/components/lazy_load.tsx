import React, { ComponentType, Suspense } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Skeleton } from '../../components/ui/skeleton';

export function LoadingFallback({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function SkeletonFallback({ type = 'list' }: { type?: 'list' | 'card' | 'form' }) {
  if (type === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-6">
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
      <div className="max-w-2xl space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

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

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
}

export function LazyLoad({ children, fallback }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
}

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

  void placeholder;

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
      { rootMargin: '50px' },
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

interface ConditionalLazyLoadProps<TProps extends object> {
  condition: boolean;
  importFunc: () => Promise<{ default: ComponentType<TProps> }>;
  fallback?: React.ReactNode;
  props?: TProps;
}

export function ConditionalLazyLoad<TProps extends object>({
  condition,
  importFunc,
  fallback,
  props,
}: ConditionalLazyLoadProps<TProps>) {
  const [Component, setComponent] = React.useState<ComponentType<TProps> | null>(null);

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

  return <Component {...(props ?? ({} as TProps))} />;
}
