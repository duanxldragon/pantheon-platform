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
import { DetailKeyValueItem, DetailKeyValueSection } from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { getMenuLabel } from '../../../../../shared/constants/views_config';
import { useLanguageStore } from '../../../../../stores/language_store';
import type { Menu, PermissionFormData } from '../../../types';
import { getPermissionModuleOptions, normalizePermissionModule } from '../module_localization';
import { getPermissionManagementCopy } from '../permission_management_copy';

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
  const selectedMenu = useMemo(
    () => menus.find((menu) => String(menu.id) === String(formData.menuId ?? '')),
    [formData.menuId, menus],
  );
  const currentTypeLabel =
    copy.typeOptions.find((type) => type.value === formData.type)?.label || formData.type || '-';
  const currentModuleLabel =
    moduleOptions.find((module) => module.value === formData.module)?.label || formData.module || copy.none;
  const configOutcome = formData.type === 'data'
    ? (language === 'zh' ? '当前权限更偏向数据范围或数据访问控制。' : 'This permission is oriented toward data scope or data access control.')
    : formData.type === 'menu'
      ? (language === 'zh' ? '当前权限将直接参与菜单授权与可见范围控制。' : 'This permission will directly participate in menu authorization and visibility control.')
      : formData.type === 'field'
        ? (language === 'zh' ? '当前权限适合用于字段级读写控制。' : 'This permission is suitable for field-level access control.')
        : (language === 'zh' ? '当前权限更适合作为操作行为授权点。' : 'This permission is best suited as an action-level authorization point.');

  return (
    <div className="space-y-6">
      <DetailKeyValueSection
        eyebrow="CONFIG"
        title={language === 'zh' ? '权限配置摘要' : 'Permission Config Summary'}
        description={language === 'zh' ? '填写前先确认权限类型、模块归属和菜单关联方式。' : 'Confirm type, module ownership, and menu relation before saving.'}
      >
        <DetailKeyValueItem
          label={language === 'zh' ? '权限类型' : 'Permission Type'}
          value={currentTypeLabel}
        />
        <DetailKeyValueItem
          label={language === 'zh' ? '所属模块' : 'Module'}
          value={currentModuleLabel}
        />
        <DetailKeyValueItem
          label={language === 'zh' ? '关联菜单' : 'Related Menu'}
          value={selectedMenu ? getMenuLabel(selectedMenu, language, t) : copy.none}
          hint={selectedMenu ? (language === 'zh' ? '有助于在菜单侧定位该权限。' : 'Helps map this permission back to a menu entry.') : (language === 'zh' ? '当前未绑定菜单。' : 'No menu binding selected.')}
        />
        <DetailKeyValueItem
          label={language === 'zh' ? '当前结论' : 'Current Outcome'}
          value={configOutcome}
          className="md:col-span-2"
        />
      </DetailKeyValueSection>

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

      <DetailKeyValueSection
        eyebrow="REVIEW"
        title={language === 'zh' ? '保存前检查' : 'Pre-save Review'}
        description={language === 'zh' ? '提交前建议快速核对编码规范、模块归属与菜单关联。' : 'Quickly review code style, module ownership, and menu relation before submitting.'}
      >
        <DetailKeyValueItem
          label={language === 'zh' ? '权限编码' : 'Permission Code'}
          value={formData.code || '-'}
          hint={language === 'zh' ? '建议一条编码只表达一个动作。' : 'Prefer one clear action per permission code.'}
        />
        <DetailKeyValueItem
          label={language === 'zh' ? '模块归属' : 'Module Ownership'}
          value={currentModuleLabel}
          hint={language === 'zh' ? '建议与菜单、角色授权分层保持一致。' : 'Keep it aligned with menu and role-authorization layers.'}
        />
        <DetailKeyValueItem
          label={language === 'zh' ? '菜单关联' : 'Menu Relation'}
          value={selectedMenu ? getMenuLabel(selectedMenu, language, t) : copy.none}
          hint={language === 'zh' ? '菜单权限或操作权限通常建议绑定菜单。' : 'Menu and operation permissions usually benefit from menu binding.'}
        />
        <DetailKeyValueItem
          label={language === 'zh' ? '建议动作' : 'Recommended Action'}
          value={language === 'zh' ? '确认编码、模块、菜单三者语义一致后再保存。' : 'Confirm code, module, and menu semantics are aligned before saving.'}
        />
      </DetailKeyValueSection>
    </div>
  );
}












