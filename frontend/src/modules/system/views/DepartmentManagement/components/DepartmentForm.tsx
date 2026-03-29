import { useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../../../../../components/ui/alert';
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
import { TreeSelect } from '../../../../../shared/components/ui/TreeSelect';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { DepartmentFormData, ID, User } from '../../../types';

interface DepartmentFormProps {
  data?: Partial<DepartmentFormData>;
  departments: Array<{ id: ID; name: string; parentId: ID | null; status?: string }>;
  users: User[];
  onChange: (data: Partial<DepartmentFormData>) => void;
  isEdit?: boolean;
}

const defaultFormData: Partial<DepartmentFormData> = {
  name: '',
  code: '',
  parentId: null,
  leaderId: undefined,
  leader: '',
  phone: '',
  email: '',
  sort: 0,
  status: 'active',
  description: '',
};

export function DepartmentForm({ data = {}, departments, users, onChange }: DepartmentFormProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [formData, setFormData] = useState<Partial<DepartmentFormData>>({
    ...defaultFormData,
    ...data,
  });

  useEffect(() => {
    setFormData({
      ...defaultFormData,
      ...data,
    });
  }, [data]);

  const updateField = <K extends keyof DepartmentFormData>(field: K, value: DepartmentFormData[K]) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    onChange(nextData);
  };

  const departmentOptions = useMemo(
    () =>
      (departments || []).map((department) => ({
        id: String(department.id),
        name: department.name,
        parentId: department.parentId == null ? null : String(department.parentId),
      })),
    [departments],
  );

  const selectedParent =
    formData.parentId != null
      ? departments.find((department) => String(department.id) === String(formData.parentId))
      : undefined;

  const copy = {
    name: zh ? '部门名称' : 'Department Name',
    code: zh ? '部门编码' : 'Department Code',
    codeDescription: zh ? '用于系统内部唯一标识部门。' : 'Used as the unique internal identifier for the department.',
    parent: zh ? '上级部门' : 'Parent Department',
    parentDescription: zh ? '上级部门必须存在且处于启用状态。' : 'The parent department must exist and stay active.',
    leader: zh ? '负责人' : 'Leader',
    leaderDescription: zh ? '负责人以用户身份保存，便于后续权限与组织关系扩展。' : 'The leader is stored as a user identity for future permission and organization linkage.',
    phone: zh ? '联系电话' : 'Phone',
    email: zh ? '邮箱' : 'Email',
    sort: zh ? '排序' : 'Sort',
    status: zh ? '状态' : 'Status',
    description: zh ? '部门说明' : 'Department Description',
    namePlaceholder: zh ? '请输入部门名称' : 'Enter department name',
    codePlaceholder: zh ? '请输入部门编码' : 'Enter department code',
    parentPlaceholder: zh ? '请选择上级部门，不选则为顶级部门' : 'Select a parent department, or leave empty for top level',
    leaderPlaceholder: zh ? '请选择负责人' : 'Select leader',
    none: zh ? '无' : 'None',
    phonePlaceholder: zh ? '请输入联系电话' : 'Enter contact phone',
    emailPlaceholder: zh ? '请输入邮箱' : 'Enter email address',
    sortPlaceholder: zh ? '数字越小越靠前' : 'Smaller numbers appear first',
    descriptionPlaceholder: zh ? '请输入部门说明' : 'Enter department description',
    active: zh ? '启用' : 'Active',
    inactive: zh ? '禁用' : 'Inactive',
    relationTitle: zh ? '层级关系提示' : 'Hierarchy Hint',
    relationDescription: zh
      ? '部门不能选择自己或自己的下级部门作为父级；保存时会按后端规则再次校验。'
      : 'A department cannot choose itself or one of its descendants as the parent; the backend validates this again on save.',
    currentParentPrefix: zh ? '当前父级：' : 'Current parent: ',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label={copy.name} required>
          <Input
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder={copy.namePlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.code} required description={copy.codeDescription}>
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder={copy.codePlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.parent} description={copy.parentDescription}>
          <TreeSelect
            data={departmentOptions}
            value={formData.parentId ?? null}
            onChange={(value) => updateField('parentId', value == null ? null : String(value))}
            placeholder={copy.parentPlaceholder}
          />
        </FormField>

        <FormField label={copy.leader} description={copy.leaderDescription}>
          <Select
            value={formData.leaderId != null ? String(formData.leaderId) : 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                updateField('leaderId', undefined);
                updateField('leader', '');
                return;
              }
              const leader = users.find((user) => String(user.id) === value);
              updateField('leaderId', value);
              updateField('leader', leader?.realName || leader?.username || '');
            }}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={copy.leaderPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{copy.none}</SelectItem>
              {users.map((user) => (
                <SelectItem key={String(user.id)} value={String(user.id)}>
                  {user.realName || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.phone}>
          <Input
            value={formData.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder={copy.phonePlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder={copy.emailPlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.sort}>
          <Input
            type="number"
            value={formData.sort}
            onChange={(event) => updateField('sort', Number(event.target.value) || 0)}
            placeholder={copy.sortPlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.status} required>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value as DepartmentFormData['status'])}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{copy.active}</SelectItem>
              <SelectItem value="inactive">{copy.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <Alert className="border-slate-200 bg-slate-50">
        <AlertCircle className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-900">{copy.relationTitle}</AlertTitle>
        <AlertDescription className="text-slate-700">
          {copy.relationDescription}
          {selectedParent ? ` ${copy.currentParentPrefix}${selectedParent.name}` : ''}
        </AlertDescription>
      </Alert>

      <FormField label={copy.description}>
        <Textarea
          value={formData.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder={copy.descriptionPlaceholder}
          className="resize-none bg-white"
          rows={3}
        />
      </FormField>
    </div>
  );
}
