import { describe, expect, it } from 'vitest';

import type { Tab } from '../../stores/ui_store';
import { resolveQueryAccessFallback, resolveRouteGuardDecision } from './access_control_utils';

describe('resolveRouteGuardDecision', () => {
  const messages = {
    pleaseLogin: 'Please log in',
    permissionDenied: 'Permission denied',
    roleDenied: 'Role denied',
  };

  it('blocks unauthenticated access first', () => {
    const decision = resolveRouteGuardDecision({
      isAuthenticated: false,
      hasUser: false,
      hasPermission: () => true,
      hasRole: () => true,
      messages,
    });

    expect(decision).toEqual({
      status: 'unauthenticated',
      message: messages.pleaseLogin,
    });
  });

  it('blocks missing permissions', () => {
    const decision = resolveRouteGuardDecision({
      isAuthenticated: true,
      hasUser: true,
      requiredPermissions: '/api/v1/system/users:*',
      hasPermission: () => false,
      hasRole: () => true,
      messages,
    });

    expect(decision).toEqual({
      status: 'permission_denied',
      message: messages.permissionDenied,
    });
  });

  it('blocks missing roles after permission checks', () => {
    const decision = resolveRouteGuardDecision({
      isAuthenticated: true,
      hasUser: true,
      requiredPermissions: '/api/v1/system/users:*',
      requiredRoles: 'admin',
      hasPermission: () => true,
      hasRole: () => false,
      messages,
    });

    expect(decision).toEqual({
      status: 'role_denied',
      message: messages.roleDenied,
    });
  });

  it('allows access when every requirement is satisfied', () => {
    const decision = resolveRouteGuardDecision({
      isAuthenticated: true,
      hasUser: true,
      requiredPermissions: '/api/v1/system/users:*',
      requiredRoles: 'admin',
      hasPermission: () => true,
      hasRole: () => true,
      messages,
    });

    expect(decision).toEqual({ status: 'allow' });
  });
});

describe('resolveQueryAccessFallback', () => {
  const tabs: Tab[] = [
    { id: 'system-users', label: 'Users', closable: true, path: ['System', 'Users'] },
    { id: 'system-menus', label: 'Menus', closable: true, path: ['System', 'Menus'] },
    { id: 'system-settings', label: 'Settings', closable: true, path: ['System', 'Settings'] },
  ];

  it('keeps the first remaining accessible tab', () => {
    const fallback = resolveQueryAccessFallback(
      tabs,
      'system-users',
      (candidate) => candidate === 'system-settings',
    );

    expect(fallback.id).toBe('system-settings');
    expect(fallback.existingTabs.map((tab) => tab.id)).toEqual(['system-menus', 'system-settings']);
  });

  it('falls back to dashboard when no tab remains accessible', () => {
    const fallback = resolveQueryAccessFallback(
      tabs,
      'system-users',
      (candidate) => candidate === 'system-dashboard',
    );

    expect(fallback).toEqual({
      id: 'system-dashboard',
      existingTabs: [
        { id: 'system-menus', label: 'Menus', closable: true, path: ['System', 'Menus'] },
        { id: 'system-settings', label: 'Settings', closable: true, path: ['System', 'Settings'] },
      ],
    });
  });

  it('falls back to profile center as the last resort', () => {
    const fallback = resolveQueryAccessFallback(tabs, 'system-users', () => false);

    expect(fallback.id).toBe('profile-center');
    expect(fallback.existingTabs).toHaveLength(2);
  });
});
