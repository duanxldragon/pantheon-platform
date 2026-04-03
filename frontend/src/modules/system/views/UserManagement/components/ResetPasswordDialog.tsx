import { useState } from 'react';
import { Eye, EyeOff, Info, Key } from 'lucide-react';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { Input } from '../../../../../components/ui/input';
import { FormDialog } from '../../../../../shared/components/ui/FormDialog';
import { FormField } from '../../../../../shared/components/ui/FormField';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { getUserManagementCopy } from '../userManagementCopy';

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
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title={copy.title}
      description={copy.description(displayName)}
      onSubmit={handleSubmit}
      loading={loading}
      cancelText={copy.cancel}
      submitText={copy.submit}
      submittingText={copy.submitting}
      width="sm:max-w-[520px]"
    >
      <div className="space-y-6">
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
