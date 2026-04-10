import { useMemo, useState } from 'react';

import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { ActionButtons, type ActionButtonConfig } from '../../../../../shared/components/ui/action_buttons';
import { useLanguageStore } from '../../../../../stores/language_store';
import { systemPermissions } from '../../../constants/permissions';
import type { Permission } from '../../../types';
import {
  getPermissionModuleLabel,
  getPermissionModuleWeight,
  normalizePermissionModule,
} from '../module_localization';
import { getPermissionManagementCopy } from '../permission_management_copy';

interface PermissionGroupViewProps {
  permissions: Permission[];
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
}

export function PermissionGroupView({
  permissions,
  onEdit,
  onDelete,
}: PermissionGroupViewProps) {
  const { language } = useLanguageStore();
  const copy = getPermissionManagementCopy(language).group;

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      const moduleName = normalizePermissionModule(permission.module) || copy.uncategorized;
      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push(permission);
    });
    return groups;
  }, [copy.uncategorized, permissions]);

  const sortedModules = useMemo(
    () =>
      Object.keys(groupedPermissions).sort((left, right) => {
        const leftWeight = getPermissionModuleWeight(left);
        const rightWeight = getPermissionModuleWeight(right);
        if (leftWeight === rightWeight) {
          return left.localeCompare(right);
        }
        return leftWeight - rightWeight;
      }),
    [groupedPermissions],
  );

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleName)) {
        next.delete(moduleName);
      } else {
        next.add(moduleName);
      }
      return next;
    });
  };

  const typeMeta: Record<string, { label: string; className: string }> = {
    menu: { label: copy.typeMeta.menu, className: 'border-blue-100 bg-blue-50 text-blue-700' },
    operation: { label: copy.typeMeta.operation, className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
    data: { label: copy.typeMeta.data, className: 'border-violet-100 bg-violet-50 text-violet-700' },
    field: { label: copy.typeMeta.field, className: 'border-amber-100 bg-amber-50 text-amber-700' },
  };

  if (sortedModules.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-500">{copy.empty}</div>;
  }

  return (
    <div className="space-y-4">
      {sortedModules.map((moduleName) => {
        const modulePermissions = groupedPermissions[moduleName];
        const expanded = expandedModules.has(moduleName);
        const moduleLabel =
          moduleName === copy.uncategorized
            ? copy.uncategorized
            : getPermissionModuleLabel(moduleName, language);
        const activeCount = modulePermissions.filter((permission) => permission.status === 'active').length;
        const operationCount = modulePermissions.filter((permission) => permission.type === 'operation').length;
        const menuCount = modulePermissions.filter((permission) => permission.type === 'menu').length;

        return (
          <Card
            key={moduleName}
            className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/88 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.24)] backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => toggleModule(moduleName)}
              className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50/80"
            >
              <div className="flex items-center gap-3">
                {expanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                )}
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">{moduleLabel}</h3>
                  <p className="text-xs text-slate-400">
                    {language === 'zh'
                      ? `按模块查看 ${modulePermissions.length} 个权限点`
                      : `${modulePermissions.length} permission nodes in this module`}
                  </p>
                </div>
                <Badge variant="info">
                  {modulePermissions.length} {copy.countSuffix}
                </Badge>
              </div>
            </button>

            {expanded && (
              <div className="divide-y border-t border-slate-100/90">
                <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                      {language === 'zh' ? '启用权限' : 'Active Permissions'}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{activeCount}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                      {language === 'zh' ? '操作权限' : 'Operation Permissions'}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{operationCount}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3">
                    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                      {language === 'zh' ? '菜单权限' : 'Menu Permissions'}
                    </div>
                    <div className="mt-2 text-base font-semibold text-slate-900">{menuCount}</div>
                  </div>
                </div>
                {modulePermissions.map((permission) => {
                  const meta = typeMeta[permission.type] || {
                    label: permission.type,
                    className: 'border-slate-200 bg-slate-100 text-slate-800',
                  };
                  const actions: ActionButtonConfig[] = [
                    {
                      label: copy.edit,
                      icon: <Edit className="h-4 w-4" />,
                      onClick: () => onEdit(permission),
                      permission: systemPermissions.permission.update,
                    },
                    {
                      label: copy.delete,
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: () => onDelete(permission),
                      permission: systemPermissions.permission.delete,
                      danger: true,
                    },
                  ];

                  return (
                    <div
                      key={String(permission.id)}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium text-slate-900">{permission.name}</span>
                            <Badge variant="outline" className={`text-xs ${meta.className}`}>
                              {meta.label}
                            </Badge>
                            <Badge variant={permission.status === 'active' ? 'success' : 'warning'}>
                              {permission.status}
                            </Badge>
                          </div>
                          <code className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-2.5 py-1 text-xs text-slate-600">
                            {permission.code}
                          </code>
                          <div className="mt-2 text-[11px] text-slate-500">
                            {permission.status === 'active'
                              ? language === 'zh' ? '当前已进入可授权状态' : 'Currently available for authorization'
                              : language === 'zh' ? '当前处于停用态，需谨慎检查角色引用' : 'Currently inactive; review role references carefully'}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-sm text-slate-600">{permission.description || copy.noDescription}</p>
                          {permission.menuId ? (
                            <span className="mt-1 inline-block text-xs text-slate-500">
                              {copy.relatedMenu}
                              {permission.menuId}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="ml-4">
                        <ActionButtons actions={actions} surface="ghost" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}








