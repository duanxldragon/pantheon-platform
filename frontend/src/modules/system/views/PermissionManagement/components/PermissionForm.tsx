import { useEffect, useMemo, useState } from 'react';

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
import { getMenuLabel } from '../../../../../shared/constants/viewsConfig';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, PermissionFormData } from '../../../types';
import { getPermissionModuleOptions, normalizePermissionModule } from '../moduleLocalization';
import { getPermissionManagementCopy } from '../permissionManagementCopy';

interface PermissionFormProps {
  data?: Partial<PermissionFormData>;
  menus?: Menu[];
  onChange: (data: Partial<PermissionFormData>) => void;
  isEdit?: boolean;
}

const defaultFormData: Partial<PermissionFormData> = {
  code: '',
  name: '',
  type: 'operation',
  module: '',
  menuId: undefined,
  description: '',
};

export function PermissionForm({ data = {}, menus = [], onChange, isEdit = false }: PermissionFormProps) {
  const { language, t } = useLanguageStore();
  const [formData, setFormData] = useState<Partial<PermissionFormData>>({
    ...defaultFormData,
    ...data,
    module: normalizePermissionModule(data.module),
  });
  const copy = getPermissionManagementCopy(language).form;
  const fieldClassName =
    'rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';

  useEffect(() => {
    setFormData({
      ...defaultFormData,
      ...data,
      module: normalizePermissionModule(data.module),
    });
  }, [data]);

  const updateField = <K extends keyof PermissionFormData>(field: K, value: PermissionFormData[K]) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    onChange(nextData);
  };

  const moduleOptions = useMemo(() => getPermissionModuleOptions(language), [language]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label={copy.code} required>
          <Input
            placeholder={copy.codePlaceholder}
            value={formData.code || ''}
            onChange={(event) => updateField('code', event.target.value)}
            disabled={isEdit}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.name} required>
          <Input
            placeholder={copy.namePlaceholder}
            value={formData.name || ''}
            onChange={(event) => updateField('name', event.target.value)}
            className={fieldClassName}
          />
        </FormField>

        <FormField label={copy.type} required>
          <Select value={formData.type} onValueChange={(value) => updateField('type', value as PermissionFormData['type'])}>
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {copy.typeOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.module} required>
          <Select
            value={formData.module || undefined}
            onValueChange={(value) => updateField('module', normalizePermissionModule(value))}
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder={copy.modulePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {moduleOptions.map((module) => (
                <SelectItem key={module.value} value={module.value}>
                  {module.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {(formData.type === 'menu' || formData.type === 'operation') && (
          <FormField label={copy.menu} className="md:col-span-2">
            <Select
              value={formData.menuId != null ? String(formData.menuId) : 'none'}
              onValueChange={(value) => updateField('menuId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder={copy.menuPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{copy.none}</SelectItem>
                {menus.map((menu) => (
                  <SelectItem key={String(menu.id)} value={String(menu.id)}>
                    {getMenuLabel(menu, language, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      <FormField label={copy.description}>
        <Textarea
          placeholder={copy.descriptionPlaceholder}
          value={formData.description || ''}
          onChange={(event) => updateField('description', event.target.value)}
          rows={4}
          className={`resize-none ${fieldClassName}`}
        />
      </FormField>

      <div className="rounded-[28px] border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-[0_18px_36px_-30px_rgba(59,130,246,0.32)]">
        <h4 className="mb-3 text-sm font-semibold text-blue-900">{copy.guideTitle}</h4>
        <ul className="space-y-2 text-sm leading-6 text-blue-700">
          {copy.guideItems.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
