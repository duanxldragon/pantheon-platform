import { useState, useMemo } from 'react';
import { useMenus } from '../../hooks/useMenus';
import { useCallback } from 'react';
import { useRoles } from '../../hooks/useRoles';
import { Menu } from '../../types';
import { useLanguageStore } from '../../../../stores/languageStore';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Plus, Upload, Download, ChevronDown, ChevronRight, Trash2, Power, PowerOff } from 'lucide-react';
import { PageLayout } from '../../../../components/layouts/PageLayout';
import { ConfirmDialog } from '../../../../shared/components/ui/ConfirmDialog';
import { ManagementActionBar, ManagementContentCard } from '../../../../shared/components/ui';
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
import { getMenuManagementCopy } from './menuManagementCopy';

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
    onExport: async (_options: unknown) => {
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
    return copy.messages.deleteBlocked(menuName, childCount);
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

  return (
    <PageLayout
      title={copy.page.title}
      actions={canQueryMenu ? (
        <ManagementActionBar>
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
              {copy.actionLabels.import}
            </Button>
          ) : null}
          {canExportMenu ? (
            <Button
              variant="outline"
              onClick={() => setDialogOpen('export', true)}
              className="h-11 gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-slate-700 shadow-sm shadow-slate-200/60 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <Download className="w-4 h-4" />
              {copy.actionLabels.export}
            </Button>
          ) : null}
          {canCreateMenu ? (
            <Button
              onClick={openAddDialog}
              className="h-11 gap-2 rounded-2xl bg-primary px-4 shadow-[0_16px_30px_-18px_rgba(var(--primary),0.7)] transition-all active:scale-95 hover:-translate-y-0.5 hover:bg-primary/92 hover:shadow-[0_18px_34px_-18px_rgba(var(--primary),0.75)]"
            >
              <Plus className="w-4 h-4" />
              {copy.actionLabels.add}
            </Button>
          ) : null}
        </ManagementActionBar>
      ) : undefined}
    >
      {!canQueryMenu ? (
        <QueryAccessBoundary
          viewId="system-menus"
          title={copy.page.title}
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





