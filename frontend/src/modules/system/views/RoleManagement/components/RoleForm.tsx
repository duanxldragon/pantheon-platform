import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Textarea } from '../../../../../components/ui/textarea';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { ID, Menu, RoleFormData } from '../../../types';

interface RoleFormProps {
  data?: Partial<RoleFormData>;
  menus: Menu[];
  onChange: (data: Partial<RoleFormData>) => void;
  isEdit?: boolean;
}

export function RoleForm({ data = {}, menus, onChange, isEdit = false }: RoleFormProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [formData, setFormData] = useState<Partial<RoleFormData>>({
    name: '',
    code: '',
    menuIds: [],
    status: 'active',
    description: '',
    ...data,
  });
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFormData({
      name: '',
      code: '',
      menuIds: [],
      status: 'active',
      description: '',
      ...data,
    });
  }, [data]);

  const updateField = <K extends keyof RoleFormData>(field: K, value: RoleFormData[K]) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    onChange(nextData);
  };

  const toggleMenu = (menuId: ID) => {
    const currentMenuIds = formData.menuIds || [];
    const nextMenuIds = currentMenuIds.includes(menuId)
      ? currentMenuIds.filter((id) => id !== menuId)
      : [...currentMenuIds, menuId];
    updateField('menuIds', nextMenuIds);
  };

  const toggleExpand = (menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const menuTree = useMemo(() => buildMenuTree(menus || []), [menus]);

  const copy = {
    name: zh ? '角色名称' : 'Role Name',
    code: zh ? '角色编码' : 'Role Code',
    status: zh ? '状态' : 'Status',
    description: zh ? '角色说明' : 'Description',
    menuPermissions: zh ? '菜单权限' : 'Menu Permissions',
    menuPermissionsDescription: zh
      ? '为角色勾选可访问的菜单与按钮权限。'
      : 'Select accessible menus and button permissions for this role.',
    namePlaceholder: zh ? '请输入角色名称' : 'Enter role name',
    codePlaceholder: zh ? '请输入角色编码' : 'Enter role code',
    descriptionPlaceholder: zh ? '请输入角色说明' : 'Enter role description',
    active: zh ? '启用' : 'Active',
    inactive: zh ? '禁用' : 'Inactive',
    menuType: {
      directory: zh ? '目录' : 'Directory',
      menu: zh ? '菜单' : 'Menu',
      button: zh ? '按钮' : 'Button',
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label={copy.name} required>
          <Input
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder={copy.namePlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.code} required>
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder={copy.codePlaceholder}
            disabled={isEdit}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.status} required>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{copy.active}</SelectItem>
              <SelectItem value="inactive">{copy.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.description} className="md:col-span-2">
          <Textarea
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder={copy.descriptionPlaceholder}
            className="resize-none bg-white"
            rows={2}
          />
        </FormField>
      </div>

      <FormField label={copy.menuPermissions} required description={copy.menuPermissionsDescription}>
        <Card className="max-h-96 overflow-y-auto border-gray-200 p-4">
          <div className="space-y-1">
            {renderMenuTree({
              menuList: menuTree,
              expandedMenus,
              toggleExpand,
              selectedMenuIds: formData.menuIds || [],
              toggleMenu,
              typeLabelMap: copy.menuType,
            })}
          </div>
        </Card>
      </FormField>
    </div>
  );
}

function renderMenuTree({
  menuList,
  expandedMenus,
  toggleExpand,
  selectedMenuIds,
  toggleMenu,
  typeLabelMap,
  level = 0,
}: {
  menuList: Menu[];
  expandedMenus: Set<string>;
  toggleExpand: (menuId: string) => void;
  selectedMenuIds: ID[];
  toggleMenu: (menuId: ID) => void;
  typeLabelMap: Record<'directory' | 'menu' | 'button', string>;
  level?: number;
}): ReactNode {
  return menuList.map((menu) => {
    const menuId = String(menu.id);
    const hasChildren = (menu.children || []).length > 0;
    const expanded = expandedMenus.has(menuId);
    const selected = selectedMenuIds.includes(menu.id);

    return (
      <div key={menuId} className={level > 0 ? 'ml-6' : ''}>
        <div className="flex items-center gap-2 rounded px-2 py-2 hover:bg-gray-50">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(menuId)}
              className="rounded p-0.5 hover:bg-gray-200"
            >
              <ChevronRight
                className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}

          <div className="flex flex-1 items-center gap-2">
            {hasChildren ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-gray-400" />}

            <Checkbox
              id={`role-menu-${menuId}`}
              checked={selected}
              onCheckedChange={() => toggleMenu(menu.id)}
            />

            <Label htmlFor={`role-menu-${menuId}`} className="flex-1 cursor-pointer text-gray-700">
              {menu.name}
            </Label>

            {menu.type && (
              <Badge variant="outline" className="text-xs">
                {typeLabelMap[menu.type]}
              </Badge>
            )}
          </div>
        </div>

        {hasChildren &&
          expanded &&
          renderMenuTree({
            menuList: menu.children || [],
            expandedMenus,
            toggleExpand,
            selectedMenuIds,
            toggleMenu,
            typeLabelMap,
            level: level + 1,
          })}
      </div>
    );
  });
}

function buildMenuTree(menus: Menu[]) {
  const menuMap = new Map<string, Menu>();
  const rootMenus: Menu[] = [];

  menus.forEach((menu) => {
    menuMap.set(String(menu.id), { ...menu, children: [] });
  });

  menuMap.forEach((menu) => {
    if (menu.parentId == null) {
      rootMenus.push(menu);
      return;
    }

    const parent = menuMap.get(String(menu.parentId));
    if (parent) {
      parent.children = parent.children || [];
      parent.children.push(menu);
    }
  });

  return rootMenus;
}
