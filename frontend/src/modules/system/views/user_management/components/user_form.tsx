import { useEffect, useMemo, useState } from 'react';

import { Badge } from '../../../../../components/ui/badge';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Input } from '../../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Textarea } from '../../../../../components/ui/textarea';
import { DetailKeyValueItem, DetailKeyValueSection } from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { ID, UserFormData } from '../../../types';
import { getUserManagementCopy } from '../user_management_copy';

interface UserFormProps {
  data?: Partial<UserFormData>;
  departments: Array<{ id: ID; name: string }>;
  roles: Array<{ id: ID; name: string }>;
  onChange: (data: Partial<UserFormData>) => void;
  isEdit?: boolean;
}

const createDefaultFormData = (data?: Partial<UserFormData>): Partial<UserFormData> => ({
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  departmentId: '' as ID,
  roleIds: [],
  userGroupIds: [],
  status: 'active',
  description: '',
  ...data,
});

export function UserForm({
  data = {},
  departments,
  roles,
  onChange,
  isEdit = false,
}: UserFormProps) {
  const { language } = useLanguageStore();
  const copy = getUserManagementCopy(language).form;
  const [formData, setFormData] = useState<Partial<UserFormData>>(createDefaultFormData(data));
  const fieldClassName =
    'rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  useEffect(() => {
    setFormData(createDefaultFormData(data));
  }, [data]);

  const selectedRoles = useMemo(() => {
    const selectedRoleIds = new Set((formData.roleIds || []).map((id) => String(id)));
    return roles.filter((role) => selectedRoleIds.has(String(role.id)));
  }, [formData.roleIds, roles]);
  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === String(formData.departmentId ?? '')),
    [departments, formData.departmentId],
  );
  const configOutcome = selectedRoles.length > 0
    ? (language === 'zh' ? '当前账号已具备部门与角色归属，可继续确认状态与联系信息。' : 'This account already has department and role ownership; continue with status and contact review.')
    : (language === 'zh' ? '当前账号尚未绑定角色，保存前建议明确授权范围。' : 'This account has no roles assigned yet; confirm its authorization scope before saving.');

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    onChange(nextData);
  };

  const toggleRole = (roleId: ID, checked: boolean) => {
    const nextRoleIds = checked
      ? Array.from(new Set([...(formData.roleIds || []), roleId]))
      : (formData.roleIds || []).filter((id) => String(id) !== String(roleId));
    updateField('roleIds', nextRoleIds);
  };

  return (
    <div className="space-y-6">
      <DetailKeyValueSection
        eyebrow="CONFIG"
        title={language === 'zh' ? '用户配置摘要' : 'User Config Summary'}
        description={language === 'zh' ? '填写前先确认部门归属、角色分配与账号状态。' : 'Confirm department ownership, role assignment, and account status before saving.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '所属部门' : 'Department'} value={selectedDepartment?.name || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '已选角色' : 'Selected Roles'} value={selectedRoles.length} hint={copy.roleBindingDescription} />
        <DetailKeyValueItem label={language === 'zh' ? '账号状态' : 'Account Status'} value={formData.status === 'active' ? copy.statusEnabled : copy.statusDisabled} />
        <DetailKeyValueItem label={language === 'zh' ? '当前结论' : 'Current Outcome'} value={configOutcome} className="md:col-span-2" />
      </DetailKeyValueSection>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label={copy.username} required>
          <Input
            value={formData.username}
            onChange={(event) => updateField('username', event.target.value)}
          placeholder={copy.usernamePlaceholder}
          disabled={isEdit}
          className={fieldClassName}
        />
        </FormField>

        <FormField label={copy.realName} required>
          <Input
            value={formData.realName}
            onChange={(event) => updateField('realName', event.target.value)}
          placeholder={copy.realNamePlaceholder}
          className={fieldClassName}
        />
        </FormField>

        <FormField label={copy.email} required>
          <Input
            type="email"
            value={formData.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder={copy.emailPlaceholder}
          className={fieldClassName}
        />
        </FormField>

        <FormField label={copy.phone} required>
          <Input
            value={formData.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          placeholder={copy.phonePlaceholder}
          className={fieldClassName}
        />
        </FormField>

        {!isEdit && (
          <FormField label={copy.password} required>
            <Input
              type="password"
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder={copy.passwordPlaceholder}
              className={fieldClassName}
            />
          </FormField>
        )}

        <FormField label={copy.department} required>
          <Select
            value={formData.departmentId?.toString()}
            onValueChange={(value) => updateField('departmentId', value as ID)}
        >
          <SelectTrigger className={fieldClassName}>
            <SelectValue placeholder={copy.departmentPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id.toString()}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </FormField>

        <FormField label={copy.role} required description={copy.roleBindingDescription}>
          <div className="space-y-4 rounded-[28px] border border-slate-200/70 bg-slate-50/85 p-5 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.3)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-800">{copy.role}</div>
            <div className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500">
              {copy.selectedCount}: {selectedRoles.length}
            </div>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {roles.map((role) => {
              const checked = (formData.roleIds || []).some((id) => String(id) === String(role.id));
              return (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/88 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => toggleRole(role.id, nextChecked === true)}
                  />
                  <span className="text-sm font-medium text-slate-700">{role.name}</span>
                </label>
              );
            })}
          </div>

          <div className="flex min-h-10 flex-wrap gap-2">
            {selectedRoles.length > 0 ? (
              selectedRoles.map((role) => (
                <Badge
                  key={role.id}
                  variant="outline"
                  className="rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-blue-700"
                >
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-500">{copy.selectedRolesEmpty}</span>
            )}
          </div>
        </div>
        </FormField>

        <FormField label={copy.status} required>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField('status', value as UserFormData['status'])}
        >
          <SelectTrigger className={fieldClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{copy.statusEnabled}</SelectItem>
            <SelectItem value="inactive">{copy.statusDisabled}</SelectItem>
          </SelectContent>
        </Select>
        </FormField>

        <div className="md:col-span-2">
          <FormField label={copy.remark}>
            <Textarea
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder={copy.remarkPlaceholder}
              className={`resize-none ${fieldClassName}`}
              rows={3}
            />
          </FormField>
        </div>
      </div>

      <DetailKeyValueSection
        eyebrow="REVIEW"
        title={language === 'zh' ? '保存前检查' : 'Pre-save Review'}
        description={language === 'zh' ? '提交前建议核对用户名、部门与角色范围。' : 'Review username, department, and role scope before submitting.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '用户名' : 'Username'} value={formData.username || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '部门归属' : 'Department Ownership'} value={selectedDepartment?.name || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '角色摘要' : 'Role Summary'} value={selectedRoles.map((role) => role.name).join(' / ') || '-'} hint={language === 'zh' ? '建议至少保留一个明确业务角色。' : 'Prefer keeping at least one clear business role.'} />
        <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认部门与角色范围匹配后再保存。' : 'Confirm department and role scope are aligned before saving.'} />
      </DetailKeyValueSection>
    </div>
  );
}











