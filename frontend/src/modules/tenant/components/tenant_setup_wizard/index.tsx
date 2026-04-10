import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../../../../components/ui/button';
import { useLanguageStore } from '../../../../stores/language_store';
import { useTenantSetupWizard } from '../../hooks';
import type { DatabaseConnectionConfig } from '../../types';
import type { TenantSetupResult } from '../../types';
import { CompleteStep } from './components/complete_step';
import { ConnectionConfigStep } from './components/connection_config_step';
import { DatabaseTypeStep } from './components/database_type_step';
import { TestConnectionStep } from './components/test_connection_step';
import { WelcomeStep } from './components/welcome_step';

interface TenantSetupWizardProps {
  embedded?: boolean;
  targetTenantId?: string;
  targetTenantName?: string;
  targetTenantCode?: string;
  onCompleted?: (tenantId: string, result?: TenantSetupResult) => void | Promise<void>;
}

export function TenantSetupWizard({
  embedded = false,
  targetTenantId,
  targetTenantName,
  targetTenantCode,
  onCompleted,
}: TenantSetupWizardProps = {}) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const {
    steps,
    currentStep,
    currentStepIndex,
    currentStepInfo,
    progress,
    config,
    setTestResult,
    setupResult,
    isSubmitting,
    canGoNext,
    handleDatabaseTypeSelect,
    handleConfigChange,
    handleNext,
    handleBack,
    handleFinish,
    recommendedDatabaseName,
    recommendedSQLitePath,
    isManagedTenantSetup,
  } = useTenantSetupWizard({
    targetTenantId,
    targetTenantName,
    targetTenantCode,
    onCompleted,
  });

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={handleNext} targetTenantName={targetTenantName} managed={isManagedTenantSetup} />;
      case 'database-type':
        return <DatabaseTypeStep selected={config.databaseType} onSelect={handleDatabaseTypeSelect} />;
      case 'connection-config':
        return config.databaseType ? (
          <ConnectionConfigStep
            databaseType={config.databaseType}
            config={config}
            recommendedDatabaseName={recommendedDatabaseName}
            recommendedSQLitePath={recommendedSQLitePath}
            onChange={handleConfigChange}
          />
        ) : null;
      case 'test-connection':
        return <TestConnectionStep config={config as DatabaseConnectionConfig} onComplete={setTestResult} />;
      case 'complete':
        return (
          <CompleteStep
            onComplete={handleFinish}
            managed={isManagedTenantSetup}
            targetTenantName={targetTenantName}
            result={setupResult ?? undefined}
          />
        );
      default:
        return null;
    }
  };

  const nextButtonLabel =
    currentStep === 'test-connection'
      ? isSubmitting
        ? zh
          ? '保存中...'
          : 'Saving...'
        : zh
          ? '完成初始化'
          : 'Finish Setup'
      : zh
        ? '下一步'
        : 'Next';

  const card = (
    <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isManagedTenantSetup
                ? zh
                  ? `租户数据库初始化向导${targetTenantName ? ` · ${targetTenantName}` : ''}`
                  : `Tenant Database Setup Wizard${targetTenantName ? ` · ${targetTenantName}` : ''}`
                : zh
                  ? '租户数据库初始化向导'
                  : 'Tenant Database Setup Wizard'}
            </h1>
            <p className="mt-1 text-sm text-blue-100">{currentStepInfo.description}</p>
          </div>
          <div className="rounded-full bg-white/15 px-4 py-2 text-sm">
            {zh ? '步骤' : 'Step'} {currentStepIndex + 1} / {steps.length}
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-5 grid grid-cols-5 gap-2 text-center text-xs">
          {steps.map((step, index) => {
            const active = index === currentStepIndex;
            const completed = index < currentStepIndex;

            return (
              <div key={step.id} className={active || completed ? 'text-white' : 'text-white/60'}>
                <div
                  className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full ${
                    completed ? 'bg-emerald-400' : active ? 'bg-white text-blue-600' : 'bg-white/20'
                  }`}
                >
                  {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div>{step.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-[420px] px-8 py-6">{renderStep()}</div>

      {currentStep !== 'complete' ? (
        <div className="flex justify-between border-t bg-slate-50 px-8 py-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 'welcome' || isSubmitting}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {zh ? '上一步' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={!canGoNext() || isSubmitting}>
            {nextButtonLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );

  const helperText = zh
    ? '如果连接失败，请检查数据库网络可达性、账号权限、端口开放和字符集配置。'
    : 'If connection fails, verify network access, account privileges, port exposure, and charset settings.';

  if (embedded) {
    return (
      <div className="space-y-4">
        {card}
        <p className="text-center text-sm text-slate-500">{helperText}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {card}
        <p className="mt-4 text-center text-sm text-slate-500">{helperText}</p>
      </div>
    </div>
  );
}




