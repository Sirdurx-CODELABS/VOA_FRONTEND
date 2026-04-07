import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple' | 'orange' | 'blue';

const variants: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  danger:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  info:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  purple:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  orange:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  blue:    'bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-blue-900/30 dark:text-blue-300 border border-[#1E3A8A]/20 dark:border-blue-800',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}

export function statusBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    // Account status
    active: 'success', inactive: 'danger', pending: 'warning',
    // Program status
    upcoming: 'blue', ongoing: 'orange', completed: 'success',
    // Transaction / contribution status
    approved: 'success', rejected: 'danger',
    'in-progress': 'info', resolved: 'success',
    // Visibility
    internal: 'default', public: 'blue',
    // Finance
    income: 'success', expense: 'danger',
    // Attendance
    present: 'success', absent: 'danger',
    // Welfare types
    financial: 'orange', personal: 'info', other: 'default',
  };
  return map[status] || 'default';
}
