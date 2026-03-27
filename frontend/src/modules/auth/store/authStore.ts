import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { systemNotification } from '../../../shared/utils/notification';
import { useLanguageStore } from '../../../stores/languageStore';
import { useSystemStore } from '../../../stores/systemStore';
import { useUIStore } from '../../../stores/uiStore';
import { ApiError } from '../../../shared/utils/apiClient';
import type { ID } from '../../system/types';
import tenantDatabaseApi from '../../tenant/api/tenantDatabaseApi';
import type { TenantInfo, TenantSetupStatus } from '../../tenant/types';
import { authApi, type User as ApiUser } from '../api/authApi';

export interface UserInfo {
  id: ID;
  username: string;
  realName: string;
  email: string;
  phone: string;
  avatar?: string;
  departmentId: ID;
  departmentName: string;
  positionId?: ID;
  positionName?: string;
  roleIds: ID[];
  roleNames: string[];
  permissions: string[];
  status: 'active' | 'inactive' | 'locked';
  lastLoginTime?: string;
  lastLoginIp?: string;
  tenantId?: ID;
  tenantCode?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  requires2FA: boolean;
  tempToken: string | null;
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  loginAttempts: number;
  isLocked: boolean;
  lockUntil: number | null;
  enableMultiTenant: boolean;
  loginRequiresTenantCode: boolean;
  enable2FA: boolean;
  isFirstLogin: boolean;
  tenantSetupRequired: boolean;
  tenantInfo: TenantInfo | null;
  fetchConfig: () => Promise<void>;
  login: (
    username: string,
    password: string,
    remember?: boolean,
    tenantCode?: string,
  ) => Promise<{ success: boolean; requires2FA?: boolean }>;
  verify2FA: (code: string) => Promise<boolean>;
  logout: () => void;
  syncSessionState: () => Promise<'unchanged' | 'authorization_changed' | 'signed_out'>;
  refreshCurrentUser: () => Promise<void>;
  loadPermissions: () => Promise<void>;
  reloadAuthorization: () => Promise<void>;
  refreshTenantContext: () => Promise<TenantSetupStatus | null>;
  updateUser: (user: Partial<UserInfo>) => void;
  setUser: (user: UserInfo) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  clearTokens: () => void;
  isTokenExpired: () => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  lockAccount: () => void;
  checkTenantStatus: () => Promise<TenantSetupStatus>;
  completeTenantSetup: (tenantId: string) => void;
  setTenantInfo: (tenant: TenantInfo) => void;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000;

type PermissionTuple = { obj: string; act: string };

const isZh = () => useLanguageStore.getState().language === 'zh';

function text(zh: string, en: string): string {
  return isZh() ? zh : en;
}

function buildAccountLockedMessage(remainingMinutes: number): string {
  return text(
    `账号已锁定，请在 ${remainingMinutes} 分钟后重试。`,
    `Account is locked. Try again in ${remainingMinutes} minute(s).`,
  );
}

function buildMockUser(): UserInfo {
  return {
    id: '1' as ID,
    username: 'admin',
    realName: text('系统管理员', 'System Admin'),
    email: 'admin@example.com',
    phone: '13800138000',
    avatar: '',
    departmentId: '' as ID,
    departmentName: text('研发部', 'Engineering'),
    positionId: '' as ID,
    positionName: text('技术负责人', 'CTO'),
    roleIds: [],
    roleNames: [text('超级管理员', 'Super Admin')],
    permissions: ['*:*:*'],
    status: 'active',
    lastLoginTime: new Date().toISOString(),
  };
}

function splitPermission(permission: string): PermissionTuple {
  const raw = String(permission || '').trim();
  const idx = raw.lastIndexOf(':');
  if (idx <= 0 || idx === raw.length - 1) {
    return { obj: raw, act: '' };
  }
  return { obj: raw.slice(0, idx), act: raw.slice(idx + 1) };
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchPath(pattern: string, path: string): boolean {
  const p = String(pattern || '').trim();
  const t = String(path || '').trim();
  if (!p) return false;
  if (p === '*' || p === '/*') return true;

  const segments = p.split('/').map((seg) => {
    if (!seg) return '';
    if (seg === '*') return '.*';
    if (seg.startsWith(':')) return '[^/]+';
    return escapeRegExp(seg).replace(/\\\*/g, '.*');
  });

  const re = new RegExp(`^${segments.join('/')}$`);
  return re.test(t);
}

function matchPermissionPattern(userPerm: string, requiredPerm: string): boolean {
  if (!userPerm || !requiredPerm) return false;
  if (
    userPerm === '*:*:*' ||
    requiredPerm === '*:*:*' ||
    userPerm === '/api/v1/*:*' ||
    userPerm === '/api/v1/*'
  ) {
    return true;
  }

  const u = splitPermission(userPerm);
  const r = splitPermission(requiredPerm);
  const uAct = (u.act || '').toLowerCase();
  const rAct = (r.act || '').toLowerCase();
  if (!matchPath(u.obj, r.obj)) return false;
  if (uAct === '*' || rAct === '*') return true;
  if (!uAct || !rAct) return userPerm === requiredPerm;
  return uAct === rAct;
}

function shouldUseMockAuth(error: unknown): boolean {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_API !== 'true') return false;
  if (error instanceof TypeError) return error.message.includes('fetch');
  return error instanceof Error && error.message.includes('Network Error');
}

function buildUserInfo(apiUser: ApiUser, tenantCode?: string, currentUser?: UserInfo | null): UserInfo {
  return {
    id: apiUser.id as ID,
    username: apiUser.username,
    realName: apiUser.real_name,
    email: apiUser.email,
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    departmentId: (apiUser.department_id || '') as ID,
    departmentName: currentUser?.departmentName || '',
    positionId: (apiUser.position_id || '') as ID,
    positionName: currentUser?.positionName || '',
    roleIds: (apiUser.role_ids || currentUser?.roleIds || []) as ID[],
    roleNames: apiUser.role_names || currentUser?.roleNames || [],
    permissions: currentUser?.permissions || [],
    status: apiUser.status as 'active' | 'inactive' | 'locked',
    lastLoginTime: apiUser.last_login_at || currentUser?.lastLoginTime || new Date().toISOString(),
    lastLoginIp: apiUser.last_login_ip || currentUser?.lastLoginIp,
    tenantId: (apiUser.tenant_id || currentUser?.tenantId || '') as ID,
    tenantCode: apiUser.tenant_code || tenantCode || currentUser?.tenantCode || undefined,
  };
}

function normalizeIdArray(ids?: ID[]): string[] {
  return Array.from(new Set((ids || []).map((id) => String(id)).filter(Boolean))).sort();
}

function sameIdArray(left?: ID[], right?: ID[]): boolean {
  const normalizedLeft = normalizeIdArray(left);
  const normalizedRight = normalizeIdArray(right);
  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function buildSessionChangeReason(type: 'disabled' | 'deleted' | 'locked') {
  switch (type) {
    case 'disabled':
      return {
        title: text('账号已被禁用', 'Account disabled'),
        description: text(
          '当前登录账号已被其他管理员禁用，系统已强制退出。',
          'Your current account was disabled by another administrator and has been signed out.',
        ),
      };
    case 'locked':
      return {
        title: text('账号已被锁定', 'Account locked'),
        description: text(
          '当前登录账号状态已变更为锁定，系统已强制退出。',
          'Your current account has been locked and the system has signed you out.',
        ),
      };
    case 'deleted':
    default:
      return {
        title: text('账号不存在', 'Account not found'),
        description: text(
          '当前登录账号可能已被删除，或租户访问已失效，请重新登录。',
          'Your current account may have been deleted or tenant access has expired. Please sign in again.',
        ),
      };
  }
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        isAuthenticated: false,
        requires2FA: false,
        tempToken: null,
        user: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        loginAttempts: 0,
        isLocked: false,
        lockUntil: null,
        enableMultiTenant: true,
        loginRequiresTenantCode: true,
        enable2FA: true,
        isFirstLogin: false,
        tenantSetupRequired: false,
        tenantInfo: null,

        fetchConfig: async () => {
          try {
            const resp = await authApi.getPublicConfig();
            if (resp.data) {
              set({
                enableMultiTenant: Boolean((resp.data as any).enable_multi_tenant),
                loginRequiresTenantCode: Boolean(
                  (resp.data as any).login_requires_tenant_code ?? (resp.data as any).enable_multi_tenant,
                ),
                enable2FA: (resp.data as any).enable_2fa ?? true,
              });
            }
          } catch (error) {
            console.error('Failed to fetch public config:', error);
          }
        },

        login: async (username, password, remember, tenantCode) => {
          try {
            const state = get();
            if (state.isLocked && state.lockUntil) {
              if (Date.now() < state.lockUntil) {
                const remainingMinutes = Math.ceil((state.lockUntil - Date.now()) / 60000);
                throw new Error(buildAccountLockedMessage(remainingMinutes));
              }
              set({ isLocked: false, lockUntil: null, loginAttempts: 0 });
            }

            const resp = await authApi.login({
              username,
              password,
              tenant_code: tenantCode || null,
            });

            if (resp.data && (resp.data as any).require_2fa) {
              const data = resp.data as any;
              set({
                requires2FA: true,
                tempToken: data.temp_token,
                isAuthenticated: false,
              });
              return { success: true, requires2FA: true };
            }

            if (!resp.data || !resp.data.access_token) {
              get().incrementLoginAttempts();
              return { success: false };
            }

            set({
              user: buildUserInfo(resp.data.user, tenantCode),
              isAuthenticated: true,
              requires2FA: false,
              tempToken: null,
              accessToken: resp.data.access_token,
              refreshToken: resp.data.refresh_token,
              tokenExpiry: Date.now() + resp.data.expires_in * 1000,
              enableMultiTenant: resp.data.enable_multi_tenant,
              loginRequiresTenantCode:
                resp.data.login_requires_tenant_code ?? resp.data.enable_multi_tenant,
              loginAttempts: 0,
              isLocked: false,
              lockUntil: null,
              isFirstLogin: false,
              tenantSetupRequired: false,
              tenantInfo: null,
            });

            useUIStore.getState().clearTabs();
            if (remember) {
              localStorage.setItem('rememberedUsername', username);
            } else {
              localStorage.removeItem('rememberedUsername');
            }

            await get().refreshTenantContext();
            return { success: true, requires2FA: false };
          } catch (error) {
            console.error('Login error:', error);
            if (shouldUseMockAuth(error)) {
              if (username === 'admin' && password === 'admin123') {
                set({
                  user: buildMockUser(),
                  isAuthenticated: true,
                  accessToken: `mock_token_${Date.now()}`,
                  refreshToken: `mock_refresh_${Date.now()}`,
                  tokenExpiry: Date.now() + 7200 * 1000,
                  loginAttempts: 0,
                  isLocked: false,
                  lockUntil: null,
                  isFirstLogin: false,
                  tenantSetupRequired: false,
                  tenantInfo: null,
                  loginRequiresTenantCode: true,
                });
                useUIStore.getState().clearTabs();
                return { success: true, requires2FA: false };
              }
              get().incrementLoginAttempts();
              return { success: false };
            }
            throw error;
          }
        },

        verify2FA: async (code) => {
          const { tempToken } = get();
          if (!tempToken) return false;

          try {
            const resp = await authApi.verifyLogin2FA(tempToken, code);
            if (resp.data && resp.data.access_token) {
              set({
                user: buildUserInfo(resp.data.user, undefined, get().user),
                isAuthenticated: true,
                requires2FA: false,
                tempToken: null,
                accessToken: resp.data.access_token,
                refreshToken: resp.data.refresh_token,
                tokenExpiry: Date.now() + resp.data.expires_in * 1000,
                loginRequiresTenantCode:
                  resp.data.login_requires_tenant_code ?? get().loginRequiresTenantCode,
              });
              useUIStore.getState().clearTabs();
              await get().refreshTenantContext();
              return true;
            }
            return false;
          } catch (error) {
            console.error('2FA verification failed', error);
            return false;
          }
        },

        logout: () => {
          void authApi.logout().catch((error) => console.error('Logout failed:', error));
          useUIStore.getState().clearTabs();
          useSystemStore.getState().reset();
          set({
            user: null,
            isAuthenticated: false,
            requires2FA: false,
            tempToken: null,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null,
            loginAttempts: 0,
            isLocked: false,
            lockUntil: null,
            isFirstLogin: false,
            tenantSetupRequired: false,
            tenantInfo: null,
          });
        },

        syncSessionState: async () => {
          const state = get();
          if (!state.isAuthenticated || !state.accessToken || !state.user) {
            return 'unchanged';
          }

          const previousUser = state.user;

          try {
            const resp = await authApi.getCurrentUser();
            if (!resp.data) {
              return 'unchanged';
            }

            const nextUser = buildUserInfo(resp.data, previousUser.tenantCode, previousUser);

            if (nextUser.status === 'inactive' || nextUser.status === 'locked') {
              const copy = buildSessionChangeReason(
                nextUser.status === 'locked' ? 'locked' : 'disabled',
              );
              get().logout();
              systemNotification.warning(copy.title, copy.description);
              return 'signed_out';
            }

            const roleChanged =
              !sameIdArray(previousUser.roleIds, nextUser.roleIds) ||
              previousUser.status !== nextUser.status;

            set({ user: nextUser });

            if (!roleChanged) {
              return 'unchanged';
            }

            await get().loadPermissions();
            await useSystemStore.getState().initialize();
            useUIStore.getState().clearTabs();
            systemNotification.info(
              '权限已更新',
              '当前登录用户的角色或授权已发生变更，系统已自动刷新菜单与权限快照。',
            );
            return 'authorization_changed';
          } catch (error) {
            if (error instanceof ApiError && (error.code === 401 || error.code === 403 || error.code === 404)) {
              const copy = buildSessionChangeReason('deleted');
              get().logout();
              systemNotification.warning(copy.title, copy.description);
              return 'signed_out';
            }

            console.error('Failed to sync session state:', error);
            return 'unchanged';
          }
        },

        refreshCurrentUser: async () => {
          const state = get();
          if (!state.isAuthenticated || !state.accessToken || !state.user) return;
          try {
            const resp = await authApi.getCurrentUser();
            if (resp.data) {
              set({ user: buildUserInfo(resp.data, state.user.tenantCode, get().user) });
            }
          } catch (error) {
            console.error('Failed to refresh current user:', error);
          }
        },

        loadPermissions: async () => {
          const state = get();
          if (!state.isAuthenticated || !state.accessToken || !state.user) return;
          try {
            const resp = await authApi.getPermissions();
            const perms = Array.isArray(resp.data)
              ? Array.from(new Set(resp.data.filter(Boolean)))
              : [];
            set({ user: { ...get().user!, permissions: perms } });
          } catch (error) {
            console.error('Failed to load permissions:', error);
          }
        },

        reloadAuthorization: async () => {
          await get().refreshCurrentUser();
          await get().loadPermissions();
        },

        refreshTenantContext: async () => {
          const state = get();
          if (!state.isAuthenticated) {
            return null;
          }

          await get().reloadAuthorization();
          const status = await get().checkTenantStatus();

          if (status.databaseConfigured) {
            await useSystemStore.getState().initialize();
            useUIStore.getState().clearTabs();
          }

          return status;
        },

        updateUser: (updates) => {
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...updates } });
          }
        },

        setUser: (user) => set({ user, isAuthenticated: true }),

        setTokens: (accessToken, refreshToken, expiresIn) => {
          set({ accessToken, refreshToken, tokenExpiry: Date.now() + expiresIn * 1000 });
        },

        clearTokens: () => set({ accessToken: null, refreshToken: null, tokenExpiry: null }),

        isTokenExpired: () => {
          const { tokenExpiry } = get();
          return !tokenExpiry || Date.now() >= tokenExpiry;
        },

        hasPermission: (permission) => {
          const { user } = get();
          if (!user?.permissions) return false;
          if (user.permissions.includes('*:*:*')) return true;
          const permissions = Array.isArray(permission) ? permission : [permission];
          return permissions.some((required) =>
            user.permissions.some((item) => matchPermissionPattern(item, required)),
          );
        },

        hasRole: (role) => {
          const { user } = get();
          if (!user?.roleNames) return false;
          const roles = Array.isArray(role) ? role : [role];
          return roles.some((item) => user.roleNames.includes(item));
        },

        hasAnyPermission: (permissions) => permissions.some((item) => get().hasPermission(item)),
        hasAllPermissions: (permissions) => permissions.every((item) => get().hasPermission(item)),

        incrementLoginAttempts: () => {
          const newAttempts = get().loginAttempts + 1;
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            get().lockAccount();
            return;
          }
          set({ loginAttempts: newAttempts });
        },

        resetLoginAttempts: () => set({ loginAttempts: 0, isLocked: false, lockUntil: null }),

        lockAccount: () => {
          set({ isLocked: true, lockUntil: Date.now() + LOCK_DURATION, loginAttempts: 0 });
        },

        checkTenantStatus: async () => {
          const { user, enableMultiTenant } = get();
          if (!enableMultiTenant || !user?.tenantCode) {
            const status: TenantSetupStatus = {
              isConfigured: true,
              isFirstLogin: false,
              databaseConfigured: true,
              tenantId: user?.tenantId,
              tenantCode: user?.tenantCode,
            };
            set({ isFirstLogin: false, tenantSetupRequired: false, tenantInfo: null });
            return status;
          }

          try {
            const status = await tenantDatabaseApi.getStatus(user.tenantCode);
            set({
              isFirstLogin: status.isFirstLogin,
              tenantSetupRequired: !status.databaseConfigured,
            });

            if (status.databaseConfigured) {
              const tenant = await tenantDatabaseApi.getCurrentTenant();
              set({ tenantInfo: tenant });
            } else {
              set({ tenantInfo: null });
            }

            return status;
          } catch (error) {
            console.error('Failed to check tenant status:', error);
            const fallback: TenantSetupStatus = {
              isConfigured: true,
              isFirstLogin: false,
              databaseConfigured: true,
              tenantId: user.tenantId,
              tenantCode: user.tenantCode,
            };
            set({ isFirstLogin: false, tenantSetupRequired: false, tenantInfo: null });
            return fallback;
          }
        },

        completeTenantSetup: (tenantId) => {
          const { user } = get();
          set({
            isFirstLogin: false,
            tenantSetupRequired: false,
            user: user ? { ...user, tenantId: tenantId as ID } : null,
          });
        },

        setTenantInfo: (tenant) => {
          const { user } = get();
          set({
            tenantInfo: tenant,
            user: user ? { ...user, tenantId: tenant.id as ID, tenantCode: tenant.code } : null,
          });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          tokenExpiry: state.tokenExpiry,
          loginAttempts: state.loginAttempts,
          isLocked: state.isLocked,
          lockUntil: state.lockUntil,
          enableMultiTenant: state.enableMultiTenant,
          loginRequiresTenantCode: state.loginRequiresTenantCode,
          isFirstLogin: state.isFirstLogin,
          tenantSetupRequired: state.tenantSetupRequired,
          tenantInfo: state.tenantInfo,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
