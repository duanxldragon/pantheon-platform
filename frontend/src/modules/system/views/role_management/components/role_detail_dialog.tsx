import { Calendar, Settings, Shield, Users } from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import {
  DetailDialogWrapper,
  DetailKeyValueItem,
  DetailKeyValueSection,
} from '../../../../../shared/components/ui';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { Role } from '../../../types';
import { getRoleManagementCopy } from '../role_management_copy';

interface RoleDetailDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetailDialog({ role, open, onOpenChange }: RoleDetailDialogProps) {
  const { language } = useLanguageStore();
  const copy = getRoleManagementCopy(language).detail;
  const roleReviewSummary =
    role.type === 'system'
      ? {
          badge: language === 'zh' ? '系统角色' : 'Built-in Role',
          badgeVariant: 'warning' as const,
          description:
            language === 'zh'
              ? '当前角色为系统内置角色，建议优先查看成员影响与授权范围。'
              : 'This is a built-in role. Review member impact and authorization scope first.',
          nextAction:
            language === 'zh' ? '先看成员数，再看菜单授权规模。' : 'Review linked users first, then menu coverage.',
        }
      : role.userCount > 0
        ? {
            badge: language === 'zh' ? '成员影响' : 'Member Impact',
            badgeVariant: 'info' as const,
            description:
              language === 'zh'
                ? '当前角色已分配给成员，建议优先查看授权覆盖面。'
                : 'This role is already assigned to users. Review its authorization coverage first.',
            nextAction:
              language === 'zh' ? '先看成员数与菜单数，再决定后续调整。' : 'Review linked users and menu count before making changes.',
          }
        : {
            badge: language === 'zh' ? '查看稳定' : 'Stable Review',
            badgeVariant: 'success' as const,
            description:
              language === 'zh'
                ? '当前角色影响面较小，可按状态、类型、授权规模顺序查看。'
                : 'This role has a smaller impact surface. Review status, type, and coverage in order.',
            nextAction:
              language === 'zh' ? '先看状态和类型，再看授权规模。' : 'Review status and type first, then authorization coverage.',
          };

  return (
    <DetailDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={role.name}
      description={role.code}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mono">ROLE</Badge>
          {role.type === 'system' ? (
            <Badge variant="warning">{copy.systemRole}</Badge>
          ) : (
            <Badge variant="info">{copy.customRole}</Badge>
          )}
          {role.status === 'active' ? (
            <Badge variant="success">{copy.statusEnabled}</Badge>
          ) : (
            <Badge variant="outline">{copy.statusDisabled}</Badge>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <DetailKeyValueSection
          eyebrow="REVIEW"
          title={language === 'zh' ? '查看摘要' : 'Review Summary'}
          description={language === 'zh' ? '帮助快速判断当前角色应先看什么。' : 'Helps decide what to review first for this role.'}
        >
          <DetailKeyValueItem
            label={language === 'zh' ? '当前结论' : 'Current Outcome'}
            value={<Badge variant={roleReviewSummary.badgeVariant}>{roleReviewSummary.badge}</Badge>}
            hint={roleReviewSummary.description}
          />
          <DetailKeyValueItem
            label={language === 'zh' ? '授权规模' : 'Authorization Size'}
            value={`${role.userCount}/${role.menuIds?.length || 0}`}
            hint={language === 'zh' ? '成员数 / 菜单数' : 'Users / menus'}
          />
          <DetailKeyValueItem
            label={language === 'zh' ? '下一步动作' : 'Next Action'}
            value={roleReviewSummary.nextAction}
            className="md:col-span-2"
          />
        </DetailKeyValueSection>

        <DetailKeyValueSection
          eyebrow="SUMMARY"
          title={copy.description}
          description={role.description || '-'}
        >
          <DetailKeyValueItem
            label={copy.status}
            value={
              role.status === 'active' ? (
                <Badge variant="success">{copy.statusEnabled}</Badge>
              ) : (
                <Badge variant="outline">{copy.statusDisabled}</Badge>
              )
            }
          />
          <DetailKeyValueItem
            label={copy.roleType}
            value={
              role.type === 'system' ? (
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4 text-warning" />
                  {copy.systemRole}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  {copy.customRole}
                </span>
              )
            }
          />
        </DetailKeyValueSection>

        <DetailKeyValueSection
          eyebrow="STATS"
          title={copy.linkedUsers}
          description={language === 'zh' ? '角色影响范围与授权规模摘要。' : 'Summary of role scope and authorization size.'}
        >
          <DetailKeyValueItem
            label={copy.linkedUsers}
            value={
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {role.userCount}
              </span>
            }
          />
          <DetailKeyValueItem
            label={copy.menuCount}
            value={
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {role.menuIds?.length || 0}
              </span>
            }
          />
        </DetailKeyValueSection>

        <DetailKeyValueSection
          eyebrow="AUDIT"
          title={copy.createdAt}
          description={language === 'zh' ? '角色基础审计信息。' : 'Basic audit information for this role.'}
        >
          <DetailKeyValueItem
            label={copy.createdAt}
            value={
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {role.createdAt || '-'}
              </span>
            }
          />
          <DetailKeyValueItem
            label={copy.description}
            value={role.description || '-'}
          />
        </DetailKeyValueSection>
      </div>
    </DetailDialogWrapper>
  );
}
