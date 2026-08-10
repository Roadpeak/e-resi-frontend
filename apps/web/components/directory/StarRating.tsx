import { Star } from 'lucide-react';

/**
 * Read-only star display. Renders halves by clipping a filled row over an
 * empty one, so a 4.5 reads as four and a half rather than rounding to five —
 * these scores decide directory order, so they should look precise.
 */
export function StarRating({
  value,
  count,
  size = 14,
  showEmpty = true,
}: {
  value: number;
  /** Review count shown beside the stars; omitted when undefined. */
  count?: number;
  size?: number;
  /** When false, an unrated agent renders nothing rather than five grey stars. */
  showEmpty?: boolean;
}) {
  const rated = value > 0 && (count ?? 1) > 0;
  if (!rated && !showEmpty) return null;

  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="relative inline-flex">
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={size} className="text-[#dadce0]" />
          ))}
        </span>
        {/* Filled row clipped to the score. aria-hidden — the label above
            already states the value, so screen readers hear it once. */}
        <span
          aria-hidden
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={size} className="shrink-0 fill-[#f5b544] text-[#f5b544]" />
          ))}
        </span>
      </span>
      {rated ? (
        <span className="text-[13px] text-[#6b6b70]">
          {value.toFixed(1)}
          {count !== undefined && ` (${count})`}
        </span>
      ) : (
        <span className="text-[13px] text-[#8a8a90]">No reviews yet</span>
      )}
    </span>
  );
}
