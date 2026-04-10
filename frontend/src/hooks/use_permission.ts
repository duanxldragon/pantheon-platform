import { useCallback } from 'react';
import { useAuthStore } from '../modules/auth/store/auth_store';

/**
 * 权限管理 Hook
 * @description 提供细粒度的权限检查功能
 * @example
 * ```tsx
 * const { hasPermission, hasRole } = usePermission();
 * 
 * if (hasPermission('user:delete')) {
 *   // 显示删除按钮
 * }
 * ```
 */
export function usePermission() {
  const { user, hasPermission: checkPermission, hasRole: checkRole } = useAuthStore();

  /**
   * 检查是否拥有指定权限
   * @param permission 权限代码或权限数组
   * @returns boolean
   */
  const hasPermission = useCallback((permission: string | readonly string[]): boolean => {
    return checkPermission(permission);
  }, [checkPermission]);

  /**
   * 检查是否拥有指定角色
   * @param role 角色名称或角色数组
   * @returns boolean
   */
  const hasRole = useCallback((role: string | readonly string[]): boolean => {
    return checkRole(role);
  }, [checkRole]);

  /**
   * 检查是否拥有任一权限
   * @param permissions 权限数组
   * @returns boolean
   */
  const hasAnyPermission = useCallback((permissions: readonly string[]): boolean => {
    return permissions.some(p => checkPermission(p));
  }, [checkPermission]);

  /**
   * 检查是否拥有所有权限
   * @param permissions 权限数组
   * @returns boolean
   */
  const hasAllPermissions = useCallback((permissions: readonly string[]): boolean => {
    return permissions.every(p => checkPermission(p));
  }, [checkPermission]);

  /**
   * 检查是否有任一角色
   * @param roles 角色数组
   * @returns boolean
   */
  const hasAnyRole = useCallback((roles: readonly string[]): boolean => {
    return roles.some(r => checkRole(r));
  }, [checkRole]);

  /**
   * 检查是否有所有角色
   * @param roles 角色数组
   * @returns boolean
   */
  const hasAllRoles = useCallback((roles: readonly string[]): boolean => {
    return roles.every(r => checkRole(r));
  }, [checkRole]);

  /**
   * 检查是否是超级管理员
   * @returns boolean
   */
  const isSuperAdmin = useCallback((): boolean => {
    return user?.permissions?.includes('*:*:*') || false;
  }, [user]);

  /**
   * 获取当前用户的所有权限
   * @returns string[]
   */
  const getUserPermissions = useCallback((): string[] => {
    return user?.permissions || [];
  }, [user]);

  /**
   * 获取当前用户的所有角色
   * @returns string[]
   */
  const getUserRoles = useCallback((): string[] => {
    return user?.roleNames || [];
  }, [user]);

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
    getUserPermissions,
    getUserRoles,
  };
}



