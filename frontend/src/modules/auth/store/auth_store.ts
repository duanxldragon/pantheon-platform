import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { systemNotification } from '../../../shared/utils/notification';
import { useLanguageStore } from '../../../stores/language_store';
import { useSystemStore } from '../../../stores/system_store';
import { useUIStore } from '../../../stores/ui_store';
import { ApiError } from '../../../shared/utils/api_client';
import type { ID } from '../../system/types';
import tenantDatabaseApi from '../../tenant/api/tenant_database_api';
import type { TenantInfo, TenantSetupStatus } from '../../tenant/types';
import { authApi, type LoginResponse, type PublicAuthConfig, type User as ApiUser } from '../api/auth_api';
import { matchPermissionPattern } from '../utils/permission_matcher';

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
  hasPermission: (permission: string | readonly string[]) => boolean;
  hasRole: (role: string | readonly string[]) => boolean;
  hasAnyPermission: (permissions: readonly string[]) => boolean;
  hasAllPermissions: (permissions: readonly string[]) => boolean;
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  lockAccount: () => void;
  checkTenantStatus: () => Promise<TenantSetupStatus>;
  completeTenantSetup: (tenantId: ID) => void;
  setTenantInfo: (tenant: TenantInfo) => void;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000;
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

const isZh = () => useLanguageStore.getState().language === 'zh';

function text(zh: string, en: string): string {
  return isZh() ? zh : en;
}

function normalizeTenantCode(value?: string | null): string | undefined {
  const trimmed = value?.trim() || '';
  return trimmed && trimmed !== EMPTY_UUID ? trimmed : undefined;
}

function buildAccountLockedMessage(remainingMinutes: number): string {
  return text(
    `账号已锁定，请在 ${remainingMinutes} 分钟后重试。`,
    `Account is locked. Try again in ${remainingMinutes} minute(s).`,
  );
}

function buildUserInfo(apiUser: ApiUser, tenantCode?: string, currentUser?: UserInfo | null): UserInfo {
  return {
    id: apiUser.id as ID,
    username: apiUser.username,
    realName: apiUser.realName,
    email: apiUser.email,
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    departmentId: (apiUser.departmentId || '') as ID,
    departmentName: currentUser?.departmentName || '',
    positionId: (apiUser.positionId || '') as ID,
    positionName: currentUser?.positionName || '',
    roleIds: (apiUser.roleIds || currentUser?.roleIds || []) as ID[],
    roleNames: apiUser.roleNames || currentUser?.roleNames || [],
    permissions: currentUser?.permissions || [],
    status: apiUser.status as 'active' | 'inactive' | 'locked',
    lastLoginTime: apiUser.lastLoginAt || currentUser?.lastLoginTime || new Date().toISOString(),
    lastLoginIp: apiUser.lastLoginIp || currentUser?.lastLoginIp,
    tenantId: (apiUser.tenantId || currentUser?.tenantId || '') as ID,
    tenantCode:
      normalizeTenantCode(apiUser.tenantCode) ||
      normalizeTenantCode(tenantCode) ||
      normalizeTenantCode(currentUser?.tenantCode),
  };
}

function sanitizeStoredAuthState(state: Partial<AuthState>): Partial<AuthState> {
  const sanitizedUser = state.user
    ? {
        ...state.user,
        tenantCode: normalizeTenantCode(state.user.tenantCode),
        tenantId:
          typeof state.user.tenantId === 'string' && state.user.tenantId.trim() === EMPTY_UUID
            ? undefined
            : state.user.tenantId,
      }
    : null;

  const sanitizedTenantInfo = state.tenantInfo
    ? {
        ...state.tenantInfo,
        code: normalizeTenantCode(state.tenantInfo.code) || '',
        id:
          typeof state.tenantInfo.id === 'string' && state.tenantInfo.id.trim() === EMPTY_UUID
            ? ''
            : state.tenantInfo.id,
      }
    : null;

  return {
    ...state,
    user: sanitizedUser,
    tenantInfo: sanitizedTenantInfo && sanitizedTenantInfo.code ? sanitizedTenantInfo : null,
  };
}

function sanitizePersistedPublicAuthState(state: Partial<AuthState>): Partial<AuthState> {
  const sanitized = sanitizeStoredAuthState(state);
  return {
    enableMultiTenant: sanitized.enableMultiTenant,
    loginRequiresTenantCode: sanitized.loginRequiresTenantCode,
    enable2FA: sanitized.enable2FA,
  };
}

