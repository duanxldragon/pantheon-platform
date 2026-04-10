import * as React from 'react';
import { ArrowLeft, Eye, EyeOff, Languages, Lock, Server, Shield, Sparkles, User } from 'lucide-react';

import packageJson from '../../../../../package.json';
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

type ShowcaseSlide = {
  eyebrow: string;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string }>;
};

type VisualMode = 'business' | 'future';

function DashboardPreview({ slide, active }: { slide: ShowcaseSlide; active: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/82 p-5 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-500 ${
        active ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-90'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(191,219,254,0.45),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.35),_transparent_30%)]" />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
            Pantheon
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{slide.eyebrow}</div>
                <div className="mt-2 text-xl font-medium tracking-tight text-slate-950">{slide.title}</div>
              </div>
              <div className="rounded-2xl bg-white p-2 text-slate-500 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {slide.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[20px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{stat.label}</div>
                  <div className="mt-2 text-lg font-medium text-slate-900">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-5">
            <div className="text-sm leading-7 text-slate-500">{slide.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    tenantCodeExpanded,
    setTenantCodeExpanded,
    shouldShowTenantCodeInput,
    clearError,
    handleSubmit,
    handleVerify2FA,
    resetTwoFactorChallenge,
  } = useLoginForm();

  const slides = React.useMemo<ShowcaseSlide[]>(
    () => [
      {
        eyebrow: isZh ? 'Auth / System' : 'Auth / System',
        title: isZh ? '认证链路与系统工作台统一入口' : 'Unified Entry for Authentication and System Workspace',
        description: isZh
          ? '登录后继续完成用户身份恢复、权限装配、菜单加载与工作台初始化。'
          : 'After sign-in, the flow continues into identity restore, authorization loading, menu bootstrap, and workspace initialization.',
        stats: [
          { label: isZh ? '模块' : 'Module', value: 'auth / system' },
          { label: isZh ? '安全' : 'Security', value: 'JWT + 2FA' },
          { label: isZh ? '入口' : 'Entry', value: isZh ? '工作台首页' : 'Workspace Home' },
        ],
      },
      {
        eyebrow: isZh ? 'Tenant / Platform' : 'Tenant / Platform',
        title: isZh ? '多租户平台能力映射到统一业务入口' : 'Multi-Tenant Platform Capabilities Aligned with a Unified Entry',
        description: isZh
          ? '租户上下文、初始化流程、动态视图与系统管理能力在这里统一承接。'
          : 'Tenant context, onboarding, dynamic views, and system management capabilities converge here.',
        stats: [
          { label: isZh ? '模块' : 'Module', value: 'tenant / system' },
          { label: isZh ? '导航' : 'Navigation', value: isZh ? '菜单 + 标签页 + 视图' : 'Menu + Tabs + Views' },
          { label: isZh ? '部署' : 'Deploy', value: 'Private / PaaS / SaaS' },
        ],
      },
    ],
    [isZh],
  );

  const [visualMode, setVisualMode] = React.useState<VisualMode>('business');

  const versionLabel = `v${packageJson.version}`;
  const currentSlide = slides[visualMode === 'business' ? 0 : 1] ?? slides[0];
  const businessMode = visualMode === 'business';

  return (
    <div
      className={`min-h-screen lg:grid lg:grid-cols-2 ${
        businessMode
          ? 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)]'
          : 'bg-[linear-gradient(180deg,#f8fafc_0%,#ede9fe_45%,#f8fafc_100%)]'
      }`}
    >
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 sm:px-10">
        <div
          className={`absolute inset-0 ${
            businessMode
              ? 'bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.98))]'
              : 'bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.12),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,245,255,0.98))]'
          }`}
        />
        <div className={`absolute left-[-84px] top-20 h-56 w-56 rounded-full blur-3xl ${businessMode ? 'bg-indigo-100/40' : 'bg-violet-100/50'}`} />
        <div className={`absolute bottom-0 left-8 h-48 w-48 rounded-full blur-3xl ${businessMode ? 'bg-sky-100/40' : 'bg-blue-100/45'}`} />

        <div className="relative z-10 w-full max-w-xl">
          <div className="mb-6 space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)] backdrop-blur-md">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  {isZh ? 'Workspace Entry' : 'Workspace Entry'}
                </div>
                <div className="text-sm font-medium tracking-tight text-slate-800">{t.system.title}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-md text-[2.2rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.8rem] sm:leading-[1.04]">
                {isZh ? '登录平台工作台' : 'Sign in to the workspace'}
              </h1>
              <p className="max-w-md text-sm leading-6 text-slate-500">
                {isZh
                  ? '输入账号与密码后，继续进入平台工作区。'
                  : 'Use your account credentials to continue into the platform workspace.'}
              </p>
              <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
                {[
                  { key: 'business' as const, label: isZh ? '商务稳重' : 'Business' },
                  { key: 'future' as const, label: isZh ? '科技未来' : 'Future' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setVisualMode(mode.key)}
                    className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] transition-all ${
                      visualMode === mode.key
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/78 p-7 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0.08))]" />
            <div className="absolute right-[-24px] top-[-24px] h-32 w-32 rounded-full bg-indigo-100/70 blur-2xl" />

            <div className="relative">
              {requires2FA ? (
                <form onSubmit={handleVerify2FA} className="space-y-6">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.6)]">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                        {isZh ? '双因素认证' : 'Two-Factor Authentication'}
                      </h2>
                      <p className="text-sm leading-6 text-slate-500">
                        {isZh
                          ? '请输入 6 位动态验证码，或者输入 8 位备份码。'
                          : 'Enter a 6-digit OTP code or an 8-character backup code.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/85 p-4">
                    <div className="mb-3 text-center text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      {isZh ? 'Verification Code' : 'Verification Code'}
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
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-full bg-black text-white hover:bg-slate-900" disabled={isLoading || otpCode.trim().length < 6}>
                    {isLoading ? (isZh ? '验证中...' : 'Verifying...') : isZh ? '验证并登录' : 'Verify and Sign In'}
                  </Button>

                  <Button type="button" variant="ghost" className="w-full rounded-full" onClick={resetTwoFactorChallenge}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {isZh ? '返回登录' : 'Back to sign in'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {isZh ? 'Username & Password' : 'Username & Password'}
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {isZh ? '欢迎回来' : 'Welcome back'}
                    </h2>
                    <p className="text-sm leading-6 text-slate-500">
                      {isZh
                        ? '输入账号密码后即可继续进入平台。'
                        : 'Enter your credentials to continue into the platform.'}
                    </p>
                  </div>

                  {isLocked && lockCountdown > 0 && (
                    <div className="flex items-center gap-2 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      <Lock className="h-4 w-4" />
                      <span>
                        {isZh ? `账户已锁定，请在 ${lockMessage} 后重试` : `Account locked, retry after ${lockMessage}`}
                      </span>
                    </div>
                  )}

                  {showTenantCode ? (
                    <div className="flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900">
                          {isZh ? '租户登录上下文' : 'Tenant sign-in context'}
                        </div>
                        <div className="text-xs leading-5 text-slate-500">
                          {tenantCodeExpanded
                            ? (isZh ? '当前已展开租户代码输入，用于进入指定租户上下文。' : 'Tenant code input is expanded for a specific tenant context.')
                            : (isZh ? '如需指定租户上下文，请展开并输入租户代码。' : 'Expand and enter a tenant code when a specific tenant context is required.')}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="mono"
                        size="pill"
                        className="shrink-0"
                        onClick={() => {
                          setTenantCodeExpanded((current) => !current);
                          clearError('tenantCode');
                        }}
                      >
                        {tenantCodeExpanded
                          ? (isZh ? '收起租户代码' : 'Hide Tenant Code')
                          : (isZh ? '输入租户代码' : 'Enter Tenant Code')}
                      </Button>
                    </div>
                  ) : null}

                  {shouldShowTenantCodeInput && (
                    <div className="space-y-2 rounded-[28px] border border-sky-100 bg-sky-50/70 p-4">
                      <Label htmlFor="tenantCode">{t.login.tenantCode}</Label>
                      <div className="relative">
                        <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="tenantCode"
                          value={tenantCode}
                          onChange={(event) => {
                            setTenantCode(event.target.value);
                            clearError('tenantCode');
                          }}
                          placeholder={t.login.tenantCodePlaceholder}
                          className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
                          disabled={isLoading}
                        />
                        {tenantLoading && (
                          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                        )}
                      </div>
                      {errors.tenantCode && <p className="text-sm text-red-500">{errors.tenantCode}</p>}
                      {tenantPreview?.name && (
                        <div className="rounded-2xl border border-emerald-200/70 bg-white/85 px-3 py-2 text-xs text-emerald-700">
                          <div className="font-medium">{tenantPreview.name}</div>
                          <div className="mt-1 text-emerald-600/80">
                            {tenantPreview.status
                              ? `${isZh ? '状态' : 'Status'} · ${tenantPreview.status}`
                              : isZh
                                ? '租户信息已识别'
                                : 'Tenant information detected'}
                          </div>
                        </div>
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
                        className="h-12 rounded-2xl border-slate-200 bg-white/95 pl-10"
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
                        className="h-12 rounded-2xl border-slate-200 bg-white/95 pl-10 pr-12"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label={showPassword ? (isZh ? '隐藏密码' : 'Hide password') : isZh ? '显示密码' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/75 px-4 py-3">
                    <label htmlFor="remember-login" className="flex min-w-0 cursor-pointer items-center gap-3">
                      <Checkbox
                        id="remember-login"
                        checked={remember}
                        onCheckedChange={setRemember}
                        disabled={isLoading}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900">
                          {isZh ? '记住账号信息' : 'Remember account info'}
                        </div>
                        <div className="text-xs leading-5 text-slate-500">
                          {isZh
                            ? '保留账号名，并在启用租户登录时一并保留租户代码。'
                            : 'Keeps the username and, when tenant sign-in is enabled, the tenant code as well.'}
                        </div>
                      </div>
                    </label>
                    <div className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      {remember ? (isZh ? '已启用' : 'On') : (isZh ? '未启用' : 'Off')}
                    </div>
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-full bg-black text-white hover:bg-slate-900" disabled={isLoading}>
                    {isLoading ? t.login.loggingIn : t.login.loginButton}
                  </Button>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      isZh ? '受保护登录' : 'Protected Login',
                      isZh ? '实时授权恢复' : 'Live Auth Restore',
                      isZh ? '多语言工作台' : 'Multi-language Workspace',
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-slate-500"
                      >
                        {item}
                      </div>
                      ))}
                    </div>

                  <div className="grid gap-3 rounded-[28px] border border-slate-200/80 bg-slate-50/75 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{t.common.version}</div>
                        <div className="mt-1 text-sm font-medium text-slate-800">{versionLabel}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          {isZh ? 'Current View' : 'Current View'}
                        </div>
                        <div className="mt-1 truncate text-sm font-medium text-slate-800">
                          {currentSlide.eyebrow}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="mono" size="pill" className="justify-self-start gap-2 sm:justify-self-end">
                          <Languages className="h-4 w-4" />
                          {t.topBar.language}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLanguage('zh')}>中文</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
            <p>© 2026 {t.system.title}</p>
            <p>{isZh ? 'Design-inspired workspace entrance' : 'Design-inspired workspace entrance'}</p>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:flex">
        <div
          className={`absolute inset-0 ${
            businessMode
              ? 'bg-[radial-gradient(circle_at_top_right,_rgba(191,219,254,0.55),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.5),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_46%,#e9f1ff_100%)]'
              : 'bg-[radial-gradient(circle_at_top_right,_rgba(196,181,253,0.35),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(191,219,254,0.52),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef2ff_48%,#e6efff_100%)]'
          }`}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${businessMode ? 'bg-blue-400' : 'bg-violet-400'}`} />
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                {isZh ? '平台能力概览' : 'Platform Overview'}
              </span>
            </div>
            <div className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-sm text-slate-500 shadow-sm">
              {versionLabel}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-5xl flex-1 items-center">
            <div className="grid w-full gap-10 xl:grid-cols-[0.86fr_1.14fr] xl:items-center">
              <div className="space-y-6">
                <div className="inline-flex rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  {currentSlide.eyebrow}
                </div>
                <div className="space-y-4">
                  <h2 className="max-w-xl text-4xl font-medium tracking-tight text-slate-950 xl:text-5xl xl:leading-tight">
                    {currentSlide.title}
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-slate-500">
                    {currentSlide.description}
                  </p>
                </div>
                <div className="grid max-w-xl grid-cols-3 gap-3">
                  {currentSlide.stats.map((stat) => (
                    <div
                      key={`${currentSlide.title}-${stat.label}-hero`}
                      className="rounded-[20px] border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm"
                    >
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                      <div className="mt-2 text-lg font-medium text-slate-900">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <DashboardPreview slide={currentSlide} active />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
