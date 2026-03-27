import { useMemo, useState } from 'react';
import { Building2, CheckCircle2, Home, Loader2, Settings2, Zap } from 'lucide-react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { useLanguageStore } from '../../../stores/languageStore';
import { tenantDatabaseApi } from '../../tenant/api/tenantDatabaseApi';

type LoginMode = 'single' | 'tenant' | 'auto';

interface ModeOption {
  id: LoginMode;
  title: string;
  description: string;
  icon: typeof Home;
  highlights: string[];
}

const MODE_OPTIONS_ZH: ModeOption[] = [
  {
    id: 'single',
    title: '单体模式',
    description: '适用于平台管理员或单实例部署场景。',
    icon: Home,
    highlights: ['部署简单', '维护成本低', '适合平台管理员'],
  },
  {
    id: 'tenant',
    title: '租户模式',
    description: '适用于多租户独立数据隔离场景。',
    icon: Building2,
    highlights: ['数据库隔离', '权限独立', '支持租户初始化'],
  },
  {
    id: 'auto',
    title: '自动模式',
    description: '由系统根据当前环境推荐最合适的登录模式。',
    icon: Settings2,
    highlights: ['自动识别环境', '降低配置成本', '适合首次接入'],
  },
];

const MODE_OPTIONS_EN: ModeOption[] = [
  {
    id: 'single',
    title: 'Single Instance',
    description: 'Best for platform admin or standalone deployments.',
    icon: Home,
    highlights: ['Simple deployment', 'Low maintenance cost', 'Fits platform admins'],
  },
  {
    id: 'tenant',
    title: 'Tenant Mode',
    description: 'Best for multi-tenant scenarios with isolated data.',
    icon: Building2,
    highlights: ['Database isolation', 'Independent permissions', 'Supports tenant initialization'],
  },
  {
    id: 'auto',
    title: 'Auto Mode',
    description: 'Let the system recommend the best login mode for the current environment.',
    icon: Settings2,
    highlights: ['Auto-detect environment', 'Lower setup cost', 'Good for first-time access'],
  },
];

export function LoginModeSelector() {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const copy = {
    current: zh ? '当前模式' : 'Current',
    tenantCheck: zh ? '租户检查' : 'Tenant Check',
    tenantPlaceholder: zh ? '请输入租户代码' : 'Enter tenant code',
    checkTenant: zh ? '检查租户' : 'Check Tenant',
    checkBeforeInput: zh ? '请输入租户代码后再检查。' : 'Enter a tenant code before checking.',
    tenantReady: zh
      ? '租户已存在，且数据库已完成配置。'
      : 'Tenant exists and the database is already configured.',
    tenantPending: zh
      ? '租户存在，但数据库尚未初始化。'
      : 'Tenant exists, but the database has not been initialized yet.',
    tenantFailed: zh ? '租户状态检查失败。' : 'Failed to check tenant status',
  };

  const [selectedMode, setSelectedMode] = useState<LoginMode>('tenant');
  const [tenantCode, setTenantCode] = useState('');
  const [tenantMessage, setTenantMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const modeOptions = useMemo(() => (zh ? MODE_OPTIONS_ZH : MODE_OPTIONS_EN), [zh]);

  const selectedOption = useMemo(
    () => modeOptions.find((option) => option.id === selectedMode) ?? modeOptions[1],
    [modeOptions, selectedMode],
  );

  const checkTenant = async () => {
    if (!tenantCode.trim()) {
      setTenantMessage(copy.checkBeforeInput);
      return;
    }

    setIsChecking(true);
    setTenantMessage('');

    try {
      const status = await tenantDatabaseApi.getStatus(tenantCode.trim());
      setTenantMessage(status.databaseConfigured ? copy.tenantReady : copy.tenantPending);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.tenantFailed;
      setTenantMessage(message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {modeOptions.map((option) => {
          const Icon = option.icon;
          const active = option.id === selectedMode;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedMode(option.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                active ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`rounded-xl p-3 ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{option.title}</div>
                  {active && <Badge className="mt-1">{copy.current}</Badge>}
                </div>
              </div>
              <p className="text-sm text-slate-600">{option.description}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            {selectedOption.title}
          </CardTitle>
          <CardDescription>{selectedOption.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {selectedOption.highlights.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {selectedMode !== 'single' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-900">{copy.tenantCheck}</div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={tenantCode}
                  onChange={(event) => setTenantCode(event.target.value)}
                  placeholder={copy.tenantPlaceholder}
                />
                <Button type="button" onClick={checkTenant} disabled={isChecking}>
                  {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {copy.checkTenant}
                </Button>
              </div>
              {tenantMessage && <p className="text-sm text-slate-600">{tenantMessage}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginModeSelector;
