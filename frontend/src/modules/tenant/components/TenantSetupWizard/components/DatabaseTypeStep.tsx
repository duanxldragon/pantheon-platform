import { Check } from 'lucide-react';

import { useLanguageStore } from '../../../../../stores/languageStore';
import type { DatabaseType } from '../../../types';

interface DatabaseTypeStepProps {
  onSelect: (type: DatabaseType) => void;
  selected?: DatabaseType;
}

export function DatabaseTypeStep({ onSelect, selected }: DatabaseTypeStepProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const types: Array<{ id: DatabaseType; name: string; desc: string; icon: string; color: string }> = [
    {
      id: 'mysql',
      name: 'MySQL',
      desc: zh ? '适合大多数业务系统，部署成熟，维护成本较低。' : 'Fits most business systems with mature deployment and low maintenance cost.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      color: 'hover:border-blue-400 hover:bg-blue-50/30',
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      desc: zh ? '适合复杂查询、分析型场景和更强一致性要求。' : 'Ideal for complex queries, analytics, and strong consistency scenarios.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
      color: 'hover:border-indigo-400 hover:bg-indigo-50/30',
    },
    {
      id: 'sqlite',
      name: 'SQLite',
      desc: zh ? '适合单机、私有化轻量部署以及开发环境。' : 'Suitable for standalone, lightweight private deployments, and development environments.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg',
      color: 'hover:border-slate-400 hover:bg-slate-50/30',
    },
    {
      id: 'mssql',
      name: 'SQL Server',
      desc: zh ? '适合既有微软生态或企业统一技术栈。' : 'Suitable for existing Microsoft ecosystems or unified enterprise stacks.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg',
      color: 'hover:border-emerald-400 hover:bg-emerald-50/30',
    },
  ];

  return (
    <div className="animate-in slide-in-from-right-4 space-y-6 py-4 duration-500">
      <div className="mb-10 text-center">
        <h3 className="text-lg font-bold text-slate-900">{zh ? '选择数据库引擎' : 'Choose a Database Engine'}</h3>
        <p className="mt-1 text-xs text-slate-400">
          {zh ? '系统会根据你的选择生成对应的初始化连接配置。' : 'The system will prepare initialization settings based on your choice.'}
        </p>
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4">
        {types.map((type) => {
          const active = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`group relative flex items-center gap-6 rounded-3xl border-2 p-6 text-left transition-all duration-300 ${
                active ? 'scale-[1.02] border-primary bg-primary/5 shadow-lg shadow-primary/5' : `border-slate-100 bg-white ${type.color}`
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-50 bg-white p-3 shadow-sm ${
                  active ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <img src={type.icon} alt={type.name} className="h-full w-full object-contain" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${active ? 'text-primary' : 'text-slate-800'}`}>{type.name}</span>
                  {active && (
                    <div className="rounded-full bg-primary p-0.5 text-white">
                      <Check className="h-3 w-3" strokeWidth={4} />
                    </div>
                  )}
                </div>
                <p className="max-w-md text-xs italic leading-relaxed text-slate-500">{type.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
