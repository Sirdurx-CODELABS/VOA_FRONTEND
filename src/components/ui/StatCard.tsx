import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'indigo';
  trend?: { value: number; label: string };
}

const colors = {
  blue:   { iconBg: 'bg-[#1E3A8A]',   icon: 'text-white', accent: 'border-l-[#1E3A8A]' },
  orange: { iconBg: 'bg-[#F97316]',   icon: 'text-white', accent: 'border-l-[#F97316]' },
  green:  { iconBg: 'bg-[#22C55E]',   icon: 'text-white', accent: 'border-l-[#22C55E]' },
  red:    { iconBg: 'bg-red-500',      icon: 'text-white', accent: 'border-l-red-500' },
  purple: { iconBg: 'bg-purple-600',  icon: 'text-white', accent: 'border-l-purple-600' },
  indigo: { iconBg: 'bg-indigo-600',  icon: 'text-white', accent: 'border-l-indigo-600' },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }: StatCardProps) {
  const c = colors[color];
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-2xl p-5',
      'border border-slate-200 dark:border-slate-800 border-l-4',
      'shadow-sm hover:shadow-md transition-all duration-200',
      c.accent
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs mt-2 font-semibold flex items-center gap-1', trend.value >= 0 ? 'text-[#22C55E]' : 'text-red-500')}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl shrink-0', c.iconBg)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
      </div>
    </div>
  );
}
