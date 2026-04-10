import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { Shield, Edit, Trash2, Lock, Folder, Activity, Database, Layout, Clock } from 'lucide-react';
import { EnhancedDataTable, type Column } from '../../../../../shared/components/ui/enhanced_data_table';
import { ActionButtons } from '../../../../../shared/components/ui/action_buttons';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useAuthStore } from '../../../../auth/store/auth_store';
import { systemPermissions } from '../../../constants/permissions';
import type { Permission } from '../../../types';
import { getPermissionModuleLabel } from '../module_localization';
import { getPermissionManagementCopy } from '../permission_management_copy';

interface PermissionTableProps {
  data: Permission[];
  selectedItems: Permission[];
  onSelectionChange: (items: Permission[]) => void;
  onAction: (action: string, permission: Permission) => void;
  onStatusChange: (permission: Permission, enabled: boolean) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  data,
  selectedItems,
  onSelectionChange,
  onAction,
  onStatusChange,
  pagination,
}) => {
  const { language } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const copy = getPermissionManagementCopy(language).table;
  const actionSurfaceClass =
    'inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-500';

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'menu':
        return {
          label: copy.typeMenu,
          color: 'bg-blue-50 text-blue-600 border-blue-100',
          icon: Layout,
        };
      case 'operation':
        return {
          label: copy.typeOperation,
          color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          icon: Activity,
        };
      case 'data':
        return {
          label: copy.typeData,
          color: 'bg-purple-50 text-purple-600 border-purple-100',
          icon: Database,
        };
      default:
        return { label: type, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Shield };
    }
  };

  const columns: Column<Permission>[] = [
    {
      key: 'code',
      label: copy.code,
      width: '240px',
      render: (permission) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 shadow-[0_16px_30px_-22px_rgba(15,23,42,0.85)] transition-transform duration-200 group-hover:scale-105">
            <Lock className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <code
            className="inline-flex min-h-9 items-center rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-1 font-mono text-[11px] font-semibold text-slate-700 transition-colors select-all cursor-pointer hover:border-slate-300 hover:bg-white"
            title={copy.clickToCopy}
          >
            {permission.code}
          </code>
        </div>
      ),
    },
    {
      key: 'name',
      label: copy.name,
      width: '180px',
      render: (permission) => <span className="font-bold text-slate-900">{permission.name}</span>,
    },
    {
      key: 'type',
      label: copy.type,
      width: '100px',
      render: (permission) => {
        const info = getTypeInfo(permission.type);
        return (
          <Badge
            variant="outline"
            className={`gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${info.color}`}
          >
            <info.icon className="w-2.5 h-2.5" />
            {info.label}
          </Badge>
        );
      },
    },
    {
      key: 'module',
      label: copy.module,
      width: '140px',
      render: (permission) => (
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5 text-sm font-medium text-slate-600">
            <Folder className="h-3.5 w-3.5 text-amber-500" />
            <span className="truncate">{getPermissionModuleLabel(permission.module, language)}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {language === 'zh' ? '按模块聚合展示' : 'Grouped by module'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: copy.status,
      width: '112px',
      align: 'center',
      render: (permission) => (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={permission.status === 'active' ? 'success' : 'warning'}>
              {permission.status === 'active'
                ? language === 'zh' ? '启用' : 'Active'
                : language === 'zh' ? '停用' : 'Inactive'}
            </Badge>
            <Switch
              checked={permission.status === 'active'}
              onCheckedChange={(checked) => onStatusChange(permission, checked)}
              className="scale-90 data-[state=checked]:bg-green-500"
              disabled={!hasPermission(systemPermissions.permission.update)}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            {permission.status === 'active'
              ? language === 'zh' ? '当前可被角色授权' : 'Available for roles'
              : language === 'zh' ? '当前不参与授权' : 'Excluded from authorization'}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      label: copy.description,
      width: '220px',
      render: (permission) => (
        <div className="space-y-1">
          <span className="line-clamp-2 text-xs leading-6 text-slate-500">{permission.description || '-'}</span>
          {permission.menuId ? (
            <div className="text-[10px] text-slate-400">
              {language === 'zh' ? `关联菜单 ${permission.menuId}` : `Menu ${permission.menuId}`}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: copy.createdAt,
      width: '160px',
      render: (permission) => (
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-1.5 font-mono text-[11px] text-slate-500">
          <Clock className="h-3 w-3 opacity-60" />
          {permission.createdAt}
        </div>
      ),
    },
    {
      key: 'actions',
      label: copy.actions,
      width: '168px',
      align: 'right',
      render: (permission) => (
        <div className={actionSurfaceClass}>
          <ActionButtons
            actions={[
              {
                icon: <Edit className="w-4 h-4" />,
                label: copy.edit,
                onClick: () => onAction('edit', permission),
                permission: systemPermissions.permission.update,
                variant: 'mono',
              },
              {
                icon: <Trash2 className="w-4 h-4" />,
                label: copy.delete,
                onClick: () => onAction('delete', permission),
                permission: systemPermissions.permission.delete,
                danger: true,
              },
            ]}
            surface="ghost"
          />
        </div>
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      rowKey={(p) => p.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
};









