import { Card } from '../ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
}

const defaultGradients = {
  blue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
};

export function MetricCard({ 
  title, 
  value, 
  change,
  changeType = 'neutral',
  icon: Icon, 
  iconColor = 'blue',
  gradient,
}: MetricCardProps) {
  const { theme } = useThemeStore();
  const backgroundGradient = gradient || defaultGradients[iconColor as keyof typeof defaultGradients] || defaultGradients.blue;

  return (
    <Card 
      className="p-6 hover:shadow-xl transition-all duration-300 border hover:scale-105"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p 
            className="text-sm mb-2"
            style={{ color: theme.colors.textSecondary }}
          >
            {title}
          </p>
          <p 
            className="text-3xl font-semibold mb-2"
            style={{ color: theme.colors.text }}
          >
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'increase' && <TrendingUp className="w-4 h-4 text-green-600" />}
              {changeType === 'decrease' && <TrendingDown className="w-4 h-4 text-red-600" />}
              <p 
                className="text-sm"
                style={{ 
                  color: changeType === 'increase' 
                    ? '#10b981' 
                    : changeType === 'decrease' 
                    ? '#ef4444' 
                    : theme.colors.textSecondary 
                }}
              >
                {change}
              </p>
            </div>
          )}
        </div>
        <div 
          className="p-3 rounded-xl shadow-md flex-shrink-0"
          style={{ background: backgroundGradient }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}