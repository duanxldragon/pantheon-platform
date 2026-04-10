import { http } from '../../../shared/utils/axios_client';

export interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
  tenantId?: string;
  tenantCode?: string;
  departmentId?: string;
  positionId?: string;
  roleIds?: string[];
  roleNames?: string[];
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EnableTwoFactorResponse {
  secret: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  require2fa?: boolean;
  tempToken?: string;
  enableMultiTenant: boolean;
  loginRequiresTenantCode?: boolean;
  user: User;
}

export interface PublicAuthConfig {
  enableMultiTenant: boolean;
  loginRequiresTenantCode?: boolean;
  enable2fa?: boolean;
}

export interface SessionInfo {
  jti: string;
  deviceName: string;
  ipAddress: string;
  loginTime: number;
  lastActive: number;
  isCurrent: boolean;
}

export interface ActiveSessionsResponse {
  sessions: SessionInfo[];
  maxSessions: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string;
  createdAt: string;
  lastUsed?: string;
}

export type ApiKey = ApiKeyItem;

export interface ApiKeyResponse {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string;
  lastUsed?: string;
  createdAt: string;
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
  loginAt: string;
  logoutAt?: string;
}

export interface LoginHistoryResponse {
  items: LoginHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
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
  getPublicConfig: () => http.get<PublicAuthConfig>('/v1/auth/config'),

  login: (data: {
    username: string;
    password: string;
    tenantCode?: string | null;
  }) => http.post<LoginResponse>('/v1/auth/login', data),

  logout: () => http.post('/v1/auth/logout'),

  refreshToken: (refreshToken: string) =>
    http.post<{ accessToken: string; refreshToken: string }>('/v1/auth/refresh', { refreshToken }),

  getCurrentUser: () => http.get<User>('/v1/auth/current'),

  getLoginAttempts: (username: string, tenantCode?: string) =>
    http.get<{ attempts: number; lockedUntil?: number; remaining?: number }>(
      `/v1/auth/attempts?username=${encodeURIComponent(username)}${tenantCode ? `&tenantCode=${encodeURIComponent(tenantCode)}` : ''}`,
    ),

  unlockAccount: (data: { username: string; tenantCode?: string }) => http.post('/v1/auth/unlock', data),

  validatePassword: (data: { password: string; username?: string }) =>
    http.post<ValidatePasswordResponse>('/v1/auth/validate-password', data),

  getProfile: () => http.get<Record<string, unknown>>('/v1/user/profile'),

  updateProfile: (data: Record<string, unknown>) => http.put<Record<string, unknown>>('/v1/user/profile', data),

  changePassword: (data: { password: string; newPassword: string }) =>
    http.put('/v1/user/password', data),

  getPermissions: () => http.get<string[]>('/v1/user/permissions'),

  getLoginHistory: (params?: { page?: number; pageSize?: number }) =>
    http.get<LoginHistoryResponse>('/v1/auth/login-history', { params }),

  get2FAStatus: () => http.get<TwoFactorStatusResponse>('/v1/auth/2fa/status'),

  enable2FA: () => http.post<EnableTwoFactorResponse>('/v1/auth/2fa/enable'),

  verify2FA: (code: string) => http.post('/v1/auth/2fa/verify', { code }),

  verifyLogin2FA: (tempToken: string, code: string) =>
    http.post<LoginResponse>('/v1/auth/2fa/login', { tempToken, code }),

  disable2FA: (password: string) => http.post('/v1/auth/2fa/disable', { password }),

  verifyCode: (code: string) => http.post('/v1/auth/2fa/verify-code', { code }),

  generateBackupCodes: (count?: number) =>
    http.post<{ backupCodes: string[]; allCodes: string[] }>('/v1/auth/2fa/backup-codes', { count: count || 10 }),

  listSessions: () => http.get<ActiveSessionsResponse>('/v1/auth/sessions'),

  kickSession: (jti: string) => http.delete(`/v1/auth/sessions/${jti}`),

  listApiKeys: () => http.get<{ items: ApiKeyItem[] }>('/v1/auth/api-keys'),

  createApiKey: (data: { name: string; permissions?: string }) =>
    http.post<ApiKeyResponse>('/v1/auth/api-keys', data),

  updateApiKey: (id: string, data: { name?: string; permissions?: string }) =>
    http.put(`/v1/auth/api-keys/${id}`, data),

  deleteApiKey: (id: string) => http.delete(`/v1/auth/api-keys/${id}`),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<{ url: string }>('/v1/system/users/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};


