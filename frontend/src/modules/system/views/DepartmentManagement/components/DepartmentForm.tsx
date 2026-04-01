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
  const fieldClassName =
    'rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

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

  const copy = zh
    ? {
        name: '部门名称',
        code: '部门编码',
        codeDescription: '用于系统内部唯一标识部门。',
        parent: '上级部门',
        parentDescription: '上级部门必须存在并处于启用状态。',
        leader: '负责人',
        leaderDescription: '负责人以用户身份保存，便于后续权限与组织关系扩展。',
        phone: '联系电话',
        email: '邮箱',
        sort: '排序',
        status: '状态',
        description: '部门说明',
        namePlaceholder: '请输入部门名称',
        codePlaceholder: '请输入部门编码',
        parentPlaceholder: '请选择上级部门，不选则为顶级部门',
        leaderPlaceholder: '请选择负责人',
        none: '无',
        phonePlaceholder: '请输入联系电话',
        emailPlaceholder: '请输入邮箱地址',
        sortPlaceholder: '数字越小越靠前',
        descriptionPlaceholder: '请输入部门说明',
        active: '启用',
        inactive: '禁用',
        relationTitle: '层级关系提示',
        relationDescription: '部门不能选择自己或自己的下级部门作为父级；保存时后端会再次校验。',
        currentParentPrefix: '当前父级：',
      }
    : {
        name: 'Department Name',
        code: 'Department Code',
        codeDescription: 'Used as the unique internal identifier for the department.',
        parent: 'Parent Department',
        parentDescription: 'The parent department must exist and stay active.',
        leader: 'Leader',
        leaderDescription: 'The leader is stored as a user identity for future permission and organization linkage.',
        phone: 'Phone',
        email: 'Email',
        sort: 'Sort',
        status: 'Status',
        description: 'Department Description',
        namePlaceholder: 'Enter department name',
        codePlaceholder: 'Enter department code',
        parentPlaceholder: 'Select a parent department, or leave empty for top level',
        leaderPlaceholder: 'Select leader',
        none: 'None',
        phonePlaceholder: 'Enter contact phone',
        emailPlaceholder: 'Enter email address',
        sortPlaceholder: 'Smaller numbers appear first',
        descriptionPlaceholder: 'Enter department description',
        active: 'Active',
        inactive: 'Inactive',
        relationTitle: 'Hierarchy Hint',
        relationDescription:
          'A department cannot choose itself or one of its descendants as the parent; the backend validates this again on save.',
        currentParentPrefix: 'Current parent: ',
      };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label={copy.name} required>
          <Input
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder={copy.namePlaceholder}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.code} required description={copy.codeDescription}>
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder={copy.codePlaceholder}
            className={fieldClassName}
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
            <SelectTrigger className={fieldClassName}>
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
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.email}>
          <Input
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder={copy.emailPlaceholder}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.sort}>
          <Input
            type="number"
            value={formData.sort}
            onChange={(event) => updateField('sort', Number(event.target.value) || 0)}
            placeholder={copy.sortPlaceholder}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.status} required>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value as DepartmentFormData['status'])}>
            <SelectTrigger className={fieldClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{copy.active}</SelectItem>
              <SelectItem value="inactive">{copy.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <Alert className="rounded-[28px] border border-slate-200/80 bg-slate-50/85 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.28)]">
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
          className={`resize-none ${fieldClassName}`}
          rows={3}
        />
      </FormField>
    </div>
  );
}
