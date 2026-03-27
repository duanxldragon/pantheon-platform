import React from 'react';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';

import { Card } from '../../../../../components/ui/card';
import { useLanguageStore } from '../../../../../stores/languageStore';

interface LogStatsProps {
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  loading?: boolean;
}

export const LogStatsCards: React.FC<LogStatsProps> = ({ stats, loading }) => {
  const { t } = useLanguageStore();

  const cards = [
    {
      label: t.systemManagement.logs.stats.total,
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: t.modules.deploy.status.success,
      value: stats.success,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: t.modules.deploy.status.failed,
      value: stats.failed,
      icon: XCircle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="p-4 border-none shadow-sm bg-white/80 backdrop-blur-sm group hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${card.color}`}>{loading ? '--' : card.value.toLocaleString()}</p>
              </div>
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

