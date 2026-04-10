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
import { useLanguageStore } from '../../../../../stores/language_store';
import type { Department, PositionFormData } from '../../../types';
import { getPositionManagementCopy } from '../position_management_copy';

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
  const copy = getPositionManagementCopy(language).form;
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

  const selectedDepartment = useMemo(
    () =>
      formData.departmentId != null
        ? departments.find((department) => String(department.id) === String(formData.departmentId))
        : undefined,
    [departments, formData.departmentId],
  );
  const selectedLevelLabel = copy.levels.find((option) => option.value === formData.level)?.label || '-';
  const configOutcome = selectedDepartment
    ? (language === 'zh' ? '当前岗位将挂接到指定部门，适合继续确认职责与任职要求。' : 'This position will be attached to the selected department; continue by confirming responsibilities and requirements.')
    : (language === 'zh' ? '当前岗位尚未绑定部门，保存前需明确组织归属。' : 'This position is not linked to a department yet; confirm its organization ownership before saving.');

  return (
    <div className="space-y-6">
      <DetailKeyValueSection
        eyebrow="CONFIG"
        title={language === 'zh' ? '岗位配置摘要' : 'Position Config Summary'}
        description={language === 'zh' ? '填写前先确认部门归属、岗位级别和状态。' : 'Confirm department ownership, level, and status before saving.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '所属部门' : 'Department'} value={selectedDepartment?.name || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '岗位级别' : 'Level'} value={selectedLevelLabel} />
        <DetailKeyValueItem label={language === 'zh' ? '岗位状态' : 'Position Status'} value={formData.status === 'active' ? copy.active : copy.inactive} />
        <DetailKeyValueItem label={language === 'zh' ? '当前结论' : 'Current Outcome'} value={configOutcome} className="md:col-span-2" />
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
              {copy.categories.map((option) => (
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
              {copy.levels.map((option) => (
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

      <DetailKeyValueSection
        eyebrow="REVIEW"
        title={language === 'zh' ? '保存前检查' : 'Pre-save Review'}
        description={language === 'zh' ? '提交前建议核对部门、级别与岗位职责是否一致。' : 'Review department, level, and responsibilities before submitting.'}
      >
        <DetailKeyValueItem label={language === 'zh' ? '部门归属' : 'Department Ownership'} value={selectedDepartment?.name || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '岗位类别' : 'Category'} value={formData.category || '-'} />
        <DetailKeyValueItem label={language === 'zh' ? '职责摘要' : 'Responsibilities'} value={formData.responsibilities || '-'} hint={language === 'zh' ? '建议职责与任职要求保持匹配。' : 'Keep responsibilities aligned with requirements.'} />
        <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认部门、级别与职责匹配后再保存。' : 'Confirm department, level, and responsibilities are aligned before saving.'} />
      </DetailKeyValueSection>
    </div>
  );
}











