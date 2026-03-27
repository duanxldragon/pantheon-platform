import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { ChevronRight, File, Folder } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '../../../../../components/ui/checkbox';
import { Label } from '../../../../../components/ui/label';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Separator } from '../../../../../components/ui/separator';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { roleApi } from '../../../api/roleApi';
import type { Menu, Role } from '../../../types';

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
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const saveRoleMenuPermissionsSuccessMessage = zh ? '角色菜单权限已保存' : 'Role menu permissions saved';
  const saveRoleMenuPermissionsFailedMessage = zh ? '保存角色菜单权限失败，请重试' : 'Failed to save role menu permissions';

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
      toast.success(saveRoleMenuPermissionsSuccessMessage);
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error(saveRoleMenuPermissionsFailedMessage);
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
      title={zh ? '配置菜单权限' : 'Configure Menu Permissions'}
      description={
        zh
          ? `为角色“${role.name}”配置可访问的菜单与按钮。`
          : `Configure accessible menus and buttons for role "${role.name}".`
      }
      onSubmit={handleSubmit}
      loading={loading}
      cancelText={zh ? '取消' : 'Cancel'}
      submitText={zh ? '保存配置' : 'Save'}
      submittingText={zh ? '保存中...' : 'Saving...'}
      width="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <div className="text-sm text-gray-700">
            {zh ? '已选择' : 'Selected'}{' '}
            <span className="font-medium text-blue-600">{selectedMenuIds.length}</span>{' '}
            {zh ? '项菜单权限' : 'menu permissions'}
          </div>
          <button
            type="button"
            onClick={() => setSelectedMenuIds([])}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {zh ? '清空选择' : 'Clear'}
          </button>
        </div>

        <Separator />

        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-1">
            {renderMenuTree({
              menuList: menuTree,
              expandedMenuIds,
              toggleExpand,
              selectedMenuIds,
              toggleSelection,
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
  level = 0,
}: {
  menuList: Menu[];
  expandedMenuIds: Set<string>;
  toggleExpand: (menuId: string) => void;
  selectedMenuIds: string[];
  toggleSelection: (menuId: string) => void;
  level?: number;
}): ReactNode {
  return menuList.map((menu) => {
    const menuId = String(menu.id);
    const hasChildren = (menu.children || []).length > 0;
    const expanded = expandedMenuIds.has(menuId);
    const selected = selectedMenuIds.includes(menuId);

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
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  expanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}

          {hasChildren ? (
            <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <File className="h-4 w-4 text-gray-400" />
          )}

          <Checkbox
            id={`permission-menu-${menuId}`}
            checked={selected}
            onCheckedChange={() => toggleSelection(menuId)}
          />
          <Label
            htmlFor={`permission-menu-${menuId}`}
            className="flex-1 cursor-pointer text-gray-700"
          >
            {menu.name}
          </Label>
          <span className="text-xs text-gray-400">{menu.path || menu.code}</span>
        </div>

        {hasChildren &&
          expanded &&
          renderMenuTree({
            menuList: menu.children || [],
            expandedMenuIds,
            toggleExpand,
            selectedMenuIds,
            toggleSelection,
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
