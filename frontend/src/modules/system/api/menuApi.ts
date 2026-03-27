import { Menu, MenuFormData } from '../types';
import { http } from '../../../api/client';

interface BackendMenu {
  id: string;
  name: string;
  code: string;
  path: string;
  icon?: string;
  component?: string;
  type: 'menu' | 'button' | 'directory';
  parent_id?: string;
  sort?: number;
  status?: string;
  is_external?: boolean;
  description?: string;
  children?: BackendMenu[];
}

function flattenMenus(menus: Menu[]): Menu[] {
  return menus.flatMap((menu) => [
    { ...menu, children: menu.children || [] },
    ...flattenMenus(menu.children || []),
  ]);
}

function mapMenu(m: BackendMenu): Menu {
  return {
    id: m.id,
    name: m.name,
    code: m.code,
    path: m.path,
    icon: m.icon || '',
    parentId: m.parent_id || null,
    level: 0,
    type: m.type as Menu['type'],
    sort: m.sort || 0,
    status: (m.status || 'active') as Menu['status'],
    visible: true,
    external: Boolean(m.is_external),
    permission: m.code,
    permissions: m.code ? [m.code] : [],
    component: m.component,
    description: m.description,
    children: m.children?.map(mapMenu) || [],
  };
}

export const menuApi = {
  getMenus: async (): Promise<Menu[]> => {
    const resp = await http.getPage<BackendMenu>('/v1/system/menus', { page: 1, page_size: 1000 });
    return (resp.data?.items || []).map(mapMenu);
  },

  getMenuTree: async (): Promise<Menu[]> => {
    const resp = await http.get<BackendMenu[]>('/v1/system/menus/tree');
    return (resp.data || []).map(mapMenu);
  },

  getCurrentUserMenus: async (): Promise<Menu[]> => {
    const resp = await http.get<BackendMenu[]>('/v1/user/menus');
    return flattenMenus((resp.data || []).map(mapMenu));
  },

  createMenu: async (data: Partial<MenuFormData>): Promise<Menu> => {
    const resp = await http.post<BackendMenu>('/v1/system/menus', {
      name: data.name,
      code: data.code,
      path: data.path,
      icon: data.icon,
      component: data.component,
      type: data.type,
      parent_id: data.parentId,
      sort: data.sort,
      status: data.status,
      is_external: Boolean(data.external),
    });
    return mapMenu(resp.data);
  },

  updateMenu: async (id: string, data: Partial<MenuFormData>): Promise<Menu> => {
    const resp = await http.put<BackendMenu>(`/v1/system/menus/${id}`, {
      name: data.name,
      code: data.code,
      path: data.path,
      icon: data.icon,
      component: data.component,
      type: data.type,
      parent_id: data.parentId,
      sort: data.sort,
      status: data.status,
      is_external: Boolean(data.external),
    });
    return mapMenu(resp.data);
  },

  deleteMenu: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/menus/${id}`);
  },
};
