import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

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
import { getDialogClassName, getDialogStyle } from '../../../../../shared/constants/dialog_sizes';
import { ConfirmDialog } from '../../../../../shared/components/ui/confirm_dialog';
import { DetailKeyValueItem, DetailKeyValueSection } from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { ID, Position, User } from '../../../types';
import { getPositionManagementCopy } from '../position_management_copy';

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

function getUserDisplayName(user: User): string {
  return user.realName || user.username || '-';
}

function getUserInitial(user: User): string {
  return getUserDisplayName(user).slice(0, 1).toUpperCase();
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
  const copy = getPositionManagementCopy(language).users;
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

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

  const filterUsers = useCallback((users: User[]) => {
    if (!searchQuery.trim()) {
      return users;
    }

    const keyword = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const realName = (user.realName || '').toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      return realName.includes(keyword) || username.includes(keyword) || email.includes(keyword);
    });
  }, [searchQuery]);

  const filteredCurrentUsers = useMemo(() => filterUsers(currentUsers), [currentUsers, filterUsers]);
  const filteredAvailableUsers = useMemo(() => filterUsers(availableUsers), [availableUsers, filterUsers]);
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

  const pendingUsername = pendingRemoveUser ? getUserDisplayName(pendingRemoveUser) : '';
  const confirmDescription =
    confirmMode === 'assign'
      ? copy.assignDescription(position.name, selectedUserIds.size)
      : copy.removeDescription(position.name, pendingUsername);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={getDialogClassName('3xl', 'flex min-h-0 flex-col p-0')} style={getDialogStyle('3xl')}>
        <DialogHeader className="border-b border-slate-100/90 bg-slate-50/70 px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            {position.name} - {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4 px-6 py-5">
          <DetailKeyValueSection
            eyebrow="MEMBERS"
            title={language === 'zh' ? '岗位成员摘要' : 'Position Member Summary'}
            description={language === 'zh' ? '先确认岗位、现有成员和可分配范围。' : 'Confirm the position, current members, and assignable scope first.'}
          >
            <DetailKeyValueItem label={language === 'zh' ? '当前岗位' : 'Current Position'} value={position.name} />
            <DetailKeyValueItem label={language === 'zh' ? '现有成员' : 'Current Members'} value={currentUsers.length} />
            <DetailKeyValueItem label={language === 'zh' ? '可分配成员' : 'Available Users'} value={availableUsers.length} />
            <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '先确认岗位归属与级别，再执行成员调整。' : 'Confirm position ownership and level before adjusting users.'} className="md:col-span-2" />
          </DetailKeyValueSection>

          <div className="flex flex-wrap items-center gap-2">
            {position.category ? <Badge className="bg-purple-100 text-purple-700">{position.category}</Badge> : null}
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {copy.levelLabels[position.level] || `P${position.level}`}
            </Badge>
            {position.departmentName ? (
              <Badge variant="outline" className="bg-slate-50 text-slate-700">
                {position.departmentName}
              </Badge>
            ) : null}
          </div>

          <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-100/85 p-1">
            <Button
              variant={activeTab === 'current' ? 'default' : 'ghost'}
              className={activeTab === 'current' ? 'rounded-xl px-4 shadow-sm' : 'rounded-xl px-4 text-slate-600 hover:bg-white/70'}
              onClick={() => setActiveTab('current')}
            >
              {copy.currentTab} ({currentUsers.length})
            </Button>
            <Button
              variant={activeTab === 'assign' ? 'default' : 'ghost'}
              className={activeTab === 'assign' ? 'rounded-xl px-4 shadow-sm' : 'rounded-xl px-4 text-slate-600 hover:bg-white/70'}
              onClick={() => setActiveTab('assign')}
            >
              {copy.assignTab} ({availableUsers.length})
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className={`${fieldClassName} pl-10`}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 rounded-2xl hover:bg-rose-50"
                          onClick={() => openRemoveConfirm(user)}
                        >
                          <UserMinus className="h-4 w-4 text-rose-500" />
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <EmptyState icon={<Briefcase className="mb-3 h-12 w-12 text-slate-300" />} text={copy.emptyCurrent} />
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
                      const displayName = getUserDisplayName(user);

                      return (
                        <Card
                          key={userId}
                          className={`cursor-pointer rounded-[24px] border p-4 transition-all duration-200 ${
                            selectedUserIds.has(userId)
                              ? 'border-blue-200 bg-blue-50/75 shadow-sm shadow-blue-100/60'
                              : 'border-slate-200/70 bg-white/92 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white'
                          }`}
                          onClick={() => toggleUser(userId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedUserIds.has(userId)}
                                onCheckedChange={() => toggleUser(userId)}
                                onClick={(event) => event.stopPropagation()}
                              />
                              <AvatarBadge>{getUserInitial(user)}</AvatarBadge>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-slate-900">{displayName}</p>
                                  <Badge variant="outline" className="bg-slate-50 text-xs">
                                    {user.username}
                                  </Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <p className="text-sm text-slate-500">{user.email}</p>
                                  {user.departmentName ? (
                                    <Badge className="bg-blue-100 text-xs text-blue-700">{user.departmentName}</Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <EmptyState icon={<UserPlus className="mb-3 h-12 w-12 text-slate-300" />} text={copy.emptyAvailable} />
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="border-t border-slate-100/90 bg-slate-50/80 px-4 py-4 sm:justify-between">
                <div className="text-xs text-slate-500">
                  {copy.selectedSummary(selectedUserIds.size, filteredAvailableUsers.length)}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={selectAllDisplayed}
                    disabled={filteredAvailableUsers.length === 0}
                    className="rounded-2xl border-slate-200 bg-white/90 px-5 hover:bg-white"
                  >
                    {copy.selectAll}
                  </Button>
                  <Button
                    onClick={openAssignConfirm}
                    disabled={selectedUserIds.size === 0}
                    className="gap-2 rounded-2xl px-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <UserPlus className="h-4 w-4" />
                    {copy.assignAction}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </div>

        <div className="px-6 pb-2">
          <DetailKeyValueSection
            eyebrow="CHECK"
            title={language === 'zh' ? '提交前检查' : 'Pre-submit Review'}
            description={language === 'zh' ? '提交前建议核对当前标签页、筛选结果和选择数量。' : 'Review the active tab, filtered results, and selection count before submitting.'}
          >
            <DetailKeyValueItem label={language === 'zh' ? '当前标签' : 'Current Tab'} value={activeTab === 'current' ? copy.currentTab : copy.assignTab} />
            <DetailKeyValueItem label={language === 'zh' ? '筛选结果' : 'Filtered Results'} value={displayedUsers.length} />
            <DetailKeyValueItem label={language === 'zh' ? '已选成员' : 'Selected Users'} value={selectedUserIds.size} />
          </DetailKeyValueSection>
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
  const displayName = getUserDisplayName(user);

  return (
    <Card className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarBadge>{getUserInitial(user)}</AvatarBadge>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-900">{displayName}</p>
              <Badge variant="outline" className="bg-slate-50 text-xs">
                {user.username}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-slate-500">{user.email}</p>
              {badgeText ? <Badge className="bg-blue-100 text-xs text-blue-700">{badgeText}</Badge> : null}
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
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
      {children}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="py-12 text-center text-slate-500">
      <div className="flex justify-center">{icon}</div>
      <p>{text}</p>
    </div>
  );
}









