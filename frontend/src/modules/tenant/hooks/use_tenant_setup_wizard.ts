import { useMemo, useState } from 'react';

import { getDefaultPort } from '@/shared/constants/database_types';

import { useAuthStore } from '../../auth/store/auth_store';
import { systemNotification } from '../../../shared/utils/notification';
import { useLanguageStore } from '../../../stores/language_store';
import tenantDatabaseApi from '../api/tenant_database_api';
import {
  buildRecommendedSQLitePath,
  buildRecommendedTenantDatabaseName,
  normalizeTenantCode,
} from '../utils/naming';
import type {
  DatabaseConnectionConfig,
  DatabaseType,
  TenantSetupResult,
  TestConnectionResult,
  WizardStep,
  WizardStepInfo,
} from '../types';

const ZH_STEPS: WizardStepInfo[] = [
  { id: 'welcome', title: '欢迎', description: '了解租户数据库初始化流程与注意事项' },
  { id: 'database-type', title: '数据库类型', description: '选择当前租户准备使用的数据库引擎' },
  { id: 'connection-config', title: '连接配置', description: '填写数据库地址、账号和连接池参数' },
  { id: 'test-connection', title: '连接测试', description: '验证数据库连接是否可用' },
  { id: 'complete', title: '初始化完成', description: '确认默认管理员与基础权限已经就绪' },
];

const EN_STEPS: WizardStepInfo[] = [
  { id: 'welcome', title: 'Welcome', description: 'Review the tenant database initialization flow' },
  { id: 'database-type', title: 'Database Type', description: 'Choose the database engine for this tenant' },
  { id: 'connection-config', title: 'Connection Config', description: 'Fill in host, account, and pool settings' },
  { id: 'test-connection', title: 'Connection Test', description: 'Verify whether the database connection is available' },
  { id: 'complete', title: 'Completed', description: 'Confirm the admin account and base authorization bootstrap' },
];

export const WIZARD_STEPS = ZH_STEPS;

interface UseTenantSetupWizardOptions {
  targetTenantId?: string;
  targetTenantName?: string;
  targetTenantCode?: string;
  onCompleted?: (tenantId: string, result?: TenantSetupResult) => void | Promise<void>;
}

function validateConfig(config: Partial<DatabaseConnectionConfig>) {
  if (!config.databaseType) {
    return false;
  }

  if (config.databaseType === 'sqlite') {
    return Boolean(config.filepath?.trim());
  }

  return Boolean(
    config.host?.trim() &&
      config.port &&
      config.port > 0 &&
      config.database?.trim() &&
      config.username?.trim() &&
      config.password?.trim() &&
      config.adminPassword?.trim() &&
      config.adminPassword.trim().length >= 12,
  );
}

