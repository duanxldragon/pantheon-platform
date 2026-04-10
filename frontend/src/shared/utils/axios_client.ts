import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
  CancelTokenSource,
} from 'axios';
import { useAuthStore } from '../../modules/auth/store/auth_store';
import { systemNotification } from './notification';
import { CSRFTokenManager } from './security';
import { FieldTransformer } from './field_transformer';

// 类型定义
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResult<T = unknown> {
  items: T[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

export interface ErrorResponseBody {
  code?: string;
  message?: string;
  details?: string;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipCSRF?: boolean;
  skipErrorNotification?: boolean;
  retryCount?: number;
  showErrorMessage?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public details?: unknown,
    public response?: AxiosResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 扩展Axios配置类型以包含自定义属性
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  skipCSRF?: boolean;
  skipErrorNotification?: boolean;
  retryCount?: number;
  showErrorMessage?: boolean;
  _retry?: boolean;
}

type HeaderBag = Record<string, string>;

function ensureHeaderBag(headers: ExtendedAxiosRequestConfig['headers']): HeaderBag {
  return (headers || {}) as unknown as HeaderBag;
}

/**
 * 基于Axios的API客户端
 * 提供完整的HTTP请求功能，包括拦截器、错误处理、Token刷新等
 */
export class AxiosApiClient {
  private instance: AxiosInstance;
  private defaultTimeout = 30000;
  private defaultRetryCount = 1;
  private refreshPromise: Promise<string | null> | null = null;
  private cancelTokenSources: Map<string, CancelTokenSource> = new Map();

  constructor(baseURL: string = '/api', timeout?: number) {
    this.instance = axios.create({
      baseURL,
      timeout: timeout || this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => this.requestInterceptor(config),
      (error: AxiosError) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => this.responseInterceptor(response),
      (error: AxiosError) => this.responseErrorInterceptor(error)
    );
  }

  /**
   * 请求拦截器
   * 添加认证信息、CSRF令牌、请求ID等，并转换字段名
   */
  private requestInterceptor(config: ExtendedAxiosRequestConfig): ExtendedAxiosRequestConfig {
    // 自动转换请求数据字段名 (camelCase -> snake_case)
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = FieldTransformer.transformRequest(config.data);
    }

    // 添加认证信息
    if (!config.skipAuth) {
      const authStore = useAuthStore.getState();

      if (authStore.accessToken && authStore.isTokenExpired()) {
        authStore.logout();
        throw new ApiError('登录已过期，请重新登录', 401);
      }

      if (authStore.accessToken) {
        ensureHeaderBag(config.headers).Authorization = `Bearer ${authStore.accessToken}`;
      }

      // 添加租户信息
      if (authStore.user?.tenantId) {
        ensureHeaderBag(config.headers)['X-Tenant-ID'] = String(authStore.user.tenantId);
      }
    }

    // 添加CSRF令牌
    if (!config.skipCSRF && config.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
      CSRFTokenManager.getToken() || CSRFTokenManager.generateToken();
      const tokenHeader = CSRFTokenManager.getTokenHeader();
      Object.keys(tokenHeader).forEach(key => {
        ensureHeaderBag(config.headers)[key] = tokenHeader[key as keyof typeof tokenHeader];
      });
    }

    // 添加请求ID
    ensureHeaderBag(config.headers)['X-Request-ID'] = this.generateRequestId();

    // 记录请求日志
    if (import.meta.env.DEV) {
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  }

  /**
   * 响应拦截器
   * 处理成功的响应
   */
  private responseInterceptor(response: AxiosResponse): AxiosResponse {
    // 自动转换响应数据字段名 (snake_case -> camelCase)
    if (response.data && typeof response.data === 'object') {
      response.data = FieldTransformer.transformResponse(response.data);
    }

    // 记录响应日志
    if (import.meta.env.DEV) {
      console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    // 检查业务状态码
    if (response.data && (response.data.code !== 200 && response.data.code !== 0)) {
      throw new ApiError(
        response.data.message || '请求失败',
        response.data.code,
        response.data,
        response
      );
    }

    return response;
  }

  /**
   * 响应错误拦截器
   * 处理错误的响应，包括401、403等
   */
  private async responseErrorInterceptor(error: AxiosError): Promise<AxiosResponse | never> {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // 记录错误日志
    if (import.meta.env.DEV) {
      console.error(`[API ERROR] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, error);
    }

    // 处理401未授权错误
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      return this.handleUnauthorized(error, originalRequest);
    }

    // 处理403权限不足错误
    if (error.response?.status === 403) {
      const errorMessage = this.getErrorMessage(error);
      if (!originalRequest?.skipErrorNotification) {
        systemNotification.error('权限不足', errorMessage);
      }
      throw new ApiError(errorMessage || '权限不足', 403, error.response?.data, error.response);
    }

    // 处理500服务器错误
    if (error.response?.status && error.response.status >= 500) {
      const errorMessage = this.getErrorMessage(error);
      if (!originalRequest?.skipErrorNotification) {
        systemNotification.error('服务器错误', errorMessage || '服务器错误，请稍后重试');
      }
      throw new ApiError(errorMessage || '服务器错误', error.response.status, error.response?.data, error.response);
    }

    // 处理网络错误
    if (!error.response) {
      const errorMessage = this.getNetworkErrorMessage(error);
      if (!originalRequest?.skipErrorNotification) {
        systemNotification.error('网络错误', errorMessage);
      }
      throw new ApiError(errorMessage, 0, error);
    }

    // 其他错误
    const errorMessage = this.getErrorMessage(error);
    throw new ApiError(errorMessage || '请求失败', error.response.status, error.response?.data, error.response);
  }

  /**
   * 处理401未授权错误
   * 尝试刷新token或重定向到登录页
   */
  private async handleUnauthorized(error: AxiosError, originalRequest: ExtendedAxiosRequestConfig): Promise<AxiosResponse> {
    const authStore = useAuthStore.getState();
    const errorPayload = error.response?.data as ErrorResponseBody;
    const errorCode = errorPayload?.code || '';
    const errorMessage = errorPayload?.message || '未授权，请重新登录';

    // 如果是会话过期或撤销，直接退出登录
    if (errorCode === 'SESSION_EXPIRED' || errorCode === 'SESSION_REVOKED') {
      authStore.logout();
      systemNotification.sessionExpired();
      window.location.href = '/login';
      throw new ApiError(errorMessage, 401, errorPayload);
    }

    // 如果有刷新token且不是重试请求，尝试刷新token
    if (authStore.refreshToken && !originalRequest.skipAuth && !originalRequest._retry) {
      try {
        const newAccessToken = await this.refreshSession(errorCode);
        if (newAccessToken) {
          // 更新请求头中的token
          ensureHeaderBag(originalRequest.headers).Authorization = `Bearer ${newAccessToken}`;

          // 标记为重试请求，避免无限循环
          originalRequest._retry = true;

          // 重试原始请求
          return this.instance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    // 刷新失败，退出登录
    authStore.logout();
    if (errorCode === 'AUTH_VERSION_MISMATCH') {
      systemNotification.warning('权限已变更', '登录态无法自动刷新，请重新登录');
    } else {
      systemNotification.sessionExpired();
    }
    window.location.href = '/login';
    throw new ApiError(errorMessage, 401, errorPayload);
  }

  /**
   * 刷新会话token
   */
  private async refreshSession(errorCode: string): Promise<string | null> {
    // 如果已经有刷新请求在进行，返回相同的Promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const authStore = useAuthStore.getState();
      if (!authStore.refreshToken) {
        return null;
      }

      try {
        const response = await this.instance.post('/v1/auth/refresh', {
          refresh_token: authStore.refreshToken,
        });

        const newAccessToken = response.data.data.access_token;
        const newRefreshToken = response.data.data.refresh_token;

        // 更新token
        authStore.setTokens(newAccessToken, newRefreshToken, response.data.data.expires_in);

        // 刷新租户上下文
        try {
          await authStore.refreshTenantContext();
          if (errorCode === 'AUTH_VERSION_MISMATCH') {
            systemNotification.info('权限已更新', '已自动刷新当前登录态与菜单权限');
          }
        } catch (reloadError) {
          console.error('Authorization reload failed after token refresh:', reloadError);
        }

        return newAccessToken;
      } catch (error) {
        console.error('Token refresh request failed:', error);
        return null;
      }
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as ErrorResponseBody & { error?: string };
      return data.message || data.error || '请求失败';
    }
    return error.message || '未知错误';
  }

  /**
   * 获取网络错误消息
   */
  private getNetworkErrorMessage(error: AxiosError): string {
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请检查网络连接';
    }
    if (error.message === 'Network Error') {
      return '网络错误，请检查网络连接';
    }
    return error.message || '网络错误';
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // ============ 公共API方法 ============

  /**
   * GET请求
   */
  async get<T = unknown>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST请求
   */
  async post<T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT请求
   */
  async put<T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH请求
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE请求
   */
  async delete<T = unknown>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * 分页查询
   */
  async getPage<T = unknown>(url: string, params?: Record<string, unknown>, config?: ApiRequestConfig): Promise<ApiResponse<PageResult<T>>> {
    const response = await this.instance.get<ApiResponse<PageResult<T>>>(url, {
      ...config,
      params,
    });
    return response.data;
  }

  /**
   * 文件上传
   */
  async upload<T = unknown>(
    url: string,
    file: File,
    config?: ApiRequestConfig & { onProgress?: (progress: number) => void }
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (config?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          config.onProgress(progress);
        }
      },
    });
    return response.data;
  }

  /**
   * 文件下载
   */
  async download(url: string, filename?: string, config?: ApiRequestConfig): Promise<void> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = filename || 'download';
    link.click();
    URL.revokeObjectURL(objectUrl);
  }

  /**
   * 批量请求
   */
  async batch<T = unknown>(requests: Array<() => Promise<ApiResponse<T>>>): Promise<ApiResponse<T>[]> {
    return Promise.all(requests.map((req) => req()));
  }

  /**
   * 带重试的请求
   */
  async retry<T = unknown>(
    requestFn: () => Promise<ApiResponse<T>>,
    retryCount: number = this.defaultRetryCount,
    retryDelay: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let index = 0; index <= retryCount; index++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        if (index === retryCount) {
          throw error;
        }
        // 指数退避
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, index)));
      }
    }

    throw lastError;
  }

  /**
   * 创建可取消的请求
   */
  createCancellableRequest<T = unknown>(
    requestFn: (cancelToken: CancelTokenSource) => Promise<ApiResponse<T>>,
    requestId: string
  ): {
    promise: Promise<ApiResponse<T>>;
    cancel: () => void;
  } {
    // 取消之前的同名请求
    if (this.cancelTokenSources.has(requestId)) {
      const previousSource = this.cancelTokenSources.get(requestId);
      previousSource?.cancel('Request cancelled due to new request');
    }

    // 创建新的取消token
    const cancelTokenSource = axios.CancelToken.source();
    this.cancelTokenSources.set(requestId, cancelTokenSource);

    const promise = requestFn(cancelTokenSource);

    const cancel = () => {
      cancelTokenSource.cancel('Request cancelled by user');
      this.cancelTokenSources.delete(requestId);
    };

    return { promise, cancel };
  }

  /**
   * 获取原始axios实例
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 创建默认实例
export const axiosApi = new AxiosApiClient('/api');
export const http = axiosApi;

// 工具函数
export const apiHelpers = {
  handleError(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return '未知错误';
  },

  buildQueryParams(params: Record<string, unknown>): string {
    const filtered = Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    );
    if (filtered.length === 0) {
      return '';
    }
    return `?${new URLSearchParams(
      filtered.map(([key, value]) => [key, String(value)])
    ).toString()}`;
  },

  formatResponse<T>(response: ApiResponse<T>): T {
    return response.data;
  },

  isSuccess(response: ApiResponse<unknown>): boolean {
    return response.code === 200 || response.code === 0;
  },

  isCancelled(error: unknown): boolean {
    return axios.isCancel(error);
  },
};
