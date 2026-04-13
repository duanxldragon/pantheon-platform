import { describe, expect, it } from 'vitest';

import { matchPermissionPattern } from './permission_matcher';

describe('matchPermissionPattern', () => {
  it('matches exact permissions', () => {
    expect(matchPermissionPattern('/api/v1/system/users:GET', '/api/v1/system/users:GET')).toBe(true);
  });

  it('supports wildcard actions on matched resources', () => {
    expect(matchPermissionPattern('/api/v1/system/users:*', '/api/v1/system/users:DELETE')).toBe(true);
  });

  it('supports path parameters in the granted permission', () => {
    expect(matchPermissionPattern('/api/v1/system/users/:id:GET', '/api/v1/system/users/123:GET')).toBe(true);
  });

  it('supports global api wildcards', () => {
    expect(matchPermissionPattern('/api/v1/*:*', '/api/v1/system/menus:POST')).toBe(true);
  });

  it('rejects different actions on the same resource', () => {
    expect(matchPermissionPattern('/api/v1/system/menus:GET', '/api/v1/system/menus:POST')).toBe(false);
  });

  it('rejects different resources', () => {
    expect(matchPermissionPattern('/api/v1/system/users:GET', '/api/v1/system/roles:GET')).toBe(false);
  });
});