export function useTenantSetupWizard(options: UseTenantSetupWizardOptions = {}) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const completeTenantSetup = useAuthStore((state) => state.completeTenantSetup);
  const refreshTenantContext = useAuthStore((state) => state.refreshTenantContext);
  const setTenantInfo = useAuthStore((state) => state.setTenantInfo);
  const authTenantCode = useAuthStore((state) => state.user?.tenantCode);

  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [config, setConfig] = useState<Partial<DatabaseConnectionConfig>>({ database: '' });
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [setupResult, setSetupResult] = useState<TenantSetupResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = useMemo(() => (zh ? ZH_STEPS : EN_STEPS), [zh]);

  const currentStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === currentStep),
    [currentStep, steps],
  );
  const recommendedTenantCode = useMemo(
    () => normalizeTenantCode(options.targetTenantCode || authTenantCode || ''),
    [authTenantCode, options.targetTenantCode],
  );
  const recommendedDatabaseName = useMemo(
    () => buildRecommendedTenantDatabaseName(recommendedTenantCode),
    [recommendedTenantCode],
  );
  const recommendedSQLitePath = useMemo(
    () => buildRecommendedSQLitePath(recommendedTenantCode),
    [recommendedTenantCode],
  );
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canGoNext = () => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'database-type':
        return Boolean(config.databaseType);
      case 'connection-config':
        return validateConfig(config);
      case 'test-connection':
        return Boolean(testResult?.success);
      default:
        return false;
    }
  };

  const handleDatabaseTypeSelect = (databaseType: DatabaseType) => {
    setConfig((current) => ({
      ...current,
      databaseType,
      port: databaseType === 'sqlite' ? undefined : getDefaultPort(databaseType),
      database: current.database || recommendedDatabaseName,
      host: databaseType === 'sqlite' ? undefined : current.host || '',
      username: databaseType === 'sqlite' ? undefined : current.username || '',
      password: databaseType === 'sqlite' ? undefined : current.password || '',
      adminPassword: databaseType === 'sqlite' ? undefined : current.adminPassword || '',
      filepath: databaseType === 'sqlite' ? current.filepath || recommendedSQLitePath : undefined,
    }));
    setTestResult(null);
    setSetupResult(null);
    setCurrentStep('connection-config');
  };

  const handleConfigChange = (updates: Partial<DatabaseConnectionConfig>) => {
    setConfig((current) => ({ ...current, ...updates }));
    setTestResult(null);
    setSetupResult(null);
  };

  const handleNext = async () => {
    if (currentStep === 'test-connection') {
      if (!testResult?.success) {
        return;
      }

      setIsSubmitting(true);
      try {
        const result = options.targetTenantId
          ? await tenantDatabaseApi.setupTenantDatabase(options.targetTenantId, config as DatabaseConnectionConfig)
          : await tenantDatabaseApi.setupDatabase(config as DatabaseConnectionConfig);

        setSetupResult(result);
        setCurrentStep('complete');
        systemNotification.success(
          zh ? '租户数据库配置已保存' : 'Tenant database configuration saved',
          zh ? '默认管理员、菜单和权限模板已开始生效' : 'Default admin, menus, and permissions are now available',
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : zh
              ? '租户数据库配置保存失败'
              : 'Failed to save tenant database configuration';
        systemNotification.error(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const nextStep = steps[currentStepIndex + 1];
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const previousStep = steps[currentStepIndex - 1];
    if (!previousStep) {
      return;
    }

    if (currentStep === 'test-connection') {
      setTestResult(null);
    }

    setCurrentStep(previousStep.id);
  };

  const handleFinish = async () => {
    const tenantId = setupResult?.tenantId;
    if (!tenantId) {
      return;
    }

    if (options.targetTenantId) {
      await options.onCompleted?.(tenantId, setupResult ?? undefined);
      systemNotification.success(
        zh ? '租户初始化完成' : 'Tenant initialization completed',
        zh
          ? `${options.targetTenantName ? `租户「${options.targetTenantName}」` : '目标租户'}已完成数据库与基础权限初始化`
          : 'The target tenant database and base authorization have been initialized',
      );
      return;
    }

    completeTenantSetup(tenantId);

    try {
      const tenantInfo = await tenantDatabaseApi.getCurrentTenant();
      setTenantInfo(tenantInfo);
    } catch (error) {
      console.warn('Failed to load current tenant after setup:', error);
    }

    try {
      await refreshTenantContext();
    } catch (error) {
      console.warn('Failed to refresh tenant context after setup:', error);
    }

    systemNotification.success(
      zh ? '租户初始化完成' : 'Tenant initialization completed',
      zh ? '当前租户已具备登录、菜单和权限基础能力' : 'The tenant is now ready for sign-in, menus, and permissions',
    );

    await options.onCompleted?.(tenantId, setupResult ?? undefined);
  };

  return {
    steps,
    currentStep,
    currentStepIndex,
    currentStepInfo: steps[currentStepIndex],
    progress,
    config,
    testResult,
    setupResult,
    setTestResult,
    isSubmitting,
    canGoNext,
    handleDatabaseTypeSelect,
    handleConfigChange,
    handleNext,
    handleBack,
    handleFinish,
    targetTenantName: options.targetTenantName,
    targetTenantCode: recommendedTenantCode,
    recommendedDatabaseName,
    recommendedSQLitePath,
    isManagedTenantSetup: Boolean(options.targetTenantId),
  };
}







