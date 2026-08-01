'use client';

/**
 * Google Material Symbols (Rounded) — the icon set Google's own products use.
 * `fill` renders the solid variant (Google's active-state convention).
 */
export function MaterialIcon({
  name,
  size = 20,
  fill = false,
  weight = 400,
  className = '',
}: {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: 300 | 400 | 500 | 600 | 700;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}
