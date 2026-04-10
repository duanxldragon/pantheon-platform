import { useCallback, useEffect, useState } from 'react';

import { operationNotification, systemNotification } from '../../../shared/utils/notification';
import { useLanguageStore } from '../../../stores/language_store';
import { authApi, type EnableTwoFactorResponse, type SessionInfo } from '../api/auth_api';
import { useAuthStore } from '../store/auth_store';

export type DeviceSession = {
  id: string;
  name: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
  type: 'desktop' | 'mobile';
};

export type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
};

function resolveQrCodeUrl(data: EnableTwoFactorResponse | null): string {
  return data?.qrCodeUrl || '';
}

function resolveBackupCodes(data: EnableTwoFactorResponse | null): string[] {
  return data?.backupCodes || [];
}

function detectDeviceType(name: string): 'desktop' | 'mobile' {
  return /iphone|android|mobile|ipad/i.test(name) ? 'mobile' : 'desktop';
}

function formatRelativeTime(timestamp: number, zh: boolean): string {
  if (!timestamp) {
    return zh ? '未知' : 'Unknown';
  }

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return zh ? '刚刚' : 'Just now';
  }
  if (minutes < 60) {
    return zh ? `${minutes} 分钟前` : `${minutes} minute(s) ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return zh ? `${hours} 小时前` : `${hours} hour(s) ago`;
  }

  const days = Math.floor(hours / 24);
  return zh ? `${days} 天前` : `${days} day(s) ago`;
}

function mapSession(session: SessionInfo, zh: boolean): DeviceSession {
  const name = session.deviceName || (zh ? '未知设备' : 'Unknown device');
  return {
    id: session.jti,
    name,
    location: zh ? '未知地区' : 'Unknown',
    ip: session.ipAddress || '-',
    lastActive: formatRelativeTime(session.lastActive, zh),
    current: session.isCurrent,
    type: detectDeviceType(name),
  };
}

export function useTwoFactorSettings() {
  const { language } = useLanguageStore();
  const { enable2FA: featureEnabled } = useAuthStore();
  const zh = language === 'zh';

  const [passwords, setPasswords] = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [setupData, setSetupData] = useState<EnableTwoFactorResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  const qrCodeUrl = resolveQrCodeUrl(setupData);

  const updatePassword = (key: keyof PasswordForm, value: string) => {
    setPasswords((current) => ({ ...current, [key]: value }));
  };

  const fetch2FAStatus = useCallback(async () => {
    try {
      const res = await authApi.get2FAStatus();
      setTwoFactorEnabled(Boolean(res.data.enabled));
    } catch (error) {
      console.error('Failed to fetch 2FA status', error);
    }
  }, []);

  const loadDeviceSessions = useCallback(async () => {
    try {
      const res = await authApi.listSessions();
      setDeviceSessions((res.data.sessions || []).map((session) => mapSession(session, zh)));
    } catch (error) {
      console.error('Failed to load active sessions', error);
      setDeviceSessions([]);
    }
  }, [zh]);

  useEffect(() => {
    void fetch2FAStatus();
    void loadDeviceSessions();
  }, [fetch2FAStatus, loadDeviceSessions]);

  const handleToggle2FA = async (checked: boolean) => {
    if (checked) {
      try {
        setLoading(true);
        const res = await authApi.enable2FA();
        setSetupData(res.data);
        setBackupCodes(resolveBackupCodes(res.data));
        setShowBackupCodes(false);
        setOtpCode('');
        setIs2FADialogOpen(true);
      } catch (error) {
        console.error('Failed to enable 2FA', error);
        systemNotification.error(zh ? '获取双因素认证配置失败' : 'Failed to get 2FA config');
      } finally {
        setLoading(false);
      }
      return;
    }

    setDisablePassword('');
    setDisableDialogOpen(true);
  };

  const closeDisableDialog = () => {
    if (loading) {
      return;
    }
    setDisableDialogOpen(false);
    setDisablePassword('');
  };

  const confirmDisable2FA = async () => {
    if (!disablePassword.trim()) {
      systemNotification.error(zh ? '请输入当前密码' : 'Please enter your current password');
      return;
    }

    try {
      setLoading(true);
      await authApi.disable2FA(disablePassword.trim());
      setTwoFactorEnabled(false);
      setSetupData(null);
      setBackupCodes([]);
      setShowBackupCodes(false);
      setOtpCode('');
      setDisableDialogOpen(false);
      setDisablePassword('');
      systemNotification.success(zh ? '双因素认证已关闭' : '2FA disabled');
    } catch (error) {
      console.error('Failed to disable 2FA', error);
      systemNotification.error(
        zh ? '关闭双因素认证失败' : 'Failed to disable 2FA',
        zh ? '请确认当前密码是否正确' : 'Please verify that your current password is correct',
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (otpCode.length !== 6) {
      return;
    }

    try {
      setLoading(true);
      await authApi.verify2FA(otpCode);
      setTwoFactorEnabled(true);
      setShowBackupCodes(true);
      systemNotification.success(
        zh ? '双因素认证已启用' : 'Two-factor authentication enabled',
        zh ? '请立即保存备份码，后续仅可通过重新生成获取' : 'Please save your backup codes now',
      );
    } catch (error) {
      console.error('Failed to verify 2FA', error);
      systemNotification.error(zh ? '验证码无效' : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const closeTwoFactorDialog = () => {
    setIs2FADialogOpen(false);
    setOtpCode('');
    if (twoFactorEnabled) {
      setSetupData(null);
    }
  };

  const savePassword = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      systemNotification.error(zh ? '请完整填写密码字段' : 'Please complete all password fields');
      return;
    }
    if (passwords.next.length < 8) {
      systemNotification.error(zh ? '新密码至少 8 位' : 'New password must be at least 8 characters');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      systemNotification.error(zh ? '两次输入的新密码不一致' : 'New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        password: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      systemNotification.success(zh ? '密码已更新' : 'Password updated');
    } catch (error) {
      console.error('Failed to change password', error);
      systemNotification.error(zh ? '密码更新失败' : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    try {
      setIsGenerating(true);
      const res = await authApi.generateBackupCodes();
      setBackupCodes(res.data.backupCodes || []);
      setShowBackupCodes(true);
      systemNotification.success(
        zh ? '备份码已重新生成' : 'Backup codes regenerated',
        zh ? '旧备份码已全部失效，请及时保存新备份码' : 'Previous backup codes are now invalid',
      );
    } catch (error) {
      console.error('Failed to regenerate backup codes', error);
      systemNotification.error(zh ? '重新生成备份码失败' : 'Failed to regenerate backup codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = async (value: string, successMessage?: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      systemNotification.success(successMessage || (zh ? '已复制' : 'Copied'));
    } catch (error) {
      console.error('Failed to copy text', error);
      operationNotification.operationFailed(zh ? '复制内容' : 'Copy content');
    }
  };

  return {
    featureEnabled,
    passwords,
    updatePassword,
    savePassword,
    twoFactorEnabled,
    is2FADialogOpen,
    setIs2FADialogOpen,
    handleToggle2FA,
    setupData,
    qrCodeUrl,
    backupCodes,
    showBackupCodes,
    setShowBackupCodes,
    loading,
    otpCode,
    setOtpCode,
    verifyAndEnable,
    closeTwoFactorDialog,
    generateNewBackupCodes,
    isGenerating,
    deviceSessions,
    reloadDeviceSessions: loadDeviceSessions,
    disableDialogOpen,
    setDisableDialogOpen,
    disablePassword,
    setDisablePassword,
    closeDisableDialog,
    confirmDisable2FA,
    copyText,
  };
}



