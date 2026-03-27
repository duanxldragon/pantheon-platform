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
import { FormField } from '../../../../../shared/components/ui/FormField';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { ID, UserFormData } from '../../../types';

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
  const { t, language } = useLanguageStore();
  const zh = language === 'zh';
  const formI18n = t.systemManagement.users.form;
  const [formData, setFormData] = useState<Partial<UserFormData>>(createDefaultFormData(data));

  useEffect(() => {
    setFormData(createDefaultFormData(data));
  }, [data]);

  const selectedRoles = useMemo(() => {
    const selectedRoleIds = new Set((formData.roleIds || []).map((id) => String(id)));
    return roles.filter((role) => selectedRoleIds.has(String(role.id)));
  }, [formData.roleIds, roles]);

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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FormField label={t.user.username} required>
        <Input
          value={formData.username}
          onChange={(event) => updateField('username', event.target.value)}
          placeholder={formI18n.usernamePlaceholder}
          disabled={isEdit}
          className="bg-white"
        />
      </FormField>

      <FormField label={t.user.realName} required>
        <Input
          value={formData.realName}
          onChange={(event) => updateField('realName', event.target.value)}
          placeholder={formI18n.realNamePlaceholder}
          className="bg-white"
        />
      </FormField>

      <FormField label={t.user.email} required>
        <Input
          type="email"
          value={formData.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder={formI18n.emailPlaceholder}
          className="bg-white"
        />
      </FormField>

      <FormField label={t.user.phone} required>
        <Input
          value={formData.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          placeholder={formI18n.phonePlaceholder}
          className="bg-white"
        />
      </FormField>

      {!isEdit && (
        <FormField label={t.user.password} required>
          <Input
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder={formI18n.passwordPlaceholder}
            className="bg-white"
          />
        </FormField>
      )}

      <FormField label={t.user.department} required>
        <Select
          value={formData.departmentId?.toString()}
          onValueChange={(value) => updateField('departmentId', value as ID)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder={formI18n.departmentPlaceholder} />
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

      <FormField
        label={t.user.role}
        required
        description={
          zh
            ? '用户可同时绑定多个角色，保存后将重新计算动态菜单与权限快照。'
            : 'A user can be assigned multiple roles. Saving recalculates menus and permission snapshots.'
        }
      >
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {roles.map((role) => {
              const checked = (formData.roleIds || []).some((id) => String(id) === String(role.id));
              return (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-100 px-3 py-2 transition-colors hover:bg-gray-50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(nextChecked) => toggleRole(role.id, nextChecked)}
                  />
                  <span className="text-sm text-gray-700">{role.name}</span>
                </label>
              );
            })}
          </div>

          <div className="flex min-h-8 flex-wrap gap-2">
            {selectedRoles.length > 0 ? (
              selectedRoles.map((role) => (
                <Badge
                  key={role.id}
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-700"
                >
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-500">
                {zh
                  ? '请至少选择一个角色。'
                  : 'Select at least one role.'}
              </span>
            )}
          </div>
        </div>
      </FormField>

      <FormField label={t.user.status} required>
        <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t.status.enabled}</SelectItem>
            <SelectItem value="inactive">{t.status.disabled}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="md:col-span-2">
        <FormField label={t.common.remark}>
          <Textarea
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder={formI18n.remarkPlaceholder}
            className="resize-none bg-white"
            rows={3}
          />
        </FormField>
      </div>
    </div>
  );
}
