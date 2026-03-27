import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Briefcase, Search, UserMinus, UserPlus } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
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
import { ConfirmDialog } from '../../../../../shared/components/ui/ConfirmDialog';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { ID, Position, User } from '../../../types';

interface PositionUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Position;
  allUsers: User[];
  currentUsers: User[];
  onAssignUsers: (userIds: string[]) => void | Promise<void>;
  onUnassignUser: (userId: string) => void | Promise<void>;
}

function asID(value: ID | null | undefined): string {
  return String(value ?? '');
}

export function PositionUsersDialog({
  open,
  onOpenChange,
  position,
  allUsers,
  currentUsers,
  onAssignUsers,
  onUnassignUser,
}: PositionUsersDialogProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const levelLabels = zh
    ? ['', 'P1-初级', 'P2-中级', 'P3-高级', 'P4-资深', 'P5-专家']
    : ['', 'P1-Junior', 'P2-Mid', 'P3-Senior', 'P4-Staff', 'P5-Expert'];
  const copy = {
    title: zh ? '岗位成员分配' : 'Position Assignment',
    description: zh
      ? '管理岗位成员，支持分配用户、移出用户，并触发相关权限刷新。'
      : 'Manage position users, including assignment, removal, and permission refresh.',
    currentTab: zh ? '当前成员' : 'Current Members',
    assignTab: zh ? '分配成员' : 'Assign Members',
    searchPlaceholder: zh ? '搜索用户名、姓名或邮箱' : 'Search by username, name, or email',
    emptyCurrent: zh ? '当前岗位暂无成员' : 'No users assigned to this position',
    emptyAvailable: zh ? '暂无可分配的用户' : 'No available users to assign',
    selectedLabel: zh ? '已选' : 'Selected',
    selectAll: zh ? '全选当前列表' : 'Select Current List',
    assignAction: zh ? '分配到岗位' : 'Assign to Position',
    confirmAssignTitle: zh ? '确认分配成员' : 'Confirm Assign Members',
    confirmRemoveTitle: zh ? '确认移出成员' : 'Confirm Remove Member',
    confirmAssignText: zh ? '确认分配' : 'Confirm Assign',
    confirmRemoveText: zh ? '确认移出' : 'Confirm Remove',
    cancelText: zh ? '取消' : 'Cancel',
  };

  const [activeTab, setActiveTab] = useState<'current' | 'assign'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'assign' | 'remove' | null>(null);
  const [pendingRemoveUser, setPendingRemoveUser] = useState<User | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveTab('current');
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingRemoveUser(null);
  }, [open, position.id]);

  const availableUsers = useMemo(
    () => allUsers.filter((user) => !currentUsers.some((current) => asID(current.id) === asID(user.id))),
    [allUsers, currentUsers],
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
        (user.email || '').toLowerCase().includes(keyword),
    );
  };

  const filteredCurrentUsers = useMemo(() => filterUsers(currentUsers), [currentUsers, searchQuery]);
  const filteredAvailableUsers = useMemo(() => filterUsers(availableUsers), [availableUsers, searchQuery]);
  const displayedUsers = activeTab === 'current' ? filteredCurrentUsers : filteredAvailableUsers;

  const toggleUser = (userId: string) => {
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

  const handleAssignUsers = async () => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) {
      return;
    }

    await onAssignUsers(ids);
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setActiveTab('current');
  };

  const openAssignConfirm = () => {
    if (selectedUserIds.size === 0) {
      return;
    }
    setConfirmMode('assign');
    setConfirmOpen(true);
  };

  const openRemoveConfirm = (user: User) => {
    setPendingRemoveUser(user);
    setConfirmMode('remove');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (confirmMode === 'assign') {
      await handleAssignUsers();
    }

    if (confirmMode === 'remove' && pendingRemoveUser) {
      await onUnassignUser(asID(pendingRemoveUser.id));
    }

    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingRemoveUser(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedUserIds(new Set());
      setSearchQuery('');
      setActiveTab('current');
      setConfirmOpen(false);
      setConfirmMode(null);
      setPendingRemoveUser(null);
    }
    onOpenChange(nextOpen);
  };

  const confirmDescription =
    confirmMode === 'assign'
      ? zh
        ? `本次将为岗位「${position.name}」分配 ${selectedUserIds.size} 名成员，并触发相关用户的权限刷新。`
        : `This will assign ${selectedUserIds.size} users to "${position.name}" and refresh related user permissions.`
      : zh
        ? `本次将从岗位「${position.name}」移出成员「${pendingRemoveUser?.realName || pendingRemoveUser?.username || ''}」，并触发该用户的权限刷新。`
        : `This will remove "${pendingRemoveUser?.realName || pendingRemoveUser?.username || ''}" from "${position.name}" and refresh that user's permissions.`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            {position.name} - {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4">
          <div className="flex items-center gap-2">
            {position.category && <Badge className="bg-purple-100 text-purple-700">{position.category}</Badge>}
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {levelLabels[position.level] || `P${position.level}`}
            </Badge>
            {position.departmentName && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                {position.departmentName}
              </Badge>
            )}
          </div>

          <div className="flex gap-2 border-b border-gray-200">
            <Button
              variant={activeTab === 'current' ? 'default' : 'ghost'}
              className={activeTab === 'current' ? 'rounded-none border-b-2 border-blue-600' : 'rounded-none'}
              onClick={() => setActiveTab('current')}
            >
              {copy.currentTab} ({currentUsers.length})
            </Button>
            <Button
              variant={activeTab === 'assign' ? 'default' : 'ghost'}
              className={activeTab === 'assign' ? 'rounded-none border-b-2 border-blue-600' : 'rounded-none'}
              onClick={() => setActiveTab('assign')}
            >
              {copy.assignTab} ({availableUsers.length})
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="pl-10"
            />
          </div>

          {activeTab === 'current' ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredCurrentUsers.length > 0 ? (
                  filteredCurrentUsers.map((user) => (
                    <UserCard
                      key={asID(user.id)}
                      user={user}
                      badgeText={user.departmentName}
                      action={
                        <Button size="sm" variant="ghost" onClick={() => openRemoveConfirm(user)}>
                          <UserMinus className="h-4 w-4 text-red-500" />
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <EmptyState icon={<Briefcase className="mb-3 h-12 w-12 text-gray-300" />} text={copy.emptyCurrent} />
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {filteredAvailableUsers.length > 0 ? (
                    filteredAvailableUsers.map((user) => {
                      const userId = asID(user.id);
                      return (
                        <Card
                          key={userId}
                          className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                          onClick={() => toggleUser(userId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedUserIds.has(userId)}
                                onCheckedChange={() => toggleUser(userId)}
                                onClick={(event) => event.stopPropagation()}
                              />
                              <AvatarBadge>{user.realName.slice(0, 1)}</AvatarBadge>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900">{user.realName}</p>
                                  <Badge variant="outline" className="bg-gray-50 text-xs">
                                    {user.username}
                                  </Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                  {user.departmentName && (
                                    <Badge className="bg-blue-100 text-xs text-blue-700">
                                      {user.departmentName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <EmptyState icon={<UserPlus className="mb-3 h-12 w-12 text-gray-300" />} text={copy.emptyAvailable} />
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="flex items-center justify-between gap-2">
                <div className="text-xs text-gray-500">
                  {copy.selectedLabel} {selectedUserIds.size} / {filteredAvailableUsers.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={selectAllDisplayed} disabled={filteredAvailableUsers.length === 0}>
                    {copy.selectAll}
                  </Button>
                  <Button onClick={openAssignConfirm} disabled={selectedUserIds.size === 0} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {copy.assignAction}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={() => {
            void handleConfirm();
          }}
          title={confirmMode === 'assign' ? copy.confirmAssignTitle : copy.confirmRemoveTitle}
          description={confirmDescription}
          confirmText={confirmMode === 'assign' ? copy.confirmAssignText : copy.confirmRemoveText}
          cancelText={copy.cancelText}
          variant={confirmMode === 'assign' ? 'info' : 'warning'}
        />
      </DialogContent>
    </Dialog>
  );
}

function UserCard({
  user,
  badgeText,
  action,
}: {
  user: User;
  badgeText?: string;
  action: ReactNode;
}) {
  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarBadge>{user.realName.slice(0, 1)}</AvatarBadge>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-gray-900">{user.realName}</p>
              <Badge variant="outline" className="bg-gray-50 text-xs">
                {user.username}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-gray-500">{user.email}</p>
              {badgeText && <Badge className="bg-blue-100 text-xs text-blue-700">{badgeText}</Badge>}
            </div>
          </div>
        </div>
        {action}
      </div>
    </Card>
  );
}

function AvatarBadge({ children }: { children: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
      {children}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="py-12 text-center text-gray-500">
      <div className="flex justify-center">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
