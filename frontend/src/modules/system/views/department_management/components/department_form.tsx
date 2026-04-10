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
import { DetailKeyValueItem, DetailKeyValueSection } from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { TreeSelect } from '../../../../../shared/components/ui/tree_select';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { DepartmentFormData, ID, User } from '../../../types';
import { getDepartmentManagementCopy } from '../department_management_copy';

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
  const copy = getDepartmentManagementCopy(language).form;
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
  const selectedLeader =
    formData.leaderId != null
      ? users.find((user) => String(user.id) === String(formData.leaderId))
      : undefined;

  return (
    <div className="space-y-6">
      <DetailKeyValueSection
        eyebrow="CONFIG"
        title={language === 'zh' ? '部门配置摘要' : 'Department Config Summary'}
        description={language === 'zh' ? '填写前先确认层级关系、负责人和启停状态。' : 'Confirm hierarchy, leader, and status before saving.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '层级位置' : 'Hierarchy'} value={selectedParent ? selectedParent.name : (language === 'zh' ? '顶级部门' : 'Top-level department')} />
        <DetailKeyValueItem label={language === 'zh' ? '负责人' : 'Leader'} value={selectedLeader ? (selectedLeader.realName || selectedLeader.username) : copy.none} />
        <DetailKeyValueItem label={language === 'zh' ? '部门状态' : 'Department Status'} value={formData.status === 'active' ? copy.active : copy.inactive} />
        <DetailKeyValueItem label={language === 'zh' ? '当前结论' : 'Current Outcome'} value={selectedParent ? (language === 'zh' ? '当前部门将纳入既有组织树分支。' : 'This department will join an existing organization branch.') : (language === 'zh' ? '当前部门将作为新的根级组织节点创建。' : 'This department will be created as a new root organization node.')} className="md:col-span-2" />
      </DetailKeyValueSection>

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

      <DetailKeyValueSection
        eyebrow="REVIEW"
        title={language === 'zh' ? '保存前检查' : 'Pre-save Review'}
        description={language === 'zh' ? '提交前建议核对父级、负责人和联系方式。' : 'Review parent, leader, and contact details before submitting.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '父级部门' : 'Parent Department'} value={selectedParent ? selectedParent.name : copy.none} />
        <DetailKeyValueItem label={language === 'zh' ? '负责人' : 'Leader'} value={selectedLeader ? (selectedLeader.realName || selectedLeader.username) : copy.none} />
        <DetailKeyValueItem label={language === 'zh' ? '联系方式' : 'Contact'} value={formData.phone || formData.email || '-'} hint={language === 'zh' ? '建议至少补充一个联系方式。' : 'Prefer at least one contact channel.'} />
        <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认组织层级和负责人归属无误后再保存。' : 'Confirm hierarchy and leader ownership before saving.'} />
      </DetailKeyValueSection>
    </div>
  );
}












