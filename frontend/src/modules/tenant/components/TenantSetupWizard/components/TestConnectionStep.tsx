import { useEffect, useState } from 'react';

import { CheckCircle2, RefreshCcw, ShieldAlert, Terminal, Wifi } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { useLanguageStore } from '../../../../../stores/languageStore';
import tenantDatabaseApi from '../../../api/tenantDatabaseApi';
import type { DatabaseConnectionConfig, TestConnectionResult } from '../../../types';

interface TestConnectionStepProps {
  config: DatabaseConnectionConfig;
  onComplete: (result: TestConnectionResult) => void;
}

export function TestConnectionStep({ config, onComplete }: TestConnectionStepProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [result, setResult] = useState<TestConnectionResult | null>(null);

  const handleTest = async () => {
    setStatus('testing');
    try {
      const response = await tenantDatabaseApi.testConnection(config);
      setResult(response);
      setStatus(response.success ? 'success' : 'failed');
      onComplete(response);
    } catch (error) {
      const failedResult: TestConnectionResult = {
        success: false,
        message: error instanceof Error ? error.message : zh ? '连接测试失败' : 'Connection test failed',
      };
      setResult(failedResult);
      setStatus('failed');
      onComplete(failedResult);
    }
  };

  useEffect(() => {
    void handleTest();
  }, []);

  const targetLabel =
    config.databaseType === 'sqlite'
      ? config.filepath || (zh ? '本地文件' : 'Local File')
      : `${config.host || 'localhost'}:${config.port || '-'}`;
  const latencyLabel = typeof result?.latency === 'number' ? `${result.latency}ms` : zh ? '不可用' : 'n/a';
  const versionLabel = result?.version
    ? `${zh ? '版本' : 'Version'}: ${result.version}`
    : `${zh ? '版本' : 'Version'}: ${zh ? '不可用' : 'n/a'}`;

  return (
    <div className="animate-in slide-in-from-right-4 flex flex-col items-center py-8 duration-500">
      <div className="relative mb-8 h-48 w-48">
        <div
          className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-1000 ${
            status === 'testing' ? 'animate-spin border-primary/20' : 'border-transparent'
          }`}
        />

        <div
          className={`absolute inset-4 flex items-center justify-center rounded-full transition-all duration-500 ${
            status === 'testing'
              ? 'scale-110 bg-primary/5'
              : status === 'success'
                ? 'bg-emerald-50'
                : status === 'failed'
                  ? 'bg-rose-50'
                  : 'bg-slate-50'
          }`}
        >
          {status === 'testing' && <Wifi className="h-16 w-16 animate-pulse text-primary" />}
          {status === 'success' && <CheckCircle2 className="h-20 w-20 text-emerald-500" />}
          {status === 'failed' && <ShieldAlert className="h-20 w-20 text-rose-500" />}
        </div>
      </div>

      <div className="mb-10 max-w-md text-center">
        <h3 className="mb-2 text-2xl font-black text-slate-900">
          {status === 'testing'
            ? zh
              ? '正在连接数据库...'
              : 'Connecting to database...'
            : status === 'success'
              ? zh
                ? '连接成功'
                : 'Connection Succeeded'
              : zh
                ? '连接失败'
                : 'Connection Failed'}
        </h3>
        <p className="text-sm italic text-slate-500">
          {status === 'testing'
            ? zh
              ? `正在尝试连接 ${targetLabel}`
              : `Trying to connect to ${targetLabel}`
            : status === 'success'
              ? zh
                ? `连接校验通过，当前延迟 ${latencyLabel}`
                : `Connection verified. Current latency: ${latencyLabel}`
              : result?.message ||
                (zh ? '请检查网络访问、账号权限或数据库配置。' : 'Check network access, account privileges, or database settings.')}
        </p>
      </div>

      {status === 'failed' && (
        <Button onClick={handleTest} variant="outline" className="h-12 gap-2 rounded-xl px-8 text-primary">
          <RefreshCcw className="h-4 w-4" />
          {zh ? '重新测试' : 'Retry Test'}
        </Button>
      )}

      <div className="mt-8 w-full max-w-lg rounded-xl bg-slate-900 p-4 font-mono text-[10px] text-emerald-400 shadow-inner">
        <div className="mb-2 flex items-center gap-2 border-b border-slate-800 pb-2 opacity-50">
          <Terminal className="h-3 w-3" />
          <span>{zh ? '调试控制台' : 'DEBUG CONSOLE'}</span>
        </div>
        <p className="opacity-70">{'>'} {zh ? '连接引擎' : 'Connecting engine'}: {config.databaseType}</p>
        <p className="opacity-70">{'>'} {zh ? '目标地址' : 'Target'}: {targetLabel}</p>
        {config.username && <p className="opacity-70">{'>'} {zh ? '认证用户' : 'Authenticating user'}: {config.username}</p>}
        {status === 'testing' && <p className="animate-pulse">{'>'} {zh ? '等待握手响应...' : 'Waiting for handshake response...'}</p>}
        {status === 'success' && <p className="text-emerald-500">{'>'} {zh ? `连接已建立，延迟 ${latencyLabel}` : `Connection established. Latency: ${latencyLabel}`}</p>}
        {status === 'success' && <p className="text-emerald-500">{'>'} {versionLabel}</p>}
        {status === 'failed' && <p className="text-rose-500">{'>'} {zh ? '错误' : 'Error'}: {result?.message}</p>}
      </div>
    </div>
  );
}
