import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * @description 捕获组件树中的JavaScript错误，记录错误并显示备用UI
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * // 自定义错误页面
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * // 错误回调
 * <ErrorBoundary onError={(error, errorInfo) => {
 *   console.error('Error caught:', error);
 *   // 发送到错误监控服务
 * }}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // 调用错误回调
    this.props.onError?.(error, errorInfo);

    // 在生产环境中，应该发送错误到监控服务
    // 例如: Sentry.captureException(error, { extra: errorInfo });
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // 当 resetKeys 改变时，重置错误状态
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      this.resetError();
    }
  }

  /**
   * 记录错误到服务
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // 这里应该发送到实际的错误监控服务
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 实际项目中应该使用：
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // });

    // 或使用 errorHandler.ts 中的全局错误处理：
    // GlobalErrorHandler.getInstance().handle(error, 'ErrorBoundary');
  }

  /**
   * 重置错误状态
   */
  private resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * 刷新页面
   */
  private handleRefresh = (): void => {
    window.location.reload();
  };

  /**
   * 返回首页
   */
  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则显示默认错误页面
      return (
        <ErrorPage
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.resetError}
          onRefresh={this.handleRefresh}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 错误页面组件
 */
interface ErrorPageProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onRefresh: () => void;
  onGoHome: () => void;
}

function ErrorPage({ error, errorInfo, onReset, onRefresh, onGoHome }: ErrorPageProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center">
          {/* 图标 */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            哎呀，出错了！
          </h1>
          
          {/* 描述 */}
          <p className="text-gray-600 mb-6">
            应用程序遇到了一个意外错误。我们已经记录了这个问题，并将尽快修复。
          </p>

          {/* 错误信息 */}
          {error && (
            <div className="mb-6 text-left">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 hover:text-blue-800 underline mb-2"
              >
                {showDetails ? '隐藏' : '显示'}错误详情
              </button>
              
              {showDetails && (
                <div className="bg-gray-100 rounded-lg p-4 text-left overflow-auto max-h-60">
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      错误信息：
                    </h3>
                    <pre className="text-xs text-red-600 whitespace-pre-wrap break-words">
                      {error.message}
                    </pre>
                  </div>
                  
                  {error.stack && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">
                        堆栈跟踪：
                      </h3>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">
                        组件堆栈：
                      </h3>
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onReset}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4" />
              重新尝试
            </Button>
            
            <Button
              onClick={onRefresh}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4" />
              刷新页面
            </Button>
            
            <Button
              onClick={onGoHome}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Button>
          </div>

          {/* 提示 */}
          <p className="text-sm text-gray-500 mt-6">
            如果问题持续存在，请联系技术支持。
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * 函数式错误边界包装器
 * @description 提供更简洁的使用方式
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * 异步错误边界 Hook
 * @description 用于捕获异步操作中的错误
 * @example
 * ```tsx
 * const { showError } = useAsyncErrorBoundary();
 * 
 * const handleClick = async () => {
 *   try {
 *     await someAsyncOperation();
 *   } catch (error) {
 *     showError(error);
 *   }
 * };
 * ```
 */
export function useAsyncErrorBoundary() {
  const [, setError] = React.useState<Error | null>(null);

  const showError = React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { showError, resetError };
}
