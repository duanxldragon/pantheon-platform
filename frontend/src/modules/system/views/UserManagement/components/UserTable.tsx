import React from 'react';
import { Badge } from '../../../../../components/ui/badge';
import { Switch } from '../../../../../components/ui/switch';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Shield, 
  Key,
  Mail,
  Phone,
  Building2,
  User as UserIcon
} from '../../../../../shared/components/ui/icons';
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
import { User } from '../../../types';

interface UserTableProps {
  data: User[];
  selectedItems: User[];
  onSelectionChange: (items: User[]) => void;
  onAction: (action: string, user: User) => void;
  onStatusChange: (user: User, enabled: boolean) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export const UserTable: React.FC<UserTableProps> = ({
  data,
  selectedItems,
  onSelectionChange,
  onAction,
  onStatusChange,
  pagination
}) => {
  const { t } = useLanguageStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const columns: Column<User>[] = [
    {
      key: 'username',
      label: t.user.username,
      width: '240px',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 transition-all duration-300 group-hover:scale-105">
              <span className="text-primary font-bold text-sm">
                {user.realName?.charAt(0) || user.username.charAt(0)}
              </span>
            </div>
            {user.status === 'active' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 leading-tight">
              {user.username}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {user.realName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: t.common.info,
      width: '220px',
      render: (user) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3 opacity-60" />
            {user.email}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 opacity-60" />
            {user.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      label: t.user.department,
      width: '180px',
      render: (user) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Building2 className="w-3.5 h-3.5 text-primary opacity-70" />
            {user.departmentName}
          </div>
          <span className="text-xs text-gray-400 pl-5">
            {user.positionName}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      label: t.user.role,
      width: '200px',
      render: (user) => (
        <div className="flex gap-1 flex-wrap">
          {user.roleNames.map((role, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
            >
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: t.user.status,
      width: '100px',
      align: 'center',
      render: (user) => {
        const canUpdateUser = hasPermission(systemPermissions.user.update);
        return (
          <Switch
            checked={user.status === 'active'}
            onCheckedChange={(checked) => onStatusChange(user, checked)}
            className="data-[state=checked]:bg-green-500"
            disabled={!canUpdateUser}
          />
        );
      },
    },
    {
      key: 'actions',
      label: t.common.actions,
      width: '160px',
      align: 'center',
      render: (user) => {
        const canUpdateUser = hasPermission(systemPermissions.user.update);
        const canDeleteUser = hasPermission(systemPermissions.user.delete);
        const hasMoreActions = canUpdateUser || canDeleteUser;

        return (
          <div className="flex items-center justify-center gap-1">
            <ActionButtons 
              actions={[
                {
                  icon: <Eye className="w-4 h-4 text-blue-500" />,
                  label: t.common.view,
                  onClick: () => onAction('detail', user),
                  permission: systemPermissions.user.query,
                },
                {
                  icon: <Edit className="w-4 h-4 text-amber-500" />,
                  label: t.common.edit,
                  onClick: () => onAction('edit', user),
                  permission: systemPermissions.user.update,
                },
                {
                  icon: <Trash2 className="w-4 h-4 text-red-500" />,
                  label: t.common.delete,
                  onClick: () => onAction('delete', user),
                  permission: systemPermissions.user.delete,
                  danger: true,
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
                <DropdownMenuContent align="end" className="w-40">
                  {canUpdateUser ? (
                    <DropdownMenuItem onClick={() => onAction('assign-role', user)}>
                      <Shield className="w-4 h-4 mr-2 text-primary" />
                      {t.systemManagement.users.actions.assignRoles}
                    </DropdownMenuItem>
                  ) : null}
                  {canUpdateUser ? (
                    <DropdownMenuItem onClick={() => onAction('reset-password', user)}>
                      <Key className="w-4 h-4 mr-2 text-amber-500" />
                      {t.systemManagement.users.actions.resetPassword}
                    </DropdownMenuItem>
                  ) : null}
                  {canUpdateUser && canDeleteUser ? <DropdownMenuSeparator /> : null}
                  {canDeleteUser ? (
                    <DropdownMenuItem className="text-red-600" onClick={() => onAction('delete', user)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.common.delete}
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
      rowKey={(user) => user.id}
      selectable
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      pagination={pagination}
      className="border-none shadow-none"
    />
  );
};

