import { useState } from 'react';
import { Eye, EyeOff, Info, Key } from 'lucide-react';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { Input } from '../../../../../components/ui/input';
import { DetailKeyValueItem, DetailKeyValueSection, FormDialogWrapper } from '../../../../../shared/components/ui';
import { FormField } from '../../../../../shared/components/ui/form_field';
import { useLanguageStore } from '../../../../../stores/language_store';
import { getUserManagementCopy } from '../user_management_copy';

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
  const copy = getUserManagementCopy(language).resetPassword;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const displayName = realName || username;

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
    <FormDialogWrapper
      open={open}
      onOpenChange={handleClose}
      title={copy.title}
      description={copy.description(displayName)}
      onSubmit={handleSubmit}
      loading={loading}
      cancelText={copy.cancel}
      submitText={copy.submit}
      size="sm"
    >
      <div className="space-y-6">
        <DetailKeyValueSection
          eyebrow="SECURITY"
          title={language === 'zh' ? '重置摘要' : 'Reset Summary'}
          description={language === 'zh' ? '先确认目标账号和密码策略，再执行重置。' : 'Confirm the target account and password policy before resetting.'}
        >
          <DetailKeyValueItem label={language === 'zh' ? '目标账号' : 'Target Account'} value={displayName || '-'} />
          <DetailKeyValueItem label={language === 'zh' ? '密码状态' : 'Password State'} value={password ? (language === 'zh' ? '已填写' : 'Entered') : (language === 'zh' ? '待填写' : 'Pending')} />
          <DetailKeyValueItem label={language === 'zh' ? '确认状态' : 'Confirm State'} value={confirmPassword ? (language === 'zh' ? '已填写' : 'Entered') : (language === 'zh' ? '待填写' : 'Pending')} />
          <DetailKeyValueItem label={language === 'zh' ? '建议动作' : 'Recommended Action'} value={language === 'zh' ? '确认两次密码一致且满足强度要求后再提交。' : 'Confirm both passwords match and meet policy before submitting.'} className="md:col-span-2" />
        </DetailKeyValueSection>

        <Alert className="rounded-[24px] border border-blue-200/70 bg-blue-50/85 shadow-sm shadow-blue-100/60">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="ml-2 text-sm text-blue-900/80">{copy.tip}</AlertDescription>
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

        {error ? (
          <Alert variant="destructive" className="rounded-[24px] border border-rose-200/80 bg-rose-50/90 shadow-sm shadow-rose-100/60">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DetailKeyValueSection
          eyebrow="CHECK"
          title={language === 'zh' ? '提交前检查' : 'Pre-submit Review'}
          description={language === 'zh' ? '提交前建议检查密码长度和确认输入。' : 'Review password length and confirmation input before submitting.'}
        >
          <DetailKeyValueItem label={language === 'zh' ? '长度检查' : 'Length Check'} value={password.length} hint={language === 'zh' ? '至少 6 位。' : 'At least 6 characters.'} />
          <DetailKeyValueItem label={language === 'zh' ? '一致性' : 'Match State'} value={password && confirmPassword && password === confirmPassword ? (language === 'zh' ? '一致' : 'Matched') : (language === 'zh' ? '待确认' : 'Pending')} />
        </DetailKeyValueSection>
      </div>
    </FormDialogWrapper>
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
      <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-2xl border-slate-200/80 bg-white/90 pl-10 pr-11 shadow-sm shadow-slate-200/50 transition-all focus:border-primary/40 focus:bg-white focus:ring-primary/10"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}











