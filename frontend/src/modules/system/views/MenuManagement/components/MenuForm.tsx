import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Link2, Route, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../../../../../components/ui/alert';
import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Switch } from '../../../../../components/ui/switch';
import { Textarea } from '../../../../../components/ui/textarea';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { TreeSelect } from '../../../../../shared/components/ui/TreeSelect';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, MenuFormData } from '../../../types';

interface MenuStatusHint {
  fieldDescription: string;
  title?: string;
  description?: string;
  tone?: 'info' | 'warning' | 'success';
}

interface MenuFormProps {
  data?: Partial<MenuFormData>;
  menus: Menu[];
  onChange: (data: Partial<MenuFormData>) => void;
  isEdit?: boolean;
  statusHint?: MenuStatusHint;
}

const iconOptions = [
  'LayoutDashboard',
  'Server',
  'Box',
  'Rocket',
  'Activity',
  'Settings',
  'Users',
  'Shield',
  'Menu',
  'FileText',
  'Folder',
  'File',
];

const defaultFormData: Partial<MenuFormData> = {
  name: '',
  code: '',
  path: '',
  icon: '',
  parentId: null,
  type: 'menu',
  sort: 0,
  status: 'active',
  visible: true,
  external: false,
  permissions: [],
  component: '',
  description: '',
};

const toneConfig = {
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50',
    titleClassName: 'text-blue-900',
    descriptionClassName: 'text-blue-800',
    iconClassName: 'text-blue-600',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-amber-200 bg-amber-50',
    titleClassName: 'text-amber-900',
    descriptionClassName: 'text-amber-800',
    iconClassName: 'text-amber-600',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50',
    titleClassName: 'text-emerald-900',
    descriptionClassName: 'text-emerald-800',
    iconClassName: 'text-emerald-600',
  },
} as const;

