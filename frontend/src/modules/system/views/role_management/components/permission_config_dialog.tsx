import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { ChevronRight, File, Folder } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '../../../../../components/ui/checkbox';
import { Label } from '../../../../../components/ui/label';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Separator } from '../../../../../components/ui/separator';
import { DetailKeyValueItem, DetailKeyValueSection, FormDialogWrapper } from '../../../../../shared/components/ui';
import { getMenuLabel } from '../../../../../shared/constants/views_config';
import { useLanguageStore } from '../../../../../stores/language_store';
import { roleApi } from '../../../api/role_api';
import type { Menu, Role } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';

interface PermissionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  menus: Menu[];
  onSuccess?: () => void;
}

export function PermissionConfigDialog({
  open,
  onOpenChange,
  role,
  menus,
  onSuccess,
}: PermissionConfigDialogProps) {
  const { language, t } = useLanguageStore();
  const copy = getRoleManagementCopy(language).dialog;
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(new Set());
  const parentMap = useMemo(() => buildParentMap(menus || []), [menus]);
  const childrenMap = useMemo(() => buildChildrenMap(menus || []), [menus]);

  useEffect(() => {
    if (open && role) {
      const initialSelectedMenuIds = (role.menuIds || []).map(String);
      setSelectedMenuIds(initialSelectedMenuIds);
      setExpandedMenuIds(buildExpandedMenuIds(initialSelectedMenuIds, childrenMap, parentMap));
    }
  }, [childrenMap, open, parentMap, role]);

  const menuTree = useMemo(() => buildMenuTree(menus || []), [menus]);
  const selectedMenus = useMemo(
    () => menus.filter((menu) => selectedMenuIds.includes(String(menu.id))),
    [menus, selectedMenuIds],
  );

  const toggleSelection = (menuId: string) => {
    setSelectedMenuIds((prev) => {
      if (prev.includes(menuId)) {
        const next = new Set(prev);
        collectDescendantMenuIds(menuId, childrenMap).forEach((id) => next.delete(id));
        next.delete(menuId);
        return Array.from(next);
      }

      const next = new Set(prev);
      next.add(menuId);
      collectAncestorMenuIds(menuId, parentMap).forEach((id) => next.add(id));
      return Array.from(next);
    });
    setExpandedMenuIds((prev) => {
      const next = new Set(prev);
      collectAncestorMenuIds(menuId, parentMap).forEach((id) => next.add(id));
      if (childrenMap.get(menuId)?.length) {
        next.add(menuId);
      }
      return next;
    });
  };

  const toggleExpand = (menuId: string) => {
    setExpandedMenuIds((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!role) {
      return;
    }

    setLoading(true);
    try {
      await roleApi.assignMenus(String(role.id), selectedMenuIds);
      toast.success(copy.permissionSaveSuccess);
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(copy.permissionSaveFailed);
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return null;
  }

  return (
    <FormDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={copy.permissionTitle}
      description={copy.permissionDescription(role.name)}
      onSubmit={handleSubmit}
      loading={loading}
      cancelText={copy.permissionCancel}
      submitText={copy.permissionSubmit}
      size="3xl"
    >
      <div className="space-y-4">
        <DetailKeyValueSection
          eyebrow="AUTH"
          title={language === 'zh' ? '权限配置摘要' : 'Permission Config Summary'}
          description={language === 'zh' ? '先确认当前角色、菜单数量和授权覆盖面。' : 'Confirm the current role, menu count, and authorization coverage first.'}
        >
          <DetailKeyValueItem label={language === 'zh' ? '当前角色' : 'Current Role'} value={role.name} />
          <DetailKeyValueItem label={language === 'zh' ? '已选菜单' : 'Selected Menus'} value={selectedMenuIds.length} hint={selectedMenus.slice(0, 3).map((menu) => getMenuLabel(menu, language, t)).join(' / ') || '-'} />
          <DetailKeyValueItem label={language === 'zh' ? '菜单总量' : 'Total Menus'} value={menus.length} />
          <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认菜单授权范围与角色职责一致后再保存。' : 'Confirm the menu coverage matches the role responsibility before saving.'} className="md:col-span-2" />
        </DetailKeyValueSection>

        <div className="flex items-center justify-between rounded-[24px] border border-blue-200/80 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-4 shadow-[0_18px_36px_-30px_rgba(59,130,246,0.28)]">
          <div className="text-sm text-slate-700">{copy.permissionSelected(selectedMenuIds.length)}</div>
          <button
            type="button"
            onClick={() => setSelectedMenuIds([])}
            className="rounded-2xl border border-blue-100 bg-white/90 px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-white hover:text-blue-700"
          >
            {copy.permissionClear}
          </button>
        </div>

        <Separator />

        <ScrollArea className="h-[420px] rounded-[28px] border border-slate-200/80 bg-slate-50/75 p-3 pr-4 shadow-inner shadow-slate-100/80">
          <div className="space-y-2">
            {renderMenuTree({
              menuList: menuTree,
              expandedMenuIds,
              toggleExpand,
              selectedMenuIds,
              toggleSelection,
              language,
              t,
            })}
          </div>
        </ScrollArea>

        <DetailKeyValueSection
          eyebrow="CHECK"
          title={language === 'zh' ? '保存前检查' : 'Pre-save Review'}
          description={language === 'zh' ? '提交前建议核对所选菜单范围和关键入口。' : 'Review selected menu coverage and key entries before saving.'}
        >
          <DetailKeyValueItem label={language === 'zh' ? '已选数量' : 'Selected Count'} value={selectedMenuIds.length} />
          <DetailKeyValueItem label={language === 'zh' ? '关键入口' : 'Key Entries'} value={selectedMenus.slice(0, 2).map((menu) => getMenuLabel(menu, language, t)).join(' / ') || '-'} />
        </DetailKeyValueSection>
      </div>
    </FormDialogWrapper>
  );
}

function renderMenuTree({
  menuList,
  expandedMenuIds,
  toggleExpand,
  selectedMenuIds,
  toggleSelection,
  language,
  t,
  level = 0,
}: {
  menuList: Menu[];
  expandedMenuIds: Set<string>;
  toggleExpand: (menuId: string) => void;
  selectedMenuIds: string[];
  toggleSelection: (menuId: string) => void;
  language: string;
  t: unknown;
  level?: number;
}): ReactNode {
  return menuList.map((menu) => {
    const menuId = String(menu.id);
    const hasChildren = (menu.children || []).length > 0;
    const expanded = expandedMenuIds.has(menuId);
    const selected = selectedMenuIds.includes(menuId);

    return (
      <div key={menuId} className={level > 0 ? 'ml-6' : ''}>
        <div
          className={`flex items-center gap-3 rounded-[24px] border px-4 py-3 transition-all duration-200 ${
            selected
              ? 'border-blue-200 bg-blue-50/80 shadow-sm shadow-blue-100/60'
              : 'border-slate-200/70 bg-white/88 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
          }`}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(menuId)}
              className="rounded-2xl p-1.5 transition-colors hover:bg-slate-100"
            >
              <ChevronRight
                className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-7" />
          )}

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
            id={`permission-menu-${menuId}`}
            checked={selected}
            onCheckedChange={() => toggleSelection(menuId)}
          />
          <Label
            htmlFor={`permission-menu-${menuId}`}
            className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
          >
            {getMenuLabel(menu, language, t)}
          </Label>
          <span className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] text-slate-500">
            {menu.path || menu.code}
          </span>
        </div>

        {hasChildren &&
          expanded &&
          renderMenuTree({
            menuList: menu.children || [],
            expandedMenuIds,
            toggleExpand,
            selectedMenuIds,
            toggleSelection,
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

function buildParentMap(menus: Menu[]) {
  return new Map(
    menus
      .filter((menu) => menu.parentId != null)
      .map((menu) => [String(menu.id), String(menu.parentId)]),
  );
}

function buildChildrenMap(menus: Menu[]) {
  const map = new Map<string, string[]>();

  menus.forEach((menu) => {
    const parentId = menu.parentId == null ? null : String(menu.parentId);
    if (!parentId) {
      return;
    }

    const current = map.get(parentId) || [];
    current.push(String(menu.id));
    map.set(parentId, current);
  });

  return map;
}

function collectAncestorMenuIds(menuId: string, parentMap: Map<string, string>) {
  const ancestors: string[] = [];
  let currentId = parentMap.get(menuId);

  while (currentId) {
    ancestors.push(currentId);
    currentId = parentMap.get(currentId);
  }

  return ancestors;
}

function collectDescendantMenuIds(menuId: string, childrenMap: Map<string, string[]>) {
  const descendants: string[] = [];
  const stack = [...(childrenMap.get(menuId) || [])];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }

    descendants.push(currentId);
    stack.push(...(childrenMap.get(currentId) || []));
  }

  return descendants;
}

function buildExpandedMenuIds(
  selectedMenuIds: string[],
  childrenMap: Map<string, string[]>,
  parentMap: Map<string, string>,
) {
  const expanded = new Set<string>();

  selectedMenuIds.forEach((menuId) => {
    collectAncestorMenuIds(menuId, parentMap).forEach((ancestorId) => expanded.add(ancestorId));
    if (childrenMap.get(menuId)?.length) {
      expanded.add(menuId);
    }
  });

  return expanded;
}












