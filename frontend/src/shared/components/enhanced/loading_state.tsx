/**
 * LoadingState 组件 - 加载状态展示
 * 支持多种加载样式：spinner、skeleton、pulse
 */

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  type = 'spinner',
  text = '加载中...',
  size = 'md',
  fullScreen = false,
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center py-12';

  if (type === 'spinner') {
    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} rounded-full bg-primary`}
                style={{
                  animation: 'bounce 1.4s infinite ease-in-out',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-primary/20 animate-ping`} />
    </div>
  );
}

/**
 * 表格骨架屏加载
 */
export function TableLoadingSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* 表头 */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* 表格行 */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="h-12 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 卡片骨架屏加载
 */
export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
