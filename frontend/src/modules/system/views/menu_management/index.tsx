import { useEffect, useMemo, useState } from 'react';
import { useMenus } from '../../hooks/use_menus';
import { useCallback } from 'react';
import { useRoles } from '../../hooks/use_roles';
import { Menu } from '../../types';
import { useLanguageStore } from '../../../../stores/language_store';
import { toast } from 'sonner';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Plus, Upload, Download, ChevronDown, ChevronRight, Trash2, Power, PowerOff } from 'lucide-react';
import { ConfirmDialog } from '../../../../shared/components/ui/confirm_dialog';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  ManagementContentCard,
  ManagementPageHeader,
} from '../../../../shared/components/ui';
import { useCSVImportExport } from '../../../../shared/hooks/use_csv_import_export';
import { csvTemplates } from '../../../../shared/utils/csv_templates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/auth_store';
import { QueryAccessBoundary } from '../../../../shared/components/query_access_boundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/use_action_permission_dialog_guard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/use_permission_confirm_guard';
import { getMenuLabel } from '../../../../shared/constants/views_config';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

// 导入重构后的子组件和 Hook
import { MenuTreeTable } from './components/menu_tree_table';
import { MenuSearchForm } from './components/menu_search_form';
import { MenuDialogManager } from './components/menu_dialog_manager';
import { useMenuTree, MenuNode } from './hooks/use_menu_tree';
import { getMenuManagementCopy } from './menu_management_copy';

interface ActionConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  variant: 'warning' | 'success' | 'danger';
  guard?: 'update' | 'delete' | null;
  action: null | (() => Promise<void>);
}

interface MenuStatusHint {
  fieldDescription: string;
  title?: string;
  description?: string;
  tone?: 'info' | 'warning' | 'success';
}

const initialActionConfirmState: ActionConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmText: '',
  variant: 'warning',
  guard: null,
  action: null,
};

