import Link from 'next/link';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

type BaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  href?: string;
};

type ButtonProps = BaseProps &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  );

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 active:scale-[0.98]',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900',
  outline: 'bg-transparent border border-gray-300 hover:border-gray-400 text-gray-900 active:scale-[0.98]',
  gold: 'bg-gold-500 hover:bg-gold-400 text-gray-900 font-semibold shadow-lg shadow-gold-500/20 active:scale-[0.98]',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:scale-[0.98]',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  xl: 'h-14 px-8 text-lg gap-2.5',
};

const base =
  'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconPosition = 'left',
  children,
  className,
  href,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  const content = (
    <>
      {loading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={(props as ButtonHTMLAttributes<HTMLButtonElement>).disabled || loading}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
