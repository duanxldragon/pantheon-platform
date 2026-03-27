import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Search, UserMinus, UserPlus, Users } from 'lucide-react';

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
import type { Department, ID, User } from '../../../types';

interface DepartmentMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department;
  allUsers: User[];
  currentMembers: User[];
  onAddMembers: (userIds: string[]) => void | Promise<void>;
  onRemoveMember: (userId: string) => void | Promise<void>;
}

function asID(value: ID | null | undefined): string {
  return String(value ?? '');
}

export function DepartmentMembersDialog({
  open,
  onOpenChange,
  department,
  allUsers,
  currentMembers,
  onAddMembers,
  onRemoveMember,
}: DepartmentMembersDialogProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = {
    title: zh ? '部门成员管理' : 'Department Members',
    description: zh
      ? '管理部门成员，支持添加成员、移出成员，并触发相关权限刷新。'
      : 'Manage department members, including add/remove actions and permission refresh.',
    currentTab: zh ? '当前成员' : 'Current Members',
    addTab: zh ? '添加成员' : 'Add Members',
    searchPlaceholder: zh ? '搜索用户名、姓名或邮箱' : 'Search by username, name, or email',
    emptyCurrent: zh ? '当前部门暂无成员' : 'No members in this department',
    emptyAvailable: zh ? '暂无可添加的用户' : 'No available users to add',
    selectedLabel: zh ? '已选' : 'Selected',
    selectAll: zh ? '全选当前列表' : 'Select Current List',
    addAction: zh ? '添加到部门' : 'Add to Department',
    confirmAddTitle: zh ? '确认添加成员' : 'Confirm Add Members',
    confirmRemoveTitle: zh ? '确认移出成员' : 'Confirm Remove Member',
    confirmAddText: zh ? '确认添加' : 'Confirm Add',
    confirmRemoveText: zh ? '确认移出' : 'Confirm Remove',
    cancelText: zh ? '取消' : 'Cancel',
  };

  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'add' | 'remove' | null>(null);
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
  }, [department.id, open]);

  const availableUsers = useMemo(
    () => allUsers.filter((user) => !currentMembers.some((member) => asID(member.id) === asID(user.id))),
    [allUsers, currentMembers],
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

  const filteredCurrentMembers = useMemo(() => filterUsers(currentMembers), [currentMembers, searchQuery]);
  const filteredAvailableUsers = useMemo(() => filterUsers(availableUsers), [availableUsers, searchQuery]);
  const displayedUsers = activeTab === 'current' ? filteredCurrentMembers : filteredAvailableUsers;

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

  const handleAddMembers = async () => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) {
      return;
    }

    await onAddMembers(ids);
    setSelectedUserIds(new Set());
    setSearchQuery('');
    setActiveTab('current');
  };

  const openAddConfirm = () => {
    if (selectedUserIds.size === 0) {
      return;
    }
    setConfirmMode('add');
    setConfirmOpen(true);
  };

  const openRemoveConfirm = (user: User) => {
    setPendingRemoveUser(user);
    setConfirmMode('remove');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (confirmMode === 'add') {
      await handleAddMembers();
    }

    if (confirmMode === 'remove' && pendingRemoveUser) {
      await onRemoveMember(asID(pendingRemoveUser.id));
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
    confirmMode === 'add'
      ? zh
        ? `本次将为部门「${department.name}」添加 ${selectedUserIds.size} 名成员，并触发相关用户的权限刷新。`
        : `This will add ${selectedUserIds.size} members to "${department.name}" and refresh related user permissions.`
      : zh
        ? `本次将从部门「${department.name}」移出成员「${pendingRemoveUser?.realName || pendingRemoveUser?.username || ''}」，并触发该用户的权限刷新。`
        : `This will remove "${pendingRemoveUser?.realName || pendingRemoveUser?.username || ''}" from "${department.name}" and refresh that user's permissions.`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {department.name} - {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4">
          <div className="flex gap-2 border-b border-gray-200">
            <Button
              variant={activeTab === 'current' ? 'default' : 'ghost'}
              className={activeTab === 'current' ? 'rounded-none border-b-2 border-blue-600' : 'rounded-none'}
              onClick={() => setActiveTab('current')}
            >
              {copy.currentTab} ({currentMembers.length})
            </Button>
            <Button
              variant={activeTab === 'add' ? 'default' : 'ghost'}
              className={activeTab === 'add' ? 'rounded-none border-b-2 border-blue-600' : 'rounded-none'}
              onClick={() => setActiveTab('add')}
            >
              {copy.addTab} ({availableUsers.length})
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
                {filteredCurrentMembers.length > 0 ? (
                  filteredCurrentMembers.map((user) => (
                    <Card key={asID(user.id)} className="p-4 transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarBadge color="blue">{user.realName.slice(0, 1)}</AvatarBadge>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900">{user.realName}</p>
                              <Badge variant="outline" className="bg-gray-50 text-xs">
                                {user.username}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <p className="text-sm text-gray-500">{user.email}</p>
                              {user.roleNames?.[0] && (
                                <Badge className="bg-purple-100 text-xs text-purple-700">
                                  {user.roleNames[0]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => openRemoveConfirm(user)}>
                          <UserMinus className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <EmptyState icon={<Users className="mb-3 h-12 w-12 text-gray-300" />} text={copy.emptyCurrent} />
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
                              <AvatarBadge color="green">{user.realName.slice(0, 1)}</AvatarBadge>
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
                  <Button onClick={openAddConfirm} disabled={selectedUserIds.size === 0} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {copy.addAction}
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
          title={confirmMode === 'add' ? copy.confirmAddTitle : copy.confirmRemoveTitle}
          description={confirmDescription}
          confirmText={confirmMode === 'add' ? copy.confirmAddText : copy.confirmRemoveText}
          cancelText={copy.cancelText}
          variant={confirmMode === 'add' ? 'info' : 'warning'}
        />
      </DialogContent>
    </Dialog>
  );
}

function AvatarBadge({ color, children }: { color: 'blue' | 'green'; children: string }) {
  const className = color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  return <div className={`flex h-10 w-10 items-center justify-center rounded-full ${className}`}>{children}</div>;
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="py-12 text-center text-gray-500">
      <div className="flex justify-center">{icon}</div>
      <p>{text}</p>
    </div>
  );
}
