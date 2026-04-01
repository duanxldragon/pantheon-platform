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
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialogSizes';
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
  const copy = zh
    ? {
        description: '查看用户基础资料、权限详情和最近登录活动。',
        tabInfo: '基本信息',
        tabPermissions: '权限明细',
        tabActivity: '登录活动',
        username: '用户名',
        realName: '姓名',
        email: '邮箱',
        phone: '手机号',
        department: '所属部门',
        roles: '角色',
        noRoles: '未分配角色',
        status: '账号状态',
        statusActive: '启用',
        statusInactive: '停用',
        statusLocked: '锁定',
        createdAt: '创建时间',
        lastLogin: '最近登录',
        noRecord: '暂无记录',
        remark: '备注说明',
        recentLoginTime: '最近登录时间：',
        recentLoginIp: '最近登录 IP：',
      }
    : {
        description: 'View user profile, permission details, and recent login activity.',
        tabInfo: 'Profile',
        tabPermissions: 'Permissions',
        tabActivity: 'Activity',
        username: 'Username',
        realName: 'Name',
        email: 'Email',
        phone: 'Phone',
        department: 'Department',
        roles: 'Roles',
        noRoles: 'No roles assigned',
        status: 'Account Status',
        statusActive: 'Active',
        statusInactive: 'Inactive',
        statusLocked: 'Locked',
        createdAt: 'Created At',
        lastLogin: 'Last Login',
        noRecord: 'No record',
        remark: 'Remarks',
        recentLoginTime: 'Last login time: ',
        recentLoginIp: 'Last login IP: ',
      };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName('4xl', 'flex min-h-0 flex-col p-0')} style={getDialogStyle('4xl')}>
        <DialogHeader className="border-b border-slate-100/90 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-semibold text-white shadow-lg shadow-blue-200/60">
              {user.realName.charAt(0)}
            </div>
            <div>
              <div className="text-xl font-semibold text-slate-900">{user.realName}</div>
              <div className="text-sm text-slate-500">@{user.username}</div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
          <Tabs defaultValue="info" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-slate-200/70 bg-slate-100/85 p-1">
              <TabsTrigger value="info" className="rounded-xl">
                {copy.tabInfo}
              </TabsTrigger>
              <TabsTrigger value="permissions" className="rounded-xl">
                {copy.tabPermissions}
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl">
                {copy.tabActivity}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 flex-1 overflow-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <InfoField label={copy.username} icon={<UserIcon className="h-4 w-4 text-slate-400" />}>
                      {user.username}
                    </InfoField>
                    <InfoField label={copy.realName} icon={<UserIcon className="h-4 w-4 text-slate-400" />}>
                      {user.realName}
                    </InfoField>
                    <InfoField label={copy.email} icon={<Mail className="h-4 w-4 text-slate-400" />}>
                      {user.email || '-'}
                    </InfoField>
                    <InfoField label={copy.phone} icon={<Phone className="h-4 w-4 text-slate-400" />}>
                      {user.phone || '-'}
                    </InfoField>
                  </div>

                  <div className="space-y-4">
                    <InfoField label={copy.department} icon={<Building2 className="h-4 w-4 text-slate-400" />}>
                      {user.departmentName || '-'}
                    </InfoField>

                    <div>
                      <label className="mb-2 block text-sm text-slate-600">{copy.roles}</label>
                      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4">
                        <div className="flex flex-wrap gap-2">
                          {(user.roleNames || []).length > 0 ? (
                            user.roleNames.map((roleName) => (
                              <Badge key={roleName} variant="outline" className="rounded-full bg-white/90">
                                <Shield className="mr-1 h-3 w-3" />
                                {roleName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">{copy.noRoles}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm text-slate-600">{copy.status}</label>
                      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4">
                        {user.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700">{copy.statusActive}</Badge>
                        ) : user.status === 'inactive' ? (
                          <Badge className="bg-slate-100 text-slate-700">{copy.statusInactive}</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">{copy.statusLocked}</Badge>
                        )}
                      </div>
                    </div>

                    <InfoField label={copy.createdAt} icon={<Calendar className="h-4 w-4 text-slate-400" />}>
                      {user.createdAt || '-'}
                    </InfoField>

                    <InfoField label={copy.lastLogin} icon={<Activity className="h-4 w-4 text-slate-400" />}>
                      {user.lastLoginAt || copy.noRecord}
                    </InfoField>
                  </div>
                </div>

                {user.description ? (
                  <>
                    <Separator />
                    <div>
                      <label className="mb-2 block text-sm text-slate-600">{copy.remark}</label>
                      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4 text-slate-700">
                        {user.description}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-6 flex-1 overflow-auto">
              <UserPermissionPanel user={user} />
            </TabsContent>

            <TabsContent value="activity" className="mt-6 flex-1 overflow-auto">
              <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 py-12 text-center text-slate-500">
                <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
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
      <label className="mb-2 block text-sm text-slate-600">{label}</label>
      <div className="flex items-center gap-2 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4">
        {icon}
        <span className="text-slate-900">{children}</span>
      </div>
    </div>
  );
}
