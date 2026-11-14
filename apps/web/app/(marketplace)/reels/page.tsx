import type { Metadata } from 'next';
import { ReelsPage } from '../../../components/reels/ReelsPage';
import { REELS_MIN_INDEXABLE, publishedReelCount } from '../../../lib/seo/reels';

const BASE: Metadata = {
  title: 'Property Reels',
  description: 'Short videos of homes for sale and to rent in Kenya, straight from agents and developers on e-resi.',
  alternates: { canonical: '/reels' },
};

/** Indexed only once there are enough reels for the page to be worth a search result. */
export async function generateMetadata(): Promise<Metadata> {
  const n = await publishedReelCount();
  return n >= REELS_MIN_INDEXABLE ? BASE : { ...BASE, robots: { index: false, follow: true } };
}

export default function Reels() {
  return (
    <>
      {/* The viewer's own top bar shows this title; the heading gives the page its structure. */}
      <h1 className="sr-only">Property reels</h1>
      <ReelsPage />
    </>
  );
}