export function MenuForm({ data = {}, menus, onChange, isEdit = false, statusHint }: MenuFormProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [formData, setFormData] = useState<Partial<MenuFormData>>({
    ...defaultFormData,
    ...data,
  });
  const [permissionInput, setPermissionInput] = useState('');

  useEffect(() => {
    setFormData({
      ...defaultFormData,
      ...data,
    });
  }, [data]);

  const menuMap = useMemo(() => new Map((menus || []).map((menu) => [String(menu.id), menu])), [menus]);
  const selectedParent = formData.parentId != null ? menuMap.get(String(formData.parentId)) : undefined;

  const menuOptions = (menus || [])
    .filter((menu) => !isEdit || String(menu.id) !== String((data as { id?: string | number }).id ?? ''))
    .map((menu) => ({
      id: String(menu.id),
      name: menu.name,
      parentId: menu.parentId == null ? null : String(menu.parentId),
    }));

  const syncByType = (draft: Partial<MenuFormData>): Partial<MenuFormData> => {
    const next = { ...draft };

    if (next.type === 'directory') {
      next.external = false;
      next.component = '';
      if (next.parentId != null) {
        const parent = menuMap.get(String(next.parentId));
        if (parent && parent.type !== 'directory') {
          next.parentId = null;
        }
      }
    }

    if (next.type === 'button') {
      next.external = false;
      next.component = '';
      if (next.parentId != null) {
        const parent = menuMap.get(String(next.parentId));
        if (parent && parent.type !== 'menu') {
          next.parentId = null;
        }
      }
    }

    if (next.type === 'menu') {
      if (next.parentId != null) {
        const parent = menuMap.get(String(next.parentId));
        if (parent && parent.type === 'button') {
          next.parentId = null;
        }
      }
      if (next.external) {
        next.component = '';
      }
    }

    return next;
  };

  const updateData = (nextData: Partial<MenuFormData>) => {
    const normalized = syncByType(nextData);
    setFormData(normalized);
    onChange(normalized);
  };

  const updateField = <K extends keyof MenuFormData>(field: K, value: MenuFormData[K]) => {
    updateData({ ...formData, [field]: value });
  };

  const addPermission = () => {
    const value = permissionInput.trim();
    if (!value) {
      return;
    }

    const permissions = formData.permissions || [];
    if (!permissions.includes(value)) {
      updateField('permissions', [...permissions, value]);
    }
    setPermissionInput('');
  };

  const removePermission = (permission: string) => {
    updateField('permissions', (formData.permissions || []).filter((item) => item !== permission));
  };

  const copy = {
    name: zh ? '菜单名称' : 'Menu Name',
    code: zh ? '菜单编码' : 'Menu Code',
    type: zh ? '菜单类型' : 'Menu Type',
    parent: zh ? '上级菜单' : 'Parent Menu',
    path: zh ? '路由路径' : 'Route Path',
    icon: zh ? '图标' : 'Icon',
    component: zh ? '组件路径' : 'Component Path',
    sort: zh ? '排序' : 'Sort',
    status: zh ? '状态' : 'Status',
    external: zh ? '是否外链' : 'External Link',
    permissionCode: zh ? '权限标识' : 'Permission Codes',
    description: zh ? '菜单说明' : 'Description',
    codeDescription: zh ? '用于系统内部唯一标识菜单。' : 'Used as the unique internal identifier for the menu.',
    typeDescription: zh ? '切换类型后，父级、组件、外链等字段会自动联动调整。' : 'Switching type auto-adjusts parent, component, and external-link related fields.',
    parentDescription: {
      button: zh ? '按钮必须选择一个“菜单”类型的父级。' : 'A button must be placed under a menu node.',
      directory: zh ? '目录只允许挂在目录下，或作为顶级节点。' : 'A directory can stay under another directory or at the top level.',
      menu: zh ? '菜单可作为顶级节点，也可挂在目录或菜单下。' : 'A menu can be top-level or nested under a directory/menu.',
    },
    pathDescription: zh
      ? (formData.external ? '外链地址必须以 http:// 或 https:// 开头。' : '例如：/system/user')
      : (formData.external ? 'External links must start with http:// or https://.' : 'Example: /system/user'),
    componentDescription: zh
      ? (formData.type === 'menu'
          ? (formData.external ? '外链菜单不需要本地组件路径。' : '普通菜单必须配置前端页面组件路径。')
          : '目录和按钮不需要组件路径，提交时会自动清空。')
      : (formData.type === 'menu'
          ? (formData.external ? 'External menus do not require a local component path.' : 'Regular menus require a frontend component path.')
          : 'Directories and buttons do not need a component path and it will be cleared on submit.'),
    statusDescription: statusHint?.fieldDescription || (zh ? '修改状态后，保存时会再次确认。' : 'Status changes require confirmation before saving.'),
    externalDescription: zh ? '开启后菜单将以外部链接打开，不再使用本地组件。' : 'When enabled, the menu opens as an external link instead of a local component.',
    permissionDescription: zh ? '可为菜单维护一个或多个权限码。' : 'You can maintain one or more permission codes for this menu.',
    namePlaceholder: zh ? '请输入菜单名称' : 'Enter menu name',
    codePlaceholder: zh ? '请输入菜单编码' : 'Enter menu code',
    parentPlaceholder: zh ? '请选择上级菜单，不选则为顶级菜单' : 'Select a parent menu, or leave empty for top level',
    routePlaceholder: formData.external ? 'https://example.com' : '/system/user',
    iconPlaceholder: zh ? '请选择图标' : 'Select icon',
    componentPlaceholder: 'system/UserManagement',
    sortPlaceholder: zh ? '数字越小越靠前' : 'Smaller numbers appear first',
    permissionPlaceholder: zh ? '输入权限标识后按回车，例如 system:user:view' : 'Enter a permission code and press Enter, e.g. system:user:view',
    descriptionPlaceholder: zh ? '请输入菜单说明' : 'Enter menu description',
    add: zh ? '添加' : 'Add',
    active: zh ? '启用' : 'Active',
    inactive: zh ? '禁用' : 'Inactive',
    internalMenu: zh ? '内部菜单' : 'Internal Menu',
    externalMenu: zh ? '外链菜单' : 'External Menu',
    typeOption: {
      directory: zh ? '目录' : 'Directory',
      menu: zh ? '菜单' : 'Menu',
      button: zh ? '按钮' : 'Button',
    },
    typeHint: {
      directory: {
        title: zh ? '目录类型规则' : 'Directory Rules',
        description: zh
          ? '目录只用于承载导航层级，不挂载组件、不允许外链；若选择上级菜单，则上级也必须是目录。'
          : 'Directories only organize navigation levels. They do not mount components or external links, and their parent must also be a directory.',
      },
      button: {
        title: zh ? '按钮类型规则' : 'Button Rules',
        description: zh
          ? '按钮必须挂在某个菜单下，不能作为顶级节点，也不能配置组件或外链地址。'
          : 'Buttons must stay under a menu node and cannot be top-level, external, or bound to a component.',
      },
      menu: {
        title: formData.external ? (zh ? '外链菜单规则' : 'External Menu Rules') : (zh ? '菜单类型规则' : 'Menu Rules'),
        description: formData.external
          ? (zh
              ? '外链菜单的路由地址必须以 http:// 或 https:// 开头，且不再配置本地组件路径。'
              : 'External menus must use an http(s) URL and do not need a local component path.')
          : (zh
              ? '普通菜单需要配置前端组件路径；若选择上级节点，上级不能是按钮。'
              : 'Regular menus require a frontend component path, and their parent cannot be a button.'),
      },
    },
    currentParentPrefix: zh ? '当前父级：' : 'Current parent: ',
    externalHintTitle: zh ? '外链菜单提示' : 'External Menu Note',
    externalHintDescription: zh
      ? '外链菜单只保留菜单节点和跳转地址，不参与本地页面组件挂载。'
      : 'External menus only keep the node and target URL, and do not participate in local view mounting.',
  };

  const typeHint = copy.typeHint[formData.type || 'menu'];
  const statusTone = statusHint?.tone || 'info';
  const statusConfig = toneConfig[statusTone];
  const StatusIcon = statusConfig.icon;

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
            disabled={isEdit}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.type} required description={copy.typeDescription}>
          <Select value={formData.type} onValueChange={(value) => updateField('type', value)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="directory">{copy.typeOption.directory}</SelectItem>
              <SelectItem value="menu">{copy.typeOption.menu}</SelectItem>
              <SelectItem value="button">{copy.typeOption.button}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.parent} description={copy.parentDescription[formData.type || 'menu']}>
          <TreeSelect
            data={menuOptions}
            value={formData.parentId ?? null}
            onChange={(value) => updateField('parentId', value)}
            placeholder={copy.parentPlaceholder}
          />
        </FormField>

        <FormField label={copy.path} required description={copy.pathDescription}>
          <Input
            value={formData.path}
            onChange={(event) => updateField('path', event.target.value)}
            placeholder={copy.routePlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.icon}>
          <Select value={formData.icon} onValueChange={(value) => updateField('icon', value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={copy.iconPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={copy.component} description={copy.componentDescription}>
          <Input
            value={formData.component}
            onChange={(event) => updateField('component', event.target.value)}
            placeholder={copy.componentPlaceholder}
            className="bg-white"
            disabled={formData.type !== 'menu' || Boolean(formData.external)}
          />
        </FormField>

        <FormField label={copy.sort} required>
          <Input
            type="number"
            value={formData.sort}
            onChange={(event) => updateField('sort', Number(event.target.value) || 0)}
            placeholder={copy.sortPlaceholder}
            className="bg-white"
          />
        </FormField>

        <FormField label={copy.status} required description={copy.statusDescription}>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{copy.active}</SelectItem>
              <SelectItem value="inactive">{copy.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {formData.type === 'menu' ? (
          <FormField label={copy.external} description={copy.externalDescription}>
            <div className="flex items-center gap-3">
              <Switch
                checked={Boolean(formData.external)}
                onCheckedChange={(checked) => updateField('external', checked)}
              />
              <span className="text-sm text-gray-600">
                {formData.external ? copy.externalMenu : copy.internalMenu}
              </span>
            </div>
          </FormField>
        ) : null}
      </div>

      <Alert className="border-slate-200 bg-slate-50">
        <Route className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-900">{typeHint.title}</AlertTitle>
        <AlertDescription className="text-slate-700">
          {typeHint.description}
          {selectedParent ? ` ${copy.currentParentPrefix}${selectedParent.name} (${copy.typeOption[selectedParent.type]})` : ''}
        </AlertDescription>
      </Alert>

      {isEdit && statusHint?.title && statusHint.description ? (
        <Alert className={statusConfig.className}>
          <StatusIcon className={`h-4 w-4 ${statusConfig.iconClassName}`} />
          <AlertTitle className={statusConfig.titleClassName}>{statusHint.title}</AlertTitle>
          <AlertDescription className={statusConfig.descriptionClassName}>
            {statusHint.description}
          </AlertDescription>
        </Alert>
      ) : null}

      <FormField label={copy.permissionCode} description={copy.permissionDescription}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={permissionInput}
              onChange={(event) => setPermissionInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addPermission();
                }
              }}
              placeholder={copy.permissionPlaceholder}
              className="flex-1 bg-white"
            />
            <button
              type="button"
              onClick={addPermission}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {copy.add}
            </button>
          </div>

          {(formData.permissions || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(formData.permissions || []).map((permission) => (
                <Badge
                  key={permission}
                  variant="outline"
                  className="gap-1 border-blue-200 bg-blue-50 text-blue-700"
                >
                  {permission}
                  <button
                    type="button"
                    onClick={() => removePermission(permission)}
                    className="rounded-full p-0.5 hover:bg-blue-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </FormField>

      {formData.type === 'menu' && formData.external ? (
        <Alert className="border-indigo-200 bg-indigo-50">
          <Link2 className="h-4 w-4 text-indigo-600" />
          <AlertTitle className="text-indigo-900">{copy.externalHintTitle}</AlertTitle>
          <AlertDescription className="text-indigo-800">{copy.externalHintDescription}</AlertDescription>
        </Alert>
      ) : null}

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
