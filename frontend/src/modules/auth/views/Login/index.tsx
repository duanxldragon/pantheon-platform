import { ArrowLeft, Eye, EyeOff, Languages, Lock, Server, Shield, User } from 'lucide-react';

import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { Input } from '../../../../components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../../../components/ui/input-otp';
import { Label } from '../../../../components/ui/label';
import { useLoginForm } from '../../hooks';

export function Login() {
  const {
    t,
    isZh,
    setLanguage,
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
  } = useLoginForm();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Server className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent">
              {t.system.title}
            </h1>
            <p className="text-sm text-slate-500">{t.system.subtitle}</p>
          </div>

          {requires2FA ? (
            <form onSubmit={handleVerify2FA} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-2 text-center">
                <Shield className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="text-xl font-semibold">{isZh ? '双因素认证' : 'Two-Factor Authentication'}</h2>
                <p className="text-sm text-slate-500">
                  {isZh
                    ? '请输入 6 位动态验证码，或者输入 8 位备份码。'
                    : 'Enter a 6-digit OTP code or an 8-character backup code.'}
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={isLoading || otpCode.trim().length < 6}>
                {isLoading ? (isZh ? '验证中...' : 'Verifying...') : isZh ? '验证并登录' : 'Verify and Sign In'}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={resetTwoFactorChallenge}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isZh ? '返回登录' : 'Back to sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {isLocked && lockCountdown > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <Lock className="h-4 w-4" />
                  <span>
                    {isZh ? `账户已锁定，请在 ${lockMessage} 后重试` : `Account locked, retry after ${lockMessage}`}
                  </span>
                </div>
              )}

              {showTenantCode && (
                <div className="space-y-2">
                  <Label htmlFor="tenantCode">{t.login.tenantCode || '租户代码'}</Label>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="tenantCode"
                      value={tenantCode}
                      onChange={(event) => {
                        setTenantCode(event.target.value);
                        clearError('tenantCode');
                      }}
                      placeholder={t.login.tenantCodePlaceholder || '请输入租户代码'}
                      className="pl-9"
                      disabled={isLoading}
                    />
                    {tenantLoading && (
                      <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    )}
                  </div>
                  {errors.tenantCode && <p className="text-sm text-red-500">{errors.tenantCode}</p>}
                  {tenantPreview?.name && (
                    <p className="text-xs text-emerald-600">
                      {tenantPreview.name}
                      {tenantPreview.status ? ` · ${tenantPreview.status}` : ''}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">{t.login.username}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      clearError('username');
                    }}
                    placeholder={t.login.usernamePlaceholder}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.login.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearError('password');
                    }}
                    placeholder={t.login.passwordPlaceholder}
                    className="pl-9 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
                  <Label htmlFor="remember" className="cursor-pointer text-sm text-slate-600">
                    {t.login.rememberPassword}
                  </Label>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                {isLoading ? (isZh ? '登录中...' : 'Signing in...') : t.login.loginButton}
              </Button>

              <div className="flex justify-center pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Languages className="h-4 w-4" />
                      {isZh ? '语言' : 'Language'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem onClick={() => setLanguage('zh')}>中文</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500">
            <p>© 2026 {t.system.title}</p>
          </div>
        </div>
      </div>

      <div className="hidden items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-12 text-white lg:flex lg:w-1/2">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
            <Shield className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-bold">
            {isZh ? '企业级多租户后台管理底座' : 'Enterprise Multi-Tenant Foundation'}
          </h2>
          <p className="text-lg text-white/85">
            {isZh
              ? '支持多租户、RBAC、多语言、审计日志、动态菜单与可配置二次认证。'
              : 'Supports multi-tenancy, RBAC, i18n, audit logs, dynamic menus, and configurable 2FA.'}
          </p>
          <div className="grid grid-cols-1 gap-4 text-sm text-white/80">
            <div className="rounded-2xl bg-white/10 p-4">
              {isZh ? '支持私有化、PaaS、SaaS 三种部署模式配置' : 'Configurable private, PaaS, and SaaS deployment modes'}
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              {isZh ? '登录后动态初始化权限与菜单' : 'Dynamic permission and menu initialization after sign-in'}
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              {isZh ? '新增业务模块可通过菜单挂载动态显示' : 'New modules can be mounted through menu-driven navigation'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
