import { useState, useMemo } from 'react';
import { useMenus } from '../../hooks/useMenus';
import { useRoles } from '../../hooks/useRoles';
import { Menu } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Plus, Upload, Download, ChevronDown, ChevronRight, Trash2, Power, PowerOff } from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { useCSVImportExport } from '../../../../shared/hooks/useCSVImportExport';
import { csvTemplates } from '../../../../shared/utils/csvTemplates';
import { api } from '../../api';
import { useAuthStore } from '../../../auth/store/authStore';
import { QueryAccessBoundary } from '../../../../shared/components/QueryAccessBoundary';
import { useActionPermissionDialogGuard } from '../../../../shared/hooks/useActionPermissionDialogGuard';
import { usePermissionConfirmGuard } from '../../../../shared/hooks/usePermissionConfirmGuard';
import { getMenuLabel } from '../../../../shared/constants/viewsConfig';
import { systemPermissions } from '../../constants/permissions';
import { createEntityFeedback } from '../../utils/feedback';

// 导入重构后的子组件和 Hook
import { MenuTreeTable } from './components/MenuTreeTable';
import { MenuSearchForm } from './components/MenuSearchForm';
import { MenuDialogManager } from './components/MenuDialogManager';
import { useMenuTree, MenuNode } from './hooks/useMenuTree';

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
  const menuMessages = createEntityFeedback(zh, { zh: '菜单', en: 'Menu', enPlural: 'menus' });
  const copy = zh
    ? {
        validation: {
          nameRequired: '请输入菜单名称。',
          codeRequired: '请输入菜单编码。',
          typeRequired: '请选择菜单类型。',
          pathRequired: '请输入路由路径。',
          parentMissing: '所选上级菜单不存在，请重新选择。',
          parentInactive: '上级菜单已被禁用，请先启用上级菜单。',
          parentSelf: '上级菜单不能选择自己。',
          directoryParent: '目录类型只能挂载在目录下。',
          buttonParentRequired: '按钮类型必须选择一个菜单作为父级。',
          buttonParentType: '按钮类型只能挂载在菜单节点下。',
          menuParentType: '菜单类型不能挂载在按钮节点下。',
          externalPath: '外链菜单的路由路径必须以 http:// 或 https:// 开头。',
          componentRequired: '普通菜单必须配置组件路径。',
        },
        actionLabels: {
          add: '新增',
          edit: '编辑',
          delete: '删除',
          import: '导入',
          export: '导出',
          batchEnable: '批量启用',
          batchDisable: '批量禁用',
          batchStatusUpdate: '批量状态变更',
          batchDelete: '批量删除',
        },
        titles: {
          statusNote: '状态变更说明',
          enableImpact: '启用风险提示',
          disableImpact: '禁用风险提示',
          confirmBatchDelete: '确认批量删除菜单',
          confirmDelete: '确认删除',
          expandAll: '全部展开',
          collapseAll: '全部收起',
        },
        buttons: {
          batchEnable: (count: number) => `批量启用 (${count})`,
          batchDisable: (count: number) => `批量禁用 (${count})`,
          batchDelete: (count: number) => `批量删除 (${count})`,
        },
      }
    : {
        validation: {
          nameRequired: 'Please enter the menu name.',
          codeRequired: 'Please enter the menu code.',
          typeRequired: 'Please select the menu type.',
          pathRequired: 'Please enter the route path.',
          parentMissing: 'The selected parent menu does not exist.',
          parentInactive: 'The selected parent menu is inactive.',
          parentSelf: 'The parent menu cannot be itself.',
          directoryParent: 'A directory can only be placed under another directory.',
          buttonParentRequired: 'A button must have a parent menu.',
          buttonParentType: 'A button can only be placed under a menu node.',
          menuParentType: 'A menu cannot be placed under a button node.',
          externalPath: 'External menu paths must start with http:// or https://.',
          componentRequired: 'A regular menu must have a component path.',
        },
        actionLabels: {
          add: 'create',
          edit: 'edit',
          delete: 'delete',
          import: 'import',
          export: 'export',
          batchEnable: 'batch enable',
          batchDisable: 'batch disable',
          batchStatusUpdate: 'batch status update',
          batchDelete: 'batch delete',
        },
        titles: {
          statusNote: 'Status change note',
          enableImpact: 'Enable impact preview',
          disableImpact: 'Disable impact preview',
          confirmBatchDelete: 'Confirm batch delete menus',
          confirmDelete: 'Delete',
          expandAll: 'Expand all',
          collapseAll: 'Collapse all',
        },
        buttons: {
          batchEnable: (count: number) => `Enable (${count})`,
          batchDisable: (count: number) => `Disable (${count})`,
          batchDelete: (count: number) => `Delete (${count})`,
        },
      };
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canQueryMenu = hasPermission(systemPermissions.menu.query);
  const getMenuDisplayName = (menu?: Partial<Menu> | null) => getMenuLabel(menu, language, t) || menu?.name || '';
  
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
  }, [filters, menus, searchQuery]);

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
    onDataImported: () => {
      toast.success(menuMessages.importSuccess);
    },
    requiredFields: ['menuName', 'path'],
  });

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
              await reload();
            });
            return;
          }

          await api.updateMenu(String(selectedMenu.id), normalizedFormData);
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
    onExport: async (_options: any) => {
      if (!ensureActionPermission(canExportMenu, copy.actionLabels.export)) return;
      await csvHandler.handleExport(menus);
      setDialogOpen('export', false);
    }
  };

  const getMenuDeleteImpact = (menuId: string, ignoreMenuIds?: Set<string>) => {
    const childCount = menus.filter((menu) => (
      String(menu.parentId ?? '') === menuId && !ignoreMenuIds?.has(String(menu.id))
    )).length;
    const linkedRoles = roles.filter((role) => (role.menuIds || []).map(String).includes(menuId));
    return {
      childCount,
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  };

  const buildMenuDeleteBlockedMessage = (menuName: string, childCount: number) => {
    if (zh) {
      return `删除已拦截：菜单「${menuName}」仍有 ${childCount} 个下级菜单，请先删除或迁移下级菜单。`;
    }
    return `Delete blocked: menu "${menuName}" still has ${childCount} child menus. Remove or move child menus first.`;
  };

  const getMenuBatchImpact = (items: Array<Menu | MenuNode>) => {
    const menuIds = new Set(items.map((item) => String(item.id)));
    const linkedRoles = roles.filter((role) =>
      (role.menuIds || []).map(String).some((menuId) => menuIds.has(menuId)),
    );

    return {
      affectedRoleCount: linkedRoles.length,
      affectedUserCount: linkedRoles.reduce((total, role) => total + (role.userCount || 0), 0),
    };
  };

  const buildMenuBatchDeleteBlockedMessage = (
    items: Array<{ name: string; childCount: number }>,
  ) => {
    const details = items
      .slice(0, 3)
      .map((item) =>
        zh
          ? `${item.name}（仍有 ${item.childCount} 个未选下级菜单）`
          : `${item.name} (${item.childCount} unselected child menus remain)`,
      )
      .join(zh ? '；' : '; ');

    if (zh) {
      return `批量删除已拦截：${details}${items.length > 3 ? '；其余菜单也仍存在未选下级菜单' : ''}`;
    }

    return `Batch delete blocked: ${details}${items.length > 3 ? '; other menus also still have unselected child menus' : ''}`;
  };

  const buildMenuDeleteDescription = (menu: Menu) => {
    const impact = getMenuDeleteImpact(String(menu.id));
    const menuName = getMenuDisplayName(menu);
    if (zh) {
      if (impact.childCount > 0) {
        return `菜单「${menuName}」仍有 ${impact.childCount} 个下级菜单，前端已阻断删除。请先处理子菜单。`;
      }
      if (impact.affectedRoleCount > 0) {
        return `确认删除菜单「${menuName}」？预计影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员的动态菜单与权限快照，并触发刷新。`;
      }
      return `确认删除菜单「${menuName}」？当前未关联角色，删除后立即生效且不可恢复。`;
    }

    if (impact.childCount > 0) {
      return `Menu "${menuName}" still has ${impact.childCount} child menus. Deletion is blocked until child menus are handled.`;
    }
    if (impact.affectedRoleCount > 0) {
      return `Delete menu "${menuName}"? This is expected to affect ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members, and refresh their menu snapshot.`;
    }
    return `Delete menu "${menuName}"? It is not linked to any role and the action cannot be undone.`;
  };

  const buildMenuBatchDeleteDescription = (items: MenuNode[]) => {
    const impact = getMenuBatchImpact(items);
    if (zh) {
      return impact.affectedRoleCount > 0
        ? `确认批量删除 ${items.length} 个菜单？预计影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员的动态菜单与权限快照，并按层级自底向上删除。`
        : `确认批量删除 ${items.length} 个菜单？当前未关联角色，将按层级自底向上删除，且不可恢复。`;
    }

    return impact.affectedRoleCount > 0
      ? `Delete ${items.length} menus? This is expected to affect ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members, and menus will be deleted from leaf to root.`
      : `Delete ${items.length} menus? They are not linked to any role and will be deleted from leaf to root. This cannot be undone.`;
  };

  const buildMenuStatusCopy = (menu: Menu, enabled: boolean) => {
    const impact = getMenuDeleteImpact(String(menu.id));
    const menuName = getMenuDisplayName(menu);
    if (zh) {
      return {
        title: enabled ? '确认启用菜单' : '确认禁用菜单',
        description:
          impact.affectedRoleCount > 0
            ? `菜单「${menuName}」状态变更将影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员，并触发动态菜单刷新。`
            : `菜单「${menuName}」状态变更将立即生效。当前未关联角色。`,
        confirmText: enabled ? '确认启用' : '确认禁用',
        success:
          impact.affectedRoleCount > 0
            ? `已${enabled ? '启用' : '禁用'}菜单「${menuName}」，影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员`
            : `已${enabled ? '启用' : '禁用'}菜单「${menuName}」`,
      };
    }

    return {
      title: enabled ? 'Confirm enable menu' : 'Confirm disable menu',
      description:
        impact.affectedRoleCount > 0
          ? `Changing menu "${menuName}" will affect ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members, and refresh their menu snapshot.`
          : `Changing menu "${menuName}" takes effect immediately. It is not linked to any role.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success:
        impact.affectedRoleCount > 0
          ? `Menu "${menuName}" ${enabled ? 'enabled' : 'disabled'}. ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members were affected.`
          : `Menu "${menuName}" ${enabled ? 'enabled' : 'disabled'}.`,
    };
  };

  const buildMenuFormStatusHint = (menu: Menu | null, nextStatus?: Menu['status']): MenuStatusHint => {
    if (!menu) {
      return {
        fieldDescription: zh
          ? '新建菜单时可先保存为禁用状态，待角色授权和路由配置确认后再启用。'
          : 'New menus can be saved as inactive first and enabled after role binding and route checks are ready.',
      };
    }

    const targetStatus = nextStatus || menu.status;
    if (targetStatus === menu.status) {
      return {
        fieldDescription: zh
          ? '修改状态后，保存时会再次确认；若菜单已分配给角色，将触发动态菜单刷新。'
          : 'If you change the status, saving will require confirmation and may refresh dynamic menus for linked roles.',
        title: copy.titles.statusNote,
        description: zh
          ? '当前未修改状态；若后续切换启用或禁用，系统会根据角色引用情况提示影响范围。'
          : 'Status is unchanged. If you switch it later, the system will preview the impact based on linked roles.',
        tone: 'info',
      };
    }

    const enabled = targetStatus === 'active';
    const impact = getMenuDeleteImpact(String(menu.id));
    return {
      fieldDescription: zh
        ? '修改状态后，保存时会再次确认；若菜单已分配给角色，将触发动态菜单刷新。'
        : 'If you change the status, saving will require confirmation and may refresh dynamic menus for linked roles.',
      title: enabled ? copy.titles.enableImpact : copy.titles.disableImpact,
      description: impact.affectedRoleCount > 0
        ? (
          zh
            ? `当前菜单已关联 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员。保存后将触发动态菜单刷新，并按最新授权快照生效。`
            : `This menu is linked to ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members. Saving will refresh dynamic menus and apply the latest authorization snapshot.`
        )
        : (
          zh
            ? `当前菜单未关联角色，${enabled ? '启用' : '禁用'}后会立即生效，但仍需二次确认。`
            : `This menu is not linked to any role. ${enabled ? 'Enabling' : 'Disabling'} it takes effect immediately, but still requires confirmation.`
        ),
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
        toast.success(copy.success);
      },
    });
  };

  const buildMenuBatchStatusCopy = (items: MenuNode[], enabled: boolean) => {
    const impact = getMenuBatchImpact(items);
    if (zh) {
      return {
        title: `确认批量${enabled ? '启用' : '禁用'}菜单`,
        description:
          impact.affectedRoleCount > 0
            ? `将批量${enabled ? '启用' : '禁用'} ${items.length} 个菜单，影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员，并触发动态菜单刷新。`
            : `将批量${enabled ? '启用' : '禁用'} ${items.length} 个菜单，当前未关联角色。`,
        confirmText: `确认${enabled ? '启用' : '禁用'}`,
        success:
          impact.affectedRoleCount > 0
            ? `已批量${enabled ? '启用' : '禁用'} ${items.length} 个菜单，影响 ${impact.affectedRoleCount} 个角色、${impact.affectedUserCount} 名角色成员`
            : `已批量${enabled ? '启用' : '禁用'} ${items.length} 个菜单`,
      };
    }

    return {
      title: `Confirm batch ${enabled ? 'enable' : 'disable'} menus`,
      description:
        impact.affectedRoleCount > 0
          ? `This will ${enabled ? 'enable' : 'disable'} ${items.length} menus, affect ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members, and refresh their menu snapshots.`
          : `This will ${enabled ? 'enable' : 'disable'} ${items.length} menus and currently affects no roles.`,
      confirmText: enabled ? 'Enable' : 'Disable',
      success:
        impact.affectedRoleCount > 0
          ? `${items.length} menus ${enabled ? 'enabled' : 'disabled'}. ${impact.affectedRoleCount} roles and ${impact.affectedUserCount} role members were affected.`
          : `${items.length} menus ${enabled ? 'enabled' : 'disabled'}.`,
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
    pageTitle: t.menu.systemMenus,
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
    pageTitle: t.menu.systemMenus,
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

  return (
    <PageLayout
      title={t.menu.systemMenus}
      actions={canQueryMenu ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[26px] border border-slate-200/70 bg-white/72 p-3 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.22)] backdrop-blur-sm">
          {selectedMenus.length > 0 && (
            <>
              {canUpdateMenu && menusToEnable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchMenuStatus(true)}
                  className="h-11 gap-2 rounded-2xl border-emerald-200/80 bg-emerald-50/80 px-4 text-emerald-700 shadow-sm shadow-emerald-100/60 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <Power className="w-4 h-4" />
                  {copy.buttons.batchEnable(menusToEnable.length)}
                </Button>
              ) : null}
              {canUpdateMenu && menusToDisable.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => handleBatchMenuStatus(false)}
                  className="h-11 gap-2 rounded-2xl border-amber-200/80 bg-amber-50/80 px-4 text-amber-700 shadow-sm shadow-amber-100/60 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"
                >
                  <PowerOff className="w-4 h-4" />
                  {copy.buttons.batchDisable(menusToDisable.length)}
                </Button>
              ) : null}
              {canDeleteMenu ? (
                <Button
                  variant="outline"
                  onClick={handleBatchDelete}
                  className="h-11 gap-2 rounded-2xl border-rose-200/80 bg-rose-50/80 px-4 text-rose-600 shadow-sm shadow-rose-100/60 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {copy.buttons.batchDelete(selectedMenus.length)}
                </Button>
              ) : null}
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={expandAll}
            className="h-11 w-11 rounded-2xl border-slate-200/80 bg-white/90 text-slate-500 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
            title={copy.titles.expandAll}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={collapseAll}
            className="mr-1 h-11 w-11 rounded-2xl border-slate-200/80 bg-white/90 text-slate-500 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900"
            title={copy.titles.collapseAll}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {canCreateMenu ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('import', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Upload className="w-4 h-4" />
              {t.actions.import}
            </Button>
          ) : null}
          {canExportMenu ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {t.actions.export}
            </Button>
          ) : null}
          {canCreateMenu ? (
            <Button
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <Plus className="w-4 h-4" />
              {t.actions.add}
            </Button>
          ) : null}
        </div>
      ) : undefined}
    >
      {!canQueryMenu ? (
        <QueryAccessBoundary
          viewId="system-menus"
          title={t.menu.systemMenus}
          queryPermission={systemPermissions.menu.query}
        />
      ) : (
        <>
      {/* 1. 搜索过滤区 */}
      <MenuSearchForm
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* 2. 数据列表展示区（统一使用树形表格） */}
      <Card className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white/88 p-0 shadow-[0_24px_56px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm">
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
      </Card>

      {/* 3. 对话框管理 */}
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
    </PageLayout>
  );
}