export function MenuManagement() {
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = getMenuManagementCopy(language);
  const menuMessages = createEntityFeedback(zh, copy.entity);
  const authUser = useAuthStore((state) => state.user);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryMenu = hasPermission(systemPermissions.menu.query);
  const getMenuDisplayName = useCallback(
    (menu?: Partial<Menu> | null) => getMenuLabel(menu, language, t) || menu?.name || '',
    [language, t],
  );
  
  // 1. 数据加载
  const { menus, reload } = useMenus({ enabled: canQueryMenu });
  const { roles } = useRoles({ enabled: canQueryMenu });

  // 2. 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<MenuNode[]>([]);
  const [formData, setFormData] = useState<Partial<Menu>>({});
  const [actionConfirm, setActionConfirm] = useState<ActionConfirmState>(initialActionConfirmState);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all'
  });
  const [dialogs, setDialogs] = useState({
    add: false,
    edit: false,
    delete: false,
    import: false,
    export: false
  });

  const setDialogOpen = (name: string, open: boolean) => {
    setDialogs(prev => ({ ...prev, [name]: open }));
  };

  const resetMenuForm = (nextFormData: Partial<Menu> = {}) => {
    setSelectedMenu(null);
    setFormData(nextFormData);
  };

  const isCurrentUserAffectedByMenuIds = useCallback((menuIds: string[]) => {
    if (menuIds.length === 0) {
      return false;
    }

    const currentRoleIds = new Set((authUser?.roleIds || []).map((roleId) => String(roleId)));
    return roles.some(
      (role) =>
        currentRoleIds.has(String(role.id)) &&
        (role.menuIds || []).map(String).some((menuId) => menuIds.includes(menuId)),
    );
  }, [authUser?.roleIds, roles]);

  const refreshCurrentUserMenuContextIfNeeded = useCallback(async (menuIds: string[]) => {
    if (isCurrentUserAffectedByMenuIds(menuIds)) {
      await refreshTenantContext();
    }
  }, [isCurrentUserAffectedByMenuIds, refreshTenantContext]);

  const closeActionConfirm = () => {
    setActionConfirm(initialActionConfirmState);
  };

  const openAddDialog = () => {
    resetMenuForm();
    setDialogOpen('add', true);
  };

  // 3. 搜索过滤逻辑
  const filteredMenus = useMemo(() => {
    return menus.filter(m => {
      const menuLabel = getMenuDisplayName(m);
      const matchesSearch = !searchQuery || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menuLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.path && m.path.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.permission && m.permission.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = filters.type === 'all' || m.type === filters.type;
      const matchesStatus = filters.status === 'all' || m.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filters, getMenuDisplayName, menus, searchQuery]);

  // 4. 树形逻辑 Hook
  const {
    flattenedDisplayData,
    expandedKeys,
    toggleExpand,
    expandAll,
    collapseAll
  } = useMenuTree(filteredMenus);

  // 5. CSV 导入导出处理
  const csvHandler = useCSVImportExport({
    templateConfig: csvTemplates.menu,
    onDataImported: async (rows) => {
      const existingMenus = new Map(menus.map((menu) => [menu.code.toLowerCase(), menu]));

      const resolveMenuType = (value: unknown): Menu['type'] => {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === 'directory' || normalized === '目录') {
          return 'directory';
        }
        if (normalized === 'button' || normalized === '按钮') {
          return 'button';
        }
        return 'menu';
      };

      const resolveMenuStatus = (value: unknown): Menu['status'] => {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'inactive' || normalized === 'disabled' || normalized === '禁用'
          ? 'inactive'
          : 'active';
      };

      const resolveMenuCode = (row: Record<string, unknown>) => {
        const permissionCode = String(row.permission || '').trim();
        if (permissionCode) {
          return permissionCode;
        }

        const path = String(row.path || '').trim();
        if (path) {
          return path
            .replace(/^https?:\/\//i, '')
            .replace(/[/?#=&]+/g, ':')
            .replace(/:+/g, ':')
            .replace(/^:|:$/g, '')
            .toLowerCase();
        }

        return String(row.menuName || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-');
      };

      const resolveParentId = (value: unknown) => {
        const keyword = String(value || '').trim();
        if (!keyword) {
          return null;
        }

        const matchedMenu = menus.find((menu) =>
          [menu.id, menu.code, menu.name, menu.path]
            .filter(Boolean)
            .some((candidate) => String(candidate).trim().toLowerCase() === keyword.toLowerCase()),
        );

        return matchedMenu ? String(matchedMenu.id) : null;
      };

      const resolveComponentPath = (path: string, type: Menu['type']) => {
        if (type !== 'menu' || /^https?:\/\//i.test(path)) {
          return '';
        }

        return path.replace(/^\/+/, '').replace(/\/+$/, '');
      };

      for (const row of rows) {
        const name = String(row.menuName || '').trim();
        const path = String(row.path || '').trim();
        if (!name || !path) {
          continue;
        }

        const type = resolveMenuType(row.type);
        const code = resolveMenuCode(row);
        const payload: Partial<Menu> = {
          name,
          code,
          path,
          icon: String(row.icon || '').trim(),
          type,
          sort: Number(row.sort) || 0,
          status: resolveMenuStatus(row.status),
          parentId: resolveParentId(row.parentMenu),
          permission: String(row.permission || '').trim() || code,
          permissions: [String(row.permission || '').trim() || code].filter(Boolean),
          component: resolveComponentPath(path, type),
          external: /^https?:\/\//i.test(path),
        };

        const existing = existingMenus.get(code.toLowerCase());
        if (existing) {
          await api.updateMenu(String(existing.id), payload);
          await refreshCurrentUserMenuContextIfNeeded([String(existing.id)]);
        } else {
          await api.createMenu(payload);
        }
      }

      await reload();
      toast.success(menuMessages.importSuccess);
    },
    requiredFields: ['menuName', 'path'],
  });

  useEffect(() => {
    setSelectedMenus((current) => {
      const next = current
        .map((menu) => menus.find((item) => String(item.id) === String(menu.id)))
        .filter((menu): menu is MenuNode => Boolean(menu));

      return next.length === current.length && next.every((menu, index) => menu === current[index])
        ? current
        : next;
    });
  }, [menus]);

  useEffect(() => {
    if (!selectedMenu) {
      return;
    }

    const nextSelectedMenu = menus.find((menu) => String(menu.id) === String(selectedMenu.id)) ?? null;
    if (!nextSelectedMenu) {
      setSelectedMenu(null);
      setDialogs((prev) => ({ ...prev, edit: false, delete: false }));
      return;
    }

    if (nextSelectedMenu !== selectedMenu) {
      setSelectedMenu(nextSelectedMenu);
    }
  }, [menus, selectedMenu]);

  // 6. 事件处理
  const handleAction = (action: string, menu: MenuNode) => {
    switch (action) {
      case 'add-sub':
        resetMenuForm({ parentId: menu.id, type: menu.type === 'directory' ? 'menu' : 'button' });
        setDialogOpen('add', true);
        break;
      case 'edit':
        setSelectedMenu(menu);
        setFormData(menu);
        setDialogOpen('edit', true);
        break;
      case 'delete':
        setSelectedMenu(menu);
        setDialogOpen('delete', true);
        break;
    }
  };

  const normalizeMenuFormData = (data: Partial<Menu>) => {
    const normalized: Partial<Menu> = {
      ...data,
      name: data.name?.trim(),
      code: data.code?.trim(),
      path: data.path?.trim(),
      icon: data.icon?.trim(),
      component: data.component?.trim(),
      description: data.description?.trim(),
      external: Boolean(data.external),
    };

    if (normalized.type === 'directory' || normalized.type === 'button') {
      normalized.external = false;
      normalized.component = '';
    }

    if (normalized.type === 'menu' && normalized.external) {
      normalized.component = '';
    }

    return normalized;
  };

  const validateMenuFormData = (data: Partial<Menu>, currentMenu?: Menu | null) => {
    const normalized = normalizeMenuFormData(data);
    const parentId = normalized.parentId != null ? String(normalized.parentId) : '';
    const parentMenu = parentId ? menus.find((menu) => String(menu.id) === parentId) : undefined;

    if (!normalized.name) {
      return copy.validation.nameRequired;
    }
    if (!normalized.code) {
      return copy.validation.codeRequired;
    }
    if (!normalized.type) {
      return copy.validation.typeRequired;
    }
    if (!normalized.path) {
      return copy.validation.pathRequired;
    }

    if (parentId) {
      if (!parentMenu) {
        return copy.validation.parentMissing;
      }
      if (parentMenu.status !== 'active') {
        return copy.validation.parentInactive;
      }
      if (currentMenu && String(currentMenu.id) === parentId) {
        return copy.validation.parentSelf;
      }
    }

    if (normalized.type === 'directory') {
      if (parentMenu && parentMenu.type !== 'directory') {
        return copy.validation.directoryParent;
      }
    }

    if (normalized.type === 'button') {
      if (!parentId) {
        return copy.validation.buttonParentRequired;
      }
      if (!parentMenu || parentMenu.type !== 'menu') {
        return copy.validation.buttonParentType;
      }
    }

    if (normalized.type === 'menu') {
      if (parentMenu?.type === 'button') {
        return copy.validation.menuParentType;
      }
      if (normalized.external) {
        if (!/^https?:\/\//i.test(normalized.path || '')) {
          return copy.validation.externalPath;
        }
      } else if (!normalized.component) {
        return copy.validation.componentRequired;
      }
    }

    return null;
  };

  const handlers = {
    onSubmit: async () => {
      if (!ensureActionPermission(dialogs.add ? canCreateMenu : canUpdateMenu, dialogs.add ? copy.actionLabels.add : copy.actionLabels.edit)) return;
      try {
        const normalizedFormData = normalizeMenuFormData(formData);
        const validationMessage = validateMenuFormData(normalizedFormData, selectedMenu);
        if (validationMessage) {
          toast.error(validationMessage);
          return;
        }

        if (dialogs.add) {
          await api.createMenu(normalizedFormData);
        } else if (selectedMenu) {
          if (normalizedFormData.status && normalizedFormData.status !== selectedMenu.status) {
            openMenuStatusConfirm(selectedMenu, normalizedFormData.status === 'active', async () => {
              await api.updateMenu(String(selectedMenu.id), normalizedFormData);
              setDialogOpen('edit', false);
              resetMenuForm();
              await refreshCurrentUserMenuContextIfNeeded([String(selectedMenu.id)]);
              await reload();
            });
            return;
          }

          await api.updateMenu(String(selectedMenu.id), normalizedFormData);
          await refreshCurrentUserMenuContextIfNeeded([String(selectedMenu.id)]);
        }
        toast.success(dialogs.add ? menuMessages.createSuccess : menuMessages.updateSuccess);
        setDialogOpen(dialogs.add ? 'add' : 'edit', false);
        resetMenuForm();
        await reload();
      } catch {
        toast.error(menuMessages.saveFailed);
      }
    },
    onDelete: async () => {
      if (!selectedMenu) return;
      if (!ensureActionPermission(canDeleteMenu, copy.actionLabels.delete)) return;
      const impact = getMenuDeleteImpact(String(selectedMenu.id));
      if (impact.childCount > 0) {
        toast.error(buildMenuDeleteBlockedMessage(getMenuDisplayName(selectedMenu), impact.childCount));
        return;
      }
      try {
        await api.deleteMenu(String(selectedMenu.id));
        toast.success(menuMessages.deleteSuccess);
        setDialogOpen('delete', false);
        resetMenuForm();
        await refreshCurrentUserMenuContextIfNeeded([String(selectedMenu.id)]);
        await reload();
      } catch {
        toast.error(menuMessages.deleteFailed);
      }
    },
    onImport: async (file: File) => {
      if (!ensureActionPermission(canCreateMenu, copy.actionLabels.import)) return;
      await csvHandler.handleImport(file);
      setDialogOpen('import', false);
    },
    onExport: async (_options: unknown) => {
      if (!ensureActionPermission(canExportMenu, copy.actionLabels.export)) return;
      await csvHandler.handleExport(
        filteredMenus.map((menu) => ({
          menuName: getMenuDisplayName(menu),
          path: menu.path,
          permission: menu.permission || menu.code,
          icon: menu.icon || '',
          type: menu.type,
          sort: menu.sort,
          parentMenu:
            menus.find((candidate) => String(candidate.id) === String(menu.parentId))?.name || '',
          status: menu.status,
        })),
        { filename: 'MenuManagement_Filtered' },
      );
      setDialogOpen('export', false);
    }
  };

  const getMenuDeleteImpact = useCallback((menuId: string, ignoreMenuIds?: Set<string>) => {
    const childCount = menus.filter((menu) => (
      String(menu.parentId ?? '') === menuId && !ignoreMenuIds?.has(String(menu.id))
    )).length;
    const linkedRoles = roles.filter((role) => (role.menuIds || []).map(String).includes(menuId));
    return {
      childCount,
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  }, [menus, roles]);

  const buildMenuDeleteBlockedMessage = (menuName: string, childCount: number) => {
    return copy.messages.deleteBlocked(menuName, childCount);
  };

  const getMenuBatchImpact = useCallback((items: Array<Menu | MenuNode>) => {
    const menuIds = new Set(items.map((item) => String(item.id)));
    const linkedRoles = roles.filter((role) =>
      (role.menuIds || []).map(String).some((menuId) => menuIds.has(menuId)),
    );

    return {
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  }, [roles]);

  const buildMenuBatchDeleteBlockedMessage = (
    items: Array<{ name: string; childCount: number }>,
  ) => {
    const details = items
      .slice(0, 3)
      .map((item) => copy.messages.batchBlockedItem(item.name, item.childCount))
      .join(copy.messages.separator);

    return copy.messages.batchBlockedSummary(details, items.length > 3);
  };

  const buildMenuDeleteDescription = (menu: Menu) => {
    const impact = getMenuDeleteImpact(String(menu.id));
    const menuName = getMenuDisplayName(menu);
    if (impact.childCount > 0) {
      return copy.messages.deleteDescriptionBlocked(menuName, impact.childCount);
    }
    if (impact.affectedRoleCount > 0) {
      return copy.messages.deleteDescriptionAffected(
        menuName,
        impact.affectedRoleCount,
        impact.affectedUserCount,
      );
    }
    return copy.messages.deleteDescriptionStandalone(menuName);
  };

  const buildMenuBatchDeleteDescription = (items: MenuNode[]) => {
    const impact = getMenuBatchImpact(items);
    return impact.affectedRoleCount > 0
      ? copy.messages.batchDeleteDescriptionAffected(
          items.length,
          impact.affectedRoleCount,
          impact.affectedUserCount,
        )
      : copy.messages.batchDeleteDescriptionStandalone(items.length);
  };

  const buildMenuStatusCopy = (menu: Menu, enabled: boolean) => {
    const impact = getMenuDeleteImpact(String(menu.id));
    const menuName = getMenuDisplayName(menu);
    return {
      title: copy.messages.statusTitle(enabled),
      description:
        impact.affectedRoleCount > 0
          ? copy.messages.statusDescriptionAffected(
              menuName,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.statusDescriptionStandalone(menuName),
      confirmText: copy.messages.statusConfirmText(enabled),
      success:
        impact.affectedRoleCount > 0
          ? copy.messages.statusSuccessAffected(
              menuName,
              enabled,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.statusSuccessStandalone(menuName, enabled),
    };
  };

  const buildMenuFormStatusHint = (menu: Menu | null, nextStatus?: Menu['status']): MenuStatusHint => {
    if (!menu) {
      return {
        fieldDescription: copy.messages.formStatusNew,
      };
    }

    const targetStatus = nextStatus || menu.status;
    if (targetStatus === menu.status) {
      return {
        fieldDescription: copy.messages.formStatusFieldDescription,
        title: copy.titles.statusNote,
        description: copy.messages.formStatusUnchanged,
        tone: 'info',
      };
    }

    const enabled = targetStatus === 'active';
    const impact = getMenuDeleteImpact(String(menu.id));
    return {
      fieldDescription: copy.messages.formStatusFieldDescription,
      title: enabled ? copy.titles.enableImpact : copy.titles.disableImpact,
      description: impact.affectedRoleCount > 0
        ? copy.messages.formStatusAffected(impact.affectedRoleCount, impact.affectedUserCount)
        : copy.messages.formStatusStandalone(enabled),
      tone: enabled ? 'success' : 'warning',
    };
  };

  const openMenuStatusConfirm = (menu: Menu, enabled: boolean, action: () => Promise<void>) => {
    const copy = buildMenuStatusCopy(menu, enabled);
    setActionConfirm({
      open: true,
      title: copy.title,
      description: copy.description,
      confirmText: copy.confirmText,
      variant: enabled ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        await refreshCurrentUserMenuContextIfNeeded([String(menu.id)]);
        toast.success(copy.success);
      },
    });
  };

  const buildMenuBatchStatusCopy = (items: MenuNode[], enabled: boolean) => {
    const impact = getMenuBatchImpact(items);
    return {
      title: copy.messages.batchStatusTitle(enabled),
      description:
        impact.affectedRoleCount > 0
          ? copy.messages.batchStatusDescriptionAffected(
              items.length,
              enabled,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.batchStatusDescriptionStandalone(items.length, enabled),
      confirmText: copy.messages.batchStatusConfirmText(enabled),
      success:
        impact.affectedRoleCount > 0
          ? copy.messages.batchStatusSuccessAffected(
              items.length,
              enabled,
              impact.affectedRoleCount,
              impact.affectedUserCount,
            )
          : copy.messages.batchStatusSuccessStandalone(items.length, enabled),
    };
  };

  const openMenuBatchStatusConfirm = (items: MenuNode[], enabled: boolean, action: () => Promise<void>) => {
    const copy = buildMenuBatchStatusCopy(items, enabled);
    setActionConfirm({
      open: true,
      title: copy.title,
      description: copy.description,
      confirmText: copy.confirmText,
      variant: enabled ? 'success' : 'warning',
      guard: 'update',
      action: async () => {
        await action();
        await refreshCurrentUserMenuContextIfNeeded(items.map((item) => String(item.id)));
        toast.success(copy.success);
      },
    });
  };

  const openMenuBatchDeleteConfirm = (items: MenuNode[], action: () => Promise<void>) => {
    setActionConfirm({
      open: true,
      title: copy.titles.confirmBatchDelete,
      description: buildMenuBatchDeleteDescription(items),
      confirmText: copy.titles.confirmDelete,
      variant: 'danger',
      guard: 'delete',
      action: async () => {
        await action();
        await refreshCurrentUserMenuContextIfNeeded(items.map((item) => String(item.id)));
        toast.success(menuMessages.batchDeleteSuccess(items.length));
      },
    });
  };

  const menusToEnable = selectedMenus.filter((menu) => menu.status !== 'active');
  const menusToDisable = selectedMenus.filter((menu) => menu.status !== 'inactive');
  const canCreateMenu = hasPermission(systemPermissions.menu.create);
  const canUpdateMenu = hasPermission(systemPermissions.menu.update);
  const canDeleteMenu = hasPermission(systemPermissions.menu.delete);
  const canExportMenu = hasPermission(systemPermissions.menu.export);
  const { ensureActionPermission } = useActionPermissionDialogGuard({
    pageTitle: copy.page.title,
    dialogs,
    guardedDialogs: {
      add: { label: copy.actionLabels.add, allowed: canCreateMenu },
      edit: { label: copy.actionLabels.edit, allowed: canUpdateMenu },
      delete: { label: copy.actionLabels.delete, allowed: canDeleteMenu },
      import: { label: copy.actionLabels.import, allowed: canCreateMenu },
      export: { label: copy.actionLabels.export, allowed: canExportMenu },
    },
    closeDialogs: (names) => {
      setDialogs((prev) => {
        const next = { ...prev };
        names.forEach((name) => {
          next[name] = false;
        });
        return next;
      });
    },
  });
  const { ensureConfirmPermission } = usePermissionConfirmGuard({
    open: actionConfirm.open,
    guard: actionConfirm.guard,
    pageTitle: copy.page.title,
    guards: {
      update: { label: copy.actionLabels.batchStatusUpdate, allowed: canUpdateMenu },
      delete: { label: copy.actionLabels.batchDelete, allowed: canDeleteMenu },
    },
    closeConfirm: closeActionConfirm,
  });

  const handleBatchMenuStatus = (enabled: boolean) => {
    if (!ensureActionPermission(canUpdateMenu, enabled ? copy.actionLabels.batchEnable : copy.actionLabels.batchDisable)) return;
    const targetMenus = enabled ? menusToEnable : menusToDisable;
    if (targetMenus.length === 0) {
      return;
    }

    openMenuBatchStatusConfirm(targetMenus, enabled, async () => {
      try {
        await api.batchUpdateMenuStatus(
          targetMenus.map((menu) => String(menu.id)),
          enabled ? 'active' : 'inactive',
        );
        setSelectedMenus([]);
        await reload();
      } catch {
        toast.error(menuMessages.batchStatusUpdateFailed);
        throw new Error('menu batch status update failed');
      }
    });
  };

  const handleBatchDelete = () => {
    if (!ensureActionPermission(canDeleteMenu, copy.actionLabels.batchDelete)) return;
    if (selectedMenus.length === 0) {
      return;
    }

    const selectedMenuIds = new Set(selectedMenus.map((menu) => String(menu.id)));
    const blockedMenus = selectedMenus
      .map((menu) => ({
        name: getMenuDisplayName(menu),
        childCount: getMenuDeleteImpact(String(menu.id), selectedMenuIds).childCount,
      }))
      .filter((menu) => menu.childCount > 0);

    if (blockedMenus.length > 0) {
      toast.error(buildMenuBatchDeleteBlockedMessage(blockedMenus));
      return;
    }

    openMenuBatchDeleteConfirm(selectedMenus, async () => {
      try {
        await api.batchDeleteMenus(selectedMenus.map((menu) => String(menu.id)));
        setSelectedMenus([]);
        resetMenuForm();
        await reload();
      } catch {
        toast.error(menuMessages.batchDeleteFailed);
        throw new Error('menu batch delete failed');
      }
    });
  };

  const pageDescription = zh
    ? '统一管理目录、菜单和按钮权限入口，确保菜单树、权限点与角色授权保持一致。'
    : 'Manage directories, menus, and button permission entry points with a stable permission-tree workflow.';
  const menuReviewStats = useMemo(() => {
    const directory = filteredMenus.filter((menu) => menu.type === 'directory').length;
    const menuCount = filteredMenus.filter((menu) => menu.type === 'menu').length;
    const button = filteredMenus.filter((menu) => menu.type === 'button').length;
    const inactive = filteredMenus.filter((menu) => menu.status !== 'active').length;
    const linkedRoles = new Set<string>();
    let linkedUsers = 0;

    filteredMenus.forEach((menu) => {
      const menuId = String(menu.id);
      roles.forEach((role) => {
        if ((role.menuIds || []).map(String).includes(menuId)) {
          linkedRoles.add(String(role.id));
        }
      });
    });

    roles.forEach((role) => {
      if (linkedRoles.has(String(role.id))) {
        linkedUsers += role.userCount || 0;
      }
    });

    return {
      total: filteredMenus.length,
      directory,
      menu: menuCount,
      button,
      inactive,
      linkedRoles: linkedRoles.size,
      linkedUsers,
    };
  }, [filteredMenus, roles]);
  const selectedBatchImpact = useMemo(() => getMenuBatchImpact(selectedMenus), [getMenuBatchImpact, selectedMenus]);
  const selectedDeleteBlockedCount = useMemo(() => {
    const selectedMenuIds = new Set(selectedMenus.map((menu) => String(menu.id)));
    return selectedMenus.filter((menu) => getMenuDeleteImpact(String(menu.id), selectedMenuIds).childCount > 0).length;
  }, [getMenuDeleteImpact, selectedMenus]);
  const menuFocusSummary = useMemo(() => {
    if (selectedMenus.length > 0) {
      return {
        badge: zh ? '批量操作中' : 'Batch In Progress',
        badgeVariant: 'warning' as const,
        title: zh ? '当前已进入批量菜单处理阶段' : 'A batch menu workflow is active',
        description:
          zh
            ? `已选中 ${selectedMenus.length} 个菜单节点，可继续启停或删除，但要先复核未选下级节点和角色影响范围。`
            : `${selectedMenus.length} menu nodes are selected. Continue with status changes or deletion after reviewing unselected child nodes and role impact.`,
        nextAction:
          zh ? '优先检查下级节点阻塞与角色影响，再执行批量操作。' : 'Review child-node blockers and role impact before batch actions.',
      };
    }
    if (menuReviewStats.inactive > 0) {
      return {
        badge: zh ? '停用复核' : 'Inactive Review',
        badgeVariant: 'mono' as const,
        title: zh ? '当前结果中存在停用菜单需要复核' : 'Inactive menu nodes need follow-up',
        description:
          zh
            ? `当前范围内有 ${menuReviewStats.inactive} 个停用菜单节点，建议优先确认角色授权与动态菜单刷新影响。`
            : `${menuReviewStats.inactive} inactive menu nodes are in scope. Review role authorization and dynamic menu refresh impact first.`,
        nextAction:
          zh ? '先查看停用节点的角色影响，再决定恢复启用。' : 'Review role impact for inactive nodes before re-enabling them.',
      };
    }
    if (filters.type !== 'all' || filters.status !== 'all' || searchQuery.trim()) {
      return {
        badge: zh ? '筛选结果' : 'Filtered Result',
        badgeVariant: 'info' as const,
        title: zh ? '当前处于菜单树聚焦筛选模式' : 'You are reviewing a narrowed menu-tree scope',
        description:
          zh
            ? `当前范围已缩小到 ${menuReviewStats.total} 个菜单节点，适合继续检查目录层级、权限点和路由挂载。`
            : `The current scope is narrowed to ${menuReviewStats.total} menu nodes, which is ideal for reviewing hierarchy, permission points, and route mounting.`,
        nextAction:
          zh ? '继续展开目标树枝查看细节，或清空筛选回到全量树。' : 'Expand the target branch for detail review, or clear filters to return to the full tree.',
      };
    }

    return {
      badge: zh ? '结构稳定' : 'Stable',
      badgeVariant: 'success' as const,
      title: zh ? '当前菜单树整体结构稳定' : 'The menu tree structure is stable overall',
      description:
        zh
          ? '当前结果以内主要为稳定节点，可继续做路由、权限点和角色引用的常规巡检。'
          : 'Most nodes in scope are stable. Continue with routine checks on routes, permission points, and role references.',
      nextAction:
        zh ? '优先抽查关键目录和高影响菜单。' : 'Spot-check key directories and high-impact menus next.',
    };
  }, [filters.status, filters.type, menuReviewStats, searchQuery, selectedMenus.length, zh]);

  return (
    <div className="space-y-6">
      {!canQueryMenu ? (
        <QueryAccessBoundary
          viewId="system-menus"
          title={copy.page.title}
          queryPermission={systemPermissions.menu.query}
        />
      ) : (
        <>
          <ManagementPageHeader
            eyebrow="SYSTEM"
            title={copy.page.title}
            description={pageDescription}
            meta={
              <>
                <Badge variant="mono">{copy.entity.en}</Badge>
                <Badge variant="info">{zh ? `菜单总数 ${menus.length}` : `${menus.length} menus`}</Badge>
                {selectedMenus.length > 0 ? (
                  <Badge variant="warning">
                    {zh ? `已选 ${selectedMenus.length} 项` : `${selectedMenus.length} selected`}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <>
          {selectedMenus.length > 0 && (
            <>
              {canUpdateMenu && menusToEnable.length > 0 ? (
                <Button
                  variant="success"
                  size="pill"
                  onClick={() => handleBatchMenuStatus(true)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(menusToEnable.length)}
                </Button>
              ) : null}
              {canUpdateMenu && menusToDisable.length > 0 ? (
                <Button
                  variant="warning"
                  size="pill"
                  onClick={() => handleBatchMenuStatus(false)}
                  className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(menusToDisable.length)}
                </Button>
              ) : null}
              {canDeleteMenu ? (
                <Button
                  variant="ghost-danger"
                  size="pill"
                  onClick={handleBatchDelete}
                  className="h-11 gap-2 rounded-full border border-destructive/20 px-4 shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedMenus.length)}
                </Button>
              ) : null}
            </>
          )}
          <Button
            variant="mono"
            size="icon-sm"
            onClick={expandAll}
            className="h-11 w-11 rounded-full text-slate-500"
            title={copy.titles.expandAll}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="mono"
            size="icon-sm"
            onClick={collapseAll}
            className="mr-1 h-11 w-11 rounded-full text-slate-500"
            title={copy.titles.collapseAll}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {canCreateMenu ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => setDialogOpen('import', true)}
              className="h-11 gap-2 rounded-full px-4"
            >
              <Upload className="w-4 h-4" />
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportMenu ? (
            <Button
              variant="mono"
              size="pill"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-full px-4"
            >
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateMenu ? (
            <Button
              size="pill"
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-full px-4 shadow-sm transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
              </>
            }
          />

          <ManagementContentCard className="border-slate-200/70 bg-gradient-to-br from-white via-slate-50/70 to-slate-100/70 p-5">
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <DetailKeyValueSection
                  eyebrow="PRIORITY"
                  title={zh ? '本次处理顺序' : 'Suggested Priority Order'}
                  description={zh ? '根据当前菜单树状态，建议优先处理这些动作。' : 'Based on the current menu tree state, handle these actions first.'}
                >
                  <DetailKeyValueItem
                    label="01"
                    value={
                      selectedMenus.length > 0
                        ? (zh ? '先复核下级节点阻塞与角色影响' : 'Review child-node blockers and role impact first')
                        : menuReviewStats.inactive > 0
                          ? (zh ? '先处理停用节点' : 'Review inactive nodes first')
                          : (zh ? '先展开关键目录分支' : 'Expand key directory branches first')
                    }
                  />
                  <DetailKeyValueItem
                    label="02"
                    value={zh ? '再检查路由挂载、权限点与角色引用' : 'Then inspect routes, permission points, and role references'}
                  />
                  <DetailKeyValueItem
                    label="03"
                    value={selectedMenus.length === 0 && canCreateMenu ? (zh ? '最后新增或调整菜单节点' : 'Finally add or adjust menu nodes') : (zh ? '最后恢复常规巡检' : 'Finally return to routine inspection')}
                    className="md:col-span-2"
                  />
                </DetailKeyValueSection>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={menuFocusSummary.badgeVariant}>{menuFocusSummary.badge}</Badge>
                    <Badge variant="mono">
                      {zh ? `当前范围 ${menuReviewStats.total} 个节点` : `${menuReviewStats.total} nodes in scope`}
                    </Badge>
                    {selectedMenus.length > 0 ? (
                      <Badge variant="warning">
                        {zh ? `已选 ${selectedMenus.length} 个` : `${selectedMenus.length} selected`}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{menuFocusSummary.title}</div>
                  <div className="text-xs leading-5 text-slate-600">{menuFocusSummary.description}</div>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '目录' : 'Directories'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{menuReviewStats.directory}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '当前范围内的导航层级节点。' : 'Navigation-level nodes in scope.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '菜单' : 'Menus'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{menuReviewStats.menu}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '承载真实视图或外链入口。' : 'View or external-link entry nodes.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '按钮权限' : 'Buttons'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{menuReviewStats.button}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? '细粒度操作权限入口。' : 'Granular action permission points.'}</div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{zh ? '角色影响' : 'Role Impact'}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{menuReviewStats.linkedRoles}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-500">{zh ? `${menuReviewStats.linkedUsers} 名成员受当前范围覆盖` : `${menuReviewStats.linkedUsers} users covered in scope`}</div>
                  </div>
                </div>
              </div>

              <DetailKeyValueSection
                eyebrow="REVIEW"
                title={zh ? '菜单树焦点' : 'Menu Tree Focus'}
                description={zh ? '结合当前筛选与选择状态，快速判断菜单管理下一步。' : 'Use the current filters and selection state to decide the next menu-tree action.'}
              >
                <DetailKeyValueItem
                  label={zh ? '当前结论' : 'Current Outcome'}
                  value={menuFocusSummary.title}
                  hint={menuFocusSummary.description}
                  className="md:col-span-2"
                />
                <DetailKeyValueItem
                  label={zh ? '筛选状态' : 'Filter State'}
                  value={filters.status === 'all' ? copy.search.statusAll : filters.status === 'active' ? copy.search.statusEnabled : copy.search.statusDisabled}
                  hint={
                    filters.type === 'all'
                      ? (zh ? '未限制菜单类型' : 'No menu type filter applied')
                      : filters.type === 'directory'
                        ? copy.search.typeDirectory
                        : filters.type === 'menu'
                          ? copy.search.typeMenu
                          : copy.search.typeButton
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '下一步动作' : 'Next Action'}
                  value={menuFocusSummary.nextAction}
                />
                <DetailKeyValueItem
                  label={zh ? '批量影响' : 'Batch Impact'}
                  value={
                    selectedMenus.length > 0
                      ? (zh
                        ? `待启用 ${menusToEnable.length} / 待禁用 ${menusToDisable.length}`
                        : `${menusToEnable.length} to enable / ${menusToDisable.length} to disable`)
                      : (zh ? '当前未选择菜单' : 'No menus selected')
                  }
                  hint={
                    selectedMenus.length > 0
                      ? (zh
                        ? `影响 ${selectedBatchImpact.affectedRoleCount} 个角色、${selectedBatchImpact.affectedUserCount} 名成员；删除阻塞 ${selectedDeleteBlockedCount} 个`
                        : `${selectedBatchImpact.affectedRoleCount} roles and ${selectedBatchImpact.affectedUserCount} users affected; ${selectedDeleteBlockedCount} delete blockers`)
                      : (zh ? '可先展开树结构后再选择节点。' : 'Expand the tree first before selecting nodes.')
                  }
                />
                <DetailKeyValueItem
                  label={zh ? '推荐操作' : 'Recommended Actions'}
                  className="md:col-span-2"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {(searchQuery.trim() || filters.type !== 'all' || filters.status !== 'all') ? (
                        <Button
                          type="button"
                          variant="mono"
                          size="pill"
                          onClick={() => {
                            setSearchQuery('');
                            setFilters({
                              type: 'all',
                              status: 'all',
                            });
                          }}
                        >
                          {zh ? '清空筛选条件' : 'Clear Filters'}
                        </Button>
                      ) : null}
                      <Button type="button" variant="mono" size="pill" onClick={expandAll}>
                        {zh ? '展开菜单树' : 'Expand Tree'}
                      </Button>
                      {selectedMenus.length === 0 && canCreateMenu ? (
                        <Button type="button" variant="mono" size="pill" onClick={openAddDialog}>
                          {zh ? '新增菜单节点' : 'Create Menu Node'}
                        </Button>
                      ) : null}
                    </div>
                  }
                />
              </DetailKeyValueSection>
            </div>
          </ManagementContentCard>

          <MenuSearchForm
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={setFilters}
          />

          <ManagementContentCard className="p-0">
            <MenuTreeTable
              data={flattenedDisplayData}
              expandedKeys={expandedKeys}
              onToggleExpand={toggleExpand}
              onAction={handleAction}
              selectedItems={selectedMenus}
              onSelectionChange={setSelectedMenus}
              onStatusChange={async (menu, enabled) => {
                openMenuStatusConfirm(menu, enabled, async () => {
                  try {
                    await api.batchUpdateMenuStatus([String(menu.id)], enabled ? 'active' : 'inactive');
                    await reload();
                  } catch {
                    toast.error(menuMessages.statusUpdateFailed);
                    throw new Error('menu status update failed');
                  }
                });
              }}
            />
          </ManagementContentCard>

          <MenuDialogManager
            dialogs={dialogs}
            setDialogOpen={setDialogOpen}
            selectedMenu={selectedMenu}
            formData={formData}
            setFormData={setFormData}
            menus={menus}
            handlers={handlers}
            deleteDescription={selectedMenu ? buildMenuDeleteDescription(selectedMenu) : ''}
            statusHint={buildMenuFormStatusHint(selectedMenu, formData.status)}
          />

          <ConfirmDialog
            open={actionConfirm.open}
            onOpenChange={(open) => {
              if (!open) {
                closeActionConfirm();
              }
            }}
            onConfirm={() => {
              if (!ensureConfirmPermission(actionConfirm.guard)) {
                closeActionConfirm();
                return;
              }
              const action = actionConfirm.action;
              closeActionConfirm();
              void action?.().catch(() => undefined);
            }}
            title={actionConfirm.title}
            description={actionConfirm.description}
            confirmText={actionConfirm.confirmText}
            variant={actionConfirm.variant}
          />
        </>
      )}
    </div>
  );
}


















