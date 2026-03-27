import { useAuthStore } from '../../modules/auth/store/authStore';
import { systemNotification } from './notification';

// Token刷新相关状态
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * 添加刷新Token的订阅者
 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * 通知所有订阅者Token已刷新
 */
function notifyRefreshSubscribers(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * 刷新访问令牌
 */
async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const newAccessToken = data.data.access_token;
    const newRefreshToken = data.data.refresh_token;

    // 更新store中的token
    const authStore = useAuthStore.getState();
    authStore.setTokens(
      newAccessToken,
      newRefreshToken,
      data.data.expires_in
    );
    try {
      await authStore.refreshTenantContext();
    } catch (reloadError) {
      console.error('Authorization reload failed after token refresh:', reloadError);
    }

    return newAccessToken;
  } catch (error) {
    // 刷新失败，清除认证状态
    useAuthStore.getState().logout();
    systemNotification.sessionExpired();
    throw error;
  }
}

/**
 * 创建带Token自动刷新的fetch包装器
 */
export function createAuthenticatedFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // 获取当前token
    let { accessToken, isTokenExpired } = useAuthStore.getState();
    
    // 如果token过期或不存在，尝试刷新
    if (!accessToken || isTokenExpired()) {
      if (isRefreshing) {
        // 如果正在刷新，等待刷新完成
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string) => {
            const updatedInit = {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${token}`,
              },
            };
            fetch(input, updatedInit).then(resolve).catch(reject);
          });
        });
      }

      isRefreshing = true;
      try {
        accessToken = await refreshAccessToken();
        notifyRefreshSubscribers(accessToken);
      } catch (error) {
        isRefreshing = false;
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    // 添加Authorization头
    const headers = {
      ...init?.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(input, {
      ...init,
      headers,
    });

    // 如果返回401，可能是token过期，尝试刷新
    if (response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        accessToken = await refreshAccessToken();
        
        // 使用新token重试请求
        const retryHeaders = {
          ...init?.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return fetch(input, {
          ...init,
          headers: retryHeaders,
        });
      } catch (error) {
        isRefreshing = false;
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  };
}

/**
 * 初始化API拦截器
 */
export function initializeApiInterceptor() {
  // 保存原始fetch
  const originalFetch = window.fetch;
  
  // 替换全局fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // 只对同域API请求进行拦截
    const url = typeof input === 'string' ? input : input.toString();
    
    if (url.includes('/api/') && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      try {
        return await createAuthenticatedFetch()(input, init);
      } catch (error) {
        // 如果认证失败，继续使用原始fetch让API层处理
        return originalFetch(input, init);
      }
    }
    
    // 其他请求使用原始fetch
    return originalFetch(input, init);
  };
}
