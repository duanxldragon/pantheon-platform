import { Menu, MenuFormData } from '../types';
import { http } from '../../../shared/utils/axios_client';

// axios拦截器会自动处理snake_case ↔ camelCase转换
// 但需要保留一些业务逻辑映射

function flattenMenus(menus: Menu[]): Menu[] {
  return menus.flatMap((menu) => [
    { ...menu, children: menu.children || [] },
    ...flattenMenus(menu.children || []),
  ]);
}

// 将后端Menu响应转换为前端Menu类型
function mapMenu(m: Menu): Menu {
  return {
    ...m,
    parentId: m.parentId || null,
    level: 0,
    icon: m.icon || '',
    visible: m.visible ?? true,
    permission: m.code,
    permissions: m.code ? [m.code] : [],
    children: m.children?.map(mapMenu) || [],
  };
}

export const menuApi = {
  getMenus: async (): Promise<Menu[]> => {
    const resp = await http.getPage<Menu>('/v1/system/menus', { page: 1, pageSize: 1000 });
    return (resp.data?.items || []).map(mapMenu);
  },

  getMenuTree: async (): Promise<Menu[]> => {
    const resp = await http.get<Menu[]>('/v1/system/menus/tree');
    return (resp.data || []).map(mapMenu);
  },

  getCurrentUserMenus: async (): Promise<Menu[]> => {
    const resp = await http.get<Menu[]>('/v1/user/menus');
    return flattenMenus((resp.data || []).map(mapMenu));
  },

  createMenu: async (data: Partial<MenuFormData>): Promise<Menu> => {
    const resp = await http.post<Menu>('/v1/system/menus', data);
    return mapMenu(resp.data);
  },

  updateMenu: async (id: string, data: Partial<MenuFormData>): Promise<Menu> => {
    const resp = await http.put<Menu>(`/v1/system/menus/${id}`, data);
    return mapMenu(resp.data);
  },

  deleteMenu: async (id: string): Promise<void> => {
    await http.delete(`/v1/system/menus/${id}`);
  },

  batchDeleteMenus: async (ids: string[]): Promise<void> => {
    await http.post('/v1/system/menus/batch-delete', { menuIds: ids });
  },

  batchUpdateMenuStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<void> => {
    await http.patch('/v1/system/menus/status', { menuIds: ids, status });
  },
};


