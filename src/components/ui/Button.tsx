'use client';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary:   'bg-[#F97316] hover:bg-[#EA6C0A] text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/20',
  secondary: 'bg-[#1E3A8A] hover:bg-[#1e3480] text-white shadow-sm',
  outline:   'border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-white',
  ghost:     'text-[#1F2937] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  success:   'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-sm',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3.5 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant], sizes[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
