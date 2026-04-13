import { describe, expect, it } from 'vitest';

import type { Menu } from '../../modules/system/types';
import { buildMenuBreadcrumb, canAccessView } from './view_manager_utils';

const baseMenu = (overrides: Partial<Menu>): Menu => ({
  id: 'menu-id',
  name: 'Menu',
  code: 'menu',
  path: '/menu',
  icon: 'menu',
  parentId: null,
  level: 1,
  type: 'menu',
  sort: 1,
  status: 'active',
  visible: true,
  permissions: [],
  ...overrides,
});

describe('canAccessView', () => {
  it('always allows profile-center', () => {
    expect(canAccessView('profile-center', [], () => false, () => false)).toBe(true);
  });

  it('rejects inactive or hidden matched menus', () => {
    const menus = [
      baseMenu({
        id: 'system-menus',
        component: 'system/menu_management',
        status: 'inactive',
        permissions: ['/api/v1/system/menus:*'],
      }),
    ];

    expect(canAccessView('system-menus', menus, () => true, () => true)).toBe(false);
  });

  it('checks menu permissions when a matched menu exists', () => {
    const menus = [
      baseMenu({
        id: 'system-menus',
        component: 'system/menu_management',
        permissions: ['/api/v1/system/menus:*'],
      }),
    ];

    expect(canAccessView('system-menus', menus, (permission) => permission === '/api/v1/system/menus:*', () => true)).toBe(true);
    expect(canAccessView('system-menus', menus, () => false, () => true)).toBe(false);
  });
});

describe('buildMenuBreadcrumb', () => {
  it('builds a parent-to-child breadcrumb trail', () => {
    const menus = [
      {
        id: 'parent',
        name: 'System',
        children: [
          {
            id: 'child',
            name: 'Menus',
            parentId: 'parent',
          },
        ],
      },
    ];

    const t = {
      menu: {
        system: 'System',
        systemMenus: 'Menus',
      },
    } as never;

    expect(buildMenuBreadcrumb('child', menus, 'en', t)).toEqual(['System', 'Menus']);
  });
});
