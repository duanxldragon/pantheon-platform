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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {i18n.title}
          </DialogTitle>
          <DialogDescription>
            {i18n.description} <span className="font-medium">{userName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
              <span className="font-medium">{userName.charAt(0)}</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{userName}</div>
              <div className="text-sm text-gray-500">{i18n.selectRoles}</div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={i18n.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <Label className="mb-2 text-sm font-medium text-gray-700">{i18n.rolesLabel}</Label>
            <ScrollArea className="h-[240px] rounded-lg border p-2">
              <div className="space-y-1 pr-3">
                {filteredRoles.map((role) => {
                  const selected = selectedRoleIds.includes(role.id);
                  const systemRole = role.type === 'system';

                  return (
                    <div
                      key={role.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors',
                        selected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50',
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
                          <span className="text-sm font-medium text-gray-900">{role.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              systemRole
                                ? 'border-orange-200 bg-orange-50 text-orange-700'
                                : 'border-gray-300 bg-gray-100 text-gray-600',
                            )}
                          >
                            {systemRole ? i18n.systemRole : i18n.customRole}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">{role.code}</div>
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
                      'w-full justify-start text-left font-normal',
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
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm text-blue-800">
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={selectedRoleIds.length === 0}>
            {t.common.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
