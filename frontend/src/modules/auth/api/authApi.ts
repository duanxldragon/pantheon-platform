import { http } from '../../../api/client';

export interface User {
  id: string;
  username: string;
  real_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
  tenant_id?: string;
  tenant_code?: string;
  department_id?: string;
  position_id?: string;
  role_ids?: string[];
  role_names?: string[];
  last_login_at?: string;
  last_login_ip?: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  qr_code_url?: string;
  secret?: string;
  backup_codes?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface EnableTwoFactorResponse {
  secret: string;
  qrCodeUrl?: string;
  qr_code_url?: string;
  backupCodes?: string[];
  backup_codes?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  require_2fa?: boolean;
  temp_token?: string;
  enable_multi_tenant: boolean;
  login_requires_tenant_code?: boolean;
  user: User;
}

export interface SessionInfo {
  jti: string;
  device_name: string;
  ip_address: string;
  login_time: number;
  last_active: number;
  is_current: boolean;
}

export interface ActiveSessionsResponse {
  sessions: SessionInfo[];
  max_sessions: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_preview: string;
  permissions: string;
  created_at: string;
  last_used?: string;
}

export type ApiKey = ApiKeyItem;

export interface ApiKeyResponse {
  id: string;
  user_id: string;
  name: string;
  key: string;
  permissions: string;
  last_used?: string;
  created_at: string;
}

export interface LoginHistoryItem {
  id: string;
  username: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  status: string;
  message: string;
  login_at: string;
  logout_at?: string;
}

export interface LoginHistoryResponse {
  items: LoginHistoryItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

export interface ValidatePasswordResponse {
  valid: boolean;
  strength: string;
  score: number;
  errors: string[];
  requirements: Record<string, boolean>;
}

export const authApi = {
  getPublicConfig: () => http.get<Record<string, unknown>>('/auth/config'),

  login: (data: {
    username: string;
    password: string;
    tenant_code?: string | null;
  }) => http.post<LoginResponse>('/auth/login', data),

  logout: () => http.post('/auth/logout'),

  refreshToken: (refresh_token: string) =>
    http.post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token }),

  getCurrentUser: () => http.get<User>('/auth/current'),

  getLoginAttempts: (username: string, tenant_code?: string) =>
    http.get<{ attempts: number; locked_until?: number; remaining?: number }>(
      `/auth/attempts?username=${encodeURIComponent(username)}${tenant_code ? `&tenant_code=${encodeURIComponent(tenant_code)}` : ''}`,
    ),

  unlockAccount: (data: { username: string; tenant_code?: string }) => http.post('/auth/unlock', data),

  validatePassword: (data: { password: string; username?: string }) =>
    http.post<ValidatePasswordResponse>('/auth/validate-password', data),

  getProfile: () => http.get<Record<string, unknown>>('/user/profile'),

  updateProfile: (data: Record<string, unknown>) => http.put<Record<string, unknown>>('/user/profile', data),

  changePassword: (data: { password: string; new_password: string }) =>
    http.put('/user/password', data),

  getPermissions: () => http.get<string[]>('/user/permissions'),

  getLoginHistory: (params?: { page?: number; page_size?: number }) =>
    http.get<LoginHistoryResponse>('/auth/login-history', params),

  get2FAStatus: () => http.get<TwoFactorStatusResponse>('/auth/2fa/status'),

  enable2FA: () => http.post<EnableTwoFactorResponse>('/auth/2fa/enable'),

  verify2FA: (code: string) => http.post('/auth/2fa/verify', { code }),

  verifyLogin2FA: (temp_token: string, code: string) =>
    http.post<LoginResponse>('/auth/2fa/login', { temp_token, code }),

  disable2FA: (password: string) => http.post('/auth/2fa/disable', { password }),

  verifyCode: (code: string) => http.post('/auth/2fa/verify-code', { code }),

  generateBackupCodes: (count?: number) =>
    http.post<{ backup_codes: string[]; all_codes: string[] }>('/auth/2fa/backup-codes', { count: count || 10 }),

  listSessions: () => http.get<ActiveSessionsResponse>('/auth/sessions'),

  kickSession: (jti: string) => http.delete(`/auth/sessions/${jti}`),

  listApiKeys: () => http.get<{ items: ApiKeyItem[] }>('/auth/api-keys'),

  createApiKey: (data: { name: string; permissions?: string }) =>
    http.post<ApiKeyResponse>('/auth/api-keys', data),

  updateApiKey: (id: string, data: { name?: string; permissions?: string }) =>
    http.put(`/auth/api-keys/${id}`, data),

  deleteApiKey: (id: string) => http.delete(`/auth/api-keys/${id}`),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<{ url: string }>('/system/users/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
