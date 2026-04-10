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
import { DetailKeyValueItem, DetailKeyValueSection } from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { getMenuLabel } from '../../../../../shared/constants/views_config';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { ID, Menu, RoleFormData } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';

interface RoleFormProps {
  data?: Partial<RoleFormData>;
  menus: Menu[];
  onChange: (data: Partial<RoleFormData>) => void;
  isEdit?: boolean;
}

export function RoleForm({ data = {}, menus, onChange, isEdit = false }: RoleFormProps) {
  const { language, t } = useLanguageStore();
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
  const copy = getRoleManagementCopy(language).form;

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
  const configOutcome = selectedCount > 0
    ? (language === 'zh' ? '当前角色已具备菜单授权范围，可继续检查成员绑定与状态。' : 'This role already has menu coverage configured; continue with membership and status review.')
    : (language === 'zh' ? '当前角色尚未绑定菜单权限，保存前建议至少确认基础访问范围。' : 'This role has no menu permissions yet; confirm the minimum access scope before saving.');

  return (
    <div className="space-y-6">
      <DetailKeyValueSection
        eyebrow="CONFIG"
        title={language === 'zh' ? '角色配置摘要' : 'Role Config Summary'}
        description={language === 'zh' ? '填写前先确认角色状态、编码和菜单授权范围。' : 'Confirm role status, code, and menu authorization scope before saving.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '角色状态' : 'Role Status'} value={formData.status === 'active' ? copy.active : copy.inactive} />
        <DetailKeyValueItem label={language === 'zh' ? '菜单授权数' : 'Menu Coverage'} value={selectedCount} hint={copy.menuPermissionsDescription} />
        <DetailKeyValueItem label={language === 'zh' ? '当前结论' : 'Current Outcome'} value={configOutcome} className="md:col-span-2" />
      </DetailKeyValueSection>

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
          <Select
            value={formData.status}
            onValueChange={(value) => updateField('status', value as RoleFormData['status'])}
          >
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

      <FormField
        label={copy.menuPermissions}
        required
        description={copy.menuPermissionsDescription}
      >
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

      <DetailKeyValueSection
        eyebrow="REVIEW"
        title={language === 'zh' ? '保存前检查' : 'Pre-save Review'}
        description={language === 'zh' ? '提交前建议核对角色编码、状态和菜单树覆盖面。' : 'Review role code, status, and menu-tree coverage before submitting.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '角色编码' : 'Role Code'} value={formData.code || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '角色名称' : 'Role Name'} value={formData.name || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '授权范围' : 'Authorization Scope'} value={selectedCount} hint={language === 'zh' ? '建议至少覆盖一个明确业务入口。' : 'Prefer covering at least one clear business entry.'} />
        <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认角色语义与菜单覆盖一致后再保存。' : 'Confirm the role intent matches the selected menu coverage before saving.'} />
      </DetailKeyValueSection>
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

            <Label
              htmlFor={`role-menu-${menuId}`}
              className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
            >
              {getMenuLabel(menu, language, t)}
            </Label>

            {menu.type ? (
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-white/90 px-2.5 py-1 text-xs text-slate-600"
              >
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












