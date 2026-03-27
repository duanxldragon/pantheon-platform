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
import { useThemeStore } from '../../../stores/themeStore';

export interface ActionButtonConfig {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  danger?: boolean;
  permission?: string | string[];
  role?: string | string[];
  hideWhenUnauthorized?: boolean;
  disabled?: boolean;
  className?: string;
}

interface ActionButtonsProps {
  actions: ActionButtonConfig[];
  size?: 'sm' | 'default' | 'lg';
}

export function ActionButtons({ actions, size = 'sm' }: ActionButtonsProps) {
  const { theme } = useThemeStore();
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
    <TooltipProvider>
      <div className="flex items-center gap-1">
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
                  'h-8 w-8 transition-all',
                  !disabled && 'hover:scale-110',
                  action.danger
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                    : 'hover:shadow-md',
                  disabled && 'cursor-not-allowed opacity-50 hover:scale-100 hover:shadow-none',
                  action.className,
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (disabled) {
                    return;
                  }
                  action.onClick();
                }}
              >
                {action.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
