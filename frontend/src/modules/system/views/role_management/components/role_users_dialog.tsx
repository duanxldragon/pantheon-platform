import { useEffect, useMemo, useState } from 'react';

import { Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { useCallback } from 'react';
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
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialog_sizes';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useAuthStore } from '../../../../auth/store/auth_store';
import { api } from '../../../api';
import type { Role, User } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';

interface RoleUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onUpdate?: () => void;
}

function asID(value: unknown): string {
  return String(value ?? '');
}

export function RoleUsersDialog({ open, onOpenChange, role, onUpdate }: RoleUsersDialogProps) {
  const { language } = useLanguageStore();
  const copy = getRoleManagementCopy(language).users;
  const authUser = useAuthStore((state) => state.user);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const roleId = asID(role.id);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [currentResponse, allResponse] = await Promise.all([
        api.listUsers({ page: 1, pageSize: 200, roleId }),
        api.listUsers({ page: 1, pageSize: 200 }),
      ]);
      setCurrentUsers(currentResponse.items);
      setAllUsers(allResponse.items);
    } catch {
      toast.error(copy.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [copy.loadFailed, roleId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveTab('current');
    setSearchQuery('');
    setSelectedUserIds(new Set());
    void refreshData();
  }, [open, refreshData, roleId]);

  const availableUsers = useMemo(
    () => allUsers.filter((user) => !user.roleIds?.map(asID).includes(roleId)),
    [allUsers, roleId],
  );

  const filterUsers = useCallback((users: User[]) => {
    if (!searchQuery.trim()) {
      return users;
    }

    const keyword = searchQuery.trim().toLowerCase();
    return users.filter(
      (user) =>
        user.realName.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        (user.email || '').toLowerCase().includes(keyword),
    );
  }, [searchQuery]);

  const filteredCurrentUsers = useMemo(() => filterUsers(currentUsers), [currentUsers, filterUsers]);
  const filteredAvailableUsers = useMemo(
    () => filterUsers(availableUsers),
    [availableUsers, filterUsers],
  );
  const displayedUsers = activeTab === 'current' ? filteredCurrentUsers : filteredAvailableUsers;

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const selectAllDisplayed = () => {
    setSelectedUserIds((prev) => {
      const displayedIds = displayedUsers.map((user) => asID(user.id));
      const allSelected = displayedIds.length > 0 && displayedIds.every((id) => prev.has(id));
      const next = new Set(prev);

      if (allSelected) {
        displayedIds.forEach((id) => next.delete(id));
      } else {
        displayedIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const updateUsersRole = async (mode: 'add' | 'remove') => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const userMap = new Map<string, User>();
      allUsers.forEach((user) => {
        userMap.set(asID(user.id), user);
      });

      await Promise.all(
        ids.map(async (id) => {
          const user = userMap.get(id);
          if (!user) {
            return;
          }

          const existingRoleIds = (user.roleIds || []).map(asID);
          const nextRoleIds =
            mode === 'add'
              ? Array.from(new Set([...existingRoleIds, roleId]))
              : existingRoleIds.filter((idValue) => idValue !== roleId);
          await api.updateUser(id, { roleIds: nextRoleIds });
        }),
      );

      toast.success(mode === 'add' ? copy.addSuccess : copy.removeSuccess);
      setSelectedUserIds(new Set());
      if (ids.some((id) => String(authUser?.id) === id)) {
        await refreshTenantContext();
      }
      await refreshData();
      onUpdate?.();

      if (mode === 'add') {
        setActiveTab('current');
      }
    } catch {
      toast.error(mode === 'add' ? copy.addFailed : copy.removeFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedUserIds(new Set());
      setSearchQuery('');
      setActiveTab('current');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={getDialogClassName('3xl', 'flex min-h-0 flex-col p-0')}
        style={getDialogStyle('3xl')}
      >
        <DialogHeader className="border-b border-slate-100/90 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {copy.title}: {role.name}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4 px-6 py-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`${fieldClassName} pl-10`}
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'current' | 'add')}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-slate-200/70 bg-slate-100/85 p-1">
              <TabsTrigger value="current" className="gap-2 rounded-xl">
                <UserMinus className="h-4 w-4" />
                {copy.tabCurrent} <Badge variant="outline">{currentUsers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="add" className="gap-2 rounded-xl">
                <UserPlus className="h-4 w-4" />
                {copy.tabAdd} <Badge variant="outline">{availableUsers.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-4 min-h-0 flex-1">
              <UserList
                users={filteredCurrentUsers}
                selectedUserIds={selectedUserIds}
                onToggle={toggleSelect}
                emptyText={searchQuery ? copy.emptySearch : copy.emptyCurrent}
              />
            </TabsContent>

            <TabsContent value="add" className="mt-4 min-h-0 flex-1">
              <UserList
                users={filteredAvailableUsers}
                selectedUserIds={selectedUserIds}
                onToggle={toggleSelect}
                emptyText={copy.emptySearch}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-6 py-4 sm:justify-between">
          <div className="text-xs text-slate-500">
            {copy.selectedLabel}: {selectedUserIds.size} / {displayedUsers.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={selectAllDisplayed}
              disabled={displayedUsers.length === 0 || loading}
              className="rounded-2xl border-slate-200 bg-white/90 px-5 hover:bg-white"
            >
              {copy.selectAll}
            </Button>
            {activeTab === 'current' ? (
              <Button
                variant="destructive"
                onClick={() => void updateUsersRole('remove')}
                disabled={selectedUserIds.size === 0 || loading}
                className="rounded-2xl bg-rose-600 px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-md"
              >
                {copy.removeSelected}
              </Button>
            ) : (
              <Button
                onClick={() => void updateUsersRole('add')}
                disabled={selectedUserIds.size === 0 || loading}
                className="rounded-2xl px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {copy.addSelected}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserList({
  users,
  selectedUserIds,
  onToggle,
  emptyText,
}: {
  users: User[];
  selectedUserIds: Set<string>;
  onToggle: (userId: string) => void;
  emptyText: string;
}) {
  if (users.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-500">{emptyText}</div>;
  }

  return (
    <ScrollArea className="h-[48vh] pr-3">
      <div className="space-y-2">
        {users.map((user) => {
          const userId = asID(user.id);
          const checked = selectedUserIds.has(userId);
          return (
            <button
              key={userId}
              type="button"
              onClick={() => onToggle(userId)}
              className={`flex w-full items-start gap-3 rounded-[24px] border p-4 text-left transition-all duration-200 ${
                checked
                  ? 'border-blue-200 bg-blue-50/75 shadow-sm shadow-blue-100/60'
                  : 'border-slate-200/70 bg-white/92 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <Checkbox
                checked={checked}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={() => onToggle(userId)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{user.realName}</span>
                  <Badge variant="outline" className="rounded-full bg-white/90 text-xs">
                    @{user.username}
                  </Badge>
                </div>
                <div className="truncate text-xs text-slate-500">{user.email}</div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}







