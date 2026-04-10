import React from 'react';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';

import { Card } from '../../../../../components/ui/card';
import { useLanguageStore } from '../../../../../stores/language_store';
import { getUnifiedLogManagementCopy } from '../unified_log_management_copy';

interface LogStatsProps {
  activeTab: 'login' | 'operation';
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  loading?: boolean;
}

export const LogStatsCards: React.FC<LogStatsProps> = ({ activeTab, stats, loading }) => {
  const { language } = useLanguageStore();
  const copy = getUnifiedLogManagementCopy(language).stats;
  const currentTabLabel = activeTab === 'login' ? copy.loginLogs : copy.operationLogs;
  const completionRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

  const cards = [
    {
      label: currentTabLabel,
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hint: copy.currentFilteredResults,
    },
    {
      label: copy.statusSuccess,
      value: stats.success,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hint: copy.completionRate(completionRate),
    },
    {
      label: copy.statusFailed,
      value: stats.failed,
      icon: XCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      hint: stats.failed > 0 ? copy.needsAttention : copy.noFailures,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="group rounded-[24px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-30px_rgba(15,23,42,0.28)]"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${card.color}`}>{loading ? '--' : card.value.toLocaleString()}</p>
              </div>
              <p className="text-xs text-slate-400">{loading ? copy.loadingHint : card.hint}</p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${card.bgColor}`}
            >
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};






