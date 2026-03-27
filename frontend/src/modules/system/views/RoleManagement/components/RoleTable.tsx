import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { 
  Shield, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Lock,
  LockOpen,
  FileText
} from 'lucide-react';
import { 
  EnhancedDataTable, 
  Column 
} from '../../../../../shared/components/ui/EnhancedDataTable';
import { ActionButtons } from '../../../../../shared/components/ui/ActionButtons';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../../../components/ui/dropdown-menu';
import { Button } from '../../../../../components/ui/button';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useAuthStore } from '../../../../auth/store/authStore';
import { systemPermissions } from '../../../constants/permissions';
import { Role } from '../../../types';

interface RoleTableProps {
  data: Role[];
  selectedItems: Role[];
  onSelectionChange: (items: Role[]) => void;
  onAction: (action: string, role: Role) => void;
  onStatusChange: (role: Role, enabled: boolean) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const RoleTable: React.FC<RoleTableProps> = ({
  data,
  selectedItems,
  onSelectionChange,
  onAction,
  onStatusChange,
  pagination
}) => {
  const { t } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const columns: Column<Role>[] = [
    {
      key: 'name',
      label: t.user.role,
      width: '240px',
      render: (role) => (
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br transition-all shadow-sm ${
            role.type === 'system' 
              ? 'from-amber-400 to-amber-600 shadow-amber-100' 
              : 'from-blue-500 to-blue-600 shadow-blue-100'
          }`}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 leading-tight">
                {role.name}
              </span>
              {role.type === 'system' && (
                <Lock className="w-3 h-3 text-amber-500" />
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-mono mt-0.5">
              {role.code}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: t.common.info,
      width: '120px',
        render: (role) => (
          role.type === 'system' ? (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 font-medium">
              Built-in
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 font-medium">
              Custom
            </Badge>
          )
        ),
      },
      {
        key: 'stats',
        label: "Perms/Users",
        width: '180px',
        render: (role) => {
          const canQueryRole = hasPermission(systemPermissions.role.query);
          return (
          <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-blue-600">{role.menuIds?.length || 0}</span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div
            className={`flex items-center gap-1 text-xs transition-colors ${
              canQueryRole
                ? 'text-gray-500 cursor-pointer hover:text-primary'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            onClick={() => {
              if (!canQueryRole) {
                return;
              }
              onAction('members', role);
            }}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-gray-700">{role.userCount || 0}</span>
          </div>
        </div>
        );
      },
    },
    {
      key: 'status',
      label: t.user.status,
      width: '90px',
      align: 'center',
      render: (role) => {
        const canUpdateRole = hasPermission(systemPermissions.role.update);
        return (
          <Switch
            checked={role.status === 'active'}
            onCheckedChange={(checked) => onStatusChange(role, checked)}
            className="data-[state=checked]:bg-green-500 scale-90"
            disabled={!canUpdateRole || (role.type === 'system' && role.code === 'super_admin')}
          />
        );
      },
    },
    {
      key: 'description',
      label: t.modules.deploy.description,
      width: '220px',
      render: (role) => (
        <span className="text-xs text-gray-500 line-clamp-1 italic max-w-[200px]">
          {role.description || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '180px',
      align: 'right',
      render: (role) => {
        const canQueryRole = hasPermission(systemPermissions.role.query);
        const canUpdateRole = hasPermission(systemPermissions.role.update);
        const canDeleteRole = hasPermission(systemPermissions.role.delete);
        const hasMoreActions = canQueryRole || canDeleteRole;

        return (
          <div className="flex items-center justify-end gap-1">
            <ActionButtons 
              actions={[
                {
                  icon: <Settings className="w-4 h-4 text-primary" />,
                  label: "Configure Permissions",
                  onClick: () => onAction('permission', role),
                  permission: systemPermissions.role.assignPermission,
                },
                {
                  icon: <Edit className="w-4 h-4 text-amber-500" />,
                  label: t.common.edit,
                  onClick: () => onAction('edit', role),
                  permission: systemPermissions.role.update,
                },
              ]} 
            />
            {hasMoreActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {canQueryRole ? (
                    <DropdownMenuItem onClick={() => onAction('detail', role)}>
                      <Eye className="w-4 h-4 mr-2 text-blue-500" />
                      View Details
                    </DropdownMenuItem>
                  ) : null}
                  {canQueryRole ? (
                    <DropdownMenuItem onClick={() => onAction('members', role)}>
                      <Users className="w-4 h-4 mr-2 text-emerald-500" />
                      Members
                    </DropdownMenuItem>
                  ) : null}
                  {(canQueryRole && canDeleteRole) ? <DropdownMenuSeparator /> : null}
                  {canDeleteRole ? (
                    <DropdownMenuItem 
                      className="text-red-600" 
                      onClick={() => onAction('delete', role)}
                      disabled={role.type === 'system'}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.common.delete}
                      {role.type === 'system' && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      rowKey={(role) => role.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
};

