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

/** Map legacy icon color props (brand/emerald/gold/violet) to Google tonal circle pairs. */
function tonalCircle(iconColor: string, iconBg: string): string {
  const key = `${iconColor} ${iconBg}`;
  if (/emerald|green/.test(key)) return 'bg-[#e6f4ea] text-[#188038]';
  if (/gold|amber|yellow/.test(key)) return 'bg-[#fef7e0] text-[#b06000]';
  if (/violet|purple/.test(key)) return 'bg-[#f3e8fd] text-[#8430ce]';
  return 'bg-[#e8f0fe] text-[#1a73e8]';
}

export function StatCard({ label, value, change, positive, icon: Icon, iconColor = 'text-brand-600', iconBg = 'bg-brand-50 border-brand-200' }: Props) {
  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', tonalCircle(iconColor, iconBg))}>
          <Icon size={18} />
        </div>
        {change && (
          <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', positive ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#fce8e6] text-[#c5221f]')}>
            {positive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-normal text-[#202124]">{value}</p>
        <p className="mt-0.5 text-[13px] text-[#5f6368]">{label}</p>
      </div>
    </div>
  );
}
