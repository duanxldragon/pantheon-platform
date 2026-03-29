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
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, PermissionFormData } from '../../../types';

interface PermissionFormProps {
  data?: Partial<PermissionFormData>;
  menus?: Menu[];
  onChange: (data: Partial<PermissionFormData>) => void;
  isEdit?: boolean;
}

export function PermissionForm({ data = {}, menus = [], onChange, isEdit = false }: PermissionFormProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [formData, setFormData] = useState<Partial<PermissionFormData>>({
    code: '',
    name: '',
    type: 'operation',
    module: '',
    menuId: undefined,
    description: '',
    ...data,
  });

  useEffect(() => {
    setFormData({
      code: '',
      name: '',
      type: 'operation',
      module: '',
      menuId: undefined,
      description: '',
      ...data,
    });
  }, [data]);

  const updateField = <K extends keyof PermissionFormData>(field: K, value: PermissionFormData[K]) => {
    const nextData = { ...formData, [field]: value };
    setFormData(nextData);
    onChange(nextData);
  };

  const moduleOptions = useMemo(
    () => [
      { value: '仪表盘', label: zh ? '仪表盘' : 'Dashboard' },
      { value: '主机管理', label: zh ? '主机管理' : 'Host Management' },
      { value: 'K8s 管理', label: zh ? 'K8s 管理' : 'K8s Management' },
      { value: '组件部署', label: zh ? '组件部署' : 'Component Deploy' },
      { value: '运维操作', label: zh ? '运维操作' : 'Operations' },
      { value: '告警中心', label: zh ? '告警中心' : 'Alerts' },
      { value: '系统管理', label: zh ? '系统管理' : 'System Management' },
      { value: '数据权限', label: zh ? '数据权限' : 'Data Scope' },
    ],
    [zh],
  );

  const permissionTypes = useMemo(
    () => [
      { value: 'menu', label: zh ? '菜单权限' : 'Menu Permission' },
      { value: 'operation', label: zh ? '操作权限' : 'Operation Permission' },
      { value: 'data', label: zh ? '数据权限' : 'Data Permission' },
      { value: 'field', label: zh ? '字段权限' : 'Field Permission' },
    ],
    [zh],
  );

  const copy = {
    code: zh ? '权限编码' : 'Permission Code',
    name: zh ? '权限名称' : 'Permission Name',
    type: zh ? '权限类型' : 'Permission Type',
    module: zh ? '所属模块' : 'Module',
    menu: zh ? '关联菜单' : 'Related Menu',
    description: zh ? '权限说明' : 'Description',
    codePlaceholder: zh ? '请输入权限编码，例如 system:user:view' : 'Enter permission code, e.g. system:user:view',
    namePlaceholder: zh ? '请输入权限名称' : 'Enter permission name',
    typePlaceholder: zh ? '请选择权限类型' : 'Select permission type',
    modulePlaceholder: zh ? '请选择所属模块' : 'Select module',
    menuPlaceholder: zh ? '请选择关联菜单，可为空' : 'Select related menu, optional',
    descriptionPlaceholder: zh ? '请输入权限说明' : 'Enter permission description',
    none: zh ? '无' : 'None',
    guideTitle: zh ? '权限编码规范' : 'Permission Code Guide',
    guideItems: zh
      ? [
          '建议格式：模块:资源:动作，例如 `system:user:view`。',
          '建议统一使用小写英文和冒号分隔，便于前后端校验。',
          '常见动作包括 `view`、`add`、`edit`、`delete`、`export`。',
          '一个权限编码只表达一个清晰动作，避免混合多个含义。',
        ]
      : [
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
          />
        </FormField>

        <FormField label={copy.name} required>
          <Input
            placeholder={copy.namePlaceholder}
            value={formData.name || ''}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </FormField>

        <FormField label={copy.type} required>
          <Select value={formData.type} onValueChange={(value) => updateField('type', value as PermissionFormData['type'])}>
            <SelectTrigger>
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
          <Select value={formData.module || undefined} onValueChange={(value) => updateField('module', value)}>
            <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder={copy.menuPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{copy.none}</SelectItem>
                {menus.map((menu) => (
                  <SelectItem key={String(menu.id)} value={String(menu.id)}>
                    {menu.name}
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
        />
      </FormField>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-blue-900">{copy.guideTitle}</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          {copy.guideItems.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
