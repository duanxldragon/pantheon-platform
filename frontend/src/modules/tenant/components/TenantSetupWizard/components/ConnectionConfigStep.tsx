import { Database, FileCode, Lock, Server, User } from 'lucide-react';

import { Input } from '../../../../../components/ui/input';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { useLanguageStore } from '../../../../../stores/languageStore';
import type { DatabaseConnectionConfig, DatabaseType } from '../../../types';

interface ConnectionConfigStepProps {
  databaseType: DatabaseType;
  config: Partial<DatabaseConnectionConfig>;
  onChange: (updates: Partial<DatabaseConnectionConfig>) => void;
}

export function ConnectionConfigStep({ databaseType, config, onChange }: ConnectionConfigStepProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const isSqlite = databaseType === 'sqlite';

  return (
    <div className="animate-in slide-in-from-right-4 space-y-6 py-4 duration-500">
      <div className="mb-8 text-center">
        <h3 className="text-lg font-bold text-slate-900">{zh ? '配置连接信息' : 'Configure Connection Settings'}</h3>
        <p className="mt-1 text-xs text-slate-400">
          {zh
            ? '请填写租户数据库连接参数，系统将使用这些参数完成初始化和运行时接入。'
            : 'Fill in the tenant database connection details for initialization and runtime access.'}
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-100 bg-slate-50/50 p-8">
        {isSqlite ? (
          <FormField
            label={zh ? '数据库文件路径' : 'Database File Path'}
            required
            description={zh ? '适合单机或私有化轻量部署场景。' : 'Best for standalone or lightweight private deployments.'}
          >
            <div className="relative">
              <FileCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={config.filepath || ''}
                onChange={(event) => onChange({ filepath: event.target.value, database: config.database || 'pantheon' })}
                placeholder="/data/pantheon.db"
                className="h-12 rounded-xl bg-white pl-9"
              />
            </div>
          </FormField>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label={zh ? '主机地址' : 'Host'} required>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={config.host || ''}
                    onChange={(event) => onChange({ host: event.target.value })}
                    placeholder="127.0.0.1"
                    className="h-12 rounded-xl bg-white pl-9"
                  />
                </div>
              </FormField>

              <FormField label={zh ? '端口' : 'Port'} required>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    value={config.port || ''}
                    onChange={(event) => onChange({ port: Number(event.target.value) })}
                    placeholder="3306"
                    className="h-12 rounded-xl bg-white pl-9"
                  />
                </div>
              </FormField>
            </div>

            <FormField label={zh ? '数据库名' : 'Database Name'} required>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={config.database || ''}
                  onChange={(event) => onChange({ database: event.target.value })}
                  placeholder="pantheon_tenant_db"
                  className="h-12 rounded-xl bg-white pl-9"
                />
              </div>
            </FormField>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label={zh ? '用户名' : 'Username'} required>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={config.username || ''}
                    onChange={(event) => onChange({ username: event.target.value })}
                    placeholder="root"
                    className="h-12 rounded-xl bg-white pl-9"
                  />
                </div>
              </FormField>

              <FormField label={zh ? '密码' : 'Password'} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    value={config.password || ''}
                    onChange={(event) => onChange({ password: event.target.value })}
                    placeholder={zh ? '请输入数据库密码' : 'Enter database password'}
                    className="h-12 rounded-xl bg-white pl-9"
                  />
                </div>
              </FormField>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
