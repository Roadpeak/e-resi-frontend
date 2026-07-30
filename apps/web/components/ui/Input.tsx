import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, wrapperClassName, className, id, ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm transition-colors',
            'focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className,
          )}
          style={{
            backgroundColor: '#131c30',
            color: '#ffffff',
            caretColor: '#ffffff',
          }}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  );
});
