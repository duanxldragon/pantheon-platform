import { useMemo, useState } from 'react';

import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { ActionButtons, type ActionButtonConfig } from '../../../../../shared/components/ui/ActionButtons';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { systemPermissions } from '../../../constants/permissions';
import type { Permission } from '../../../types';
import {
  getPermissionModuleLabel,
  getPermissionModuleWeight,
  normalizePermissionModule,
} from '../moduleLocalization';
import { getPermissionManagementCopy } from '../permissionManagementCopy';

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
    menu: { label: copy.typeMeta.menu, className: 'border-blue-200 bg-blue-100 text-blue-800' },
    operation: { label: copy.typeMeta.operation, className: 'border-green-200 bg-green-100 text-green-800' },
    data: { label: copy.typeMeta.data, className: 'border-purple-200 bg-purple-100 text-purple-800' },
    field: { label: copy.typeMeta.field, className: 'border-orange-200 bg-orange-100 text-orange-800' },
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

        return (
          <Card key={moduleName} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleModule(moduleName)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                {expanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                )}
                <h3 className="text-lg font-semibold text-slate-900">{moduleLabel}</h3>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {modulePermissions.length} {copy.countSuffix}
                </Badge>
              </div>
            </button>

            {expanded && (
              <div className="divide-y border-t">
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
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium text-slate-900">{permission.name}</span>
                            <Badge variant="outline" className={`text-xs ${meta.className}`}>
                              {meta.label}
                            </Badge>
                          </div>
                          <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-sm text-slate-600">
                            {permission.code}
                          </code>
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
                        <ActionButtons actions={actions} />
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
