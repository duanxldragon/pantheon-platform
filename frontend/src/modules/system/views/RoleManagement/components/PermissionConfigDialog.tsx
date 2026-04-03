import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { ChevronRight, File, Folder } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '../../../../../components/ui/checkbox';
import { Label } from '../../../../../components/ui/label';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Separator } from '../../../../../components/ui/separator';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { getMenuLabel } from '../../../../../shared/constants/viewsConfig';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { roleApi } from '../../../api/roleApi';
import type { Menu, Role } from '../../../types';
import { getRoleManagementCopy } from '../roleManagementCopy';

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

  useEffect(() => {
    if (open && role) {
      setSelectedMenuIds((role.menuIds || []).map(String));
    }
  }, [open, role]);

  const menuTree = useMemo(() => buildMenuTree(menus || []), [menus]);

  const toggleSelection = (menuId: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId],
    );
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.permissionTitle}
      description={copy.permissionDescription(role.name)}
      onSubmit={handleSubmit}
      loading={loading}
      cancelText={copy.permissionCancel}
      submitText={copy.permissionSubmit}
      submittingText={copy.permissionSubmitting}
      width="sm:max-w-[1180px]"
    >
      <div className="space-y-4">
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
      </div>
    </FormDialog>
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
