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

  return (
    <>
      <FormDialog
        title={zh ? '新增租户' : 'Add Tenant'}
        description={
          zh
            ? '创建租户基础资料，可在创建后立即进入数据库初始化。'
            : 'Create the base tenant profile and optionally start database setup right away.'
        }
        open={dialogs.add}
        onOpenChange={(open) => onDialogChange('add', open)}
        onSubmit={handlers.onCreateSubmit}
        submitText={zh ? '创建租户' : 'Create Tenant'}
        cancelText={zh ? '取消' : 'Cancel'}
        submittingText={zh ? '创建中...' : 'Creating...'}
        loading={loading?.add}
        width="max-w-2xl"
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={zh ? '租户名称' : 'Tenant Name'} required>
              <Input
                value={formData.name || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={zh ? '请输入企业或组织全称' : 'Enter the full organization name'}
              />
            </FormField>
            <FormField
              label={zh ? '租户编码' : 'Tenant Code'}
              required
              description={
                zh
                  ? '建议使用大写英文、数字或中划线，创建后通常不再修改。'
                  : 'Use uppercase letters, numbers, or hyphens. Usually immutable after creation.'
              }
            >
              <Input
                value={formData.code || ''}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                  }))
                }
                placeholder={zh ? '例如：ACME' : 'Example: ACME'}
                className="font-mono uppercase"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={zh ? '联系人' : 'Contact Person'}>
              <Input
                value={formData.contactPerson || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder={zh ? '请输入主要负责人姓名' : 'Enter the primary contact person'}
              />
            </FormField>
            <FormField label={zh ? '服务有效期至' : 'Expires At'}>
              <Input
                type="date"
                value={formData.expireTime || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, expireTime: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label={zh ? '租户描述' : 'Description'}>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={
                zh ? '可补充租户定位、部署说明或业务范围' : 'Describe the tenant profile, deployment notes, or business scope'
              }
            />
          </FormField>

          <FormField
            label={zh ? '初始用户上限' : 'Initial User Limit'}
            description={
              zh
                ? '创建完成后会同步写入 users 配额项，0 表示暂不分配。'
                : 'Writes the users quota after creation. 0 means not assigned yet.'
            }
          >
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
        title={zh ? '编辑租户资料' : 'Edit Tenant'}
        description={
          zh
            ? '更新租户基础信息，不会影响现有数据库配置。'
            : 'Update the tenant base profile without touching the current database configuration.'
        }
        open={dialogs.edit}
        onOpenChange={(open) => onDialogChange('edit', open)}
        onSubmit={handlers.onEditSubmit}
        submitText={zh ? '保存' : 'Save'}
        cancelText={zh ? '取消' : 'Cancel'}
        submittingText={zh ? '保存中...' : 'Saving...'}
        loading={loading?.edit}
        width="max-w-2xl"
      >
        <div className="space-y-4 py-2">
          <FormField label={zh ? '租户名称' : 'Tenant Name'} required>
            <Input
              value={formData.name || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={zh ? '请输入企业或组织全称' : 'Enter the full organization name'}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={zh ? '租户编码' : 'Tenant Code'} required>
              <Input value={formData.code || ''} disabled className="bg-slate-50 font-mono uppercase" />
            </FormField>
            <FormField label={zh ? '联系人' : 'Contact Person'}>
              <Input
                value={formData.contactPerson || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, contactPerson: event.target.value }))}
                placeholder={zh ? '请输入主要负责人姓名' : 'Enter the primary contact person'}
              />
            </FormField>
          </div>

          <FormField label={zh ? '租户描述' : 'Description'}>
            <Textarea
              rows={4}
              value={formData.description || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={
                zh ? '可补充租户定位、部署说明或业务范围' : 'Describe the tenant profile, deployment notes, or business scope'
              }
            />
          </FormField>
        </div>
      </FormDialog>

      <FormDialog
        title={zh ? '租户授权变更' : 'Tenant License Update'}
        description={zh ? '调整租户有效期和 users 配额。' : 'Adjust the tenant expiry date and users quota.'}
        open={dialogs.license}
        onOpenChange={(open) => onDialogChange('license', open)}
        onSubmit={handlers.onLicenseSubmit}
        submitText={zh ? '保存授权' : 'Save License'}
        cancelText={zh ? '取消' : 'Cancel'}
        submittingText={zh ? '保存中...' : 'Saving...'}
        loading={loading?.license}
      >
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-700">
            {zh
              ? '修改授权会直接影响租户的服务有效期和资源配额上限，请确认后再保存。'
              : 'Updating the license directly affects service validity and quota limits.'}
          </div>

          <FormField label={zh ? '服务有效期至' : 'Expires At'} required>
            <Input
              type="date"
              value={formData.expireTime || ''}
              onChange={(event) => setFormData((prev) => ({ ...prev, expireTime: event.target.value }))}
            />
          </FormField>

          <FormField
            label={zh ? '最大用户数' : 'User Limit'}
            required
            description={
              zh ? '本次仅更新 users 配额项，不会修改其他配额类型。' : 'Only the users quota item will be updated this time.'
            }
          >
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
        title={zh ? '确认删除租户' : 'Confirm Tenant Deletion'}
        description={
          selectedTenant
            ? zh
              ? `确定要彻底删除租户「${selectedTenant.name}」吗？此操作会断开数据库连接并清理相关运行态资源。`
              : `Are you sure you want to permanently delete tenant "${selectedTenant.name}"? This disconnects its database and clears related runtime resources.`
            : ''
        }
        loading={loading?.delete}
        cancelText={zh ? '取消' : 'Cancel'}
        confirmText={zh ? '删除' : 'Delete'}
        confirmingText={zh ? '删除中...' : 'Deleting...'}
      />
    </>
  );
}
