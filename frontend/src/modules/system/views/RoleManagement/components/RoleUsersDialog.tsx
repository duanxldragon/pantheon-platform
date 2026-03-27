import { useEffect, useMemo, useState } from 'react';

import { Search, UserMinus, UserPlus, Users } from 'lucide-react';
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
import { useLanguageStore } from '../../../../../stores/languageStore';
import { api } from '../../../api';
import type { Role, User } from '../../../types';

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
  const { t, language } = useLanguageStore();
  const i18n = t.systemManagement.roles.usersDialog;
  const zh = language === 'zh';
  const loadRoleMembersFailedMessage = zh ? '加载角色成员失败，请重试' : 'Failed to load role members';
  const addRoleMembersFailedMessage = zh ? '添加角色成员失败，请重试' : 'Failed to add role members';
  const removeRoleMembersFailedMessage = zh ? '移除角色成员失败，请重试' : 'Failed to remove role members';

  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const roleId = asID(role.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveTab('current');
    setSearchQuery('');
    setSelectedUserIds(new Set());
    void refreshData();
  }, [open, roleId]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [currentResponse, allResponse] = await Promise.all([
        api.listUsers({ page: 1, pageSize: 200, roleId }),
        api.listUsers({ page: 1, pageSize: 200 }),
      ]);
      setCurrentUsers(currentResponse.items);
      setAllUsers(allResponse.items);
    } catch {
      toast.error(loadRoleMembersFailedMessage);
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = useMemo(
    () => allUsers.filter((user) => !user.roleIds?.map(asID).includes(roleId)),
    [allUsers, roleId]
  );

  const filterUsers = (users: User[]) => {
    if (!searchQuery.trim()) {
      return users;
    }

    const keyword = searchQuery.trim().toLowerCase();
    return users.filter(
      (user) =>
        user.realName.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        (user.email || '').toLowerCase().includes(keyword)
    );
  };

  const filteredCurrentUsers = useMemo(() => filterUsers(currentUsers), [currentUsers, searchQuery]);
  const filteredAvailableUsers = useMemo(() => filterUsers(availableUsers), [availableUsers, searchQuery]);
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
        })
      );

      toast.success(mode === 'add' ? i18n.addSuccess : i18n.removeSuccess);
      setSelectedUserIds(new Set());
      await refreshData();
      onUpdate?.();

      if (mode === 'add') {
        setActiveTab('current');
      }
    } catch {
      toast.error(mode === 'add' ? addRoleMembersFailedMessage : removeRoleMembersFailedMessage);
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
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {i18n.title}: {role.name}
          </DialogTitle>
          <DialogDescription>{i18n.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={i18n.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'current' | 'add')}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="gap-2">
                <UserMinus className="h-4 w-4" />
                {i18n.tabCurrent} <Badge variant="outline">{currentUsers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="add" className="gap-2">
                <UserPlus className="h-4 w-4" />
                {i18n.tabAdd} <Badge variant="outline">{availableUsers.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-3 min-h-0 flex-1">
              <UserList
                users={filteredCurrentUsers}
                selectedUserIds={selectedUserIds}
                onToggle={toggleSelect}
                emptyText={searchQuery ? i18n.emptySearch : i18n.emptyCurrent}
              />
            </TabsContent>

            <TabsContent value="add" className="mt-3 min-h-0 flex-1">
              <UserList
                users={filteredAvailableUsers}
                selectedUserIds={selectedUserIds}
                onToggle={toggleSelect}
                emptyText={i18n.emptySearch}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500">
            {i18n.selectedLabel}: {selectedUserIds.size} / {displayedUsers.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={selectAllDisplayed}
              disabled={displayedUsers.length === 0 || loading}
            >
              {t.common.selectAll}
            </Button>
            {activeTab === 'current' ? (
              <Button
                variant="destructive"
                onClick={() => void updateUsersRole('remove')}
                disabled={selectedUserIds.size === 0 || loading}
              >
                {i18n.removeSelected}
              </Button>
            ) : (
              <Button
                onClick={() => void updateUsersRole('add')}
                disabled={selectedUserIds.size === 0 || loading}
              >
                {i18n.addSelected}
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
    return <div className="py-10 text-center text-sm text-gray-500">{emptyText}</div>;
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
              className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50"
            >
              <Checkbox
                checked={checked}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={() => onToggle(userId)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{user.realName}</span>
                  <Badge variant="outline" className="text-xs">
                    @{user.username}
                  </Badge>
                </div>
                <div className="truncate text-xs text-gray-500">{user.email}</div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
