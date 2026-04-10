import { useMemo } from 'react';

import { CheckCircle2, Copy, KeyRound, LayoutDashboard, PartyPopper } from 'lucide-react';

import { Button } from '../../../../../components/ui/button';
import { useLanguageStore } from '../../../../../stores/language_store';
import { systemNotification } from '../../../../../shared/utils/notification';
import type { TenantSetupResult } from '../../../types';

interface CompleteStepProps {
  onComplete: () => void;
  managed?: boolean;
  targetTenantName?: string;
  result?: TenantSetupResult;
}

export function CompleteStep({
  onComplete,
  managed = false,
  targetTenantName,
  result,
}: CompleteStepProps) {
  const { language } = useLanguageStore();
  const zh = language === 'zh';

  const bootstrap = result?.bootstrap;
  const copyText = useMemo(() => {
    const lines = [
      bootstrap?.adminUsername ? `${zh ? '管理员账号' : 'Admin username'}: ${bootstrap.adminUsername}` : '',
      bootstrap?.adminEmail ? `${zh ? '管理员邮箱' : 'Admin email'}: ${bootstrap.adminEmail}` : '',
      bootstrap?.roleCode ? `${zh ? '默认角色' : 'Default role'}: ${bootstrap.roleCode}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  }, [bootstrap, zh]);

  const handleCopy = async () => {
    if (!copyText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      systemNotification.success(zh ? '账号信息已复制' : 'Account details copied');
    } catch {
      systemNotification.error(zh ? '复制失败，请手动记录' : 'Copy failed, please record manually');
    }
  };

  return (
    <div className="animate-in fade-in zoom-in flex flex-col items-center py-12 text-center duration-700">
      <div className="relative mb-10">
        <div className="flex h-32 w-32 animate-bounce items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-200">
          <PartyPopper className="h-16 w-16 text-white" />
        </div>
        <div className="absolute -right-2 -top-2 flex gap-1">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-2 w-2 animate-ping rounded-full bg-amber-400"
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <h2 className="mb-4 text-4xl font-black tracking-tighter text-slate-900">
        {zh ? '初始化配置已完成' : 'Initialization Complete'}
      </h2>

      <p className="mb-3 max-w-2xl font-medium leading-relaxed text-slate-500">
        {zh
          ? managed
            ? `${targetTenantName ? `租户“${targetTenantName}”` : '目标租户'}已完成数据库、管理员账号、菜单和权限模板初始化，现在可以回到租户管理继续后续配置。`
            : '当前租户已完成数据库与基础授权初始化，现在可以进入后台继续完善系统管理、二次认证和业务模块扩展。'
          : managed
            ? 'The target tenant database, admin account, menus, and permissions have been initialized. You can return to tenant management for the next steps.'
            : 'The current tenant has completed database and base authorization bootstrap. You can now continue with system management, 2FA, and business module extension.'}
      </p>

      <p className="mb-8 max-w-2xl text-sm text-slate-500">
        {zh
          ? '管理员密码使用你在初始化时输入的值，系统不会在这里再次明文展示。'
          : 'Use the admin password you entered during setup. The system does not display it again here.'}
      </p>

      <div className="mb-8 grid w-full max-w-3xl grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div className="text-left">
            <p className="text-xs font-bold uppercase text-emerald-700">Database</p>
            <p className="text-sm font-medium text-emerald-900">
              {zh ? '连接、迁移与初始化完成' : 'Connection, migration, and setup completed'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div className="text-left">
            <p className="text-xs font-bold uppercase text-emerald-700">Menus</p>
            <p className="text-sm font-medium text-emerald-900">
              {zh ? `已分配 ${bootstrap?.menuCount ?? 0} 个基础菜单` : `${bootstrap?.menuCount ?? 0} base menus assigned`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div className="text-left">
            <p className="text-xs font-bold uppercase text-emerald-700">Permissions</p>
            <p className="text-sm font-medium text-emerald-900">
              {zh
                ? `已引导 ${bootstrap?.permissionCount ?? 0} 个权限模板`
                : `${bootstrap?.permissionCount ?? 0} permission templates bootstrapped`}
            </p>
          </div>
        </div>
      </div>

      {bootstrap?.adminUsername ? (
        <div className="mb-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-slate-50 p-6 text-left shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {zh ? '默认管理员账号' : 'Default Admin Account'}
              </h3>
              <p className="text-sm text-slate-500">
                {zh
                  ? '建议首次登录后立即修改密码，并按需开启 2FA。'
                  : 'Change the password immediately after first login and enable 2FA if needed.'}
              </p>
            </div>
            {copyText ? (
              <Button type="button" variant="outline" className="gap-2" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                {zh ? '复制信息' : 'Copy'}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {zh ? '账号' : 'Username'}
              </p>
              <p className="mt-1 break-all text-base font-bold text-slate-900">
                {bootstrap.adminUsername}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {zh ? '邮箱' : 'Email'}
              </p>
              <p className="mt-1 break-all text-base font-bold text-slate-900">
                {bootstrap.adminEmail || '-'}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-slate-500">
                {zh ? '默认角色' : 'Role'}
              </p>
              <p className="mt-1 break-all text-base font-bold text-slate-900">
                {bootstrap.roleCode || 'super_admin'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-10 flex w-full max-w-2xl items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-left">
        <div className="rounded-2xl bg-white p-3 text-amber-600">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {zh ? '密码处理' : 'Password Handling'}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {zh
              ? '仅使用你在初始化时输入的密码，不再明文回显。'
              : 'The setup uses the password you provided and does not echo it back in plaintext.'}
          </p>
        </div>
      </div>

      <Button
        onClick={onComplete}
        size="lg"
        className="group h-16 rounded-2xl bg-slate-900 px-12 text-lg font-bold shadow-2xl transition-all hover:bg-black active:scale-95"
      >
        {zh
          ? managed
            ? '返回租户管理'
            : '进入管理后台'
          : managed
            ? 'Back to Tenant Management'
            : 'Enter Admin Console'}
        <LayoutDashboard className="ml-3 h-6 w-6 transition-transform group-hover:rotate-12" />
      </Button>
    </div>
  );
}

