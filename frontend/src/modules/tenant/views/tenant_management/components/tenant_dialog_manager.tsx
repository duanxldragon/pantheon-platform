import type { Dispatch, SetStateAction } from 'react';

import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/delete_confirm_dialog';
import {
  DetailKeyValueItem,
  DetailKeyValueSection,
  FormDialogWrapper,
} from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { useLanguageStore } from '../../../../../stores/language_store';
import { normalizeTenantCode } from '../../../utils/naming';
import type { Tenant } from '../hooks/use_tenant_logic';

interface TenantDialogManagerProps {
  dialogs: {
    add: boolean;
    edit: boolean;
    delete: boolean;
    license: boolean;
  };
  selectedTenant: Tenant | null;
  formData: Partial<Tenant>;
  setFormData: Dispatch<SetStateAction<Partial<Tenant>>>;
  onDialogChange: (name: 'add' | 'edit' | 'delete' | 'license', open: boolean) => void;
  handlers: {
    onCreateSubmit: () => void;
    onEditSubmit: () => void;
    onLicenseSubmit: () => void;
    onDelete: () => void;
  };
  loading?: {
    add?: boolean;
    edit?: boolean;
    license?: boolean;
    delete?: boolean;
  };
}

export function TenantDialogManager({
  dialogs,
  selectedTenant,
  formData,
  setFormData,
  onDialogChange,
  handlers,
  loading,
}: TenantDialogManagerProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const currentName = formData.name || '';
  const currentCode = formData.code || '';
  const currentUserLimit = Number(formData.userLimit ?? 0);
  const fieldClassName =
    'h-11 rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';
  const mutedFieldClassName = `${fieldClassName} bg-slate-50/90`;

  const copy = zh
    ? {
        common: {
          cancel: '取消',
          save: '保存',
          saving: '保存中...',
          deleting: '删除中...',
        },
        add: {
          title: '新增租户',
          description: '创建租户基础资料，可在创建后立即进入数据库初始化。',
          submit: '创建租户',
          submitting: '创建中...',
        },
        edit: {
          title: '编辑租户资料',
          description: '更新租户基础信息，不会影响现有数据库配置。',
        },
        license: {
          title: '租户授权变更',
          description: '调整租户有效期和用户配额。',
          submit: '保存授权',
          warning: '修改授权会直接影响租户的服务有效期和资源配额上限，请确认后再保存。',
          userLimitDescription: '本次仅更新用户配额项，不会修改其他配额类型。',
        },
        delete: {
          title: '确认删除租户',
          confirm: '删除',
          description: (name: string) =>
            `确定要彻底删除租户“${name}”吗？此操作会断开数据库连接并清理相关运行态资源。`,
        },
        fields: {
          tenantName: '租户名称',
          tenantCode: '租户编码',
          contactPerson: '联系人',
          expiresAt: '服务有效期至',
          description: '租户描述',
          initialUserLimit: '初始用户上限',
          userLimit: '最大用户数',
        },
        descriptions: {
          tenantCode: '建议使用小写英文、数字或下划线；若以数字开头，建议补 t_ 前缀。创建后通常不再修改。',
          initialUserLimit: '创建完成后会同步写入用户配额项，0 表示暂不分配。',
        },
        placeholders: {
          tenantName: '请输入企业或组织全称',
          tenantCode: '例如：acme 或 acme_china',
          contactPerson: '请输入主要负责人姓名',
          description: '可补充租户定位、部署说明或业务范围',
        },
      }
    : {
        common: {
          cancel: 'Cancel',
          save: 'Save',
          saving: 'Saving...',
          deleting: 'Deleting...',
        },
        add: {
          title: 'Add Tenant',
          description: 'Create the base tenant profile and optionally start database setup right away.',
          submit: 'Create Tenant',
          submitting: 'Creating...',
        },
        edit: {
          title: 'Edit Tenant',
          description: 'Update the tenant base profile without touching the current database configuration.',
        },
        license: {
          title: 'Tenant License Update',
          description: 'Adjust the tenant expiry date and user quota.',
          submit: 'Save License',
          warning: 'Updating the license directly affects service validity and quota limits.',
          userLimitDescription: 'Only the user quota item will be updated this time.',
        },
        delete: {
          title: 'Confirm Tenant Deletion',
          confirm: 'Delete',
          description: (name: string) =>
            `Are you sure you want to permanently delete tenant "${name}"? This disconnects its database and clears related runtime resources.`,
        },
        fields: {
          tenantName: 'Tenant Name',
          tenantCode: 'Tenant Code',
          contactPerson: 'Contact Person',
          expiresAt: 'Expires At',
          description: 'Description',
          initialUserLimit: 'Initial User Limit',
          userLimit: 'User Limit',
        },
        descriptions: {
          tenantCode: 'Use lowercase letters, numbers, or underscores. If it starts with a number, prefix it with t_. Usually immutable after creation.',
          initialUserLimit: 'Writes the user quota after creation. 0 means not assigned yet.',
        },
        placeholders: {
          tenantName: 'Enter the full organization name',
          tenantCode: 'Example: acme or acme_china',
          contactPerson: 'Enter the primary contact person',
          description: 'Describe the tenant profile, deployment notes, or business scope',
        },
      };

  const SummaryCard = ({
    label,
    value,
    hint,
  }: {
    label: string;
    value: string | number;
    hint?: string;
  }) => (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/92 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold text-slate-900">{value || '-'}</div>
      {hint ? <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );

  return (
    <>
      <FormDialogWrapper
        title={copy.add.title}
        description={copy.add.description}
        open={dialogs.add}
        onOpenChange={(open) => onDialogChange('add', open)}
        onSubmit={handlers.onCreateSubmit}
        submitText={copy.add.submit}
        cancelText={copy.common.cancel}
        loading={loading?.add}
        size="2xl"
      >
        <div className="space-y-4 py-2">
          <DetailKeyValueSection
            eyebrow="CONFIG"
            title={zh ? '租户配置摘要' : 'Tenant Config Summary'}
            description={zh ? '填写前先确认租户名称、编码和初始配额。' : 'Confirm tenant name, code, and initial quota before creation.'}
          >
            <DetailKeyValueItem label={copy.fields.tenantName} value={currentName || (zh ? '待填写' : 'Pending')} />
            <DetailKeyValueItem label={copy.fields.tenantCode} value={currentCode || (zh ? '自动建议中' : 'Auto suggested')} />
            <DetailKeyValueItem label={copy.fields.initialUserLimit} value={currentUserLimit} />
            <DetailKeyValueItem label={zh ? '当前结论' : 'Current Outcome'} value={zh ? '当前租户将先完成基础资料创建，数据库初始化可在下一步继续。' : 'This tenant will first be created with a base profile, then database setup can continue in the next step.'} className="md:col-span-2" />
          </DetailKeyValueSection>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryCard
              label={copy.fields.tenantName}
              value={currentName || (zh ? '待填写' : 'Pending')}
              hint={zh ? '建议优先填写企业或组织全称。' : 'Start with the full organization name.'}
            />
            <SummaryCard
              label={copy.fields.tenantCode}
              value={currentCode || (zh ? '自动建议中' : 'Auto suggested')}
              hint={zh ? '编码会随名称自动建议，手动修改后保留你的输入。' : 'The code follows the name suggestion until you edit it manually.'}
            />
            <SummaryCard
              label={copy.fields.initialUserLimit}
              value={currentUserLimit}
              hint={zh ? '创建后同步写入用户配额。' : 'Written to the user quota after creation.'}
            />
          </section>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/90 p-4 text-xs leading-relaxed text-blue-700 shadow-sm shadow-blue-100/50">
            {zh
              ? '创建租户建议先确认名称、编码和初始配额，数据库初始化可以在创建成功后继续完成。'
              : 'Confirm the name, code, and initial quota first. Database setup can continue after creation.'}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.tenantName} required>
              <Input
                value={formData.name || ''}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setFormData((prev) => {
                    const previousName = prev.name || '';
                    const previousCode = prev.code || '';
                    const previousSuggestedCode = normalizeTenantCode(previousName);
                    const nextSuggestedCode = normalizeTenantCode(nextName);
                    const shouldSyncCode =
                      !previousCode.trim() || previousCode === previousSuggestedCode;

                    return {
                      ...prev,
                      name: nextName,
                      code: shouldSyncCode ? nextSuggestedCode : previousCode,
                    };
                  });
                }}
                placeholder={copy.placeholders.tenantName}
                className={fieldClassName}
              />
            </FormField>
            <FormField label={copy.fields.tenantCode} required description={copy.descriptions.tenantCode}>
              <Input
                value={formData.code || ''}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: normalizeTenantCode(event.target.value),
                  }))
                }
                placeholder={copy.placeholders.tenantCode}
                className={`${fieldClassName} font-mono`}
              />
            </FormField>
          </div>
          {currentName.trim() && currentCode && normalizeTenantCode(currentName) === currentCode ? (
            <p className="text-xs text-slate-500">
              {zh ? '编码会随名称自动建议；手动修改后将保留你的输入。' : 'The code follows the name suggestion until you edit it manually.'}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.contactPerson}>
              <Input
                value={formData.contactPerson || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder={copy.placeholders.contactPerson}
                className={fieldClassName}
              />
            </FormField>
            <FormField label={copy.fields.expiresAt}>
              <Input
                type="date"
                value={formData.expireTime || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, expireTime: event.target.value }))}
                className={fieldClassName}
              />
            </FormField>
          </div>

          <FormField label={copy.fields.description}>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={copy.placeholders.description}
              className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
            />
          </FormField>

          <FormField label={copy.fields.initialUserLimit} description={copy.descriptions.initialUserLimit}>
            <Input
              type="number"
              min={0}
              value={formData.userLimit ?? 0}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  userLimit: Number.isNaN(Number(event.target.value)) ? 0 : Number(event.target.value),
                }))
              }
              className={fieldClassName}
            />
          </FormField>

          <DetailKeyValueSection
            eyebrow="REVIEW"
            title={zh ? '创建前检查' : 'Pre-create Review'}
            description={zh ? '提交前建议核对编码规范、联系人和有效期。' : 'Review code format, contact, and expiry before submitting.'}
          >
            <DetailKeyValueItem label={copy.fields.tenantCode} value={currentCode || '-'} hint={copy.descriptions.tenantCode} />
            <DetailKeyValueItem label={copy.fields.contactPerson} value={formData.contactPerson || '-'} />
            <DetailKeyValueItem label={copy.fields.expiresAt} value={formData.expireTime || '-'} />
            <DetailKeyValueItem label={zh ? '建议动作' : 'Recommended Action'} value={zh ? '确认名称、编码和初始配额无误后再创建。' : 'Confirm name, code, and initial quota before creating the tenant.'} />
          </DetailKeyValueSection>
        </div>
      </FormDialogWrapper>

      <FormDialogWrapper
        title={copy.edit.title}
        description={copy.edit.description}
        open={dialogs.edit}
        onOpenChange={(open) => onDialogChange('edit', open)}
        onSubmit={handlers.onEditSubmit}
        submitText={copy.common.save}
        cancelText={copy.common.cancel}
        loading={loading?.edit}
        size="2xl"
      >
        <div className="space-y-4 py-2">
          <DetailKeyValueSection
            eyebrow="CONFIG"
            title={zh ? '资料更新摘要' : 'Profile Update Summary'}
            description={zh ? '更新前先确认名称、联系人与编码稳定性。' : 'Confirm name, contact, and code stability before updating.'}
          >
            <DetailKeyValueItem label={copy.fields.tenantName} value={currentName || '-'} />
            <DetailKeyValueItem label={copy.fields.tenantCode} value={currentCode || '-'} />
            <DetailKeyValueItem label={copy.fields.contactPerson} value={formData.contactPerson || (zh ? '未填写' : 'Unset')} />
            <DetailKeyValueItem label={zh ? '当前结论' : 'Current Outcome'} value={zh ? '当前修改只影响租户资料，不会触碰数据库配置。' : 'This update only affects tenant profile fields and does not touch database configuration.'} className="md:col-span-2" />
          </DetailKeyValueSection>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryCard
              label={copy.fields.tenantName}
              value={currentName || '-'}
              hint={zh ? '更新名称不会修改已有编码。' : 'Updating the name does not change the existing code.'}
            />
            <SummaryCard
              label={copy.fields.tenantCode}
              value={currentCode || '-'}
              hint={zh ? '租户编码作为稳定标识，通常不再修改。' : 'The tenant code acts as a stable identifier and usually stays immutable.'}
            />
            <SummaryCard
              label={copy.fields.contactPerson}
              value={formData.contactPerson || (zh ? '未填写' : 'Unset')}
              hint={zh ? '用于后续运维和授权跟进。' : 'Used for follow-up operations and licensing.'}
            />
          </section>

          <FormField label={copy.fields.tenantName} required>
            <Input
              value={formData.name || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={copy.placeholders.tenantName}
              className={fieldClassName}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.tenantCode} required>
              <Input value={formData.code || ''} disabled className={`${mutedFieldClassName} font-mono`} />
            </FormField>
            <FormField label={copy.fields.contactPerson}>
              <Input
                value={formData.contactPerson || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder={copy.placeholders.contactPerson}
                className={fieldClassName}
              />
            </FormField>
          </div>

          <FormField label={copy.fields.description}>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={copy.placeholders.description}
              className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
            />
          </FormField>

          <DetailKeyValueSection
            eyebrow="REVIEW"
            title={zh ? '保存前检查' : 'Pre-save Review'}
            description={zh ? '提交前建议核对联系人、说明和编码是否仍匹配。' : 'Review contact details, description, and code consistency before submitting.'}
          >
            <DetailKeyValueItem label={copy.fields.tenantCode} value={currentCode || '-'} />
            <DetailKeyValueItem label={copy.fields.contactPerson} value={formData.contactPerson || '-'} />
            <DetailKeyValueItem label={copy.fields.description} value={formData.description || '-'} />
            <DetailKeyValueItem label={zh ? '建议动作' : 'Recommended Action'} value={zh ? '确认租户资料与现有运行信息一致后再保存。' : 'Confirm the tenant profile still matches current runtime information before saving.'} />
          </DetailKeyValueSection>
        </div>
      </FormDialogWrapper>

      <FormDialogWrapper
        title={copy.license.title}
        description={copy.license.description}
        open={dialogs.license}
        onOpenChange={(open) => onDialogChange('license', open)}
        onSubmit={handlers.onLicenseSubmit}
        submitText={copy.license.submit}
        cancelText={copy.common.cancel}
        loading={loading?.license}
        size="lg"
      >
        <div className="space-y-4 py-2">
          <DetailKeyValueSection
            eyebrow="CONFIG"
            title={zh ? '授权变更摘要' : 'License Change Summary'}
            description={zh ? '修改前先确认有效期与用户配额的目标值。' : 'Confirm expiry and user quota targets before updating the license.'}
          >
            <DetailKeyValueItem label={copy.fields.tenantName} value={selectedTenant?.name || currentName || '-'} />
            <DetailKeyValueItem label={copy.fields.expiresAt} value={formData.expireTime || selectedTenant?.expireTime || '-'} />
            <DetailKeyValueItem label={copy.fields.userLimit} value={currentUserLimit} />
            <DetailKeyValueItem label={zh ? '当前结论' : 'Current Outcome'} value={zh ? '本次变更会直接影响租户有效期与用户容量上限。' : 'This update directly affects tenant validity and user capacity limits.'} className="md:col-span-2" />
          </DetailKeyValueSection>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryCard
              label={copy.fields.tenantName}
              value={selectedTenant?.name || currentName || '-'}
              hint={zh ? '当前授权变更会直接作用于该租户。' : 'This license update applies directly to the tenant.'}
            />
            <SummaryCard
              label={copy.fields.expiresAt}
              value={formData.expireTime || selectedTenant?.expireTime || '-'}
              hint={zh ? '用于判断服务是否临近到期。' : 'Used to track whether the service is nearing expiry.'}
            />
            <SummaryCard
              label={copy.fields.userLimit}
              value={currentUserLimit}
              hint={zh ? '仅更新用户配额项。' : 'Only the user quota item is updated here.'}
            />
          </section>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/90 p-4 text-xs leading-relaxed text-blue-700 shadow-sm shadow-blue-100/50">
            {copy.license.warning}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="warning">{zh ? '高影响操作' : 'High Impact'}</Badge>
            <Badge variant="info">{zh ? '直接影响有效期与配额' : 'Affects expiry and quota directly'}</Badge>
          </div>

          <FormField label={copy.fields.expiresAt} required>
            <Input
              type="date"
              value={formData.expireTime || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, expireTime: event.target.value }))}
              className={fieldClassName}
            />
          </FormField>

          <FormField label={copy.fields.userLimit} required description={copy.license.userLimitDescription}>
            <Input
              type="number"
              min={0}
              value={formData.userLimit ?? 0}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  userLimit: Number.isNaN(Number(event.target.value)) ? 0 : Number(event.target.value),
                }))
              }
              className={fieldClassName}
            />
          </FormField>

          <DetailKeyValueSection
            eyebrow="REVIEW"
            title={zh ? '提交前检查' : 'Pre-submit Review'}
            description={zh ? '提交前建议核对配额与到期日是否匹配当前服务策略。' : 'Review whether quota and expiry align with the current service plan before submitting.'}
          >
            <DetailKeyValueItem label={copy.fields.expiresAt} value={formData.expireTime || '-'} />
            <DetailKeyValueItem label={copy.fields.userLimit} value={currentUserLimit} />
            <DetailKeyValueItem label={zh ? '影响范围' : 'Impact Scope'} value={zh ? '租户有效期与用户配额' : 'Tenant expiry and user quota'} hint={copy.license.warning} />
            <DetailKeyValueItem label={zh ? '建议动作' : 'Recommended Action'} value={zh ? '确认授权变更值无误后再保存。' : 'Confirm license values before saving the change.'} />
          </DetailKeyValueSection>
        </div>
      </FormDialogWrapper>

      <DeleteConfirmDialog
        open={dialogs.delete}
        onOpenChange={(open) => onDialogChange('delete', open)}
        onConfirm={handlers.onDelete}
        title={copy.delete.title}
        description={selectedTenant ? copy.delete.description(selectedTenant.name) : ''}
        loading={loading?.delete}
        cancelText={copy.common.cancel}
        confirmText={copy.delete.confirm}
        confirmingText={copy.common.deleting}
      />
    </>
  );
}












