import type { Metadata } from 'next';
import { ReelsPage } from '../../../components/reels/ReelsPage';

export const metadata: Metadata = {
  title: 'Property Reels',
  description: 'Short videos of homes for sale and to rent in Kenya, straight from agents and developers on e-resi.',
  alternates: { canonical: '/reels' },
};

export default function Reels() {
  return <ReelsPage />;
}
