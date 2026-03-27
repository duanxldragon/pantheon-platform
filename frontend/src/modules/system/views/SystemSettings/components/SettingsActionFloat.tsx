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
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-center gap-6 px-6 py-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10 text-white">
          <div className="relative">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          </div>
          <div>
            <p className="text-sm font-bold leading-none">{t.systemManagement.settingsPage.pendingSync}</p>
            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest">
              {modifiedCount} {t.systemManagement.settingsPage.pendingSyncCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-2xl h-11 px-5 font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t.systemManagement.settingsPage.resetChanges}
          </Button>
          <Button
            onClick={onSave}
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-11 px-8 shadow-xl shadow-primary/30 font-bold active:scale-95 transition-all"
          >
            <Save className="w-4 h-4 mr-2" />
            {t.systemManagement.settingsPage.syncNow}
          </Button>
        </div>
      </div>
    </div>
  );
};

