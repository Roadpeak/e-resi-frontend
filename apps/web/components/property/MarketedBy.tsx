import { PropertyMonogram } from './PropertyMonogram';
import type { Property } from '../../lib/types';

/**
 * "Marketed by <agent>" for developments an agent lists and owns. Renders
 * nothing on developer-owned listings, so templates can drop it in freely.
 */
export function MarketedBy({ property, onDark = false, className = '' }: { property: Property; onDark?: boolean; className?: string }) {
  const a = property.listedByAgent;
  if (!a) return null;
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: onDark ? 'rgba(255,255,255,0.45)' : 'rgba(24,25,26,0.55)' }}>Marketed by</p>
      <a href={`/agents/${a.id}`} className="mt-3 flex items-center gap-3">
        <PropertyMonogram name={a.displayName} logoUrl={a.logoUrl ?? a.photoUrl ?? undefined} size={36} onDark={onDark} />
        <span className="text-[14px] font-medium" style={{ color: onDark ? '#fff' : '#18191a' }}>{a.displayName}</span>
      </a>
    </div>
  );
}
