import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({ label, value, change, positive, icon: Icon, iconColor = 'text-brand-400', iconBg = 'bg-brand-500/10 border-brand-500/20' }: Props) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface-800 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        {change && (
          <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10')}>
            {positive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="mt-0.5 text-sm text-white/40">{label}</p>
      </div>
    </div>
  );
}
