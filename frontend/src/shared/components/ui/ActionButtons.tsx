import { ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../components/ui/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { useAuthStore } from '../../../modules/auth/store/authStore';

export interface ActionButtonConfig {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
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
}

const sizeClasses: Record<NonNullable<ActionButtonsProps['size']>, string> = {
  sm: 'h-9 w-9',
  default: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export function ActionButtons({ actions, size = 'sm' }: ActionButtonsProps) {
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
      <div className="inline-flex min-h-11 items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1 shadow-sm shadow-slate-200/60 backdrop-blur-sm">
        {visibleActions.map((action, index) => {
          const permissionAllowed = action.permission ? hasPermission(action.permission) : true;
          const roleAllowed = action.role ? hasRole(action.role) : true;
          const authorized = permissionAllowed && roleAllowed;
          const disabled = action.disabled || !authorized;

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild disabled={disabled}>
                <Button
                  variant={action.danger ? 'ghost' : (action.variant || 'ghost')}
                  size="icon"
                  disabled={disabled}
                  className={cn(
                    sizeClasses[size],
                    'rounded-xl border border-transparent bg-white text-slate-500 transition-all duration-200',
                    !disabled && 'hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm',
                    action.danger && !disabled && 'text-rose-600 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700',
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