function cleanupLegacyTenantState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const rememberedTenantCode = window.localStorage.getItem('rememberedTenantCode');
  if (rememberedTenantCode && !normalizeTenantCode(rememberedTenantCode)) {
    window.localStorage.removeItem('rememberedTenantCode');
  }

  const persisted = window.localStorage.getItem('auth-storage');
  if (!persisted) {
    return;
  }

  try {
    const parsed = JSON.parse(persisted) as { state?: Partial<AuthState>; version?: number };
    if (!parsed?.state) {
      return;
    }

    const sanitizedState = sanitizePersistedPublicAuthState(parsed.state);
    if (JSON.stringify(parsed.state) !== JSON.stringify(sanitizedState)) {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          ...parsed,
          state: sanitizedState,
        }),
      );
    }
  } catch {
    window.localStorage.removeItem('auth-storage');
  }
}

cleanupLegacyTenantState();

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
              const config: PublicAuthConfig = resp.data;
              set({
                enableMultiTenant: Boolean(config.enableMultiTenant),
                loginRequiresTenantCode: Boolean(
                  config.loginRequiresTenantCode ?? config.enableMultiTenant,
                ),
                enable2FA: config.enable2fa ?? true,
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

            const payload: {
              username: string;
              password: string;
              tenant_code?: string;
            } = {
              username,
              password,
            };
            const normalizedTenantCode = normalizeTenantCode(tenantCode);
            if (normalizedTenantCode) {
              payload.tenant_code = normalizedTenantCode;
            }

            const resp = await authApi.login(payload);

            if (resp.data?.require2fa) {
              const data: LoginResponse = resp.data;
              set({
                requires2FA: true,
                tempToken: data.tempToken,
                isAuthenticated: false,
              });
              return { success: true, requires2FA: true };
            }

            if (!resp.data || !resp.data.accessToken) {
              get().incrementLoginAttempts();
              return { success: false };
            }

            set({
              user: buildUserInfo(resp.data.user, tenantCode),
              isAuthenticated: true,
              requires2FA: false,
              tempToken: null,
              accessToken: resp.data.accessToken,
              refreshToken: resp.data.refreshToken,
              tokenExpiry: Date.now() + resp.data.expiresIn * 1000,
              enableMultiTenant: resp.data.enableMultiTenant,
              loginRequiresTenantCode:
                resp.data.loginRequiresTenantCode ?? resp.data.enableMultiTenant,
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
            throw error;
          }
        },

        verify2FA: async (code) => {
          const { tempToken } = get();
          if (!tempToken) return false;

          try {
            const resp = await authApi.verifyLogin2FA(tempToken, code);
            if (resp.data && resp.data.accessToken) {
              set({
                user: buildUserInfo(resp.data.user, undefined, get().user),
                isAuthenticated: true,
                requires2FA: false,
                tempToken: null,
                accessToken: resp.data.accessToken,
                refreshToken: resp.data.refreshToken,
                tokenExpiry: Date.now() + resp.data.expiresIn * 1000,
                loginRequiresTenantCode:
                  resp.data.loginRequiresTenantCode ?? get().loginRequiresTenantCode,
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
          const tenantCode = normalizeTenantCode(user?.tenantCode);
          if (!enableMultiTenant || !tenantCode) {
            const status: TenantSetupStatus = {
              isConfigured: true,
              isFirstLogin: false,
              databaseConfigured: true,
              tenantId: user?.tenantId,
              tenantCode,
            };
            set({ isFirstLogin: false, tenantSetupRequired: false, tenantInfo: null });
            return status;
          }

          // Platform admin uses master database, no tenant database setup needed
          if (tenantCode === 'platform') {
            const status: TenantSetupStatus = {
              isConfigured: true,
              isFirstLogin: false,
              databaseConfigured: true,
              tenantId: user?.tenantId,
              tenantCode: 'platform',
            };
            set({ isFirstLogin: false, tenantSetupRequired: false, tenantInfo: null });
            return status;
          }

          try {
            const status = await tenantDatabaseApi.getStatus(tenantCode);
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
              tenantCode,
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
          enableMultiTenant: state.enableMultiTenant,
          loginRequiresTenantCode: state.loginRequiresTenantCode,
          enable2FA: state.enable2FA,
        }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizePersistedPublicAuthState((persistedState as Partial<AuthState>) || {}),
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);







