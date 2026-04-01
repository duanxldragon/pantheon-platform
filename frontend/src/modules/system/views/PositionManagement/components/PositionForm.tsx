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
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Department, PositionFormData } from '../../../types';

interface PositionFormProps {
  data?: Partial<PositionFormData>;
  departments: Department[];
  onChange: (data: Partial<PositionFormData>) => void;
  isEdit?: boolean;
}

const defaultFormData: Partial<PositionFormData> = {
  name: '',
  code: '',
  departmentId: null,
  category: '',
  level: 1,
  sort: 0,
  status: 'active',
  responsibilities: '',
  requirements: '',
  description: '',
};

export function PositionForm({ data = {}, departments, onChange }: PositionFormProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [formData, setFormData] = useState<Partial<PositionFormData>>({
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

  const updateField = <K extends keyof PositionFormData>(field: K, value: PositionFormData[K]) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    onChange(nextData);
  };

  const categoryOptions = useMemo(
    () =>
      zh
        ? [
            { value: '技术岗', label: '技术岗' },
            { value: '产品岗', label: '产品岗' },
            { value: '运营岗', label: '运营岗' },
            { value: '管理岗', label: '管理岗' },
            { value: '其他', label: '其他' },
          ]
        : [
            { value: '技术岗', label: 'Technical' },
            { value: '产品岗', label: 'Product' },
            { value: '运营岗', label: 'Operations' },
            { value: '管理岗', label: 'Management' },
            { value: '其他', label: 'Other' },
          ],
    [zh],
  );

  const levelOptions = useMemo(
    () =>
      zh
        ? [
            { value: 1, label: 'P1 - 初级' },
            { value: 2, label: 'P2 - 中级' },
            { value: 3, label: 'P3 - 高级' },
            { value: 4, label: 'P4 - 资深' },
            { value: 5, label: 'P5 - 专家' },
          ]
        : [
            { value: 1, label: 'P1 - Junior' },
            { value: 2, label: 'P2 - Mid' },
            { value: 3, label: 'P3 - Senior' },
            { value: 4, label: 'P4 - Staff' },
            { value: 5, label: 'P5 - Principal' },
          ],
    [zh],
  );

  const selectedDepartment = useMemo(
    () =>
      formData.departmentId != null
        ? departments.find((department) => String(department.id) === String(formData.departmentId))
        : undefined,
    [departments, formData.departmentId],
  );

  const copy = zh
    ? {
        name: '岗位名称',
        code: '岗位编码',
        department: '所属部门',
        departmentDescription: '岗位必须归属到一个有效部门。',
        category: '岗位类别',
        level: '岗位级别',
        sort: '排序',
        status: '状态',
        responsibilities: '岗位职责',
        requirements: '任职要求',
        description: '岗位说明',
        namePlaceholder: '请输入岗位名称',
        codePlaceholder: '请输入岗位编码',
        departmentPlaceholder: '请选择所属部门',
        categoryPlaceholder: '请选择岗位类别',
        levelPlaceholder: '请选择岗位级别',
        sortPlaceholder: '数字越小越靠前',
        responsibilitiesPlaceholder: '请输入岗位职责',
        requirementsPlaceholder: '请输入任职要求',
        descriptionPlaceholder: '请输入岗位说明',
        active: '启用',
        inactive: '禁用',
        relationTitle: '归属关系提示',
        relationDescription: '岗位保存前会校验所属部门是否存在且处于启用状态。',
        currentDepartmentPrefix: '当前部门：',
      }
    : {
        name: 'Position Name',
        code: 'Position Code',
        department: 'Department',
        departmentDescription: 'A position must belong to a valid department.',
        category: 'Category',
        level: 'Level',
        sort: 'Sort',
        status: 'Status',
        responsibilities: 'Responsibilities',
        requirements: 'Requirements',
        description: 'Description',
        namePlaceholder: 'Enter position name',
        codePlaceholder: 'Enter position code',
        departmentPlaceholder: 'Select department',
        categoryPlaceholder: 'Select category',
        levelPlaceholder: 'Select level',
        sortPlaceholder: 'Smaller numbers appear first',
        responsibilitiesPlaceholder: 'Enter responsibilities',
        requirementsPlaceholder: 'Enter requirements',
        descriptionPlaceholder: 'Enter position description',
        active: 'Active',
        inactive: 'Inactive',
        relationTitle: 'Assignment Hint',
        relationDescription: 'Before saving, the system validates that the selected department exists and is active.',
        currentDepartmentPrefix: 'Current department: ',
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

        <FormField label={copy.code} required>
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder={copy.codePlaceholder}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.department} required description={copy.departmentDescription}>
          <Select
            value={formData.departmentId != null ? String(formData.departmentId) : ''}
            onValueChange={(value) => updateField('departmentId', value)}
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.departmentPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={String(department.id)} value={String(department.id)}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.category}>
          <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.level}>
          <Select
            value={formData.level != null ? String(formData.level) : ''}
            onValueChange={(value) => updateField('level', Number(value))}
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.levelPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={formData.status} onValueChange={(value) => updateField('status', value as PositionFormData['status'])}>
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
          {selectedDepartment ? ` ${copy.currentDepartmentPrefix}${selectedDepartment.name}` : ''}
        </AlertDescription>
      </Alert>

      <FormField label={copy.responsibilities} className="md:col-span-2">
        <Textarea
          value={formData.responsibilities}
          onChange={(event) => updateField('responsibilities', event.target.value)}
          placeholder={copy.responsibilitiesPlaceholder}
          className={`resize-none ${fieldClassName}`}
          rows={3}
        />
      </FormField>

      <FormField label={copy.requirements} className="md:col-span-2">
        <Textarea
          value={formData.requirements}
          onChange={(event) => updateField('requirements', event.target.value)}
          placeholder={copy.requirementsPlaceholder}
          className={`resize-none ${fieldClassName}`}
          rows={3}
        />
      </FormField>

      <FormField label={copy.description} className="md:col-span-2">
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
