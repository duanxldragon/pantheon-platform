import { useEffect, useMemo, useState } from 'react';

import { systemNotification } from '../../../shared/utils/notification';
import { useLanguageStore } from '../../../stores/languageStore';
import tenantDatabaseApi from '../../tenant/api/tenantDatabaseApi';
import { useAuthStore } from '../store/authStore';

export type TenantPreview = {
  name?: string;
  status?: string;
};

export type LoginFormErrors = {
  username?: string;
  password?: string;
  tenantCode?: string;
};

const REMEMBERED_USERNAME_KEY = 'rememberedUsername';
const REMEMBERED_TENANT_KEY = 'rememberedTenantCode';
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

function normalizeTenantCode(value?: string | null) {
  const trimmed = value?.trim() || '';
  return trimmed && trimmed !== EMPTY_UUID ? trimmed : '';
}

function persistRememberedCredentials(
  remember: boolean,
  username: string,
  tenantCode: string,
  showTenantCode: boolean,
) {
  if (!remember) {
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
    localStorage.removeItem(REMEMBERED_TENANT_KEY);
    return;
  }

  localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
  if (showTenantCode) {
    const normalizedTenantCode = normalizeTenantCode(tenantCode);
    if (normalizedTenantCode) {
      localStorage.setItem(REMEMBERED_TENANT_KEY, normalizedTenantCode);
    } else {
      localStorage.removeItem(REMEMBERED_TENANT_KEY);
    }
  } else {
    localStorage.removeItem(REMEMBERED_TENANT_KEY);
  }
}

export function useLoginForm() {
  const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY) || '';
  const rawRememberedTenantCode = localStorage.getItem(REMEMBERED_TENANT_KEY);
  const rememberedTenantCode = normalizeTenantCode(rawRememberedTenantCode);
  if (rawRememberedTenantCode && !rememberedTenantCode) {
    localStorage.removeItem(REMEMBERED_TENANT_KEY);
  }

  const [username, setUsername] = useState(rememberedUsername);
  const [password, setPassword] = useState('');
  const [tenantCode, setTenantCode] = useState(rememberedTenantCode);
  const [remember, setRemember] = useState(Boolean(rememberedUsername));
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantPreview, setTenantPreview] = useState<TenantPreview | null>(null);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [lockCountdown, setLockCountdown] = useState(0);

  const {
    login,
    verify2FA,
    fetchConfig,
    requires2FA,
    isLocked,
    lockUntil,
    enableMultiTenant,
    loginRequiresTenantCode,
  } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();

  const isZh = language === 'zh';
  const showTenantCode = enableMultiTenant && loginRequiresTenantCode;

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!isLocked || !lockUntil) {
      setLockCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [isLocked, lockUntil]);

  useEffect(() => {
    const normalizedTenantCode = normalizeTenantCode(tenantCode);
    if (!showTenantCode || !normalizedTenantCode) {
      setTenantPreview(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setTenantLoading(true);
      try {
        const status = await tenantDatabaseApi.getStatus(normalizedTenantCode);
        setTenantPreview({ name: status.tenantName, status: status.status });
      } catch {
        setTenantPreview(null);
      } finally {
        setTenantLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [showTenantCode, tenantCode]);

  const lockMessage = useMemo(() => {
    if (!isLocked || lockCountdown <= 0) {
      return '';
    }

    const minutes = Math.floor(lockCountdown / 60);
    const seconds = lockCountdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [isLocked, lockCountdown]);

  const clearError = (field: keyof LoginFormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const resetTwoFactorChallenge = () => {
    useAuthStore.setState({ requires2FA: false, tempToken: null });
    setOtpCode('');
    setIsLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isLocked && lockCountdown > 0) {
      systemNotification.loginFailed(
        isZh ? `账户已锁定，请在 ${lockMessage} 后重试` : `Account locked, retry after ${lockMessage}`,
      );
      return;
    }

    const nextErrors: LoginFormErrors = {};
    if (!username.trim()) nextErrors.username = t.login.usernameRequired;
    if (!password) nextErrors.password = t.login.passwordRequired;
    const normalizedTenantCode = normalizeTenantCode(tenantCode);
    if (showTenantCode && !normalizedTenantCode) {
      nextErrors.tenantCode = t.login.tenantCodeRequired || '请输入租户代码';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await login(
        username.trim(),
        password,
        remember,
        showTenantCode ? normalizedTenantCode : undefined,
      );

      if (result.success && result.requires2FA) {
        systemNotification.info(isZh ? '请输入双因素验证码' : 'Please enter your 2FA code');
        return;
      }

      if (result.success) {
        persistRememberedCredentials(remember, username.trim(), normalizedTenantCode, showTenantCode);
        systemNotification.loginSuccess(username.trim());
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t.login.loginFailed;
      setErrors({ password: message });
      systemNotification.loginFailed(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (event: React.FormEvent) => {
    event.preventDefault();

    if (otpCode.trim().length < 6) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await verify2FA(otpCode.trim());
      if (!success) {
        systemNotification.loginFailed(isZh ? '验证码错误或已过期' : 'Invalid or expired verification code');
        return;
      }

      persistRememberedCredentials(remember, username.trim(), normalizeTenantCode(tenantCode), showTenantCode);
      systemNotification.loginSuccess(username.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : '2FA verification failed';
      systemNotification.loginFailed(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    t,
    language,
    setLanguage,
    isZh,
    username,
    setUsername,
    password,
    setPassword,
    tenantCode,
    setTenantCode,
    remember,
    setRemember,
    showPassword,
    setShowPassword,
    otpCode,
    setOtpCode,
    isLoading,
    tenantLoading,
    tenantPreview,
    errors,
    lockCountdown,
    lockMessage,
    requires2FA,
    isLocked,
    showTenantCode,
    clearError,
    handleSubmit,
    handleVerify2FA,
    resetTwoFactorChallenge,
  };
}
