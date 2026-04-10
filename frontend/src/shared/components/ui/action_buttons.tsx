import { ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../components/ui/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { useAuthStore } from '../../../modules/auth/store/auth_store';

export interface ActionButtonConfig {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'mono';
  danger?: boolean;
  permission?: string | readonly string[];
  role?: string | readonly string[];
  hideWhenUnauthorized?: boolean;
  disabled?: boolean;
  className?: string;
}

interface ActionButtonsProps {
  actions: ActionButtonConfig[];
  size?: 'sm' | 'default' | 'lg';
  surface?: 'default' | 'ghost';
}

const sizeClasses: Record<NonNullable<ActionButtonsProps['size']>, string> = {
  sm: 'h-[34px] w-[34px]',
  default: 'h-[38px] w-[38px]',
  lg: 'h-11 w-11',
};

export function ActionButtons({ actions, size = 'sm', surface = 'default' }: ActionButtonsProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  const visibleActions = actions.filter((action) => {
    const permissionAllowed = action.permission ? hasPermission(action.permission) : true;
    const roleAllowed = action.role ? hasRole(action.role) : true;
    const authorized = permissionAllowed && roleAllowed;

    if (authorized) {
      return true;
    }

    return action.hideWhenUnauthorized === false;
  });

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div
        className={cn(
          'inline-flex min-h-10 items-center gap-1 rounded-2xl p-1 backdrop-blur-sm',
          surface === 'default'
            ? 'border border-slate-200/80 bg-white/88 shadow-sm shadow-slate-200/50'
            : 'border border-transparent bg-transparent shadow-none',
        )}
      >
        {visibleActions.map((action, index) => {
          const permissionAllowed = action.permission ? hasPermission(action.permission) : true;
          const roleAllowed = action.role ? hasRole(action.role) : true;
          const authorized = permissionAllowed && roleAllowed;
          const disabled = action.disabled || !authorized;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild disabled={disabled}>
                <Button
                  variant={action.danger ? 'ghost-danger' : action.variant === 'mono' ? 'mono' : (action.variant || 'ghost')}
                  size={size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon'}
                  disabled={disabled}
                  className={cn(
                    sizeClasses[size],
                    'rounded-xl border border-transparent transition-all duration-200',
                    surface === 'default' && 'bg-white text-slate-500',
                    surface === 'ghost' && 'bg-transparent text-slate-500',
                    !disabled && !action.danger && action.variant !== 'mono' && 'hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm',
                    action.danger && !disabled && 'hover:-translate-y-0.5',
                    disabled && 'cursor-not-allowed opacity-45 shadow-none',
                    action.className,
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (disabled) {
                      return;
                    }
                    action.onClick();
                  }}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}



