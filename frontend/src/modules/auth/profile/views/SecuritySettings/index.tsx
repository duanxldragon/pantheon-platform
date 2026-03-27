import {
  AlertCircle,
  Copy,
  KeyRound,
  Laptop,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
} from 'lucide-react';

import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { Input } from '../../../../../components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../../../../components/ui/input-otp';
import { Label } from '../../../../../components/ui/label';
import { Switch } from '../../../../../components/ui/switch';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useThemeStore } from '../../../../../stores/themeStore';
import { useProfilePreferenceSettings } from '../../hooks/useProfilePreferenceSettings';
import { useTwoFactorSettings } from '../../../hooks';

export function SecuritySettings() {
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const zh = language === 'zh';

  const {
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
    copyText,
  } = useTwoFactorSettings();

  return (
    <div className={compactMode ? 'space-y-4' : 'space-y-6'}>
      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
            <KeyRound className="h-6 w-6" style={{ color: theme.colors.primary }} />
          </div>
          <div>
            <h3 className="text-lg" style={{ color: theme.colors.text }}>
              {zh ? '修改密码' : 'Change Password'}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {zh
                ? '建议定期更新密码，并确保密码强度满足安全要求。'
                : 'Rotate your password regularly and keep it strong.'}
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${compactMode ? 'gap-3' : 'gap-4'} md:grid-cols-3`}>
          <div className="space-y-2">
            <Label>{zh ? '当前密码' : 'Current Password'}</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(event) => updatePassword('current', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{zh ? '新密码' : 'New Password'}</Label>
            <Input
              type="password"
              value={passwords.next}
              onChange={(event) => updatePassword('next', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{zh ? '确认新密码' : 'Confirm Password'}</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(event) => updatePassword('confirm', event.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={savePassword} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {zh ? '更新密码' : 'Update Password'}
          </Button>
        </div>
      </Card>

      {featureEnabled ? (
        <>
          <Card
            className={compactMode ? 'p-4' : 'p-6'}
            style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-lg p-3" style={{ backgroundColor: theme.colors.hover }}>
                <Shield className="h-6 w-6" style={{ color: theme.colors.primary }} />
              </div>
              <div>
                <h3 className="text-lg" style={{ color: theme.colors.text }}>
                  {zh ? '双因素认证' : 'Two-Factor Authentication'}
                </h3>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {zh
                    ? '启用后，登录时将额外要求一次动态验证码。'
                    : 'Require an extra verification step during sign-in.'}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-lg border p-4"
              style={{ borderColor: theme.colors.border }}
            >
              <div style={{ color: theme.colors.text }}>{zh ? '状态' : 'Status'}</div>
              <div className="flex items-center gap-3">
                <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
                  {twoFactorEnabled ? (zh ? '已启用' : 'Enabled') : zh ? '未启用' : 'Disabled'}
                </Badge>
                <Switch checked={twoFactorEnabled} disabled={loading} onCheckedChange={handleToggle2FA} />
              </div>
            </div>
          </Card>

          <Dialog
            open={is2FADialogOpen}
            onOpenChange={(open) => (open ? setIs2FADialogOpen(true) : closeTwoFactorDialog())}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{zh ? '设置双因素认证' : 'Setup 2FA'}</DialogTitle>
                <DialogDescription>
                  {zh
                    ? '请扫描二维码绑定验证器，并完成一次验证码校验。'
                    : 'Scan the QR code and complete a verification step.'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center space-y-4 py-4">
                {qrCodeUrl ? (
                  <div className="rounded-xl border-2 bg-white p-2">
                    <img src={qrCodeUrl} alt="QR Code" className="h-40 w-40" />
                  </div>
                ) : null}

                <div className="w-full space-y-2 text-center">
                  <Label className="block text-xs uppercase text-muted-foreground">
                    {zh ? '手动密钥' : 'Manual Secret'}
                  </Label>
                  <div className="flex items-center justify-center gap-2 font-mono text-sm">
                    <span>{setupData?.secret || '-'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyText(setupData?.secret || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {!showBackupCodes ? (
                  <div className="space-y-2">
                    <Label className="block text-center">{zh ? '验证码' : 'Code'}</Label>
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} onComplete={verifyAndEnable}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                ) : null}

                {backupCodes.length > 0 ? (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{zh ? '备份码' : 'Backup Codes'}</Label>
                      <div className="flex gap-2">
                        {!showBackupCodes ? (
                          <Button variant="ghost" size="sm" onClick={() => setShowBackupCodes(true)}>
                            {zh ? '查看备份码' : 'View Backup Codes'}
                          </Button>
                        ) : null}
                        {showBackupCodes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyText(
                                backupCodes.join('\n'),
                                zh ? '已复制全部备份码' : 'Copied all backup codes',
                              )
                            }
                          >
                            <Copy className="mr-1 h-4 w-4" />
                            {zh ? '复制全部' : 'Copy All'}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {showBackupCodes ? (
                      <>
                        <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border bg-muted/50 p-3">
                          {backupCodes.map((code, index) => (
                            <div key={code} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{index + 1}.</span>
                              <code className="flex-1 font-mono text-xs">{code}</code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyText(code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateNewBackupCodes}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {isGenerating
                            ? zh
                              ? '生成中...'
                              : 'Generating...'
                            : zh
                              ? '重新生成备份码'
                              : 'Regenerate'}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                          <AlertCircle className="mr-1 inline h-3 w-3" />
                          {zh
                            ? '重新生成后旧备份码会全部失效，请确认新备份码已妥善保存。'
                            : 'Regenerating invalidates all previous backup codes.'}
                        </p>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeTwoFactorDialog}>
                  {showBackupCodes ? (zh ? '我已保存' : 'Saved') : zh ? '取消' : 'Cancel'}
                </Button>
                {!showBackupCodes ? (
                  <Button onClick={verifyAndEnable} disabled={otpCode.length !== 6 || loading}>
                    {loading ? (zh ? '验证中...' : 'Verifying...') : zh ? '验证并启用' : 'Verify & Enable'}
                  </Button>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      <Card
        className={compactMode ? 'p-4' : 'p-6'}
        style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
      >
        <h3 className="mb-4 text-lg" style={{ color: theme.colors.text }}>
          {zh ? '近期登录设备' : 'Recent Devices'}
        </h3>
        <div className="space-y-3">
          {deviceSessions.length === 0 ? (
            <div
              className="rounded-lg border p-4 text-sm"
              style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}
            >
              {zh ? '暂无会话数据' : 'No active sessions'}
            </div>
          ) : (
            deviceSessions.map((session) => {
              const Icon = session.type === 'desktop' ? Laptop : Smartphone;
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                  style={{ borderColor: theme.colors.border }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: theme.colors.hover }}>
                      <Icon className="h-5 w-5" style={{ color: theme.colors.primary }} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: theme.colors.text }}>
                        {session.name}
                      </div>
                      <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {[session.location, session.ip, session.lastActive].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <Badge variant={session.current ? 'default' : 'outline'}>
                    {session.current ? (zh ? '当前设备' : 'Current') : zh ? '其他设备' : 'Other'}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
