'use client';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
            'placeholder-slate-400 text-sm px-3.5 py-2.5 transition-all duration-150',
            'border-slate-300 dark:border-slate-700',
            'focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] dark:focus:border-blue-400',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
            icon && 'pl-10',
            error && 'border-red-400 focus:ring-red-200 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          'text-sm px-3.5 py-2.5 transition-all duration-150',
          'border-slate-300 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] dark:focus:border-blue-400',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white',
          'placeholder-slate-400 text-sm px-3.5 py-2.5 transition-all duration-150 resize-none',
          'border-slate-300 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] dark:focus:border-blue-400',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';
