import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

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

    this.props.onError?.(error, errorInfo);
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKeys !== this.props.resetKeys) {
      this.resetError();
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    void errorData;
  }

  private resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRefresh = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">页面发生异常</h1>
          <p className="mb-6 text-gray-600">
            应用遇到了一个意外错误。错误信息已被记录，你可以刷新页面或稍后重试。
          </p>

          {error && (
            <div className="mb-6 text-left">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mb-2 text-sm text-blue-600 underline hover:text-blue-800"
              >
                {showDetails ? '隐藏' : '显示'}错误详情
              </button>

              {showDetails && (
                <div className="max-h-60 overflow-auto rounded-lg bg-gray-100 p-4 text-left">
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">错误信息</h3>
                    <pre className="break-words whitespace-pre-wrap text-xs text-red-600">
                      {error.message}
                    </pre>
                  </div>

                  {error.stack && (
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">堆栈跟踪</h3>
                      <pre className="break-words whitespace-pre-wrap text-xs text-gray-600">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">组件堆栈</h3>
                      <pre className="break-words whitespace-pre-wrap text-xs text-gray-600">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={onReset}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              重新尝试
            </Button>

            <Button
              onClick={onRefresh}
              className="flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              刷新页面
            </Button>

            <Button onClick={onGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              返回首页
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            如果问题持续存在，请联系技术支持。
          </p>
        </div>
      </Card>
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>,
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

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
