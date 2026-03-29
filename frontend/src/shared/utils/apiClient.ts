import { useAuthStore } from '../../modules/auth/store/authStore';
import { GlobalErrorHandler } from './errorHandler';
import { systemNotification } from './notification';
import { CSRFTokenManager } from './security';

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResult<T = any> {
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

export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipCSRF?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response, config: RequestConfig) => Response | Promise<Response>;

function isZhLanguage() {
  return useAuthStore.getState().user !== null
    ? document?.documentElement?.lang?.startsWith('zh') ?? true
    : document?.documentElement?.lang?.startsWith('zh') ?? true;
}

function text(zhText: string, enText: string) {
  return isZhLanguage() ? zhText : enText;
}

export class ApiClient {
  private baseURL: string;
  private defaultTimeout = 30000;
  private defaultRetryCount = 1;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    this.addRequestInterceptor(async (config) => {
      if (!config.skipAuth) {
        const authStore = useAuthStore.getState();

        if (authStore.accessToken && authStore.isTokenExpired()) {
          authStore.logout();
          throw new ApiError(text('登录已过期，请重新登录', 'Session expired, please sign in again'), 401);
        }

        if (authStore.accessToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${authStore.accessToken}`,
          };
        }

        if (authStore.user?.tenantId) {
          config.headers = {
            ...config.headers,
            'X-Tenant-ID': String(authStore.user.tenantId),
          };
        }
      }

      if (!config.skipCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes((config.method || 'GET').toUpperCase())) {
        const csrfToken = CSRFTokenManager.getToken() || CSRFTokenManager.generateToken();
        void csrfToken;
        config.headers = {
          ...config.headers,
          ...CSRFTokenManager.getTokenHeader(),
        };
      }

      const isFormData = typeof FormData !== 'undefined' && config.body instanceof FormData;
      const headers = config.headers as Record<string, string> | undefined;
      if (!isFormData && config.body && typeof config.body !== 'string' && !headers?.['Content-Type']) {
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/json',
        };
      }

      config.headers = {
        ...config.headers,
        'X-Request-ID': this.generateRequestId(),
      };

      return config;
    });

    this.addResponseInterceptor(async (response, config) => {
      if (response.status === 401) {
        return this.handleUnauthorized(response, config);
      }

      if (response.status === 403) {
        throw new ApiError(text('权限不足', 'Permission denied'), 403);
      }

      if (response.status >= 500) {
        throw new ApiError(text('服务器错误，请稍后重试', 'Server error, please try again later'), response.status);
      }

      return response;
    });
  }

  private async handleUnauthorized(response: Response, config: RequestConfig): Promise<Response> {
    const authStore = useAuthStore.getState();
    const errorPayload = await this.readErrorPayload(response);
    const errorCode = errorPayload?.code || '';
    const errorMessage = errorPayload?.message || text('未授权，请重新登录', 'Unauthorized, please sign in again');

    if (errorCode === 'SESSION_EXPIRED' || errorCode === 'SESSION_REVOKED') {
      authStore.logout();
      systemNotification.sessionExpired();
      window.location.href = '/login';
      throw new ApiError(errorMessage, 401, errorPayload);
    }

    if (authStore.refreshToken && !config.skipAuth) {
      try {
        const refreshResponse = await fetch(`${this.baseURL}/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: authStore.refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData.data.access_token;
          const newRefreshToken = refreshData.data.refresh_token;

          authStore.setTokens(newAccessToken, newRefreshToken, refreshData.data.expires_in);

          try {
            await authStore.refreshTenantContext();
            if (errorCode === 'AUTH_VERSION_MISMATCH') {
              systemNotification.info(
                text('权限已更新', 'Permissions updated'),
                text('已自动刷新当前登录态与菜单权限', 'The current session and menu permissions were refreshed automatically'),
              );
            }
          } catch (reloadError) {
            console.error('Authorization reload failed after token refresh:', reloadError);
          }

          return fetch(response.url, {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }

    authStore.logout();
    if (errorCode === 'AUTH_VERSION_MISMATCH') {
      systemNotification.warning(
        text('权限已变更', 'Permissions changed'),
        text('登录态无法自动刷新，请重新登录', 'The session cannot be refreshed automatically, please sign in again'),
      );
    } else {
      systemNotification.sessionExpired();
    }
    window.location.href = '/login';
    throw new ApiError(errorMessage, 401, errorPayload);
  }

  private async readErrorPayload(response: Response): Promise<ErrorResponseBody | null> {
    try {
      return await response.clone().json();
    } catch {
      return null;
    }
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    let requestConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    const timeout = requestConfig.timeout || this.defaultTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let response = await fetch(fullUrl, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response, requestConfig);
      }

      const data = await this.parseResponse<T>(response);

      if (data.code !== 200 && data.code !== 0) {
        throw new ApiError(data.message || text('请求失败', 'Request failed'), data.code, data);
      }

      this.logApiCall(url, requestConfig.method || 'GET', 'success', Date.now() - startTime);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      GlobalErrorHandler.getInstance().handleApiError(error, url);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(text('请求超时', 'Request timeout'), 408);
      }

      if (error instanceof TypeError) {
        throw new ApiError(text('网络错误，请检查网络连接', 'Network error, please check your connection'), 0);
      }

      this.logApiCall(url, requestConfig.method || 'GET', 'failed', Date.now() - startTime, error);
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const textValue = await response.text();
    if (!response.ok) {
      try {
        const parsed = textValue ? (JSON.parse(textValue) as ApiResponse<T>) : null;
        if (parsed) {
          return parsed;
        }
      } catch {
        throw new ApiError(
          response.status === 404 ? text('接口不存在', 'API endpoint not found') : response.statusText || text('请求失败', 'Request failed'),
          response.status,
          textValue,
        );
      }
    }

    if (!textValue) {
      return {
        code: 0,
        message: 'success',
        data: undefined as T,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      return JSON.parse(textValue) as ApiResponse<T>;
    } catch {
      throw new ApiError(text('响应格式错误', 'Invalid response format'), response.status, textValue);
    }
  }

  async get<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<T>> {
    const queryString = params ? apiHelpers.buildQueryParams(params) : '';
    return this.request<T>(url + queryString, {
      ...config,
      method: 'GET',
    });
  }

  async getPage<T = any>(url: string, params?: Record<string, any>, config?: RequestConfig): Promise<ApiResponse<PageResult<T>>> {
    return this.get<PageResult<T>>(url, params, config);
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: this.serializeBody(data),
    });
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: this.serializeBody(data),
    });
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: this.serializeBody(data),
    });
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'DELETE',
    });
  }

  async upload<T = any>(
    url: string,
    file: File,
    config?: RequestConfig & { onProgress?: (progress: number) => void }
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: formData,
    });
  }

  async download(url: string, filename?: string, config?: RequestConfig): Promise<void> {
    const response = await fetch(url, {
      ...config,
      headers: {
        ...config?.headers,
        ...(!config?.skipAuth && useAuthStore.getState().accessToken
          ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new ApiError(text('下载失败', 'Download failed'), response.status);
    }

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async batch<T = any>(requests: Array<() => Promise<ApiResponse<T>>>): Promise<Array<ApiResponse<T>>> {
    return Promise.all(requests.map((req) => req()));
  }

  async retry<T = any>(
    requestFn: () => Promise<ApiResponse<T>>,
    retryCount: number = this.defaultRetryCount,
    retryDelay: number = 1000
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;

    for (let index = 0; index <= retryCount; index += 1) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        if (index === retryCount) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (index + 1)));
      }
    }

    throw lastError;
  }

  private serializeBody(data: any): BodyInit | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return data;
    }
    if (typeof data === 'string' || data instanceof Blob || data instanceof URLSearchParams) {
      return data;
    }
    return JSON.stringify(data);
  }

  private logApiCall(
    url: string,
    method: string,
    status: 'success' | 'failed',
    duration: number,
    error?: any
  ): void {
    if (import.meta.env.DEV) {
      console.log(`[API ${status.toUpperCase()}] ${method} ${url} - ${duration}ms`, error);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export const api = new ApiClient('/api');
export const http = api;

export class MockApiClient extends ApiClient {
  private mockDelay: number;
  private mockData: Map<string, any> = new Map();

  constructor(baseURL: string = '/api', mockDelay: number = 500) {
    super(baseURL);
    this.mockDelay = mockDelay;
  }

  setMockData(url: string, data: any): void {
    this.mockData.set(url, data);
  }

  override async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const mockData = this.mockData.get(url);
    if (mockData !== undefined) {
      await new Promise((resolve) => setTimeout(resolve, this.mockDelay));
      return {
        code: 0,
        message: 'success',
        data: typeof mockData === 'function' ? mockData(config) : mockData,
        timestamp: new Date().toISOString(),
      };
    }
    return super.request<T>(url, config);
  }
}

export const apiHelpers = {
  handleError(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return text('未知错误', 'Unknown error');
  },

  buildQueryParams(params: Record<string, any>): string {
    const filtered = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (filtered.length === 0) {
      return '';
    }
    return `?${new URLSearchParams(filtered.map(([key, value]) => [key, String(value)])).toString()}`;
  },

  formatResponse<T>(response: ApiResponse<T>): T {
    return response.data;
  },

  isSuccess(response: ApiResponse<any>): boolean {
    return response.code === 200 || response.code === 0;
  },
};
