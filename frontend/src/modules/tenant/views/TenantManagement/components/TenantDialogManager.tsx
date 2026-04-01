import type { Dispatch, SetStateAction } from 'react';

import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { DeleteConfirmDialog } from '../../../../../shared/components/ui/DeleteConfirmDialog';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Tenant } from '../hooks/useTenantLogic';

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
          tenantCode: '建议使用大写英文、数字或中划线，创建后通常不再修改。',
          initialUserLimit: '创建完成后会同步写入用户配额项，0 表示暂不分配。',
        },
        placeholders: {
          tenantName: '请输入企业或组织全称',
          tenantCode: '例如：ACME',
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
          tenantCode: 'Use uppercase letters, numbers, or hyphens. Usually immutable after creation.',
          initialUserLimit: 'Writes the user quota after creation. 0 means not assigned yet.',
        },
        placeholders: {
          tenantName: 'Enter the full organization name',
          tenantCode: 'Example: ACME',
          contactPerson: 'Enter the primary contact person',
          description: 'Describe the tenant profile, deployment notes, or business scope',
        },
      };

  return (
    <>
      <FormDialog
        title={copy.add.title}
        description={copy.add.description}
        open={dialogs.add}
        onOpenChange={(open) => onDialogChange('add', open)}
        onSubmit={handlers.onCreateSubmit}
        submitText={copy.add.submit}
        cancelText={copy.common.cancel}
        submittingText={copy.add.submitting}
        loading={loading?.add}
        width="max-w-2xl"
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.tenantName} required>
              <Input
                value={formData.name || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={copy.placeholders.tenantName}
              />
            </FormField>
            <FormField label={copy.fields.tenantCode} required description={copy.descriptions.tenantCode}>
              <Input
                value={formData.code || ''}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                  }))
                }
                placeholder={copy.placeholders.tenantCode}
                className="font-mono uppercase"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.contactPerson}>
              <Input
                value={formData.contactPerson || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder={copy.placeholders.contactPerson}
              />
            </FormField>
            <FormField label={copy.fields.expiresAt}>
              <Input
                type="date"
                value={formData.expireTime || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, expireTime: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label={copy.fields.description}>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={copy.placeholders.description}
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
            />
          </FormField>
        </div>
      </FormDialog>

      <FormDialog
        title={copy.edit.title}
        description={copy.edit.description}
        open={dialogs.edit}
        onOpenChange={(open) => onDialogChange('edit', open)}
        onSubmit={handlers.onEditSubmit}
        submitText={copy.common.save}
        cancelText={copy.common.cancel}
        submittingText={copy.common.saving}
        loading={loading?.edit}
        width="max-w-2xl"
      >
        <div className="space-y-4 py-2">
          <FormField label={copy.fields.tenantName} required>
            <Input
              value={formData.name || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={copy.placeholders.tenantName}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={copy.fields.tenantCode} required>
              <Input value={formData.code || ''} disabled className="bg-slate-50 font-mono uppercase" />
            </FormField>
            <FormField label={copy.fields.contactPerson}>
              <Input
                value={formData.contactPerson || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder={copy.placeholders.contactPerson}
              />
            </FormField>
          </div>

          <FormField label={copy.fields.description}>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={copy.placeholders.description}
            />
          </FormField>
        </div>
      </FormDialog>

      <FormDialog
        title={copy.license.title}
        description={copy.license.description}
        open={dialogs.license}
        onOpenChange={(open) => onDialogChange('license', open)}
        onSubmit={handlers.onLicenseSubmit}
        submitText={copy.license.submit}
        cancelText={copy.common.cancel}
        submittingText={copy.common.saving}
        loading={loading?.license}
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-700">
            {copy.license.warning}
          </div>

          <FormField label={copy.fields.expiresAt} required>
            <Input
              type="date"
              value={formData.expireTime || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, expireTime: event.target.value }))}
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
            />
          </FormField>
        </div>
      </FormDialog>

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
