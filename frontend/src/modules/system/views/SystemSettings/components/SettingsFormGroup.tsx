import React from 'react';

import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';
import { Switch } from '../../../../../components/ui/switch';
import { Textarea } from '../../../../../components/ui/textarea';
import { Lock, Settings2 } from 'lucide-react';
import type { SettingsField, SettingsSection, SettingValue } from '../hooks/useSettingsLogic';

interface SettingsFormGroupProps {
  section: SettingsSection;
  values: Partial<Record<string, SettingValue>>;
  onChange: (key: string, value: SettingValue) => void;
  copy: {
    required: string;
    enabled: string;
    disabled: string;
  };
}

export const SettingsFormGroup: React.FC<SettingsFormGroupProps> = ({
  section,
  values,
  onChange,
  copy,
}) => {
  const renderField = (item: SettingsField) => {
    const value = Object.prototype.hasOwnProperty.call(values, item.key) ? values[item.key] : item.value;
    const isModified = Object.prototype.hasOwnProperty.call(values, item.key) && values[item.key] !== item.value;
    const booleanValue = typeof value === 'boolean' ? value : value === 'true';
    const inputValue = typeof value === 'string' || typeof value === 'number' ? value : '';

    return (
      <div
        key={item.key}
        className={`group relative rounded-3xl border p-5 transition-all duration-300 ${
          isModified
            ? 'border-primary/30 bg-primary/5 shadow-md shadow-primary/5'
            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
        }`}
      >
        {isModified && (
          <div className="absolute -left-1 top-1/2 h-8 w-2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        )}

        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-slate-800">{item.label}</span>
              {item.required ? (
                <Badge className="h-4 border-rose-100 bg-rose-50 px-1.5 text-[9px] font-bold uppercase text-rose-500">
                  {copy.required}
                </Badge>
              ) : null}
              {!item.editable ? <Lock className="h-3.5 w-3.5 text-slate-300" /> : null}
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-400">{item.description}</p>
          </div>

          <div className="flex min-w-[240px] flex-none justify-end">
            {item.type === 'boolean' ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    booleanValue ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                >
                  {booleanValue ? copy.enabled : copy.disabled}
                </span>
                <Switch
                  checked={booleanValue}
                  onCheckedChange={(checked) => onChange(item.key, checked)}
                  disabled={!item.editable}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            ) : item.type === 'textarea' ? (
              <Textarea
                value={inputValue}
                onChange={(e) => onChange(item.key, e.target.value)}
                disabled={!item.editable}
                className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50 font-mono text-xs transition-all focus:bg-white"
              />
            ) : item.type === 'select' ? (
              <select
                value={inputValue}
                onChange={(e) => onChange(item.key, e.target.value)}
                disabled={!item.editable}
                className="h-11 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
              >
                {item.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={item.type === 'number' ? 'number' : 'text'}
                value={inputValue}
                onChange={(e) => onChange(item.key, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                disabled={!item.editable}
                className="h-11 rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 shadow-sm shadow-slate-200/40 transition-all focus:bg-white"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 animate-in space-y-8 slide-in-from-bottom-4 duration-500">
      <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 px-6 py-5 shadow-inner shadow-slate-100/80">
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-2xl bg-primary p-2.5 shadow-lg shadow-primary/20">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900">{section.title}</h2>
        </div>
        <p className="ml-12 text-sm font-medium text-slate-500">{section.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-20">{section.settings.map(renderField)}</div>
    </div>
  );
};
