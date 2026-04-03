import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Link2, Route, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../../../components/ui/alert';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Switch } from '../../../../../components/ui/switch';
import { Textarea } from '../../../../../components/ui/textarea';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { TreeSelect } from '../../../../../shared/components/ui/TreeSelect';
import { getMenuLabel } from '../../../../../shared/constants/viewsConfig';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { Menu, MenuFormData } from '../../../types';
import { getMenuManagementCopy } from '../menuManagementCopy';

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

const iconOptions = ['LayoutDashboard', 'Server', 'Box', 'Rocket', 'Activity', 'Settings', 'Users', 'Shield', 'Menu', 'FileText', 'Folder', 'File'];
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
  info: { icon: Info, className: 'rounded-[24px] border border-blue-200/70 bg-blue-50/85 shadow-sm shadow-blue-100/60', titleClassName: 'text-blue-950', descriptionClassName: 'text-blue-900/80', iconClassName: 'text-blue-600' },
  warning: { icon: AlertCircle, className: 'rounded-[24px] border border-amber-200/70 bg-amber-50/85 shadow-sm shadow-amber-100/60', titleClassName: 'text-amber-950', descriptionClassName: 'text-amber-900/80', iconClassName: 'text-amber-600' },
  success: { icon: CheckCircle2, className: 'rounded-[24px] border border-emerald-200/70 bg-emerald-50/85 shadow-sm shadow-emerald-100/60', titleClassName: 'text-emerald-950', descriptionClassName: 'text-emerald-900/80', iconClassName: 'text-emerald-600' },
} as const;

