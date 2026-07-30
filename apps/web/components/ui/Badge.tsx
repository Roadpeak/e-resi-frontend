import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'brand' | 'gold' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-white/10 text-white/80 border border-white/10',
  brand: 'bg-brand-500/15 text-brand-300 border border-brand-500/20',
  gold: 'bg-gold-500/15 text-gold-300 border border-gold-500/20',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/20',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/20',
  outline: 'bg-transparent text-white/60 border border-white/20',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs font-medium',
};

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full font-medium tracking-wide', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
