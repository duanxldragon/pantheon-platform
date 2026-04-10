import { useEffect, useMemo, useState } from 'react';

import { AlertCircle, Search, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Checkbox } from '../../../../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { cn } from '../../../../../components/ui/utils';
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialog_sizes';
import { DetailKeyValueItem, DetailKeyValueSection } from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import { api } from '../../../api';
import { useRoles } from '../../../hooks/use_roles';
import type { ID } from '../../../types';
import { getUserManagementCopy } from '../user_management_copy';

interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: ID;
  userName: string;
  currentRoleIds: ID[];
  onConfirm?: (roleIds: ID[]) => void | Promise<void>;
}

export function RoleAssignmentDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentRoleIds,
  onConfirm,
}: RoleAssignmentDialogProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<ID[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { language } = useLanguageStore();
  const { roles } = useRoles();
  const copy = getUserManagementCopy(language).roleAssign;
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedRoleIds(currentRoleIds);
    setSearchQuery('');
  }, [currentRoleIds, open]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) {
      return roles;
    }

    const keyword = searchQuery.trim().toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(keyword) || role.code.toLowerCase().includes(keyword),
    );
  }, [roles, searchQuery]);
  const selectedRoleNames = useMemo(
    () =>
      roles
        .filter((role) => selectedRoleIds.includes(role.id))
        .map((role) => role.name),
    [roles, selectedRoleIds],
  );

  const toggleRole = (roleId: ID) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSubmit = async () => {
    try {
      await api.updateUser(String(userId), { roleIds: selectedRoleIds });
      await onConfirm?.(selectedRoleIds);
      toast.success(copy.updated);
      onOpenChange(false);
    } catch {
      toast.error(copy.updateFailed);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName('2xl', 'p-0')} style={getDialogStyle('2xl')}>
        <DialogHeader className="border-b border-slate-100/90 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>
            {copy.description} <span className="font-medium">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar max-h-[calc(92vh-164px)] space-y-4 overflow-y-auto px-6 py-5">
          <DetailKeyValueSection
            eyebrow="REVIEW"
            title={language === 'zh' ? '角色分配摘要' : 'Role Assignment Summary'}
            description={language === 'zh' ? '先确认当前分配数量、授权方式和检索范围。' : 'Confirm current assignment count, assignment mode, and search scope first.'}
          >
            <DetailKeyValueItem label={language === 'zh' ? '当前用户' : 'Current User'} value={userName} />
            <DetailKeyValueItem label={language === 'zh' ? '已选角色' : 'Selected Roles'} value={selectedRoleIds.length} hint={selectedRoleNames.join(' / ') || '-'} />
            <DetailKeyValueItem label={language === 'zh' ? '授权方式' : 'Assignment Mode'} value={language === 'zh' ? '长期有效' : 'Persistent Assignment'} hint={language === 'zh' ? '角色到期时间尚未接入后端能力，当前保存后为长期生效。' : 'Role expiry is not wired to the backend yet, so assignments stay persistent for now.'} />
            <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认角色范围与业务职责一致后再提交。' : 'Confirm the role set matches business responsibilities before submitting.'} className="md:col-span-2" />
          </DetailKeyValueSection>

          <div className="flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.28)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_16px_30px_-20px_rgba(37,99,235,0.45)]">
              <span className="font-medium">{userName.charAt(0)}</span>
            </div>
            <div>
              <div className="font-semibold text-slate-900">{userName}</div>
              <div className="text-sm text-slate-500">{copy.selectRoles}</div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`${fieldClassName} pl-10`}
            />
          </div>

          <div>
            <Label className="mb-2 text-sm font-medium text-slate-700">{copy.rolesLabel}</Label>
            <ScrollArea className="h-[240px] rounded-[24px] border border-slate-200/70 bg-slate-50/65 p-3 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
              <div className="space-y-1 pr-3">
                {filteredRoles.map((role) => {
                  const selected = selectedRoleIds.includes(role.id);
                  const systemRole = role.type === 'system';

                  return (
                    <div
                      key={role.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition-all',
                        selected
                          ? 'border-blue-200 bg-blue-50/85 shadow-sm shadow-blue-100/70'
                          : 'border-slate-200/70 bg-white/90 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white',
                      )}
                      onClick={() => toggleRole(role.id)}
                    >
                      <Checkbox
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{role.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs',
                              systemRole
                                ? 'border-orange-200 bg-orange-50 text-orange-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600',
                            )}
                          >
                            {systemRole ? copy.systemRole : copy.customRole}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">{role.code}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-[24px] border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-[0_18px_36px_-32px_rgba(245,158,11,0.25)]">
            {language === 'zh'
              ? '当前角色分配仅支持长期生效。到期时间能力尚未接入后端，因此这里不再提供可提交的到期设置。'
              : 'Role assignment currently supports persistent grants only. Expiry is not wired to the backend yet, so the dialog no longer exposes a submit-ready expiry control.'}
          </div>

          {selectedRoleIds.length > 0 && (
            <div className="flex items-start gap-2 rounded-[24px] border border-blue-200/80 bg-blue-50/85 p-4 text-sm text-blue-800 shadow-[0_18px_36px_-32px_rgba(59,130,246,0.28)]">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {copy.tipAssignPrefix}{' '}
                <span className="font-semibold">{selectedRoleIds.length}</span> {copy.tipRoleSuffix}
              </span>
            </div>
          )}

          <DetailKeyValueSection
            eyebrow="CHECK"
            title={language === 'zh' ? '提交前检查' : 'Pre-submit Review'}
            description={language === 'zh' ? '提交前建议复核角色数量、检索范围和长期授权影响。' : 'Review role count, search scope, and persistent assignment impact before submitting.'}
          >
            <DetailKeyValueItem label={language === 'zh' ? '筛选结果' : 'Filtered Results'} value={filteredRoles.length} />
            <DetailKeyValueItem label={language === 'zh' ? '检索关键词' : 'Search Keyword'} value={searchQuery.trim() || '-'} />
            <DetailKeyValueItem label={language === 'zh' ? '授权模式' : 'Assignment Mode'} value={language === 'zh' ? '长期有效' : 'Persistent Assignment'} />
            <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认目标角色完整后再提交分配。' : 'Confirm the target role set is complete before submitting assignment.'} />
          </DetailKeyValueSection>
        </div>

        <DialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">{copy.selectRoles}</div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border-slate-200 bg-white/90 px-5 hover:bg-white"
            >
              {copy.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedRoleIds.length === 0}
              className="rounded-2xl px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {copy.confirm}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









