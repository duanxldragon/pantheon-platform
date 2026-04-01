import React from 'react';
import { Button } from '../../../../../components/ui/button';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../../../../../stores/languageStore';

interface SettingsActionFloatProps {
  isVisible: boolean;
  onSave: () => void;
  onReset: () => void;
  modifiedCount: number;
}

export const SettingsActionFloat: React.FC<SettingsActionFloatProps> = ({
  isVisible,
  onSave,
  onReset,
  modifiedCount,
}) => {
  const { t } = useLanguageStore();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-center gap-5 rounded-[28px] border border-slate-200/80 bg-white/92 px-6 py-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-r border-slate-200/80 pr-5 text-slate-900">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 shadow-inner shadow-amber-100/70">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{t.systemManagement.settingsPage.pendingSync}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {modifiedCount} {t.systemManagement.settingsPage.pendingSyncCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onReset}
            className="h-11 rounded-2xl px-5 font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t.systemManagement.settingsPage.resetChanges}
          </Button>
          <Button
            onClick={onSave}
            className="h-11 rounded-2xl px-8 font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            {t.systemManagement.settingsPage.syncNow}
          </Button>
        </div>
      </div>
    </div>
  );
};
