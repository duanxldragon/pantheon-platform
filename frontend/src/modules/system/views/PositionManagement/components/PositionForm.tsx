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
    () => [
      { value: '技术岗', label: zh ? '技术岗' : 'Technical' },
      { value: '产品岗', label: zh ? '产品岗' : 'Product' },
      { value: '运营岗', label: zh ? '运营岗' : 'Operations' },
      { value: '管理岗', label: zh ? '管理岗' : 'Management' },
      { value: '其他', label: zh ? '其他' : 'Other' },
    ],
    [zh],
  );

  const levelOptions = useMemo(
    () => [
      { value: 1, label: zh ? 'P1 - 初级' : 'P1 - Junior' },
      { value: 2, label: zh ? 'P2 - 中级' : 'P2 - Mid' },
      { value: 3, label: zh ? 'P3 - 高级' : 'P3 - Senior' },
      { value: 4, label: zh ? 'P4 - 资深' : 'P4 - Staff' },
      { value: 5, label: zh ? 'P5 - 专家' : 'P5 - Principal' },
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

  const copy = {
    name: zh ? '岗位名称' : 'Position Name',
    code: zh ? '岗位编码' : 'Position Code',
    department: zh ? '所属部门' : 'Department',
    departmentDescription: zh ? '岗位必须归属到一个有效部门。' : 'A position must belong to a valid department.',
    category: zh ? '岗位类别' : 'Category',
    level: zh ? '岗位级别' : 'Level',
    sort: zh ? '排序' : 'Sort',
    status: zh ? '状态' : 'Status',
    responsibilities: zh ? '岗位职责' : 'Responsibilities',
    requirements: zh ? '任职要求' : 'Requirements',
    description: zh ? '岗位说明' : 'Description',
    namePlaceholder: zh ? '请输入岗位名称' : 'Enter position name',
    codePlaceholder: zh ? '请输入岗位编码' : 'Enter position code',
    departmentPlaceholder: zh ? '请选择所属部门' : 'Select department',
    categoryPlaceholder: zh ? '请选择岗位类别' : 'Select category',
    levelPlaceholder: zh ? '请选择岗位级别' : 'Select level',
    sortPlaceholder: zh ? '数字越小越靠前' : 'Smaller numbers appear first',
    responsibilitiesPlaceholder: zh ? '请输入岗位职责' : 'Enter responsibilities',
    requirementsPlaceholder: zh ? '请输入任职要求' : 'Enter requirements',
    descriptionPlaceholder: zh ? '请输入岗位说明' : 'Enter position description',
    active: zh ? '启用' : 'Active',
    inactive: zh ? '禁用' : 'Inactive',
    relationTitle: zh ? '归属关系提示' : 'Assignment Hint',
    relationDescription: zh
      ? '岗位保存前会校验所属部门是否存在且处于启用状态。'
      : 'Before saving, the system validates that the selected department exists and is active.',
    currentDepartmentPrefix: zh ? '当前部门：' : 'Current department: ',
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

        <FormField label={copy.code} required>
          <Input
            value={formData.code}
            onChange={(event) => updateField('code', event.target.value)}
            placeholder={copy.codePlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.department} required description={copy.departmentDescription}>
          <Select
            value={formData.departmentId != null ? String(formData.departmentId) : ''}
            onValueChange={(value) => updateField('departmentId', value)}
          >
            <SelectTrigger className="bg-white">
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
            <SelectTrigger className="bg-white">
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
            <SelectTrigger className="bg-white">
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
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.status} required>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value as PositionFormData['status'])}>
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
          {selectedDepartment ? ` ${copy.currentDepartmentPrefix}${selectedDepartment.name}` : ''}
        </AlertDescription>
      </Alert>

      <FormField label={copy.responsibilities} className="md:col-span-2">
        <Textarea
          value={formData.responsibilities}
          onChange={(event) => updateField('responsibilities', event.target.value)}
          placeholder={copy.responsibilitiesPlaceholder}
          className="resize-none bg-white"
          rows={3}
        />
      </FormField>

      <FormField label={copy.requirements} className="md:col-span-2">
        <Textarea
          value={formData.requirements}
          onChange={(event) => updateField('requirements', event.target.value)}
          placeholder={copy.requirementsPlaceholder}
          className="resize-none bg-white"
          rows={3}
        />
      </FormField>

      <FormField label={copy.description} className="md:col-span-2">
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
