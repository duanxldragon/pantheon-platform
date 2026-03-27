import React from 'react';
import { Label } from '../../../../../components/ui/label';
import { Input } from '../../../../../components/ui/input';
import { Switch } from '../../../../../components/ui/switch';
import { Textarea } from '../../../../../components/ui/textarea';
import { Badge } from '../../../../../components/ui/badge';
import { 
  Info, 
  Lock, 
  AlertCircle,
  Settings2,
  CheckCircle2
} from 'lucide-react';

interface SettingItem {
  key: string;
  label: string;
  description: string;
  value: any;
  type: string;
  options?: string[];
  editable: boolean;
  required?: boolean;
}

interface SettingsFormGroupProps {
  section: {
    title: string;
    description: string;
    settings: SettingItem[];
  };
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const SettingsFormGroup: React.FC<SettingsFormGroupProps> = ({ 
  section, 
  values, 
  onChange 
}) => {
  
  const renderField = (item: SettingItem) => {
    const value = values.hasOwnProperty(item.key) ? values[item.key] : item.value;
    const isModified = values.hasOwnProperty(item.key) && values[item.key] !== item.value;

    return (
      <div key={item.key} className={`group relative p-5 rounded-3xl border transition-all duration-300 ${
        isModified ? 'border-primary/30 bg-primary/5 shadow-md shadow-primary/5' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}>
        {isModified && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-full shadow-lg shadow-primary/50" />
        )}

        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800 tracking-tight">{item.label}</span>
              {item.required && <Badge className="h-4 px-1.5 text-[9px] bg-rose-50 text-rose-500 border-rose-100 font-bold uppercase">Required</Badge>}
              {!item.editable && <Lock className="w-3.5 h-3.5 text-slate-300" />}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {item.description}
            </p>
          </div>

          <div className="flex-none min-w-[240px] flex justify-end">
            {item.type === 'boolean' ? (
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${value ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {value ? 'Enabled' : 'Disabled'}
                </span>
                <Switch 
                  checked={value} 
                  onCheckedChange={(checked) => onChange(item.key, checked)}
                  disabled={!item.editable}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            ) : item.type === 'textarea' ? (
              <Textarea 
                value={value} 
                onChange={(e) => onChange(item.key, e.target.value)}
                disabled={!item.editable}
                className="min-h-[100px] bg-slate-50 border-slate-100 rounded-2xl font-mono text-xs focus:bg-white transition-all"
              />
            ) : item.type === 'select' ? (
              <select 
                value={value} 
                onChange={(e) => onChange(item.key, e.target.value)}
                disabled={!item.editable}
                className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <Input 
                type={item.type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => onChange(item.key, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                disabled={!item.editable}
                className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-700 focus:bg-white transition-all"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{section.title}</h2>
        </div>
        <p className="text-sm text-slate-400 font-medium ml-12">{section.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-20">
        {section.settings.map(renderField)}
      </div>
    </div>
  );
};

