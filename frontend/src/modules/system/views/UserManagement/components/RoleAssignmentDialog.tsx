import { useEffect, useMemo, useState } from 'react';

import { AlertCircle, Calendar as CalendarIcon, Clock, Search, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { toast } from 'sonner';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Calendar } from '../../../../../components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { cn } from '../../../../../components/ui/utils';
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialogSizes';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { api } from '../../../api';
import { useRoles } from '../../../hooks/useRoles';
import type { ID } from '../../../types';

interface RoleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: ID;
  userName: string;
  currentRoleIds: ID[];
  onConfirm?: (roleIds: ID[], expiresAt?: Date) => void | Promise<void>;
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
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [hasExpiry, setHasExpiry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { language, t } = useLanguageStore();
  const { roles } = useRoles();
  const i18n = t.systemManagement.users.roleAssignDialog;
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  const dateLocale = language === 'zh' ? zhCN : enUS;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedRoleIds(currentRoleIds);
    setExpiresAt(undefined);
    setHasExpiry(false);
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

  const toggleRole = (roleId: ID) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSubmit = async () => {
    try {
      await api.updateUser(String(userId), { roleIds: selectedRoleIds });
      await onConfirm?.(selectedRoleIds, hasExpiry ? expiresAt : undefined);
      toast.success(i18n.updated);
      onOpenChange(false);
    } catch {
      toast.error(i18n.updateFailed);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName('2xl', 'p-0')} style={getDialogStyle('2xl')}>
        <DialogHeader className="border-b border-slate-100/90 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {i18n.title}
          </DialogTitle>
          <DialogDescription>
            {i18n.description} <span className="font-medium">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar max-h-[calc(92vh-164px)] space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.28)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_16px_30px_-20px_rgba(37,99,235,0.45)]">
              <span className="font-medium">{userName.charAt(0)}</span>
            </div>
            <div>
              <div className="font-semibold text-slate-900">{userName}</div>
              <div className="text-sm text-slate-500">{i18n.selectRoles}</div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={i18n.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`${fieldClassName} pl-10`}
            />
          </div>

          <div>
            <Label className="mb-2 text-sm font-medium text-slate-700">{i18n.rolesLabel}</Label>
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
                            {systemRole ? i18n.systemRole : i18n.customRole}
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

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-expiry"
                checked={hasExpiry}
                onCheckedChange={(checked) => setHasExpiry(Boolean(checked))}
              />
              <Label htmlFor="has-expiry" className="flex cursor-pointer items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {i18n.setExpiry}
              </Label>
            </div>

            {hasExpiry && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      `w-full justify-start text-left font-normal ${fieldClassName}`,
                      !expiresAt && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt
                      ? format(expiresAt, 'yyyy-MM-dd', { locale: dateLocale })
                      : i18n.expiryPlaceholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    disabled={(date) => date < new Date()}
                    locale={dateLocale}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {selectedRoleIds.length > 0 && (
            <div className="flex items-start gap-2 rounded-[24px] border border-blue-200/80 bg-blue-50/85 p-4 text-sm text-blue-800 shadow-[0_18px_36px_-32px_rgba(59,130,246,0.28)]">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {i18n.tipAssignPrefix}{' '}
                <span className="font-semibold">{selectedRoleIds.length}</span> {i18n.tipRoleSuffix}
                {hasExpiry && expiresAt && (
                  <>
                    {' '}
                    {i18n.tipUntil}{' '}
                    <span className="font-semibold">
                      {format(expiresAt, 'yyyy-MM-dd', { locale: dateLocale })}
                    </span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-400">{i18n.selectRoles}</div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border-slate-200 bg-white/90 px-5 hover:bg-white"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedRoleIds.length === 0}
              className="rounded-2xl px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {t.common.confirm}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

