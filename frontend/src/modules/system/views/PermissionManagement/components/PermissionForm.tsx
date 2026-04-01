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
  const zh = language === 'zh';
  const [formData, setFormData] = useState<Partial<PermissionFormData>>({
    ...defaultFormData,
    ...data,
    module: normalizePermissionModule(data.module),
  });
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
  const permissionTypes = useMemo(
    () => [
      { value: 'menu', label: zh ? '菜单权限' : 'Menu Permission' },
      { value: 'operation', label: zh ? '操作权限' : 'Operation Permission' },
      { value: 'data', label: zh ? '数据权限' : 'Data Permission' },
      { value: 'field', label: zh ? '字段权限' : 'Field Permission' },
    ],
    [zh],
  );

  const copy = zh
    ? {
        code: '权限编码',
        name: '权限名称',
        type: '权限类型',
        module: '所属模块',
        menu: '关联菜单',
        description: '权限说明',
        codePlaceholder: '请输入权限编码，例如 system:user:view',
        namePlaceholder: '请输入权限名称',
        typePlaceholder: '请选择权限类型',
        modulePlaceholder: '请选择所属模块',
        menuPlaceholder: '请选择关联菜单，可为空',
        descriptionPlaceholder: '请输入权限说明',
        none: '无',
        guideTitle: '权限编码建议',
        guideItems: [
          '建议格式：模块:资源:动作，例如 `system:user:view`。',
          '统一使用小写英文和冒号分隔，方便前后端做稳定校验。',
          '常见动作包括 `view`、`add`、`edit`、`delete`、`export`。',
          '一个权限编码只表达一个明确动作，避免混合多个含义。',
        ],
      }
    : {
        code: 'Permission Code',
        name: 'Permission Name',
        type: 'Permission Type',
        module: 'Module',
        menu: 'Related Menu',
        description: 'Description',
        codePlaceholder: 'Enter permission code, e.g. system:user:view',
        namePlaceholder: 'Enter permission name',
        typePlaceholder: 'Select permission type',
        modulePlaceholder: 'Select module',
        menuPlaceholder: 'Select related menu, optional',
        descriptionPlaceholder: 'Enter permission description',
        none: 'None',
        guideTitle: 'Permission Code Guide',
        guideItems: [
          'Recommended format: module:resource:action, e.g. `system:user:view`.',
          'Prefer lowercase words separated by colons for stable frontend/backend checks.',
          'Common actions include `view`, `add`, `edit`, `delete`, and `export`.',
          'A single permission code should represent one clear action only.',
        ],
      };

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
              {permissionTypes.map((type) => (
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
