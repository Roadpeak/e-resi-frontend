import type { Metadata } from 'next';
import { InviteWelcome } from '../../../components/invite/InviteWelcome';
import { fetchInvitePreview, inviteBlurb, inviteHeadline } from '../../../lib/api/fetch-invite-preview';

/**
 * Per-invite link preview: "Exclusive invite for Lux Properties to e-resi"
 * with their logo on the share card, instead of the site's generic one.
 * The share image comes from ./opengraph-image.tsx in this folder.
 */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const p = await fetchInvitePreview(code);
  const title = p ? inviteHeadline(p) : 'Your invitation to e-resi';
  const description = p ? inviteBlurb(p) : 'You have been personally invited to join e-resi.';
  return {
    title: { absolute: title },
    description,
    // Personal links: never indexed.
    robots: { index: false, follow: false },
    openGraph: { type: 'website', siteName: 'E-resi', title, description, url: `/invite/${code}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <InviteWelcome code={code} />;
}
