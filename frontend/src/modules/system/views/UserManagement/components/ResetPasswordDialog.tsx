import { useState } from 'react';
import { Eye, EyeOff, Info, Key } from 'lucide-react';

import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { Input } from '../../../../../components/ui/input';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { useLanguageStore } from '../../../../../stores/languageStore';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
  realName?: string;
  onConfirm: (password: string) => void | Promise<void>;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  username,
  realName,
  onConfirm,
}: ResetPasswordDialogProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const copy = {
    emptyPassword: zh ? '请输入新密码' : 'Please enter a new password',
    passwordTooShort: zh ? '密码长度至少为 6 位' : 'Password must be at least 6 characters',
    mismatch: zh ? '两次输入的密码不一致' : 'The two passwords do not match',
    failed: zh ? '密码重置失败，请稍后重试' : 'Failed to reset password. Please try again later.',
    title: zh ? '重置密码' : 'Reset Password',
    description:
      realName || username
        ? zh
          ? `为 ${realName || username} 重置登录密码`
          : `Reset sign-in password for ${realName || username}`
        : zh
          ? '重置用户登录密码'
          : 'Reset user sign-in password',
    cancel: zh ? '取消' : 'Cancel',
    submit: zh ? '确认重置' : 'Confirm Reset',
    submitting: zh ? '重置中...' : 'Resetting...',
    tip: zh ? '建议使用强密码，并在重置后通知用户及时修改。' : 'Use a strong password and ask the user to change it after reset.',
    newPassword: zh ? '新密码' : 'New Password',
    confirmPassword: zh ? '确认密码' : 'Confirm Password',
    newPasswordPlaceholder: zh ? '请输入新密码' : 'Enter new password',
    confirmPasswordPlaceholder: zh ? '请再次输入新密码' : 'Enter the new password again',
  };

  const resetState = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    setError('');

    if (!password) {
      setError(copy.emptyPassword);
      return;
    }

    if (password.length < 6) {
      setError(copy.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.mismatch);
      return;
    }

    setLoading(true);
    try {
      await onConfirm(password);
      resetState();
      onOpenChange(false);
    } catch {
      setError(copy.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title={copy.title}
      description={copy.description}
      onSubmit={handleSubmit}
      loading={loading}
      cancelText={copy.cancel}
      submitText={copy.submit}
      submittingText={copy.submitting}
      width="max-w-md"
    >
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="ml-2 text-sm text-blue-800">{copy.tip}</AlertDescription>
        </Alert>

        <FormField label={copy.newPassword} required>
          <PasswordInput
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggleVisible={() => setShowPassword((value) => !value)}
            placeholder={copy.newPasswordPlaceholder}
          />
        </FormField>

        <FormField label={copy.confirmPassword} required>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword((value) => !value)}
            placeholder={copy.confirmPasswordPlaceholder}
          />
        </FormField>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </FormDialog>
  );
}

function PasswordInput({
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-white pl-10 pr-10"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
