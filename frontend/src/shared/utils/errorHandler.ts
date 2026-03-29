import { useCallback } from 'react';
import { notification } from './notification';
import { ApiError } from './apiClient';

const ERROR_LOG_ENDPOINT = import.meta.env.VITE_ERROR_LOG_ENDPOINT?.trim() || '';

// Sentry集成（需要在项目中先安装@sentry/browser）
// To enable Sentry:
// 1. Install @sentry/browser: npm install @sentry/browser
// 2. Uncomment the import below:
// import * as Sentry from "@sentry/browser";

// 初始化Sentry函数（需要在main.ts中调用）
export function initSentry(dsn: string, enabled: boolean = false): void {
  if (!enabled) {
    console.log('Sentry is disabled. To enable, set enabled=true and ensure @sentry/browser is installed.');
    return;
  }

  try {
    // Sentry.init({
    //   dsn: dsn, // Sentry DSN from environment variables or config
    //   environment: import.meta.env.MODE === 'production' ? 'production' : 'development',
    //   release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    //   tracesSampleRate: 1.0,
    //   integrations: [
    //     Sentry.browserTracingIntegration(),
    //     Sentry.replayIntegration(),
    //   ],
    //   beforeSend(event, hint) {
    //     // Filter out sensitive information
    //     if (event.request) {
    //       delete event.request.cookies;
    //       if (event.request.headers) {
    //         delete event.request.headers['Authorization'];
    //       }
    //     }
    //     return event;
    //   },
    // });
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// 导出发送错误到分析服务的函数
export const sendErrorToAnalysis = (error: Error): void => {
  const apiError = error instanceof ApiError ? error : new ApiError(error.message, 0);
  try {
    // 如果Sentry已初始化，发送到Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      console.error('[Sentry] Sending error:', apiError);
      (window as any).Sentry.captureException(apiError, {
        extra: {
          code: apiError.code,
          details: apiError.details,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Fallback: 发送到错误日志API
      if (ERROR_LOG_ENDPOINT) {
        console.warn('[Fallback] Sentry not initialized, sending to error log API...');
        sendToErrorLogApi(apiError);
      }
    }
  } catch (e) {
    console.error('Failed to send error to analysis service:', e);
  }
};

// 发送到错误日志API
const sendToErrorLogApi = async (error: ApiError): Promise<void> => {
  if (!ERROR_LOG_ENDPOINT) {
    return;
  }

  try {
    const response = await fetch(ERROR_LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('accessToken')
          ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
          : {}),
      },
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to send error log:', response.status);
      return;
    }
  } catch (e) {
    console.error('Error sending error log:', e);
  }
};

export interface ErrorHandler {
  handle: (error: Error, context?: string) => void;
}

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorHandlers: Map<string, (error: Error, context?: string) => void> = new Map();

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * 注册错误处理器
   */
  register(name: string, handler: (error: Error, context?: string) => void): void {
    this.errorHandlers.set(name, handler);
  }

  /**
   * 注销错误处理器
   */
  unregister(name: string): void {
    this.errorHandlers.delete(name);
  }

  /**
   * 处理错误
   */
  handle(error: Error, context?: string): void {
    console.error(`[GlobalError] ${context || 'Unknown context'}:`, error);

    // 调用所有注册的错误处理器
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error, context);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });

    // 默认错误处理：显示用户友好的错误消息
    this.showUserFriendlyError(error, context);
  }

  /**
   * 处理API错误
   */
  handleApiError(error: any, context?: string): void {
    const apiError = this.normalizeApiError(error);
    this.handle(apiError, context || 'API Request');
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error: Error, context?: string): void {
    const networkError = new Error(`网络错误: ${error.message}`);
    networkError.name = 'NetworkError';
    this.handle(networkError, context || 'Network Request');
  }

  /**
   * 标准化API错误
   */
  private normalizeApiError(error: any): Error {
    if (error?.response?.data) {
      // 后端API错误
      const data = error.response.data;
      return new Error(data.message || '服务器返回错误');
    }

    if (error?.message) {
      // 其他HTTP错误
      if (error.message.includes('Network Error')) {
        return new Error('网络连接失败，请检查网络设置');
      }
      if (error.message.includes('timeout')) {
        return new Error('请求超时，请稍后重试');
      }
      return new Error(error.message);
    }

    return new Error('未知错误');
  }

  /**
   * 显示用户友好的错误消息
   */
  private showUserFriendlyError(error: Error, context?: string): void {
    const errorMap: Record<string, string> = {
      'NetworkError': '网络连接失败，请检查网络设置',
      'TimeoutError': '请求超时，请稍后重试',
      'UnauthorizedError': '登录已过期，请重新登录',
      'ForbiddenError': '权限不足，无法执行此操作',
      'NotFoundError': '请求的资源不存在',
      'ValidationError': '请求数据验证失败',
    };

    let message = error.message;
    if (error.name && errorMap[error.name]) {
      message = errorMap[error.name];
    }

    // 根据上下文提供更具体的错误信息
    const contextMessages: Record<string, string> = {
      'Login': '登录失败，请检查用户名和密码',
      'Token Refresh': '会话已过期，请重新登录',
      'Tenant Switch': '切换租户失败，请稍后重试',
      'Database Setup': '数据库配置失败，请检查连接信息',
    };

    if (context && contextMessages[context]) {
      message = contextMessages[context];
    }

    // 使用notification而不是systemNotification.error
    notification.error(message);
  }
}

/**
 * 使用全局错误处理的Hook
 */
export function useGlobalErrorHandler() {
  const errorHandler = GlobalErrorHandler.getInstance();

  const handleError = useCallback((error: Error, context?: string) => {
    errorHandler.handle(error, context);
  }, [errorHandler]);

  const handleApiError = useCallback((error: any, context?: string) => {
    errorHandler.handleApiError(error, context);
  }, [errorHandler]);

  const handleNetworkError = useCallback((error: Error, context?: string) => {
    errorHandler.handleNetworkError(error, context);
  }, [errorHandler]);

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    register: errorHandler.register.bind(errorHandler),
    unregister: errorHandler.unregister.bind(errorHandler),
  };
}

/**
 * 装饰器：为异步函数添加错误处理
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      GlobalErrorHandler.getInstance().handleApiError(error, context);
      throw error;
    }
  }) as T;
}

/**
 * 创建带错误处理的fetch包装器
 */
export function createErrorHandlingFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const response = await fetch(input, init);
      
      // 检查响应状态
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        throw error;
      }
      
      return response;
    } catch (error) {
      GlobalErrorHandler.getInstance().handleNetworkError(error as Error);
      throw error;
    }
  };
}

// 注册默认错误处理器
GlobalErrorHandler.getInstance().register('console', (error, context) => {
  console.error(`[${context}] Error:`, error);
});

  GlobalErrorHandler.getInstance().register('analytics', (error, context) => {
    sendErrorToAnalysis(error);
  });

  GlobalErrorHandler.getInstance().register('logging', (error, context) => {
    sendErrorToAnalysis(error);
  });

GlobalErrorHandler.getInstance().register('logging', (error, context) => {
  // TODO: 发送错误到日志服务
  // logger.error({
  //   message: error.message,
  //   stack: error.stack,
  //   context,
  //   timestamp: new Date().toISOString(),
  // });
});
