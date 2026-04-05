'use client';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100 dark:border-slate-800', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: CardProps) {
  return <div className={cn('px-6 py-4', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cn('text-base font-bold text-slate-800 dark:text-white', className)} {...props}>
      {children}
    </h3>
  );
}
