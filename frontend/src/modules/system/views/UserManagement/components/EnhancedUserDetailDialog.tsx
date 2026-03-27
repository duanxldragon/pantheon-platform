import type { ReactNode } from 'react';

import {
  Activity,
  Building2,
  Calendar,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
} from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { Separator } from '../../../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { User } from '../../../types';
import { UserPermissionPanel } from './UserPermissionPanel';

interface EnhancedUserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function EnhancedUserDetailDialog({
  open,
  onOpenChange,
  user,
}: EnhancedUserDetailDialogProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = {
    description: zh
      ? '查看用户基础资料、权限详情和最近登录活动。'
      : 'View user profile, permission details, and recent login activity.',
    tabInfo: zh ? '基本信息' : 'Profile',
    tabPermissions: zh ? '权限明细' : 'Permissions',
    tabActivity: zh ? '登录活动' : 'Activity',
    username: zh ? '用户名' : 'Username',
    realName: zh ? '姓名' : 'Name',
    email: zh ? '邮箱' : 'Email',
    phone: zh ? '手机号' : 'Phone',
    department: zh ? '所属部门' : 'Department',
    roles: zh ? '角色' : 'Roles',
    noRoles: zh ? '未分配角色' : 'No roles assigned',
    status: zh ? '账号状态' : 'Account Status',
    statusActive: zh ? '启用' : 'Active',
    statusInactive: zh ? '禁用' : 'Inactive',
    statusLocked: zh ? '锁定' : 'Locked',
    createdAt: zh ? '创建时间' : 'Created At',
    lastLogin: zh ? '最近登录' : 'Last Login',
    noRecord: zh ? '暂无记录' : 'No record',
    remark: zh ? '备注说明' : 'Remarks',
    recentLoginTime: zh ? '最近登录时间：' : 'Last login time: ',
    recentLoginIp: zh ? '最近登录 IP：' : 'Last login IP: ',
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl text-white">
              {user.realName.charAt(0)}
            </div>
            <div>
              <div className="text-xl text-gray-900">{user.realName}</div>
              <div className="text-sm text-gray-500">@{user.username}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="info" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">{copy.tabInfo}</TabsTrigger>
              <TabsTrigger value="permissions">{copy.tabPermissions}</TabsTrigger>
              <TabsTrigger value="activity">{copy.tabActivity}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 flex-1 overflow-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <InfoField label={copy.username} icon={<UserIcon className="h-4 w-4 text-gray-400" />}>
                      {user.username}
                    </InfoField>
                    <InfoField label={copy.realName} icon={<UserIcon className="h-4 w-4 text-gray-400" />}>
                      {user.realName}
                    </InfoField>
                    <InfoField label={copy.email} icon={<Mail className="h-4 w-4 text-gray-400" />}>
                      {user.email || '-'}
                    </InfoField>
                    <InfoField label={copy.phone} icon={<Phone className="h-4 w-4 text-gray-400" />}>
                      {user.phone || '-'}
                    </InfoField>
                  </div>

                  <div className="space-y-4">
                    <InfoField label={copy.department} icon={<Building2 className="h-4 w-4 text-gray-400" />}>
                      {user.departmentName || '-'}
                    </InfoField>

                    <div>
                      <label className="mb-2 block text-sm text-gray-600">{copy.roles}</label>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="flex flex-wrap gap-2">
                          {(user.roleNames || []).length > 0 ? (
                            user.roleNames.map((roleName) => (
                              <Badge key={roleName} variant="outline" className="bg-white">
                                <Shield className="mr-1 h-3 w-3" />
                                {roleName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">{copy.noRoles}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-gray-600">{copy.status}</label>
                      <div className="rounded-lg bg-gray-50 p-3">
                        {user.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700">{copy.statusActive}</Badge>
                        ) : user.status === 'inactive' ? (
                          <Badge className="bg-gray-100 text-gray-700">{copy.statusInactive}</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">{copy.statusLocked}</Badge>
                        )}
                      </div>
                    </div>

                    <InfoField label={copy.createdAt} icon={<Calendar className="h-4 w-4 text-gray-400" />}>
                      {user.createdAt || '-'}
                    </InfoField>

                    <InfoField label={copy.lastLogin} icon={<Activity className="h-4 w-4 text-gray-400" />}>
                      {user.lastLoginAt || copy.noRecord}
                    </InfoField>
                  </div>
                </div>

                {user.description && (
                  <>
                    <Separator />
                    <div>
                      <label className="mb-2 block text-sm text-gray-600">{copy.remark}</label>
                      <div className="rounded-lg bg-gray-50 p-4 text-gray-700">{user.description}</div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-6 flex-1 overflow-auto">
              <UserPermissionPanel user={user} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6 flex-1 overflow-auto">
              <div className="py-12 text-center text-gray-500">
                <Activity className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p>
                  {copy.recentLoginTime}
                  {user.lastLoginAt || copy.noRecord}
                </p>
                <p className="mt-2">
                  {copy.recentLoginIp}
                  {user.lastLoginIp || copy.noRecord}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
        {icon}
        <span className="text-gray-900">{children}</span>
      </div>
    </div>
  );
}
