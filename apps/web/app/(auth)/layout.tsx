import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Account', template: '%s — e-resi' },
};

/**
 * Each account screen owns its own full-height surface, so this stays a plain
 * pass-through. It previously imposed `flex` and a grey background for the old
 * split-panel shell; both now fight the centered card and tint its edges.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
