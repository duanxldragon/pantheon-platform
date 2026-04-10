import { Activity, Building2, Calendar, Mail, Phone, Shield, User as UserIcon } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs';
import {
  DetailDialogWrapper,
  DetailKeyValueItem,
  DetailKeyValueSection,
} from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { User } from '../../../types';
import { getUserManagementCopy } from '../user_management_copy';
import { UserPermissionPanel } from './user_permission_panel';

interface EnhancedUserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function EnhancedUserDetailDialog({
  open,
  onOpenChange,
  user,
}: EnhancedUserDetailDialogProps) {
  const { language } = useLanguageStore();
  const copy = getUserManagementCopy(language).detail;

  if (!user) {
    return null;
  }

  const roleCount = user.roleNames?.length || 0;
  const userReviewSummary =
    user.status === 'locked'
      ? {
          badge: language === 'zh' ? '锁定复核' : 'Locked Review',
          badgeVariant: 'warning' as const,
          description:
            language === 'zh'
              ? '当前账号处于锁定状态，建议优先查看最近登录活动与权限影响。'
              : 'This account is locked. Review recent activity and authorization impact first.',
          nextAction:
            language === 'zh' ? '先看登录活动，再确认角色和部门归属。' : 'Review activity first, then confirm roles and department.',
        }
      : roleCount === 0
        ? {
            badge: language === 'zh' ? '待补授权' : 'Needs Roles',
            badgeVariant: 'mono' as const,
            description:
              language === 'zh'
                ? '当前账号未分配角色，建议优先检查角色授权范围。'
                : 'This account has no assigned roles. Review role coverage first.',
            nextAction:
              language === 'zh' ? '先核对角色分配，再检查权限明细。' : 'Review role assignment before checking permission details.',
          }
        : {
            badge: language === 'zh' ? '查看稳定' : 'Stable Review',
            badgeVariant: 'success' as const,
            description:
              language === 'zh'
                ? '当前账号资料完整，可按资料、权限、活动三步巡检。'
                : 'The account profile is complete. Review profile, permissions, and activity in order.',
            nextAction:
              language === 'zh' ? '先看资料，再看权限，最后看活动。' : 'Review profile first, then permissions, then activity.',
          };

  return (
    <DetailDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={user.realName}
      description={`@${user.username}`}
      size="4xl"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mono">USER</Badge>
          {(user.roleNames || []).length > 0 ? (
            <Badge variant="info">
              {language === 'zh' ? `${user.roleNames.length} 个角色` : `${user.roleNames.length} roles`}
            </Badge>
          ) : null}
          {user.status === 'active' ? (
            <Badge variant="success">{copy.statusActive}</Badge>
          ) : user.status === 'inactive' ? (
            <Badge variant="outline">{copy.statusInactive}</Badge>
          ) : (
            <Badge variant="warning">{copy.statusLocked}</Badge>
          )}
        </div>
      }
    >
      <Tabs defaultValue="info" className="flex h-full flex-col">
        <TabsList variant="segmented" className="grid w-full grid-cols-3">
          <TabsTrigger value="info">{copy.tabInfo}</TabsTrigger>
          <TabsTrigger value="permissions">{copy.tabPermissions}</TabsTrigger>
          <TabsTrigger value="activity">{copy.tabActivity}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-5 flex-1 overflow-auto">
          <div className="space-y-5">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={language === 'zh' ? '查看摘要' : 'Review Summary'}
              description={language === 'zh' ? '帮助快速判断当前账号应先看什么。' : 'Helps decide what to review first for this account.'}
            >
              <DetailKeyValueItem
                label={language === 'zh' ? '当前结论' : 'Current Outcome'}
                value={<Badge variant={userReviewSummary.badgeVariant}>{userReviewSummary.badge}</Badge>}
                hint={userReviewSummary.description}
              />
              <DetailKeyValueItem
                label={language === 'zh' ? '角色覆盖' : 'Role Coverage'}
                value={roleCount}
                hint={roleCount > 0 ? user.roleNames?.join(' / ') : copy.noRoles}
              />
              <DetailKeyValueItem
                label={language === 'zh' ? '下一步动作' : 'Next Action'}
                value={userReviewSummary.nextAction}
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="PROFILE"
              title={copy.tabInfo}
              description={copy.description}
            >
              <DetailKeyValueItem
                label={copy.username}
                value={
                  <span className="inline-flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {user.username}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.realName}
                value={
                  <span className="inline-flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {user.realName}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.email}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {user.email || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.phone}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {user.phone || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.department}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {user.departmentName || '-'}
                  </span>
                }
              />
              <DetailKeyValueItem
                label={copy.createdAt}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {user.createdAt || '-'}
                  </span>
                }
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="ACCESS"
              title={copy.roles}
              description={language === 'zh' ? '当前用户角色、状态与最近登录信息。' : 'Current roles, status, and last login snapshot.'}
            >
              <DetailKeyValueItem
                label={copy.roles}
                value={
                  (user.roleNames || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roleNames?.map((roleName) => (
                        <Badge key={roleName} variant="info">
                          <Shield className="mr-1 h-3 w-3" />
                          {roleName}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    copy.noRoles
                  )
                }
              />
              <DetailKeyValueItem
                label={copy.status}
                value={
                  user.status === 'active' ? (
                    <Badge variant="success">{copy.statusActive}</Badge>
                  ) : user.status === 'inactive' ? (
                    <Badge variant="outline">{copy.statusInactive}</Badge>
                  ) : (
                    <Badge variant="warning">{copy.statusLocked}</Badge>
                  )
                }
              />
              <DetailKeyValueItem
                label={copy.lastLogin}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    {user.lastLoginAt || copy.noRecord}
                  </span>
                }
              />
              <DetailKeyValueItem label={copy.remark} value={user.description || '-'} />
            </DetailKeyValueSection>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-5 flex-1 overflow-auto">
          <UserPermissionPanel user={user} />
        </TabsContent>

        <TabsContent value="activity" className="mt-5 flex-1 overflow-auto">
          <div className="space-y-5">
            <DetailKeyValueSection
              eyebrow="REVIEW"
              title={language === 'zh' ? '活动查看提示' : 'Activity Review'}
              description={language === 'zh' ? '最近登录活动可用于判断账号是否需要进一步安全复核。' : 'Recent sign-in activity helps determine whether further security review is needed.'}
            >
              <DetailKeyValueItem
                label={language === 'zh' ? '最近登录状态' : 'Last Sign-in'}
                value={user.lastLoginAt || copy.noRecord}
                hint={user.lastLoginIp || copy.noRecord}
              />
              <DetailKeyValueItem
                label={language === 'zh' ? '建议动作' : 'Next Action'}
                value={language === 'zh' ? '若存在异常 IP 或锁定状态，建议回到权限和状态页继续复核。' : 'If you see unusual IPs or a locked state, return to the profile and permission tabs for further review.'}
                className="md:col-span-2"
              />
            </DetailKeyValueSection>

            <DetailKeyValueSection
              eyebrow="ACTIVITY"
              title={copy.tabActivity}
              description={language === 'zh' ? '最近登录活动与访问痕迹。' : 'Recent sign-in activity and access trace.'}
            >
              <DetailKeyValueItem
                label={copy.recentLoginTime}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    {user.lastLoginAt || copy.noRecord}
                  </span>
                }
              />
              <DetailKeyValueItem label={copy.recentLoginIp} value={user.lastLoginIp || copy.noRecord} />
            </DetailKeyValueSection>
          </div>
        </TabsContent>
      </Tabs>
    </DetailDialogWrapper>
  );
}
