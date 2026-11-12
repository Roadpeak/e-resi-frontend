import type { Metadata } from 'next';
import { InviteWelcome } from '../../../components/invite/InviteWelcome';

export const metadata: Metadata = {
  title: 'Your invitation to e-resi',
  // Personal links: never indexed.
  robots: { index: false, follow: false },
};

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <InviteWelcome code={code} />;
}
