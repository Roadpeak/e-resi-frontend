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

export function StatCard({ label, value, change, positive, icon: Icon, iconColor = 'text-brand-600', iconBg = 'bg-brand-50 border-brand-200' }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        {change && (
          <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', positive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}>
            {positive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="mt-0.5 text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
