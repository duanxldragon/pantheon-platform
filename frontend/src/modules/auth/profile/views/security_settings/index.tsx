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
import { useLanguageStore } from '../../../../../stores/language_store';
import { useThemeStore } from '../../../../../stores/theme_store';
import { useProfilePreferenceSettings } from '../../hooks/use_profile_preference_settings';
import { useTwoFactorSettings } from '../../../hooks';

export function SecuritySettings() {
  const { theme } = useThemeStore();
  const { language } = useLanguageStore();
  const { compactMode } = useProfilePreferenceSettings();
  const zh = language === 'zh';
  const copy = {
    passwordTitle: zh ? '修改密码' : 'Change Password',
    passwordDesc: zh ? '建议定期更新密码，并确保密码强度满足安全要求。' : 'Rotate your password regularly and keep it strong.',
    currentPassword: zh ? '当前密码' : 'Current Password',
    newPassword: zh ? '新密码' : 'New Password',
    confirmPassword: zh ? '确认新密码' : 'Confirm Password',
    updatePassword: zh ? '更新密码' : 'Update Password',
    twoFactorTitle: zh ? '双因素认证' : 'Two-Factor Authentication',
    twoFactorDesc: zh ? '启用后，登录时将额外要求一次动态验证码。' : 'Require an extra verification step during sign-in.',
    status: zh ? '状态' : 'Status',
    enabled: zh ? '已启用' : 'Enabled',
    disabled: zh ? '未启用' : 'Disabled',
    setupTitle: zh ? '设置双因素认证' : 'Setup 2FA',
    setupDesc: zh ? '请扫描二维码绑定验证器，并完成一次验证码校验。' : 'Scan the QR code and complete a verification step.',
    manualSecret: zh ? '手动密钥' : 'Manual Secret',
    code: zh ? '验证码' : 'Code',
    backupCodes: zh ? '备份码' : 'Backup Codes',
    viewBackupCodes: zh ? '查看备份码' : 'View Backup Codes',
    copyAll: zh ? '复制全部' : 'Copy All',
    copiedAll: zh ? '已复制全部备份码' : 'Copied all backup codes',
    generating: zh ? '生成中...' : 'Generating...',
    regenerate: zh ? '重新生成备份码' : 'Regenerate',
    regenerateHint: zh ? '重新生成后，旧备份码会全部失效，请确认新备份码已妥善保存。' : 'Regenerating invalidates all previous backup codes.',
    saved: zh ? '我已保存' : 'Saved',
    cancel: zh ? '取消' : 'Cancel',
    verifying: zh ? '验证中...' : 'Verifying...',
    verifyEnable: zh ? '验证并启用' : 'Verify & Enable',
    disableTitle: zh ? '关闭双因素认证' : 'Disable 2FA',
    disableDesc: zh ? '请输入当前密码以确认关闭双因素认证。关闭后，登录将不再要求动态验证码。' : 'Enter your current password to disable 2FA. Sign-in will no longer require a verification code.',
    disablePassword: zh ? '当前密码' : 'Current Password',
    disableConfirm: zh ? '确认关闭' : 'Disable 2FA',
    recentDevices: zh ? '近期登录设备' : 'Recent Devices',
    noSessions: zh ? '暂无会话数据' : 'No active sessions',
    currentDevice: zh ? '当前设备' : 'Current',
    otherDevice: zh ? '其他设备' : 'Other',
    separator: zh ? ' · ' : ' · ',
  };

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
    disableDialogOpen,
    disablePassword,
    setDisablePassword,
    closeDisableDialog,
    confirmDisable2FA,
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
              {copy.passwordTitle}
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {copy.passwordDesc}
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${compactMode ? 'gap-3' : 'gap-4'} md:grid-cols-3`}>
          <div className="space-y-2">
            <Label>{copy.currentPassword}</Label>
            <Input type="password" value={passwords.current} onChange={(event) => updatePassword('current', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copy.newPassword}</Label>
            <Input type="password" value={passwords.next} onChange={(event) => updatePassword('next', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copy.confirmPassword}</Label>
            <Input type="password" value={passwords.confirm} onChange={(event) => updatePassword('confirm', event.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={savePassword} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {copy.updatePassword}
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
                  {copy.twoFactorTitle}
                </h3>
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  {copy.twoFactorDesc}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between rounded-lg border p-4"
              style={{ borderColor: theme.colors.border }}
            >
              <div style={{ color: theme.colors.text }}>{copy.status}</div>
              <div className="flex items-center gap-3">
                <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
                  {twoFactorEnabled ? copy.enabled : copy.disabled}
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
                <DialogTitle>{copy.setupTitle}</DialogTitle>
                <DialogDescription>{copy.setupDesc}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center space-y-4 py-4">
                {qrCodeUrl ? (
                  <div className="rounded-xl border-2 bg-white p-2">
                    <img src={qrCodeUrl} alt="QR Code" className="h-40 w-40" />
                  </div>
                ) : null}

                <div className="w-full space-y-2 text-center">
                  <Label className="block text-xs uppercase text-muted-foreground">{copy.manualSecret}</Label>
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
                    <Label className="block text-center">{copy.code}</Label>
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
                      <Label className="text-sm">{copy.backupCodes}</Label>
                      <div className="flex gap-2">
                        {!showBackupCodes ? (
                          <Button variant="ghost" size="sm" onClick={() => setShowBackupCodes(true)}>
                            {copy.viewBackupCodes}
                          </Button>
                        ) : null}
                        {showBackupCodes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyText(backupCodes.join('\n'), copy.copiedAll)}
                          >
                            <Copy className="mr-1 h-4 w-4" />
                            {copy.copyAll}
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
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyText(code)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" size="sm" onClick={generateNewBackupCodes} disabled={isGenerating}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {isGenerating ? copy.generating : copy.regenerate}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                          <AlertCircle className="mr-1 inline h-3 w-3" />
                          {copy.regenerateHint}
                        </p>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeTwoFactorDialog}>
                  {showBackupCodes ? copy.saved : copy.cancel}
                </Button>
                {!showBackupCodes ? (
                  <Button onClick={verifyAndEnable} disabled={otpCode.length !== 6 || loading}>
                    {loading ? copy.verifying : copy.verifyEnable}
                  </Button>
                ) : null}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={disableDialogOpen} onOpenChange={(open) => (!open ? closeDisableDialog() : undefined)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{copy.disableTitle}</DialogTitle>
                <DialogDescription>{copy.disableDesc}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-4">
                <Label>{copy.disablePassword}</Label>
                <Input
                  type="password"
                  value={disablePassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeDisableDialog} disabled={loading}>
                  {copy.cancel}
                </Button>
                <Button onClick={confirmDisable2FA} disabled={loading}>
                  {loading ? copy.verifying : copy.disableConfirm}
                </Button>
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
          {copy.recentDevices}
        </h3>
        <div className="space-y-3">
          {deviceSessions.length === 0 ? (
            <div
              className="rounded-lg border p-4 text-sm"
              style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}
            >
              {copy.noSessions}
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
                        {[session.location, session.ip, session.lastActive].filter(Boolean).join(copy.separator)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={session.current ? 'default' : 'outline'}>
                    {session.current ? copy.currentDevice : copy.otherDevice}
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




