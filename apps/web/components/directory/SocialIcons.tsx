/**
 * Minimal brand glyphs for the developer profile's socials row.
 *
 * lucide-react dropped brand/social icons in this major version (Instagram,
 * Facebook, Twitter, LinkedIn all removed) — these are small, stable
 * outlines rather than a new icon-pack dependency for four icons.
 */
type IconProps = { size?: number; className?: string };

export function InstagramIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.6h2.6l.4-3H13.5V8.3c0-.87.24-1.46 1.5-1.46h1.6V4.14C16.32 4.1 15.3 4 14.1 4c-2.5 0-4.2 1.53-4.2 4.33v2.07H7.3v3h2.6V21h3.6Z" />
    </svg>
  );
}

export function TwitterIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 3h3.1l-6.77 7.74L23 21h-6.23l-4.88-6.38L6.3 21H3.2l7.24-8.28L2.8 3h6.38l4.4 5.83L18.9 3Zm-1.09 16.17h1.72L7.28 4.73H5.43l12.38 14.44Z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.98h4V21H3V9.98ZM9.5 9.98H13v1.5h.06c.49-.87 1.68-1.78 3.46-1.78 3.7 0 4.38 2.32 4.38 5.34V21h-4v-5.4c0-1.29-.02-2.94-1.8-2.94-1.8 0-2.08 1.4-2.08 2.85V21h-4V9.98Z" />
    </svg>
  );
}
