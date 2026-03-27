import { useMemo, useState } from 'react';

import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { ActionButtons, type ActionButtonConfig } from '../../../../../shared/components/ui/ActionButtons';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { systemPermissions } from '../../../constants/permissions';
import type { Permission } from '../../../types';

interface PermissionGroupViewProps {
  permissions: Permission[];
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
}

const moduleAliases: Array<{ key: string; aliases: string[] }> = [
  { key: 'dashboard', aliases: ['仪表盘', 'Dashboard'] },
  { key: 'host', aliases: ['主机管理', 'Host Management'] },
  { key: 'k8s', aliases: ['K8s 管理', 'K8s Management'] },
  { key: 'deploy', aliases: ['组件部署', 'Component Deploy'] },
  { key: 'operations', aliases: ['运维操作', 'Operations'] },
  { key: 'alert', aliases: ['告警中心', 'Alerts'] },
  { key: 'system', aliases: ['系统管理', 'System Management'] },
  { key: 'data', aliases: ['数据权限', 'Data Scope'] },
];

function getModuleWeight(moduleName: string) {
  const normalized = moduleName.trim().toLowerCase();
  const index = moduleAliases.findIndex(({ aliases }) =>
    aliases.some((alias) => alias.trim().toLowerCase() === normalized),
  );
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function PermissionGroupView({
  permissions,
  onEdit,
  onDelete,
}: PermissionGroupViewProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = {
    empty: zh ? '暂无权限数据' : 'No permissions available',
    countSuffix: zh ? '项权限' : 'permissions',
    noDescription: zh ? '暂无说明' : 'No description',
    relatedMenu: zh ? '关联菜单 ID：' : 'Related Menu ID: ',
    edit: zh ? '编辑' : 'Edit',
    delete: zh ? '删除' : 'Delete',
    typeMeta: {
      menu: zh ? '菜单权限' : 'Menu Permission',
      operation: zh ? '操作权限' : 'Operation Permission',
      data: zh ? '数据权限' : 'Data Permission',
      field: zh ? '字段权限' : 'Field Permission',
    },
  };

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((permission) => {
      const moduleName = permission.module || (zh ? '未分类' : 'Uncategorized');
      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push(permission);
    });
    return groups;
  }, [permissions, zh]);

  const sortedModules = useMemo(
    () =>
      Object.keys(groupedPermissions).sort((left, right) => {
        const leftWeight = getModuleWeight(left);
        const rightWeight = getModuleWeight(right);
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
    return <div className="py-10 text-center text-sm text-gray-500">{copy.empty}</div>;
  }

  return (
    <div className="space-y-4">
      {sortedModules.map((moduleName) => {
        const modulePermissions = groupedPermissions[moduleName];
        const expanded = expandedModules.has(moduleName);

        return (
          <Card key={moduleName} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleModule(moduleName)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {expanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">{moduleName}</h3>
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
                    className: 'border-gray-200 bg-gray-100 text-gray-800',
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
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium text-gray-900">{permission.name}</span>
                            <Badge variant="outline" className={`text-xs ${meta.className}`}>
                              {meta.label}
                            </Badge>
                          </div>
                          <code className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-600">
                            {permission.code}
                          </code>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">{permission.description || copy.noDescription}</p>
                          {permission.menuId ? (
                            <span className="mt-1 inline-block text-xs text-gray-500">
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
