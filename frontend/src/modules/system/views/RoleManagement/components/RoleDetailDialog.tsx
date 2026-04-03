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
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialogSizes';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Role } from '../../../types';
import { getRoleManagementCopy } from '../roleManagementCopy';

interface RoleDetailDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetailDialog({ role, open, onOpenChange }: RoleDetailDialogProps) {
  const { language } = useLanguageStore();
  const copy = getRoleManagementCopy(language).detail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName('xl', 'p-0')} style={getDialogStyle('xl')}>
        <DialogHeader className="border-b border-slate-100/90 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_16px_30px_-20px_rgba(37,99,235,0.45)]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {role.name}
          </DialogTitle>
          <DialogDescription>{role.code}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <DetailItem icon={<Settings className="h-4 w-4" />} label={copy.description}>
              {role.description || '-'}
            </DetailItem>

            <DetailItem icon={<Shield className="h-4 w-4" />} label={copy.status}>
              {role.status === 'active' ? (
                <Badge className="bg-green-100 text-green-700">{copy.statusEnabled}</Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700">{copy.statusDisabled}</Badge>
              )}
            </DetailItem>

            <DetailItem icon={<Users className="h-4 w-4" />} label={copy.linkedUsers}>
              {role.userCount}
            </DetailItem>

            <DetailItem icon={<Shield className="h-4 w-4" />} label={copy.menuCount}>
              {role.menuIds?.length || 0}
            </DetailItem>
          </div>

          <DetailItem icon={<Settings className="h-4 w-4" />} label={copy.roleType}>
            {role.type === 'system' ? (
              <Badge
                variant="outline"
                className="rounded-full border-orange-200 bg-orange-50 text-orange-700"
              >
                {copy.systemRole}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full border-blue-200 bg-blue-50 text-blue-700"
              >
                {copy.customRole}
              </Badge>
            )}
          </DetailItem>

          <DetailItem icon={<Calendar className="h-4 w-4" />} label={copy.createdAt}>
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
    <div className="space-y-2 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-slate-900">{children}</div>
    </div>
  );
}
