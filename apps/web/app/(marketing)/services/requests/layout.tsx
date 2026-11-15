import type { Metadata } from 'next';
import { RequireAuth } from '../../../../components/auth/RequireAuth';

export const metadata: Metadata = {
  title: { default: 'Your production requests', template: '%s — e-resi' },
  // Personal pages: never in search results.
  robots: { index: false, follow: false },
};

export default function ServiceRequestsLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