export function MenuForm({ data = {}, menus, onChange, isEdit = false, statusHint }: MenuFormProps) {
  const { language, t } = useLanguageStore();
  const [formData, setFormData] = useState<Partial<MenuFormData>>({ ...defaultFormData, ...data });
  const [permissionInput, setPermissionInput] = useState('');
  const fieldClassName = 'rounded-2xl border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10';
  const copy = getMenuManagementCopy(language).form;

  useEffect(() => {
    setFormData({ ...defaultFormData, ...data });
  }, [data]);

  const menuMap = useMemo(() => new Map((menus || []).map((menu) => [String(menu.id), menu])), [menus]);
  const selectedParent = formData.parentId != null ? menuMap.get(String(formData.parentId)) : undefined;
  const menuOptions = (menus || [])
    .filter((menu) => !isEdit || String(menu.id) !== String((data as { id?: string | number }).id ?? ''))
    .map((menu) => ({ id: String(menu.id), name: getMenuLabel(menu, language, t), parentId: menu.parentId == null ? null : String(menu.parentId) }));

  const syncByType = (draft: Partial<MenuFormData>): Partial<MenuFormData> => {
    const next = { ...draft };
    if (next.type === 'directory') {
      next.external = false;
      next.component = '';
      if (next.parentId != null && menuMap.get(String(next.parentId))?.type !== 'directory') next.parentId = null;
    }
    if (next.type === 'button') {
      next.external = false;
      next.component = '';
      if (next.parentId != null && menuMap.get(String(next.parentId))?.type !== 'menu') next.parentId = null;
    }
    if (next.type === 'menu') {
      if (next.parentId != null && menuMap.get(String(next.parentId))?.type === 'button') next.parentId = null;
      if (next.external) next.component = '';
    }
    return next;
  };

  const updateData = (nextData: Partial<MenuFormData>) => {
    const normalized = syncByType(nextData);
    setFormData(normalized);
    onChange(normalized);
  };

  const updateField = <K extends keyof MenuFormData>(field: K, value: MenuFormData[K]) => updateData({ ...formData, [field]: value });
  const addPermission = () => {
    const value = permissionInput.trim();
    if (!value) return;
    const permissions = formData.permissions || [];
    if (!permissions.includes(value)) updateField('permissions', [...permissions, value]);
    setPermissionInput('');
  };
  const removePermission = (permission: string) => updateField('permissions', (formData.permissions || []).filter((item) => item !== permission));

  const typeHint = formData.external ? copy.externalTypeHint : copy.typeHint[formData.type || 'menu'];
  const statusConfig = toneConfig[statusHint?.tone || 'info'];
  const StatusIcon = statusConfig.icon;
  const pathDescription = formData.external
    ? copy.pathDescriptionExternal
    : copy.pathDescriptionInternal;
  const componentDescription = formData.type === 'menu'
    ? formData.external
      ? copy.componentDescriptionExternal
      : copy.componentDescriptionInternal
    : copy.componentDescriptionNonMenu;
  const routePlaceholder = formData.external
    ? copy.routePlaceholderExternal
    : copy.routePlaceholderInternal;
  const statusDescription = statusHint?.fieldDescription || copy.statusDescriptionDefault;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label={copy.name} required><Input value={formData.name} onChange={(event) => updateField('name', event.target.value)} placeholder={copy.namePlaceholder} className={fieldClassName} /></FormField>
        <FormField label={copy.code} required description={copy.codeDescription}><Input value={formData.code} onChange={(event) => updateField('code', event.target.value)} placeholder={copy.codePlaceholder} disabled={isEdit} className={fieldClassName} /></FormField>
        <FormField label={copy.type} required description={copy.typeDescription}>
          <Select value={formData.type} onValueChange={(value) => updateField('type', value as MenuFormData['type'])}>
            <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="directory">{copy.typeOption.directory}</SelectItem>
              <SelectItem value="menu">{copy.typeOption.menu}</SelectItem>
              <SelectItem value="button">{copy.typeOption.button}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={copy.parent} description={copy.parentDescription[formData.type || 'menu']}><TreeSelect data={menuOptions} value={formData.parentId ?? null} onChange={(value) => updateField('parentId', value == null ? null : String(value))} placeholder={copy.parentPlaceholder} /></FormField>
        <FormField label={copy.path} required description={pathDescription}><Input value={formData.path} onChange={(event) => updateField('path', event.target.value)} placeholder={routePlaceholder} className={fieldClassName} /></FormField>
        <FormField label={copy.icon}>
          <Select value={formData.icon} onValueChange={(value) => updateField('icon', value)}>
            <SelectTrigger className={fieldClassName}><SelectValue placeholder={copy.iconPlaceholder} /></SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              {iconOptions.map((icon) => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={copy.component} description={componentDescription}><Input value={formData.component} onChange={(event) => updateField('component', event.target.value)} placeholder={copy.componentPlaceholder} className={fieldClassName} disabled={formData.type !== 'menu' || Boolean(formData.external)} /></FormField>
        <FormField label={copy.sort} required><Input type="number" value={formData.sort} onChange={(event) => updateField('sort', Number(event.target.value) || 0)} placeholder={copy.sortPlaceholder} className={fieldClassName} /></FormField>
        <FormField label={copy.status} required description={statusDescription}>
          <Select value={formData.status} onValueChange={(value) => updateField('status', value as MenuFormData['status'])}>
            <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
              <SelectItem value="active">{copy.active}</SelectItem>
              <SelectItem value="inactive">{copy.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        {formData.type === 'menu' ? (
          <FormField label={copy.external} description={copy.externalDescription}>
            <div className="flex min-h-14 items-center justify-between rounded-[24px] border border-slate-200/80 bg-slate-50/85 px-4 py-3 shadow-sm shadow-slate-200/50">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-800">{copy.external}</div>
                <div className="text-xs text-slate-500">{formData.external ? copy.externalMenu : copy.internalMenu}</div>
              </div>
              <Switch checked={Boolean(formData.external)} onCheckedChange={(checked) => updateField('external', checked)} />
            </div>
          </FormField>
        ) : null}
      </div>

      <Alert className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 shadow-sm shadow-slate-200/60">
        <Route className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-900">{typeHint.title}</AlertTitle>
        <AlertDescription className="text-slate-700">{typeHint.description}{selectedParent ? ` ${copy.currentParentPrefix}${getMenuLabel(selectedParent, language, t)} (${copy.typeOption[selectedParent.type]})` : ''}</AlertDescription>
      </Alert>

      {isEdit && statusHint?.title && statusHint.description ? (
        <Alert className={statusConfig.className}>
          <StatusIcon className={`h-4 w-4 ${statusConfig.iconClassName}`} />
          <AlertTitle className={statusConfig.titleClassName}>{statusHint.title}</AlertTitle>
          <AlertDescription className={statusConfig.descriptionClassName}>{statusHint.description}</AlertDescription>
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
              className={`flex-1 ${fieldClassName}`}
            />
            <Button type="button" onClick={addPermission} className="h-11 rounded-2xl bg-primary px-4 shadow-[0_14px_28px_-16px_rgba(var(--primary),0.72)] transition-all hover:-translate-y-0.5 hover:bg-primary/92">{copy.add}</Button>
          </div>
          {(formData.permissions || []).length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-3">
              {(formData.permissions || []).map((permission) => (
                <Badge key={permission} variant="outline" className="gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-primary shadow-sm shadow-primary/5">
                  {permission}
                  <button type="button" onClick={() => removePermission(permission)} className="rounded-full p-0.5 text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </FormField>

      {formData.type === 'menu' && formData.external ? (
        <Alert className="rounded-[24px] border border-indigo-200/70 bg-indigo-50/85 shadow-sm shadow-indigo-100/60">
          <Link2 className="h-4 w-4 text-indigo-600" />
          <AlertTitle className="text-indigo-900">{copy.externalHintTitle}</AlertTitle>
          <AlertDescription className="text-indigo-800">{copy.externalHintDescription}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label={copy.description}>
        <Textarea value={formData.description} onChange={(event) => updateField('description', event.target.value)} placeholder={copy.descriptionPlaceholder} className={`resize-none ${fieldClassName}`} rows={3} />
      </FormField>
    </div>
  );
}
