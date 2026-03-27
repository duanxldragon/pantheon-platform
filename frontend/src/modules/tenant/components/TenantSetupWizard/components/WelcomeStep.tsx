import { ArrowRight, Database, ShieldCheck, Zap } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { useLanguageStore } from '../../../../../stores/languageStore';

interface WelcomeStepProps {
  onNext: () => void;
  targetTenantName?: string;
  managed?: boolean;
}

export function WelcomeStep({ onNext, targetTenantName, managed = false }: WelcomeStepProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const features = zh
    ? [
        { icon: Zap, title: '快速初始化', desc: '按步骤完成连接配置、测试和基础数据引导' },
        { icon: ShieldCheck, title: '租户隔离', desc: '为后续私有化、PaaS、SaaS 扩展保留统一底座' },
        { icon: Database, title: '多库支持', desc: '兼容 MySQL、PostgreSQL、SQLite 和 SQL Server' },
      ]
    : [
        { icon: Zap, title: 'Quick Start', desc: 'Complete connection setup, validation, and bootstrap step by step' },
        { icon: ShieldCheck, title: 'Tenant Isolation', desc: 'Keep one foundation for private, PaaS, and SaaS expansion' },
        { icon: Database, title: 'Multi-DB Support', desc: 'Works with MySQL, PostgreSQL, SQLite, and SQL Server' },
      ];

  return (
    <div className="animate-in fade-in zoom-in py-8 text-center duration-500">
      <div className="relative mb-8 inline-flex">
        <div className="flex h-24 w-24 rotate-12 items-center justify-center rounded-3xl bg-primary/10 transition-transform duration-500 hover:rotate-0">
          <Database className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-emerald-500 shadow-lg">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
      </div>

      <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900">
        {zh ? (
          <>
            开始配置
            <span className="text-primary">{managed && targetTenantName ? `「${targetTenantName}」` : '租户'}</span>
            数据库
          </>
        ) : (
          <>
            Start configuring the <span className="text-primary">tenant database</span>
          </>
        )}
      </h2>

      <p className="mx-auto mb-10 max-w-md leading-relaxed text-slate-500">
        {zh
          ? managed
            ? '创建租户后，可以在这里直接完成数据库初始化，让租户尽快进入可登录、可授权、可挂载业务模块的可用状态。'
            : '该向导会帮助你完成租户数据库初始化，并补齐默认管理员、超级管理员角色、菜单和权限模板。'
          : 'This wizard initializes the tenant database and bootstraps the default admin, super admin role, menus, and permissions.'}
      </p>

      <div className="mx-auto mb-12 grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((item) => (
          <div
            key={item.title}
            className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md"
          >
            <item.icon className="mx-auto mb-2 h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
            <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button onClick={onNext} size="lg" className="group h-14 rounded-2xl px-10 shadow-xl shadow-primary/20 transition-all active:scale-95">
        {zh ? '开始初始化' : 'Start Setup'}
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
