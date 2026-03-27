import type { ReactNode } from 'react';

import { Calendar, Settings, Shield, Users } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Role } from '../../../types';

interface RoleDetailDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetailDialog({ role, open, onOpenChange }: RoleDetailDialogProps) {
  const { t } = useLanguageStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {role.name}
          </DialogTitle>
          <DialogDescription>{role.code}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <DetailItem icon={<Settings className="h-4 w-4" />} label="角色说明">
              {role.description || '-'}
            </DetailItem>

            <DetailItem icon={<Shield className="h-4 w-4" />} label={t.user.status}>
              {role.status === 'active' ? (
                <Badge className="bg-green-100 text-green-700">{t.status.enabled}</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700">{t.status.disabled}</Badge>
              )}
            </DetailItem>

            <DetailItem icon={<Users className="h-4 w-4" />} label="关联用户数">
              {role.userCount}
            </DetailItem>

            <DetailItem icon={<Shield className="h-4 w-4" />} label="菜单权限数">
              {role.menuIds?.length || 0}
            </DetailItem>
          </div>

          <DetailItem icon={<Settings className="h-4 w-4" />} label="角色类型">
            {role.type === 'system' ? (
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                系统角色
              </Badge>
            ) : (
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                自定义角色
              </Badge>
            )}
          </DetailItem>

          <DetailItem icon={<Calendar className="h-4 w-4" />} label={t.common.createdAt}>
            {role.createdAt || '-'}
          </DetailItem>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}
