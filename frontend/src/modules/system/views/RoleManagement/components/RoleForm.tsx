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
import { getMenuLabel } from '../../../../../shared/constants/viewsConfig';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { ID, Menu, RoleFormData } from '../../../types';

interface RoleFormProps {
  data?: Partial<RoleFormData>;
  menus: Menu[];
  onChange: (data: Partial<RoleFormData>) => void;
  isEdit?: boolean;
}

export function RoleForm({ data = {}, menus, onChange, isEdit = false }: RoleFormProps) {
  const { language, t } = useLanguageStore();
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
  const fieldClassName =
    'rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

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
  const selectedCount = formData.menuIds?.length || 0;

  const copy = zh
    ? {
        name: '角色名称',
        code: '角色编码',
        status: '状态',
        description: '角色说明',
        menuPermissions: '菜单权限',
        menuPermissionsDescription: '为角色勾选可访问的菜单与按钮权限。',
        namePlaceholder: '请输入角色名称',
        codePlaceholder: '请输入角色编码',
        descriptionPlaceholder: '请输入角色说明',
        active: '启用',
        inactive: '停用',
        selectedCount: '已选权限',
        menuType: {
          directory: '目录',
          menu: '菜单',
          button: '按钮',
        },
      }
    : {
        name: 'Role Name',
        code: 'Role Code',
        status: 'Status',
        description: 'Description',
        menuPermissions: 'Menu Permissions',
        menuPermissionsDescription: 'Select accessible menus and button permissions for this role.',
        namePlaceholder: 'Enter role name',
        codePlaceholder: 'Enter role code',
        descriptionPlaceholder: 'Enter role description',
        active: 'Active',
        inactive: 'Inactive',
        selectedCount: 'Selected',
        menuType: {
          directory: 'Directory',
          menu: 'Menu',
          button: 'Button',
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
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.code} required>
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder={copy.codePlaceholder}
            disabled={isEdit}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.status} required>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value as RoleFormData['status'])}>
            <SelectTrigger className={fieldClassName}>
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
            className={`resize-none ${fieldClassName}`}
            rows={2}
          />
        </FormField>
      </div>

      <FormField label={copy.menuPermissions} required description={copy.menuPermissionsDescription}>
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-slate-50/80 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-5 py-4">
            <div className="text-sm font-semibold text-slate-800">{copy.menuPermissions}</div>
            <div className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500">
              {copy.selectedCount}: {selectedCount}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-4">
            <div className="space-y-2">
              {renderMenuTree({
                menuList: menuTree,
                expandedMenus,
                toggleExpand,
                selectedMenuIds: formData.menuIds || [],
                toggleMenu,
                typeLabelMap: copy.menuType,
                language,
                t,
              })}
            </div>
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
  language,
  t,
  level = 0,
}: {
  menuList: Menu[];
  expandedMenus: Set<string>;
  toggleExpand: (menuId: string) => void;
  selectedMenuIds: ID[];
  toggleMenu: (menuId: ID) => void;
  typeLabelMap: Record<'directory' | 'menu' | 'button', string>;
  language: string;
  t: unknown;
  level?: number;
}): ReactNode {
  return menuList.map((menu) => {
    const menuId = String(menu.id);
    const hasChildren = (menu.children || []).length > 0;
    const expanded = expandedMenus.has(menuId);
    const selected = selectedMenuIds.includes(menu.id);

    return (
      <div key={menuId} className={level > 0 ? 'ml-6' : ''}>
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition-all ${
            selected
              ? 'border-blue-200 bg-blue-50/80 shadow-sm shadow-blue-100/60'
              : 'border-slate-200/70 bg-white/88 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
          }`}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(menuId)}
              className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="w-7" />
          )}

          <div className="flex flex-1 items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${
                hasChildren
                  ? 'border-blue-100 bg-blue-50 text-blue-600'
                  : 'border-slate-200/80 bg-slate-50 text-slate-500'
              }`}
            >
              {hasChildren ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
            </div>

            <Checkbox
              id={`role-menu-${menuId}`}
              checked={selected}
              onCheckedChange={() => toggleMenu(menu.id)}
            />

            <Label htmlFor={`role-menu-${menuId}`} className="flex-1 cursor-pointer text-sm font-medium text-slate-700">
              {getMenuLabel(menu, language, t)}
            </Label>

            {menu.type ? (
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white/90 px-2.5 py-1 text-xs text-slate-600">
                {typeLabelMap[menu.type]}
              </Badge>
            ) : null}
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
            language,
            t,
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
